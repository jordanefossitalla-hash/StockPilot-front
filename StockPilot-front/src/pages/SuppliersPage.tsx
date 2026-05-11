import { Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { suppliersData } from "../features/suppliers/supplierData"
import { formatDate, formatFcfa } from "../features/suppliers/supplierFormatters"
import type { Supplier } from "../features/suppliers/supplierTypes"

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState(suppliersData)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const PAGE_SIZE = 6

  const filteredSuppliers = useMemo(() => {
    const search = query.trim().toLowerCase()

    return suppliers.filter((supplier) => {
      const statusOk = statusFilter === "all" ? true : supplier.status === statusFilter
      const searchOk =
        search.length === 0
          ? true
          : supplier.name.toLowerCase().includes(search) ||
            supplier.phone.toLowerCase().includes(search) ||
            supplier.id.toLowerCase().includes(search)

      return statusOk && searchOk
    })
  }, [suppliers, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)

  const currentPageSuppliers = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE
    return filteredSuppliers.slice(start, start + PAGE_SIZE)
  }, [filteredSuppliers, pageSafe])

  const startRow =
    filteredSuppliers.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const endRow = Math.min(pageSafe * PAGE_SIZE, filteredSuppliers.length)

  function confirmDeleteSupplier() {
    if (!supplierToDelete) {
      return
    }

    setSuppliers((previous) =>
      previous.filter((supplier) => supplier.id !== supplierToDelete.id),
    )
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
            placeholder="Rechercher par nom, telephone ou code"
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
          {startRow}-{endRow} sur {filteredSuppliers.length}
        </p>
      </div>

      <div className="table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Fournisseur</th>
              <th>Telephone</th>
              <th>Produits fournis</th>
              <th>Achats credites</th>
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
                    <small>{supplier.id}</small>
                  </div>
                </td>
                <td>{supplier.phone}</td>
                <td>{supplier.suppliedProducts.length}</td>
                <td>{formatFcfa(supplier.debtTotal)}</td>
                <td>{formatFcfa(supplier.paymentsTotal)}</td>
                <td>
                  {supplier.debtTotal - supplier.paymentsTotal >= 0 ? (
                    <span className="text-danger">
                      {formatFcfa(supplier.debtTotal - supplier.paymentsTotal)} a payer
                    </span>
                  ) : (
                    <span className="text-success">
                      {formatFcfa(Math.abs(supplier.debtTotal - supplier.paymentsTotal))} d avoir
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

            {currentPageSuppliers.length === 0 ? (
              <tr>
                <td colSpan={8} className="clients-empty-row">
                  Aucun fournisseur trouve.
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
                <small>{supplier.id}</small>
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
                <span>Telephone</span>
                <strong>{supplier.phone}</strong>
              </p>
              <p>
                <span>Produits fournis</span>
                <strong>{supplier.suppliedProducts.length}</strong>
              </p>
              <p>
                <span>Achats credites</span>
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
                    supplier.debtTotal - supplier.paymentsTotal >= 0
                      ? "text-danger"
                      : "text-success"
                  }
                >
                  {supplier.debtTotal - supplier.paymentsTotal >= 0
                    ? `${formatFcfa(supplier.debtTotal - supplier.paymentsTotal)} a payer`
                    : `${formatFcfa(Math.abs(supplier.debtTotal - supplier.paymentsTotal))} d avoir`}
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
