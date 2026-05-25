import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Loader2,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { listClients } from "../services/clientService"
import {
  createClientOrder,
  deleteClientOrder,
  getClientOrdersStats,
  listClientOrders,
  updateClientOrderDeliveryStatus,
  type ClientOrdersStats,
  type ClientOrder,
  type OrderPriority,
  type OrderStatus,
} from "../services/orderService"
import { setPendingOrdersCount } from "../utils/orderPendingSignal"

type OrderViewTab = "entry" | "list"
type OrderStatusTab = "all" | OrderStatus
type OrderPriorityFilter = "all" | OrderPriority

type ClientOption = {
  id: string
  name: string
}

const statusTabs: Array<{ value: OrderStatusTab; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "to-deliver", label: "À livrer" },
  { value: "delivered", label: "Livrées" },
]

const priorityOptions: Array<{ value: OrderPriority; label: string }> = [
  { value: "high", label: "Haute" },
  { value: "medium", label: "Moyenne" },
  { value: "low", label: "Faible" },
]

const priorityFilterOptions: Array<{ value: OrderPriorityFilter; label: string }> = [
  { value: "all", label: "Toutes priorités" },
  { value: "high", label: "Haute" },
  { value: "medium", label: "Moyenne" },
  { value: "low", label: "Faible" },
]

const PAGE_SIZE = 20

function toDateTimeLocalValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatOrderDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getDeliveryHint(deliveryDueAt: string, status: OrderStatus) {
  if (status === "delivered") {
    return { label: "Livrée", className: "is-delivered" }
  }

  const dueAt = new Date(deliveryDueAt).getTime()
  if (Number.isNaN(dueAt)) {
    return { label: "Date invalide", className: "is-overdue" }
  }

  const diffMs = dueAt - Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000

  if (diffMs < 0) {
    return { label: "En retard", className: "is-overdue" }
  }

  if (diffMs <= oneDayMs) {
    return { label: "Aujourd'hui", className: "is-today" }
  }

  if (diffMs <= oneDayMs * 2) {
    return { label: "Demain", className: "is-upcoming" }
  }

  return { label: "Planifiée", className: "is-upcoming" }
}

function priorityLabel(priority: OrderPriority) {
  if (priority === "high") {
    return "Haute"
  }

  if (priority === "medium") {
    return "Moyenne"
  }

  return "Faible"
}

function priorityClassName(priority: OrderPriority) {
  if (priority === "high") {
    return "status-blocked"
  }

  if (priority === "medium") {
    return "status-warning"
  }

  return "status-active"
}

function statusLabel(status: OrderStatus) {
  return status === "to-deliver" ? "À livrer" : "Livrée"
}

function statusClassName(status: OrderStatus) {
  return status === "to-deliver" ? "status-warning" : "status-active"
}

export function OrdersPage() {
  const nowDateTimeLocal = toDateTimeLocalValue(new Date())
  const [orders, setOrders] = useState<ClientOrder[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [isClientsLoading, setIsClientsLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusBusyOrderId, setStatusBusyOrderId] = useState<string | null>(null)
  const [deleteBusyOrderId, setDeleteBusyOrderId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [formError, setFormError] = useState("")
  const [activeViewTab, setActiveViewTab] = useState<OrderViewTab>("list")
  const [activeStatusTab, setActiveStatusTab] = useState<OrderStatusTab>("to-deliver")
  const [activePriorityFilter, setActivePriorityFilter] = useState<OrderPriorityFilter>("all")
  const [isMobileKpiOpen, setIsMobileKpiOpen] = useState(false)
  const [clientId, setClientId] = useState("")
  const [priority, setPriority] = useState<OrderPriority>("medium")
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(nowDateTimeLocal)
  const [note, setNote] = useState("")
  const [search, setSearch] = useState("")
  const [totalOrders, setTotalOrders] = useState(0)
  const [page, setPage] = useState(1)
  const [orderToDelete, setOrderToDelete] = useState<ClientOrder | null>(null)
  const [stats, setStats] = useState<ClientOrdersStats>({
    toDeliver: 0,
    delivered: 0,
    highPriority: 0,
  })

  useEffect(() => {
    let isActive = true

    async function fetchClientsOptions() {
      setIsClientsLoading(true)

      try {
        const result = await listClients({
          page: 1,
          limit: 100,
        })

        if (!isActive) {
          return
        }

        const options = result.clients.map((client) => ({
          id: client.id,
          name: client.name,
        }))

        setClients(options)
        setClientId((current) => current || options[0]?.id || "")
      } catch {
        if (!isActive) {
          return
        }

        setClients([])
        setClientId("")
      } finally {
        if (isActive) {
          setIsClientsLoading(false)
        }
      }
    }

    void fetchClientsOptions()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function fetchOrders() {
      setIsLoading(true)
      setLoadError(null)
      setActionError(null)

      try {
        const result = await listClientOrders({
          status: activeStatusTab === "all" ? undefined : activeStatusTab,
          priority: activePriorityFilter === "all" ? undefined : activePriorityFilter,
          page,
          limit: PAGE_SIZE,
        })

        if (!isActive) {
          return
        }

        setOrders(result.data)
        setTotalOrders(result.meta.total)
      } catch (error) {
        if (!isActive) {
          return
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Chargement des commandes impossible.",
        )
        setOrders([])
        setTotalOrders(0)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void fetchOrders()

    return () => {
      isActive = false
    }
  }, [activePriorityFilter, activeStatusTab, page])

  useEffect(() => {
    let isActive = true

    async function fetchOrdersStats() {
      try {
        const result = await getClientOrdersStats()

        if (!isActive) {
          return
        }

        setStats(result)
        setPendingOrdersCount(result.toDeliver)
      } catch {
        if (!isActive) {
          return
        }

        setStats({
          toDeliver: 0,
          delivered: 0,
          highPriority: 0,
        })
        setPendingOrdersCount(0)
      }
    }

    void fetchOrdersStats()

    return () => {
      isActive = false
    }
  }, [deleteBusyOrderId, isSubmitting, statusBusyOrderId, totalOrders])

  const clientNameById = useMemo(() => {
    return new Map(clients.map((client) => [client.id, client.name]))
  }, [clients])

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return orders
    }

    return orders.filter((order) => {
      const clientName = (clientNameById.get(order.clientId) || "").toLowerCase()

      return (
        order.id.toLowerCase().includes(query) ||
        clientName.includes(query) ||
        order.note.toLowerCase().includes(query)
      )
    })
  }, [clientNameById, orders, search])

  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const startRow = totalOrders === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const endRow = Math.min((pageSafe - 1) * PAGE_SIZE + orders.length, totalOrders)
  const hasActiveFilters =
    search.trim().length > 0 ||
    activePriorityFilter !== "all" ||
    activeStatusTab !== "all"

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handlePriorityFilterChange(value: OrderPriorityFilter) {
    setActivePriorityFilter(value)
    setPage(1)
  }

  function handleStatusTabChange(value: OrderStatusTab) {
    setActiveStatusTab(value)
    setPage(1)
  }

  function statusTabCount(tab: OrderStatusTab) {
    if (tab === "all") {
      return stats.toDeliver + stats.delivered
    }

    if (tab === "to-deliver") {
      return stats.toDeliver
    }

    return stats.delivered
  }

  function clearListFilters() {
    setSearch("")
    setActivePriorityFilter("all")
    setActiveStatusTab("all")
    setPage(1)
  }

  function resetForm() {
    setClientId(clients[0]?.id ?? "")
    setPriority("medium")
    setExpectedDeliveryDate(toDateTimeLocalValue(new Date()))
    setNote("")
    setFormError("")
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")

    if (!clientId) {
      setFormError("Sélectionnez un client.")
      return
    }

    if (!expectedDeliveryDate) {
      setFormError("Choisissez une date de livraison prévisionnelle.")
      return
    }

    const expectedTimestamp = new Date(expectedDeliveryDate).getTime()

    if (Number.isNaN(expectedTimestamp)) {
      setFormError("La date et l'heure de livraison est invalide.")
      return
    }

    if (expectedTimestamp < Date.now()) {
      setFormError("La date et l'heure de livraison doit être dans le futur.")
      return
    }

    setIsSubmitting(true)

    try {
      await createClientOrder({
        clientId,
        orderedAt: new Date().toISOString(),
        deliveryDueAt: new Date(expectedDeliveryDate).toISOString(),
        priority,
        note: note.trim() || undefined,
      })

      setActiveViewTab("list")
      setActiveStatusTab("to-deliver")
      setActivePriorityFilter("all")
      setPage(1)
      resetForm()

      const refreshed = await listClientOrders({
        status: "to-deliver",
        page: 1,
        limit: PAGE_SIZE,
      })

      setOrders(refreshed.data)
      setTotalOrders(refreshed.meta.total)
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Création commande impossible.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function refreshCurrentOrders(targetPage = page) {
    const result = await listClientOrders({
      status: activeStatusTab === "all" ? undefined : activeStatusTab,
      priority: activePriorityFilter === "all" ? undefined : activePriorityFilter,
      page: targetPage,
      limit: PAGE_SIZE,
    })

    setOrders(result.data)
    setTotalOrders(result.meta.total)
  }

  async function handleToggleDeliveryStatus(order: ClientOrder) {
    setActionError(null)
    setStatusBusyOrderId(order.id)

    try {
      const nextStatus: OrderStatus =
        order.status === "to-deliver" ? "delivered" : "to-deliver"

      await updateClientOrderDeliveryStatus(order.id, nextStatus)
      await refreshCurrentOrders()
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Mise à jour du statut impossible.",
      )
    } finally {
      setStatusBusyOrderId(null)
    }
  }

  function requestDeleteOrder(order: ClientOrder) {
    setOrderToDelete(order)
  }

  async function confirmDeleteOrder() {
    if (!orderToDelete) {
      return
    }

    const orderId = orderToDelete.id
    setActionError(null)
    setDeleteBusyOrderId(orderId)

    try {
      await deleteClientOrder(orderId)

      if (orders.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1))
      } else {
        await refreshCurrentOrders()
      }

      setOrderToDelete(null)
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Suppression commande impossible.",
      )
    } finally {
      setDeleteBusyOrderId(null)
    }
  }

  const hasFilteredOrders = filteredOrders.length > 0

  return (
    <section className="page orders-page clients-page">
      <div className="page-header">
        <h2 className="page-title">Commandes</h2>
        <p className="page-subtitle">
          Enregistrez les commandes par priorité et suivez les livraisons.
        </p>
        {loadError ? <p className="form-error-banner">{loadError}</p> : null}
        {actionError ? <p className="form-error-banner">{actionError}</p> : null}
      </div>

      <div className="sales-main-tabs orders-main-tabs" role="tablist" aria-label="Vue commandes">
        <button
          type="button"
          className={`sales-main-tab-btn${activeViewTab === "list" ? " is-active" : ""}`}
          role="tab"
          aria-selected={activeViewTab === "list"}
          onClick={() => setActiveViewTab("list")}
        >
          Liste des commandes
        </button>
        <button
          type="button"
          className={`sales-main-tab-btn${activeViewTab === "entry" ? " is-active" : ""}`}
          role="tab"
          aria-selected={activeViewTab === "entry"}
          onClick={() => setActiveViewTab("entry")}
        >
          Créer commande
        </button>
      </div>

      <div className={`orders-kpi-block${isMobileKpiOpen ? " is-open" : ""}`}>
        <button
          type="button"
          className="orders-kpi-toggle"
          onClick={() => setIsMobileKpiOpen((current) => !current)}
          aria-expanded={isMobileKpiOpen}
        >
          <span>KPIs commandes</span>
          {isMobileKpiOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <div className="clients-stats-grid orders-stats-grid">
          <article className="stat-card">
            <span>Total commandes</span>
            <strong>{stats.toDeliver + stats.delivered}</strong>
          </article>
          <article className="stat-card">
            <span>À livrer</span>
            <strong>{stats.toDeliver}</strong>
          </article>
          <article className="stat-card">
            <span>Livrées</span>
            <strong>{stats.delivered}</strong>
          </article>
          <article className="stat-card">
            <span>Priorité haute</span>
            <strong>{stats.highPriority}</strong>
          </article>
        </div>
      </div>

      {activeViewTab === "entry" ? (
        <div className="sales-layout-grid orders-layout-grid">
          <form className="client-form-card" onSubmit={handleSubmit}>
            <div className="sales-form-head">
              <h3>Nouvelle commande</h3>
              <button type="button" className="btn btn-ghost" onClick={resetForm}>
                Réinitialiser
              </button>
            </div>

            <div className="client-form-grid">
              <label className="field-block">
                <span>Client *</span>
                <select
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  disabled={isClientsLoading}
                >
                  {clients.length === 0 ? (
                    <option value="">Aucun client disponible</option>
                  ) : (
                    clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="field-block">
                <span>Priorité *</span>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as OrderPriority)}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span>Date et heure de livraison prévues *</span>
                <input
                  type="datetime-local"
                  min={nowDateTimeLocal}
                  step={60}
                  value={expectedDeliveryDate}
                  onChange={(event) => setExpectedDeliveryDate(event.target.value)}
                />
              </label>

              <label className="field-block field-block-full">
                <span>Note (optionnel)</span>
                <textarea
                  rows={3}
                  placeholder="Ex: commande urgente, confirmer à la réception"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
            </div>

            {formError ? <p className="supplier-payment-error">{formError}</p> : null}

            <div className="client-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || isClientsLoading || clients.length === 0}
              >
                <Plus size={16} />
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>

          <aside className="client-form-card sales-info-card">
            <h3>Règles de priorité</h3>
            <ul className="sales-info-list">
              <li>Haute: livraison urgente (à traiter en premier).</li>
              <li>Moyenne: livraison normale planifiée.</li>
              <li>Faible: livraison flexible.</li>
            </ul>
            <p className="supplier-payment-caption">
              La création envoie directement les champs API: clientId, orderedAt,
              deliveryDueAt, priority et note.
            </p>
          </aside>
        </div>
      ) : (
        <>
          <div className="clients-toolbar sales-toolbar orders-toolbar">
            <label className="search-input-wrap">
              <Search size={16} />
              <input
                type="search"
                placeholder="Rechercher par client ou note"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </label>

            <label className="field-block orders-priority-filter">
              <span>Priorité</span>
              <select
                value={activePriorityFilter}
                onChange={(event) => handlePriorityFilterChange(event.target.value as OrderPriorityFilter)}
              >
                {priorityFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <p className="clients-page-indicator">
              {isLoading ? "Chargement..." : `${startRow}-${endRow} sur ${totalOrders}`}
            </p>

            {hasActiveFilters ? (
              <button type="button" className="btn btn-ghost orders-reset-btn" onClick={clearListFilters}>
                Réinitialiser filtres
              </button>
            ) : null}
          </div>

          <div className="sales-tabs" role="tablist" aria-label="Statuts commandes">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`sales-tab-btn${activeStatusTab === tab.value ? " is-active" : ""}`}
                role="tab"
                aria-selected={activeStatusTab === tab.value}
                onClick={() => handleStatusTabChange(tab.value)}
              >
                <span>{tab.label}</span>
                <strong>{statusTabCount(tab.value)}</strong>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="placeholder-state">
              <ClipboardList size={36} strokeWidth={1.25} className="text-muted" />
              <p>Chargement des commandes...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="placeholder-state">
              <ClipboardList size={38} strokeWidth={1.25} className="text-muted" />
              <p>Aucune commande enregistrée pour ce filtre.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveViewTab("entry")}
              >
                <Plus size={15} />
                Créer une commande
              </button>
            </div>
          ) : !hasFilteredOrders ? (
            <div className="placeholder-state">
              <ClipboardList size={36} strokeWidth={1.25} className="text-muted" />
              <p>Aucune commande ne correspond à la recherche.</p>
              <button type="button" className="btn btn-ghost" onClick={() => setSearch("") }>
                Effacer la recherche
              </button>
            </div>
          ) : (
            <>
              <div className="table-wrap orders-table-wrap">
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Priorité</th>
                      <th>Livraison prévue</th>
                      <th>Échéance</th>
                      <th>Statut</th>
                      <th>Note</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const deliveryHint = getDeliveryHint(order.deliveryDueAt, order.status)

                      return (
                      <tr key={order.id}>
                        <td>{clientNameById.get(order.clientId) || order.clientId}</td>
                        <td>
                          <span className={`status-chip ${priorityClassName(order.priority)}`}>
                            {priorityLabel(order.priority)}
                          </span>
                        </td>
                        <td>{formatOrderDateTime(order.deliveryDueAt)}</td>
                        <td>
                          <span className={`orders-deadline-hint ${deliveryHint.className}`}>
                            {deliveryHint.label}
                          </span>
                        </td>
                        <td>
                          <span className={`status-chip ${statusClassName(order.status)}`}>
                            {statusLabel(order.status)}
                          </span>
                        </td>
                        <td>{order.note || "-"}</td>
                        <td>
                          <div className="table-actions-icons">
                            <button
                              type="button"
                              className="btn btn-ghost orders-action-btn"
                              onClick={() => handleToggleDeliveryStatus(order)}
                              disabled={statusBusyOrderId === order.id || deleteBusyOrderId === order.id}
                            >
                              {statusBusyOrderId === order.id ? (
                                <>
                                  <Loader2 size={15} className="icon-spin" />
                                  Mise à jour...
                                </>
                              ) : order.status === "to-deliver" ? (
                                <>
                                  <CheckCircle2 size={15} />
                                  Marquer livrée
                                </>
                              ) : (
                                <>
                                  <Truck size={15} />
                                  Remettre à livrer
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost orders-action-btn"
                              onClick={() => requestDeleteOrder(order)}
                              disabled={deleteBusyOrderId === order.id || statusBusyOrderId === order.id}
                            >
                              {deleteBusyOrderId === order.id ? (
                                <>
                                  <Loader2 size={15} className="icon-spin" />
                                  Suppression...
                                </>
                              ) : (
                                <>
                                  <Trash2 size={15} />
                                  Supprimer
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              <div className="clients-mobile-list orders-mobile-list">
                {filteredOrders.map((order) => {
                  const deliveryHint = getDeliveryHint(order.deliveryDueAt, order.status)

                  return (
                  <article key={`${order.id}-mobile`} className="client-mobile-card">
                    <div className="client-mobile-head">
                      <div>
                        <strong>{clientNameById.get(order.clientId) || order.clientId}</strong>
                      </div>
                      <span className={`status-chip ${statusClassName(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </div>

                    <div className="client-mobile-grid">
                      <p>
                        <span>Priorité</span>
                        <strong>{priorityLabel(order.priority)}</strong>
                      </p>
                      <p>
                        <span>Livraison prévue</span>
                        <strong>{formatOrderDateTime(order.deliveryDueAt)}</strong>
                        <small className={`orders-deadline-hint ${deliveryHint.className}`}>
                          {deliveryHint.label}
                        </small>
                      </p>
                      <p>
                        <span>Note</span>
                        <strong>{order.note || "-"}</strong>
                      </p>
                    </div>

                    <div className="table-actions-icons">
                      <button
                        type="button"
                        className="btn btn-ghost orders-action-btn"
                        onClick={() => handleToggleDeliveryStatus(order)}
                        disabled={statusBusyOrderId === order.id || deleteBusyOrderId === order.id}
                      >
                        {statusBusyOrderId === order.id ? (
                          <>
                            <Loader2 size={15} className="icon-spin" />
                            Mise à jour...
                          </>
                        ) : order.status === "to-deliver" ? (
                          <>
                            <CheckCircle2 size={15} />
                            Marquer livrée
                          </>
                        ) : (
                          <>
                            <Truck size={15} />
                            Remettre à livrer
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost orders-action-btn"
                        onClick={() => requestDeleteOrder(order)}
                        disabled={deleteBusyOrderId === order.id || statusBusyOrderId === order.id}
                      >
                        {deleteBusyOrderId === order.id ? (
                          <>
                            <Loader2 size={15} className="icon-spin" />
                            Suppression...
                          </>
                        ) : (
                          <>
                            <Trash2 size={15} />
                            Supprimer
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                )})}
              </div>
            </>
          )}

          {orderToDelete ? (
            <div
              className="modal-backdrop"
              role="presentation"
              onClick={() => {
                if (!deleteBusyOrderId) {
                  setOrderToDelete(null)
                }
              }}
            >
              <article
                className="modal-card modal-danger"
                role="dialog"
                aria-modal="true"
                aria-label="Confirmer suppression commande"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-head">
                  <h3>Supprimer commande</h3>
                  <button
                    type="button"
                    className="icon-action-btn"
                    aria-label="Fermer"
                    onClick={() => {
                      if (!deleteBusyOrderId) {
                        setOrderToDelete(null)
                      }
                    }}
                    disabled={Boolean(deleteBusyOrderId)}
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="modal-warning-text">
                  Voulez-vous vraiment supprimer la commande de
                  {" "}
                  <strong>{clientNameById.get(orderToDelete.clientId) || orderToDelete.clientId}</strong>
                  {" "}
                  ? Cette action est irréversible.
                </p>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setOrderToDelete(null)}
                    disabled={Boolean(deleteBusyOrderId)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmDeleteOrder}
                    disabled={Boolean(deleteBusyOrderId)}
                  >
                    {deleteBusyOrderId ? "Suppression..." : "Supprimer"}
                  </button>
                </div>
              </article>
            </div>
          ) : null}

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
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`page-chip ${pageNumber === pageSafe ? "active" : ""}`}
                  onClick={() => setPage(pageNumber)}
                  disabled={isLoading}
                >
                  {pageNumber}
                </button>
              ))}
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
        </>
      )}
    </section>
  )
}
