import { AlertTriangle, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { StockSubnav } from "../components/StockSubnav"
import { formatDate } from "../features/stock/stockFormatters"
import { listStockStatus, type StockStatusItem } from "../services/stockService"

type StockLevelFilter = "all" | "in-stock" | "low-stock" | "out-of-stock"

function resolveStockLevel(item: StockStatusItem): Exclude<StockLevelFilter, "all"> {
  if (item.stockQuantity <= 0) {
    return "out-of-stock"
  }

  if (item.stockQuantity <= item.stockMinThreshold) {
    return "low-stock"
  }

  return "in-stock"
}

export function StockStatusPage() {
  const [items, setItems] = useState<StockStatusItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StockLevelFilter>("all")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  useEffect(() => {
    let isActive = true

    async function fetchStockStatus() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const result = await listStockStatus({
          page,
          limit: PAGE_SIZE,
        })

        if (!isActive) {
          return
        }

        setItems(result.data)
        setTotalItems(result.meta.total)
      } catch (error) {
        if (!isActive) {
          return
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Chargement de l'état du stock impossible.",
        )
        setItems([])
        setTotalItems(0)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void fetchStockStatus()

    return () => {
      isActive = false
    }
  }, [page])

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase()

    return items.filter((item) => {
      const level = resolveStockLevel(item)
      const statusOk = statusFilter === "all" ? true : level === statusFilter
      const searchOk =
        search.length === 0
          ? true
          : item.name.toLowerCase().includes(search) ||
            item.sku.toLowerCase().includes(search) ||
            (item.categoryName ?? "").toLowerCase().includes(search)

      return statusOk && searchOk
    })
  }, [items, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)

  const currentPageItems = filteredItems

  const startRow = totalItems === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const endRow = Math.min((pageSafe - 1) * PAGE_SIZE + items.length, totalItems)

  function resolveBadge(level: Exclude<StockLevelFilter, "all">) {
    if (level === "out-of-stock") {
      return { text: "Rupture", className: "status-blocked" }
    }

    if (level === "low-stock") {
      return { text: "Stock faible", className: "status-warning" }
    }

    return { text: "Disponible", className: "status-active" }
  }

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">État du stock</h2>
          <p className="page-subtitle">
            Vue globale: stock faible, rupture et quantité disponible.
          </p>
        </div>
      </div>

      <StockSubnav />

      {loadError ? <p className="form-error-banner">{loadError}</p> : null}

      <div className="products-toolbar-grid">
        <label className="search-input-wrap">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher par produit, code ou catégorie"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
        </label>

        <label className="products-filter-field">
          <span>Niveau stock</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StockLevelFilter)
              setPage(1)
            }}
          >
            <option value="all">Tous</option>
            <option value="in-stock">Disponible</option>
            <option value="low-stock">Stock faible</option>
            <option value="out-of-stock">Rupture</option>
          </select>
        </label>
      </div>

      <div className="clients-toolbar">
        <p className="clients-page-indicator">
          {isLoading
            ? "Chargement..."
            : `${currentPageItems.length} résultat(s) affiché(s) • page ${pageSafe} • ${startRow}-${endRow} sur ${totalItems}`}
        </p>
      </div>

      <div className="table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Qté disponible</th>
              <th>Seuil</th>
              <th>Statut</th>
              <th>Mise à jour</th>
            </tr>
          </thead>
          <tbody>
            {currentPageItems.map((item) => {
              const level = resolveStockLevel(item)
              const badge = resolveBadge(level)

              return (
                <tr key={item.id}>
                  <td>
                    <div className="client-main-cell">
                      <strong>{item.name}</strong>
                      <small>{item.sku}</small>
                    </div>
                  </td>
                  <td>{item.categoryName ?? "-"}</td>
                  <td>{item.stockQuantity}</td>
                  <td>{item.stockMinThreshold}</td>
                  <td>
                    <span className={`status-chip ${badge.className}`}>{badge.text}</span>
                  </td>
                  <td>{formatDate(item.updatedAt)}</td>
                </tr>
              )
            })}

            {!isLoading && currentPageItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="clients-empty-row">
                  Aucun élément de stock trouvé.
                </td>
              </tr>
            ) : null}
            {isLoading ? (
              <tr>
                <td colSpan={6} className="clients-empty-row">
                  Chargement des éléments de stock...
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="clients-mobile-list">
        {currentPageItems.map((item) => {
          const level = resolveStockLevel(item)
          const badge = resolveBadge(level)

          return (
            <article key={item.id} className="client-mobile-card">
              <div className="client-mobile-head">
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.sku}</small>
                </div>
                <span className={`status-chip ${badge.className}`}>{badge.text}</span>
              </div>

              <div className="client-mobile-grid">
                <p>
                  <span>Catégorie</span>
                  <strong>{item.categoryName ?? "-"}</strong>
                </p>
                <p>
                  <span>Qté disponible</span>
                  <strong>{item.stockQuantity}</strong>
                </p>
                <p>
                  <span>Seuil faible</span>
                  <strong>{item.stockMinThreshold}</strong>
                </p>
                <p>
                  <span>Mise à jour</span>
                  <strong>{formatDate(item.updatedAt)}</strong>
                </p>
              </div>
            </article>
          )
        })}

        {!isLoading && currentPageItems.length === 0 ? (
          <article className="client-mobile-card">
            <p className="clients-empty-row">
              <AlertTriangle size={14} /> Aucun élément de stock trouvé.
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
