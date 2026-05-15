import { Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { formatDate, formatFcfa } from "../features/suppliers/supplierFormatters"
import type { Supplier } from "../features/suppliers/supplierTypes"
import { listSuppliers } from "../services/supplierService"

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = useState(1)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const PAGE_SIZE = 20

  useEffect(() => {
    let isMounted = true

    async function fetchSuppliers() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await listSuppliers({
          status: statusFilter === "all" ? undefined : statusFilter,
          search: query,
          page,
          limit: PAGE_SIZE,
        })

        if (!isMounted) {
          return
        }

        setSuppliers(response.data)
        setTotalItems(response.meta.total)
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error ? error.message : "Chargement fournisseurs impossible."
        setLoadError(message)
        setSuppliers([])
        setTotalItems(0)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSuppliers()

    return () => {
      isMounted = false
    }
  }, [statusFilter, page, query])

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)

  const currentPageSuppliers = suppliers

  const startRow =
    suppliers.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const endRow = Math.min((pageSafe - 1) * PAGE_SIZE + suppliers.length, totalItems)

  function confirmDeleteSupplier() {
    if (!supplierToDelete) {
      return
    }

    setSuppliers((previous) =>
      previous.filter((supplier) => supplier.id !== supplierToDelete.id),
    )
    setTotalItems((previous) => Math.max(previous - 1, 0))
    setSupplierToDelete(null)
  }

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Fournisseurs</h2>
          <p className="page-subtitle">
            Gestion des fournisseurs, dettes et historique de collaboration.
          </p>
        </div>

        <div className="clients-actions">
          <Link className="btn btn-primary" to="/suppliers/new">
            <Plus size={16} />
            Ajouter fournisseur
          </Link>
        </div>
      </div>

      <div className="products-toolbar-grid">
        <label className="search-input-wrap">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher par nom, téléphone ou code"
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
          {startRow}-{endRow} sur {totalItems}
        </p>
      </div>

      {loadError ? <p className="form-error-banner">{loadError}</p> : null}

      <div className="table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Fournisseur</th>
              <th>Téléphone</th>
              <th>Produits fournis</th>
              <th>Achats crédités</th>
              <th>Paiements</th>
              <th>Solde courant</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>
                  <div className="client-main-cell">
                    <strong>{supplier.name}</strong>
                    <small>{supplier.code ?? supplier.id}</small>
                  </div>
                </td>
                <td>{supplier.phone}</td>
                <td>{supplier.suppliedProducts.length}</td>
                <td>{formatFcfa(supplier.debtTotal)}</td>
                <td>{formatFcfa(supplier.paymentsTotal)}</td>
                <td>
                  {supplier.debtTotal >= 0 ? (
                    <span className="text-success">
                      {formatFcfa(supplier.debtTotal)} d'avance
                    </span>
                  ) : (
                    <span className="text-danger">
                      {formatFcfa(Math.abs(supplier.debtTotal))} à régler
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`status-chip ${
                      supplier.status === "active" ? "status-active" : "status-blocked"
                    }`}
                  >
                    {supplier.status === "active" ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td>
                  <div className="table-actions-icons">
                    <Link
                      to={`/suppliers/${supplier.id}`}
                      className="icon-action-btn"
                      aria-label={`Voir ${supplier.name}`}
                    >
                      <Eye size={15} />
                    </Link>
                    <Link
                      to={`/suppliers/${supplier.id}/edit`}
                      className="icon-action-btn"
                      aria-label={`Modifier ${supplier.name}`}
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      type="button"
                      className="icon-action-btn danger"
                      aria-label={`Supprimer ${supplier.name}`}
                      onClick={() => setSupplierToDelete(supplier)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!isLoading && currentPageSuppliers.length === 0 ? (
              <tr>
                <td colSpan={8} className="clients-empty-row">
                  Aucun fournisseur trouvé.
                </td>
              </tr>
            ) : null}

            {isLoading ? (
              <tr>
                <td colSpan={8} className="clients-empty-row">
                  Chargement des fournisseurs...
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="clients-mobile-list">
        {currentPageSuppliers.map((supplier) => (
          <article key={supplier.id} className="client-mobile-card">
            <div className="client-mobile-head">
              <div>
                <strong>{supplier.name}</strong>
                <small>{supplier.code ?? supplier.id}</small>
              </div>
              <span
                className={`status-chip ${
                  supplier.status === "active" ? "status-active" : "status-blocked"
                }`}
              >
                {supplier.status === "active" ? "Actif" : "Inactif"}
              </span>
            </div>

            <div className="client-mobile-grid">
              <p>
                <span>Téléphone</span>
                <strong>{supplier.phone}</strong>
              </p>
              <p>
                <span>Produits fournis</span>
                <strong>{supplier.suppliedProducts.length}</strong>
              </p>
              <p>
                <span>Achats crédités</span>
                <strong>{formatFcfa(supplier.debtTotal)}</strong>
              </p>
              <p>
                <span>Paiements</span>
                <strong>{formatFcfa(supplier.paymentsTotal)}</strong>
              </p>
              <p>
                <span>Solde courant</span>
                <strong
                  className={
                    supplier.debtTotal >= 0
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  {supplier.debtTotal >= 0
                    ? `${formatFcfa(supplier.debtTotal)} d'avance`
                    : `${formatFcfa(Math.abs(supplier.debtTotal))} à régler`}
                </strong>
              </p>
              <p>
                <span>Depuis</span>
                <strong>{formatDate(supplier.createdAt)}</strong>
              </p>
            </div>

            <div className="table-actions-icons">
              <Link
                to={`/suppliers/${supplier.id}`}
                className="icon-action-btn"
                aria-label={`Voir ${supplier.name}`}
              >
                <Eye size={15} />
              </Link>
              <Link
                to={`/suppliers/${supplier.id}/edit`}
                className="icon-action-btn"
                aria-label={`Modifier ${supplier.name}`}
              >
                <Pencil size={15} />
              </Link>
              <button
                type="button"
                className="icon-action-btn danger"
                aria-label={`Supprimer ${supplier.name}`}
                onClick={() => setSupplierToDelete(supplier)}
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

      {supplierToDelete ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSupplierToDelete(null)}
        >
          <article
            className="modal-card modal-danger"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmer suppression fournisseur"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Supprimer fournisseur</h3>
              <button
                type="button"
                className="icon-action-btn"
                aria-label="Fermer"
                onClick={() => setSupplierToDelete(null)}
              >
                <X size={16} />
              </button>
            </div>

            <p className="modal-warning-text">
              Voulez-vous vraiment supprimer {supplierToDelete.name} ?
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSupplierToDelete(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeleteSupplier}
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
