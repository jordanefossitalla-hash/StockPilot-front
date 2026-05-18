import { AlertTriangle, ArrowLeft, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { StockSubnav } from "../components/StockSubnav"
import { formatDate } from "../features/stock/stockFormatters"
import {
  listStockHistory,
  type StockHistoryApiType,
  type StockHistoryItem,
} from "../services/stockService"

export function StockHistoryPage() {
  const navigate = useNavigate()
  const [movements, setMovements] = useState<StockHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | StockHistoryApiType>("all")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, typeFilter])

  useEffect(() => {
    let isActive = true

    async function fetchHistory() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const result = await listStockHistory({
          page,
          limit: PAGE_SIZE,
          type: typeFilter === "all" ? undefined : typeFilter,
          search: debouncedQuery,
        })

        if (!isActive) {
          return
        }

        setMovements(result.data)
        setTotalItems(result.meta.total)
      } catch (error) {
        if (!isActive) {
          return
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Chargement historique impossible.",
        )
        setMovements([])
        setTotalItems(0)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void fetchHistory()

    return () => {
      isActive = false
    }
  }, [PAGE_SIZE, debouncedQuery, page, typeFilter])

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)

  const currentPageMovements = movements

  const startRow =
    totalItems === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const endRow = Math.min((pageSafe - 1) * PAGE_SIZE + movements.length, totalItems)

  function typeBadge(type: StockHistoryItem["type"]) {
    if (type === "in") {
      return { text: "Entrée", className: "status-active" }
    }

    if (type === "out") {
      return { text: "Sortie", className: "status-blocked" }
    }

    return { text: "Ajustement", className: "status-warning" }
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate("/stock")
  }

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Historique stock</h2>
          <p className="page-subtitle">Suivi des entrées, sorties et ajustements.</p>
        </div>

        <div className="clients-actions">
          <button type="button" className="btn btn-ghost" onClick={handleBack}>
            <ArrowLeft size={16} />
            Retour
          </button>
        </div>
      </div>

      <StockSubnav />

      {loadError ? <p className="form-error-banner">{loadError}</p> : null}

      <div className="products-toolbar-grid">
        <label className="search-input-wrap">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher produit, motif, référence"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
          />
        </label>

        <label className="products-filter-field">
          <span>Type mouvement</span>
          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as "all" | StockHistoryApiType)
            }}
          >
            <option value="all">Tous</option>
            <option value="ENTRY">Entrée</option>
            <option value="EXIT">Sortie</option>
            <option value="ADJUSTMENT">Ajustement</option>
            <option value="SALE">Vente</option>
            <option value="ORDER_RECEIVE">Réception commande</option>
          </select>
        </label>
      </div>

      <div className="clients-toolbar">
        <p className="clients-page-indicator">
          {isLoading
            ? "Chargement..."
            : `${currentPageMovements.length} résultat(s) affiché(s) • page ${pageSafe} • ${startRow}-${endRow} sur ${totalItems}`}
        </p>
      </div>

      <div className="table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Produit</th>
              <th>Type</th>
              <th>Quantité</th>
              <th>Motif</th>
              <th>Référence</th>
            </tr>
          </thead>
          <tbody>
            {currentPageMovements.map((movement) => {
              const badge = typeBadge(movement.type)

              return (
                <tr key={movement.id}>
                  <td>{formatDate(movement.createdAt)}</td>
                  <td>
                    <div className="client-main-cell">
                      <strong>{movement.productName}</strong>
                      <small>{movement.productSku ?? movement.productId}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`status-chip ${badge.className}`}>{badge.text}</span>
                  </td>
                  <td>{movement.quantity}</td>
                  <td>{movement.note ?? "-"}</td>
                  <td>{movement.referenceId ?? "-"}</td>
                </tr>
              )
            })}

            {!isLoading && currentPageMovements.length === 0 ? (
              <tr>
                <td colSpan={6} className="clients-empty-row">
                  Aucun mouvement trouvé.
                </td>
              </tr>
            ) : null}
            {isLoading ? (
              <tr>
                <td colSpan={6} className="clients-empty-row">
                  Chargement des mouvements...
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="clients-mobile-list">
        {currentPageMovements.map((movement) => {
          const badge = typeBadge(movement.type)

          return (
            <article key={movement.id} className="client-mobile-card">
              <div className="client-mobile-head">
                <div>
                  <strong>{movement.productName}</strong>
                  <small>{movement.productSku ?? movement.productId}</small>
                </div>
                <span className={`status-chip ${badge.className}`}>{badge.text}</span>
              </div>

              <div className="client-mobile-grid">
                <p>
                  <span>Date</span>
                  <strong>{formatDate(movement.createdAt)}</strong>
                </p>
                <p>
                  <span>Quantité</span>
                  <strong>{movement.quantity}</strong>
                </p>
                <p>
                  <span>Motif</span>
                  <strong>{movement.note ?? "-"}</strong>
                </p>
                <p>
                  <span>Référence</span>
                  <strong>{movement.referenceId ?? "-"}</strong>
                </p>
              </div>
            </article>
          )
        })}

        {!isLoading && currentPageMovements.length === 0 ? (
          <article className="client-mobile-card">
            <p className="clients-empty-row">
              <AlertTriangle size={14} /> Aucun mouvement trouvé.
            </p>
          </article>
        ) : null}
      </div>

      <div className="clients-pagination">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={pageSafe === 1 || isLoading}
        >
          Précédent
        </button>

        <div className="clients-pagination-pages">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`page-chip ${pageNumber === pageSafe ? "active" : ""}`}
                onClick={() => setPage(pageNumber)}
                disabled={isLoading}
              >
                {pageNumber}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={pageSafe === totalPages || isLoading}
        >
          Suivant
        </button>
      </div>
    </section>
  )
}
