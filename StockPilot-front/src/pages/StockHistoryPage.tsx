import { ArrowLeft, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { StockSubnav } from "../components/StockSubnav"
import { stockMovementsData } from "../features/stock/stockData"
import { formatDate } from "../features/stock/stockFormatters"

export function StockHistoryPage() {
  const navigate = useNavigate()
  const [movements] = useState(stockMovementsData)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 7

  const filteredMovements = useMemo(() => {
    const search = query.trim().toLowerCase()

    return movements.filter((movement) => {
      const typeOk = typeFilter === "all" ? true : movement.type === typeFilter
      const searchOk =
        search.length === 0
          ? true
          : movement.productName.toLowerCase().includes(search) ||
            movement.productId.toLowerCase().includes(search) ||
            movement.reason.toLowerCase().includes(search) ||
            (movement.reference ?? "").toLowerCase().includes(search)

      return typeOk && searchOk
    })
  }, [movements, query, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)

  const currentPageMovements = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE
    return filteredMovements.slice(start, start + PAGE_SIZE)
  }, [filteredMovements, pageSafe])

  const startRow =
    filteredMovements.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const endRow = Math.min(pageSafe * PAGE_SIZE, filteredMovements.length)

  function typeBadge(type: "in" | "out" | "adjustment") {
    if (type === "in") {
      return { text: "Entree", className: "status-active" }
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
          <p className="page-subtitle">Suivi des entrees, sorties et ajustements.</p>
        </div>

        <div className="clients-actions">
          <button type="button" className="btn btn-ghost" onClick={handleBack}>
            <ArrowLeft size={16} />
            Retour
          </button>
        </div>
      </div>

      <StockSubnav />

      <div className="products-toolbar-grid">
        <label className="search-input-wrap">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher produit, motif, reference"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
        </label>

        <label className="products-filter-field">
          <span>Type mouvement</span>
          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">Tous</option>
            <option value="in">Entree</option>
            <option value="out">Sortie</option>
            <option value="adjustment">Ajustement</option>
          </select>
        </label>
      </div>

      <div className="clients-toolbar">
        <p className="clients-page-indicator">
          {startRow}-{endRow} sur {filteredMovements.length}
        </p>
      </div>

      <div className="table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Produit</th>
              <th>Type</th>
              <th>Quantite</th>
              <th>Motif</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {currentPageMovements.map((movement) => {
              const badge = typeBadge(movement.type)

              return (
                <tr key={movement.id}>
                  <td>{formatDate(movement.date)}</td>
                  <td>
                    <div className="client-main-cell">
                      <strong>{movement.productName}</strong>
                      <small>{movement.productId}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`status-chip ${badge.className}`}>{badge.text}</span>
                  </td>
                  <td>{movement.quantity}</td>
                  <td>{movement.reason}</td>
                  <td>{movement.reference ?? "-"}</td>
                </tr>
              )
            })}

            {currentPageMovements.length === 0 ? (
              <tr>
                <td colSpan={6} className="clients-empty-row">
                  Aucun mouvement trouve.
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
                  <small>{movement.productId}</small>
                </div>
                <span className={`status-chip ${badge.className}`}>{badge.text}</span>
              </div>

              <div className="client-mobile-grid">
                <p>
                  <span>Date</span>
                  <strong>{formatDate(movement.date)}</strong>
                </p>
                <p>
                  <span>Quantite</span>
                  <strong>{movement.quantity}</strong>
                </p>
                <p>
                  <span>Motif</span>
                  <strong>{movement.reason}</strong>
                </p>
                <p>
                  <span>Reference</span>
                  <strong>{movement.reference ?? "-"}</strong>
                </p>
              </div>
            </article>
          )
        })}
      </div>

      <div className="clients-pagination">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={pageSafe === 1}
        >
          Precedent
        </button>

        <div className="clients-pagination-pages">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`page-chip ${pageNumber === pageSafe ? "active" : ""}`}
                onClick={() => setPage(pageNumber)}
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
          disabled={pageSafe === totalPages}
        >
          Suivant
        </button>
      </div>
    </section>
  )
}
