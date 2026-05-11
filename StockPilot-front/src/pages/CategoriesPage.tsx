import { Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { categoriesData } from "../features/categories/categoryData"
import { formatDate } from "../features/categories/categoryFormatters"
import type { Category } from "../features/categories/categoryTypes"

export function CategoriesPage() {
  const [categories, setCategories] = useState(categoriesData)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const PAGE_SIZE = 6

  const filteredCategories = useMemo(() => {
    const search = query.trim().toLowerCase()

    return categories.filter((category) => {
      const statusOk =
        statusFilter === "all" ? true : category.status === statusFilter
      const searchOk =
        search.length === 0
          ? true
          : category.name.toLowerCase().includes(search) ||
            category.description.toLowerCase().includes(search) ||
            category.id.toLowerCase().includes(search)

      return statusOk && searchOk
    })
  }, [categories, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)

  const currentPageCategories = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE
    return filteredCategories.slice(start, start + PAGE_SIZE)
  }, [filteredCategories, pageSafe])

  const startRow =
    filteredCategories.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const endRow = Math.min(pageSafe * PAGE_SIZE, filteredCategories.length)

  function confirmDeleteCategory() {
    if (!categoryToDelete) {
      return
    }

    setCategories((previous) =>
      previous.filter((category) => category.id !== categoryToDelete.id),
    )
    setCategoryToDelete(null)
  }

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Categories</h2>
          <p className="page-subtitle">Organisation du catalogue produit.</p>
        </div>

        <div className="clients-actions">
          <Link className="btn btn-primary" to="/categories/new">
            <Plus size={16} />
            Ajouter categorie
          </Link>
        </div>
      </div>

      <div className="products-toolbar-grid">
        <label className="search-input-wrap">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher par nom, description ou code"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
        </label>

        <label className="products-filter-field">
          <span>Statut</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">Tous</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </label>
      </div>

      <div className="clients-toolbar">
        <p className="clients-page-indicator">
          {startRow}-{endRow} sur {filteredCategories.length}
        </p>
      </div>

      <div className="table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Categorie</th>
              <th>Description</th>
              <th>Produits</th>
              <th>Creation</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageCategories.map((category) => (
              <tr key={category.id}>
                <td>
                  <div className="client-main-cell">
                    <strong>{category.name}</strong>
                    <small>{category.id}</small>
                  </div>
                </td>
                <td>{category.description}</td>
                <td>{category.productsCount}</td>
                <td>{formatDate(category.createdAt)}</td>
                <td>
                  <span
                    className={`status-chip ${
                      category.status === "active"
                        ? "status-active"
                        : "status-blocked"
                    }`}
                  >
                    {category.status === "active" ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td>
                  <div className="table-actions-icons">
                    <Link
                      to={`/categories/${category.id}/edit`}
                      className="icon-action-btn"
                      aria-label={`Modifier ${category.name}`}
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      type="button"
                      className="icon-action-btn danger"
                      aria-label={`Supprimer ${category.name}`}
                      onClick={() => setCategoryToDelete(category)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {currentPageCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="clients-empty-row">
                  Aucune categorie trouvee.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="clients-mobile-list">
        {currentPageCategories.map((category) => (
          <article key={category.id} className="client-mobile-card">
            <div className="client-mobile-head">
              <div>
                <strong>{category.name}</strong>
                <small>{category.id}</small>
              </div>
              <span
                className={`status-chip ${
                  category.status === "active" ? "status-active" : "status-blocked"
                }`}
              >
                {category.status === "active" ? "Actif" : "Inactif"}
              </span>
            </div>

            <div className="client-mobile-grid">
              <p>
                <span>Description</span>
                <strong>{category.description}</strong>
              </p>
              <p>
                <span>Produits</span>
                <strong>{category.productsCount}</strong>
              </p>
              <p>
                <span>Creation</span>
                <strong>{formatDate(category.createdAt)}</strong>
              </p>
            </div>

            <div className="table-actions-icons">
              <Link
                to={`/categories/${category.id}/edit`}
                className="icon-action-btn"
                aria-label={`Modifier ${category.name}`}
              >
                <Pencil size={15} />
              </Link>
              <button
                type="button"
                className="icon-action-btn danger"
                aria-label={`Supprimer ${category.name}`}
                onClick={() => setCategoryToDelete(category)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        ))}
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

      {categoryToDelete ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setCategoryToDelete(null)}
        >
          <article
            className="modal-card modal-danger"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmer suppression"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Supprimer categorie</h3>
              <button
                type="button"
                className="icon-action-btn"
                aria-label="Fermer"
                onClick={() => setCategoryToDelete(null)}
              >
                <X size={16} />
              </button>
            </div>

            <p className="modal-warning-text">
              Voulez-vous vraiment supprimer {categoryToDelete.name} ?
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setCategoryToDelete(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeleteCategory}
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
