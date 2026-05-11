import { AlertTriangle, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { StockSubnav } from "../components/StockSubnav"
import { stockItemsData } from "../features/stock/stockData"
import { formatDate } from "../features/stock/stockFormatters"
import { getStockLevel } from "../features/stock/stockStats"

export function StockStatusPage() {
  const [items] = useState(stockItemsData)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase()

    return items.filter((item) => {
      const level = getStockLevel(item)
      const statusOk = statusFilter === "all" ? true : level === statusFilter
      const searchOk =
        search.length === 0
          ? true
          : item.productName.toLowerCase().includes(search) ||
            item.productId.toLowerCase().includes(search) ||
            item.category.toLowerCase().includes(search)

      return statusOk && searchOk
    })
  }, [items, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)

  const currentPageItems = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [filteredItems, pageSafe])

  const startRow = filteredItems.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const endRow = Math.min(pageSafe * PAGE_SIZE, filteredItems.length)

  function resolveBadge(level: "in-stock" | "low-stock" | "out-of-stock") {
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
              setStatusFilter(event.target.value)
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
          {startRow}-{endRow} sur {filteredItems.length}
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
              const level = getStockLevel(item)
              const badge = resolveBadge(level)

              return (
                <tr key={item.id}>
                  <td>
                    <div className="client-main-cell">
                      <strong>{item.productName}</strong>
                      <small>{item.productId}</small>
                    </div>
                  </td>
                  <td>{item.category}</td>
                  <td>{item.quantityAvailable}</td>
                  <td>{item.lowThreshold}</td>
                  <td>
                    <span className={`status-chip ${badge.className}`}>{badge.text}</span>
                  </td>
                  <td>{formatDate(item.updatedAt)}</td>
                </tr>
              )
            })}

            {currentPageItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="clients-empty-row">
                  Aucun élément de stock trouvé.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="clients-mobile-list">
        {currentPageItems.map((item) => {
          const level = getStockLevel(item)
          const badge = resolveBadge(level)

          return (
            <article key={item.id} className="client-mobile-card">
              <div className="client-mobile-head">
                <div>
                  <strong>{item.productName}</strong>
                  <small>{item.productId}</small>
                </div>
                <span className={`status-chip ${badge.className}`}>{badge.text}</span>
              </div>

              <div className="client-mobile-grid">
                <p>
                  <span>Catégorie</span>
                  <strong>{item.category}</strong>
                </p>
                <p>
                  <span>Qté disponible</span>
                  <strong>{item.quantityAvailable}</strong>
                </p>
                <p>
                  <span>Seuil faible</span>
                  <strong>{item.lowThreshold}</strong>
                </p>
                <p>
                  <span>Mise à jour</span>
                  <strong>{formatDate(item.updatedAt)}</strong>
                </p>
              </div>
            </article>
          )
        })}

        {currentPageItems.length === 0 ? (
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
          disabled={pageSafe === 1}
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
