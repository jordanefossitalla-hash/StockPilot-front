import {
  ArrowDownAZ,
  ArrowUpAZ,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { productsData } from "../features/products/productData"
import {
  formatDate,
  formatFcfa,
  formatProductCategory,
} from "../features/products/productFormatters"
import { getProductStats, getProductStockStatus } from "../features/products/productStats"
import type { Product } from "../features/products/productTypes"

export function ProductsPage() {
  const [products, setProducts] = useState(productsData)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [sortField, setSortField] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const PAGE_SIZE = 6

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase()

    return products.filter((product) => {
      const stockStatus = getProductStockStatus(product.quantity)
      const categoryOk =
        categoryFilter === "all" ? true : product.category === categoryFilter
      const stockOk = stockFilter === "all" ? true : stockStatus === stockFilter
      const searchOk =
        search.length === 0
          ? true
          : product.name.toLowerCase().includes(search) ||
            product.id.toLowerCase().includes(search) ||
            formatProductCategory(product.category).toLowerCase().includes(search)

      return categoryOk && stockOk && searchOk
    })
  }, [products, query, categoryFilter, stockFilter])

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts]

    sorted.sort((first, second) => {
      const order = sortDirection === "asc" ? 1 : -1

      if (sortField === "name") {
        return first.name.localeCompare(second.name) * order
      }

      if (sortField === "salePrice") {
        return (first.salePrice - second.salePrice) * order
      }

      if (sortField === "purchasePrice") {
        return (first.purchasePrice - second.purchasePrice) * order
      }

      if (sortField === "quantity") {
        return (first.quantity - second.quantity) * order
      }

      return first.createdAt.localeCompare(second.createdAt) * order
    })

    return sorted
  }, [filteredProducts, sortField, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)

  const currentPageProducts = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE
    return sortedProducts.slice(start, start + PAGE_SIZE)
  }, [sortedProducts, pageSafe])

  const stats = useMemo(() => getProductStats(products), [products])

  const startRow = sortedProducts.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const endRow = Math.min(pageSafe * PAGE_SIZE, sortedProducts.length)

  function handleDeleteConfirm() {
    if (!productToDelete) {
      return
    }

    setProducts((previous) =>
      previous.filter((product) => product.id !== productToDelete.id),
    )
    setProductToDelete(null)
  }

  function getStockBadge(quantity: number) {
    const status = getProductStockStatus(quantity)

    if (status === "out-of-stock") {
      return { label: "Rupture", className: "status-blocked" }
    }

    if (status === "low-stock") {
      return { label: "Stock faible", className: "status-warning" }
    }

    return { label: "Disponible", className: "status-active" }
  }

  function toggleSort(nextField: string) {
    if (sortField === nextField) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
    } else {
      setSortField(nextField)
      setSortDirection("asc")
    }
    setPage(1)
  }

  const sortIcon =
    sortDirection === "asc" ? <ArrowUpAZ size={15} /> : <ArrowDownAZ size={15} />

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Produits</h2>
          <p className="page-subtitle">
            Catalogue produits, gestion des prix et suivi du stock.
          </p>
        </div>

        <div className="clients-actions">
          <Link className="btn btn-primary" to="/products/new">
            <Plus size={16} />
            Ajouter produit
          </Link>
        </div>
      </div>

      <div className="clients-stats-grid">
        <article className="stat-card">
          <span>Total produits</span>
          <strong>{stats.totalProducts}</strong>
        </article>
        <article className="stat-card">
          <span>Unites en stock</span>
          <strong>{stats.totalStockUnits}</strong>
        </article>
        <article className="stat-card">
          <span>Valeur stock (achat)</span>
          <strong>{formatFcfa(stats.totalStockValuePurchase)}</strong>
        </article>
        <article className="stat-card">
          <span>Valeur stock (vente)</span>
          <strong>{formatFcfa(stats.totalStockValueSale)}</strong>
        </article>
      </div>

      <div className="products-toolbar-grid">
        <label className="search-input-wrap">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher par nom, code, catégorie"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
        </label>

        <label className="products-filter-field">
          <span>Catégorie</span>
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">Toutes</option>
            <option value="informatique">Informatique</option>
            <option value="electromenager">Electromenager</option>
            <option value="accessoire">Accessoire</option>
            <option value="consommable">Consommable</option>
          </select>
        </label>

        <label className="products-filter-field">
          <span>Stock</span>
          <select
            value={stockFilter}
            onChange={(event) => {
              setStockFilter(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">Tous</option>
            <option value="in-stock">Disponible</option>
            <option value="low-stock">Stock faible</option>
            <option value="out-of-stock">Rupture</option>
          </select>
        </label>

        <div className="products-sort-wrap">
          <span>Tri</span>
          <div className="products-sort-actions">
            <button
              type="button"
              className={`btn btn-ghost products-sort-btn ${
                sortField === "name" ? "is-selected" : ""
              }`}
              onClick={() => toggleSort("name")}
            >
              Nom {sortField === "name" ? sortIcon : null}
            </button>
            <button
              type="button"
              className={`btn btn-ghost products-sort-btn ${
                sortField === "salePrice" ? "is-selected" : ""
              }`}
              onClick={() => toggleSort("salePrice")}
            >
              Prix vente {sortField === "salePrice" ? sortIcon : null}
            </button>
            <button
              type="button"
              className={`btn btn-ghost products-sort-btn ${
                sortField === "quantity" ? "is-selected" : ""
              }`}
              onClick={() => toggleSort("quantity")}
            >
              Stock {sortField === "quantity" ? sortIcon : null}
            </button>
          </div>
        </div>
      </div>

      <div className="clients-toolbar">
        <p className="clients-page-indicator">
          {startRow}-{endRow} sur {sortedProducts.length}
        </p>
      </div>

      <div className="table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Prix achat</th>
              <th>Prix vente</th>
              <th>Marge</th>
              <th>Stock</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageProducts.map((product) => {
              const stock = getStockBadge(product.quantity)
              return (
                <tr key={product.id}>
                  <td>
                    <div className="client-main-cell">
                      <strong>{product.name}</strong>
                      <small>{product.id}</small>
                    </div>
                  </td>
                  <td>{formatProductCategory(product.category)}</td>
                  <td>{formatFcfa(product.purchasePrice)}</td>
                  <td>{formatFcfa(product.salePrice)}</td>
                  <td>{formatFcfa(product.salePrice - product.purchasePrice)}</td>
                  <td>{product.quantity}</td>
                  <td>
                    <span className={`status-chip ${stock.className}`}>{stock.label}</span>
                  </td>
                  <td>
                    <div className="table-actions-icons">
                      <Link
                        to={`/products/${product.id}`}
                        className="icon-action-btn"
                        aria-label={`Voir ${product.name}`}
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        to={`/products/${product.id}/edit`}
                        className="icon-action-btn"
                        aria-label={`Modifier ${product.name}`}
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        className="icon-action-btn danger"
                        aria-label={`Supprimer ${product.name}`}
                        onClick={() => setProductToDelete(product)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {currentPageProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="clients-empty-row">
                  Aucun produit trouvé.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="clients-mobile-list">
        {currentPageProducts.map((product) => {
          const stock = getStockBadge(product.quantity)
          return (
            <article key={product.id} className="client-mobile-card">
              <div className="client-mobile-head">
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.id}</small>
                </div>
                <span className={`status-chip ${stock.className}`}>{stock.label}</span>
              </div>

              <div className="client-mobile-grid">
                <p>
                  <span>Catégorie</span>
                  <strong>{formatProductCategory(product.category)}</strong>
                </p>
                <p>
                  <span>Prix achat</span>
                  <strong>{formatFcfa(product.purchasePrice)}</strong>
                </p>
                <p>
                  <span>Prix vente</span>
                  <strong>{formatFcfa(product.salePrice)}</strong>
                </p>
                <p>
                  <span>Stock</span>
                  <strong>{product.quantity}</strong>
                </p>
                <p>
                  <span>Ajouté le</span>
                  <strong>{formatDate(product.createdAt)}</strong>
                </p>
              </div>

              <div className="table-actions-icons">
                <Link
                  to={`/products/${product.id}`}
                  className="icon-action-btn"
                  aria-label={`Voir ${product.name}`}
                >
                  <Eye size={15} />
                </Link>
                <Link
                  to={`/products/${product.id}/edit`}
                  className="icon-action-btn"
                  aria-label={`Modifier ${product.name}`}
                >
                  <Pencil size={15} />
                </Link>
                <button
                  type="button"
                  className="icon-action-btn danger"
                  aria-label={`Supprimer ${product.name}`}
                  onClick={() => setProductToDelete(product)}
                >
                  <Trash2 size={15} />
                </button>
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

      {productToDelete ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setProductToDelete(null)}
        >
          <article
            className="modal-card modal-danger"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmer suppression produit"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Supprimer produit</h3>
              <button
                type="button"
                className="icon-action-btn"
                aria-label="Fermer"
                onClick={() => setProductToDelete(null)}
              >
                <X size={16} />
              </button>
            </div>

            <p className="modal-warning-text">
              Voulez-vous vraiment supprimer {productToDelete.name} ? Cette action
              est irreversible.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setProductToDelete(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
              >
                Supprimer
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}
