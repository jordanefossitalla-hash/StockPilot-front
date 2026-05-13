import { Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { formatDate, formatFcfa } from "../features/clients/clientFormatters"
import { getClientStats } from "../features/clients/clientStats"
import type { Client } from "../features/clients/clientTypes"
import { deleteClient, listClients } from "../services/clientService"

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [totalClients, setTotalClients] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const PAGE_SIZE = 15

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [query])

  useEffect(() => {
    let isActive = true

    async function fetchClients() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const result = await listClients({
          status: "active",
          search: debouncedQuery,
          page,
          limit: PAGE_SIZE,
        })

        if (!isActive) {
          return
        }

        setClients(result.clients)
        setTotalClients(result.meta.total)
      } catch (error) {
        if (!isActive) {
          return
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Chargement des clients impossible.",
        )
        setClients([])
        setTotalClients(0)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void fetchClients()

    return () => {
      isActive = false
    }
  }, [PAGE_SIZE, debouncedQuery, page])

  const totalPages = Math.max(1, Math.ceil(totalClients / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)

  const currentPageClients = useMemo(() => clients, [clients])

  const stats = useMemo(() => getClientStats(clients), [clients])

  function openClientModal(client: Client) {
    setSelectedClient(client)
  }

  function closeClientModal() {
    setSelectedClient(null)
  }

  async function confirmDeleteClient() {
    if (!clientToDelete) {
      return
    }

    setDeleteError(null)
    setIsDeleting(true)

    try {
      const deletedId = await deleteClient(clientToDelete.id)
      setClients((previous) => previous.filter((client) => client.id !== deletedId))
      setTotalClients((previous) => Math.max(0, previous - 1))
      setClientToDelete(null)
      setSelectedClient(null)
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Suppression client impossible.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const startRow =
    totalClients === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const endRow = Math.min((pageSafe - 1) * PAGE_SIZE + currentPageClients.length, totalClients)

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Clients</h2>
          <p className="page-subtitle">Liste clients, balance et historique.</p>
          {loadError ? <p className="auth-error">{loadError}</p> : null}
          {deleteError ? <p className="auth-error">{deleteError}</p> : null}
        </div>

        <div className="clients-actions">
          <Link className="btn btn-primary" to="/clients/new">
            <Plus size={16} />
            Ajouter client
          </Link>
        </div>
      </div>

      <div className="clients-stats-grid">
        <article className="stat-card">
          <span>Total clients</span>
          <strong>{stats.totalClients}</strong>
        </article>
        <article className="stat-card">
          <span>Total balance</span>
          <strong>{formatFcfa(stats.totalDebt)}</strong>
        </article>
        <article className="stat-card">
          <span>Clients bloqués</span>
          <strong>{stats.blockedCount}</strong>
        </article>
        <article className="stat-card">
          <span>Dernier encours moyen</span>
          <strong>
            {stats.totalClients > 0
              ? formatFcfa(Math.round(stats.totalDebt / stats.totalClients))
              : formatFcfa(0)}
          </strong>
        </article>
      </div>

      <div className="clients-toolbar">
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

        <p className="clients-page-indicator">
          {isLoading ? "Chargement..." : `${startRow}-${endRow} sur ${totalClients}`}
        </p>
      </div>

      <div className="table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Téléphone</th>
              <th>Balance</th>
              <th>Dernier achat</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageClients.map((client) => (
              <tr key={client.id}>
                <td>
                  <div className="client-main-cell">
                    <strong>{client.name}</strong>
                    <small>{client.code ?? client.id}</small>
                  </div>
                </td>
                <td>{client.phone}</td>
                <td>{formatFcfa(client.debtTotal)}</td>
                <td>
                  {client.lastPurchaseDate
                    ? formatDate(client.lastPurchaseDate)
                    : "N/A"}
                </td>
                <td>
                  <span
                    className={`status-chip ${
                      client.status === "active" ? "status-active" : "status-blocked"
                    }`}
                  >
                    {client.status === "active" ? "Actif" : "Bloqué"}
                  </span>
                </td>
                <td>
                  <div className="table-actions-icons">
                    <button
                      type="button"
                      className="icon-action-btn"
                      aria-label={`Voir ${client.name}`}
                      onClick={() => openClientModal(client)}
                    >
                      <Eye size={15} />
                    </button>
                    <Link
                      to={`/clients/${client.id}/edit`}
                      state={{ client }}
                      className="icon-action-btn"
                      aria-label={`Modifier ${client.name}`}
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      type="button"
                      className="icon-action-btn danger"
                      aria-label={`Supprimer ${client.name}`}
                      onClick={() => setClientToDelete(client)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {currentPageClients.length === 0 ? (
              <tr>
                <td colSpan={6} className="clients-empty-row">
                  Aucun client trouvé.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="clients-mobile-list">
        {currentPageClients.map((client) => (
          <article key={client.id} className="client-mobile-card">
            <div className="client-mobile-head">
              <div>
                <strong>{client.name}</strong>
                <small>{client.code ?? client.id}</small>
              </div>
              <span
                className={`status-chip ${
                  client.status === "active" ? "status-active" : "status-blocked"
                }`}
              >
                {client.status === "active" ? "Actif" : "Bloqué"}
              </span>
            </div>

            <div className="client-mobile-grid">
              <p>
                <span>Téléphone</span>
                <strong>{client.phone}</strong>
              </p>
              <p>
                <span>Balance</span>
                <strong>{formatFcfa(client.debtTotal)}</strong>
              </p>
              <p>
                <span>Dernier achat</span>
                <strong>
                  {client.lastPurchaseDate
                    ? formatDate(client.lastPurchaseDate)
                    : "N/A"}
                </strong>
              </p>
            </div>

            <div className="table-actions-icons">
              <button
                type="button"
                className="icon-action-btn"
                aria-label={`Voir ${client.name}`}
                onClick={() => openClientModal(client)}
              >
                <Eye size={15} />
              </button>
              <Link
                to={`/clients/${client.id}/edit`}
                state={{ client }}
                className="icon-action-btn"
                aria-label={`Modifier ${client.name}`}
              >
                <Pencil size={15} />
              </Link>
              <button
                type="button"
                className="icon-action-btn danger"
                aria-label={`Supprimer ${client.name}`}
                onClick={() => setClientToDelete(client)}
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

      {selectedClient ? (
        <div className="modal-backdrop" role="presentation" onClick={closeClientModal}>
          <article
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Détail client"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Détail client</h3>
              <button
                type="button"
                className="icon-action-btn"
                aria-label="Fermer"
                onClick={closeClientModal}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-content">
              <p>
                <span>Nom</span>
                <strong>{selectedClient.name}</strong>
              </p>
              <p>
                <span>Téléphone</span>
                <strong>{selectedClient.phone}</strong>
              </p>
              <p>
                <span>Email</span>
                <strong>{selectedClient.email ?? "Aucun"}</strong>
              </p>
              <p>
                <span>Balance</span>
                <strong>{formatFcfa(selectedClient.debtTotal)}</strong>
              </p>
              <p>
                <span>Dernier achat</span>
                <strong>
                  {selectedClient.lastPurchaseDate
                    ? formatDate(selectedClient.lastPurchaseDate)
                    : "N/A"}
                </strong>
              </p>
            </div>

            <div className="modal-actions">
              <Link to={`/clients/${selectedClient.id}`} className="btn btn-ghost">
                Ouvrir la fiche
              </Link>
              <Link
                to={`/clients/${selectedClient.id}/edit`}
                className="btn btn-primary"
              >
                Modifier
              </Link>
            </div>
          </article>
        </div>
      ) : null}

      {clientToDelete ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setClientToDelete(null)}
        >
          <article
            className="modal-card modal-danger"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmer suppression"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Supprimer client</h3>
              <button
                type="button"
                className="icon-action-btn"
                aria-label="Fermer"
                onClick={() => setClientToDelete(null)}
              >
                <X size={16} />
              </button>
            </div>

            <p className="modal-warning-text">
              Voulez-vous vraiment supprimer {clientToDelete.name} ? Cette action
              est irreversible.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setClientToDelete(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeleteClient}
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
