import { Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { formatDate } from "../features/categories/categoryFormatters"
import type { Category } from "../features/categories/categoryTypes"
import { deleteCategory, listCategories } from "../services/categoryService"

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = useState(1)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const PAGE_SIZE = 20

  useEffect(() => {
    let isMounted = true

    async function fetchCategories() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await listCategories({
          status: statusFilter === "all" ? undefined : statusFilter,
          search: query,
          page,
          limit: PAGE_SIZE,
        })

        if (!isMounted) {
          return
        }

        setCategories(response.data)
        setTotalItems(response.meta.total)
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error ? error.message : "Chargement catégories impossible."
        setLoadError(message)
        setCategories([])
        setTotalItems(0)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchCategories()

    return () => {
      isMounted = false
    }
  }, [page, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const currentPageCategories = categories

  const startRow =
    categories.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const endRow = Math.min((pageSafe - 1) * PAGE_SIZE + categories.length, totalItems)

  async function confirmDeleteCategory() {
    if (!categoryToDelete) {
      return
    }

    setDeleteError(null)
    setIsDeleting(true)

    try {
      const deletedId = await deleteCategory(categoryToDelete.id)

      setCategories((previous) =>
        previous.filter((category) => category.id !== deletedId),
      )
      setTotalItems((previous) => Math.max(previous - 1, 0))
      setCategoryToDelete(null)

      if (categories.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1))
      }
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Suppression catégorie impossible.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Catégories</h2>
          <p className="page-subtitle">Organisation du catalogue produit.</p>
        </div>

        <div className="clients-actions">
          <Link className="btn btn-primary" to="/categories/new">
            <Plus size={16} />
            Ajouter catégorie
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
              setStatusFilter(event.target.value as "all" | "active" | "inactive")
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
          {startRow}-{endRow} sur {totalItems}
        </p>
      </div>

      {loadError ? <p className="form-error-banner">{loadError}</p> : null}

      <div className="table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>Description</th>
              <th>Produits</th>
              <th>Création</th>
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

            {!isLoading && currentPageCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="clients-empty-row">
                  Aucune catégorie trouvée.
                </td>
              </tr>
            ) : null}

            {isLoading ? (
              <tr>
                <td colSpan={6} className="clients-empty-row">
                  Chargement des catégories...
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
                <span>Création</span>
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
              <h3>Supprimer catégorie</h3>
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
              {deleteError ? <p className="form-error-banner">{deleteError}</p> : null}

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setCategoryToDelete(null)
                  setDeleteError(null)
                }}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeleteCategory}
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}
