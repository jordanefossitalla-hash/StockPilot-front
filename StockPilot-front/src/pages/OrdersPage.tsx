import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Plus,
  Search,
  Truck,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { clientsData } from "../features/clients/clientData"
import { productsData } from "../features/products/productData"
import { setPendingOrdersCount } from "../utils/orderPendingSignal"

type OrderPriority = "high" | "medium" | "low"
type OrderStatus = "to-deliver" | "delivered"
type OrderViewTab = "entry" | "list"
type OrderStatusTab = "all" | OrderStatus

type OrderRecord = {
  id: string
  clientId: string
  clientName: string
  productId: string
  productName: string
  quantity: number
  priority: OrderPriority
  expectedDeliveryDate: string
  note: string
  status: OrderStatus
  createdAt: string
  deliveredAt?: string
}

const priorityOptions: Array<{ value: OrderPriority; label: string }> = [
  { value: "high", label: "Haute" },
  { value: "medium", label: "Moyenne" },
  { value: "low", label: "Faible" },
]

const statusTabs: Array<{ value: OrderStatusTab; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "to-deliver", label: "À livrer" },
  { value: "delivered", label: "Livrées" },
]

const initialOrders: OrderRecord[] = [
  {
    id: "CMD-20260510-001",
    clientId: "CL-001",
    clientName: "Awa Traore",
    productId: "PRD-001",
    productName: "POS Terminal T20",
    quantity: 2,
    priority: "high",
    expectedDeliveryDate: "2026-05-12T11:00",
    note: "Livraison avant midi.",
    status: "to-deliver",
    createdAt: "2026-05-10",
  },
  {
    id: "CMD-20260508-002",
    clientId: "CL-002",
    clientName: "Moussa Kone",
    productId: "PRD-005",
    productName: "Cartouche imprimante X1",
    quantity: 8,
    priority: "medium",
    expectedDeliveryDate: "2026-05-11T16:30",
    note: "Depot principal Yopougon.",
    status: "delivered",
    createdAt: "2026-05-08",
    deliveredAt: "2026-05-11",
  },
]

function buildOrderId(index: number) {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "")
  return `CMD-${stamp}-${String(index).padStart(3, "0")}`
}

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
  const nowLocal = new Date()
  const nowDateIso = nowLocal.toISOString().slice(0, 10)
  const nowDateTimeLocal = toDateTimeLocalValue(nowLocal)
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders)
  const [activeViewTab, setActiveViewTab] = useState<OrderViewTab>("list")
  const [activeStatusTab, setActiveStatusTab] = useState<OrderStatusTab>("to-deliver")
  const [isMobileKpiOpen, setIsMobileKpiOpen] = useState(false)
  const [clientId, setClientId] = useState(clientsData[0]?.id ?? "")
  const [productId, setProductId] = useState(productsData[0]?.id ?? "")
  const [quantityInput, setQuantityInput] = useState("1")
  const [priority, setPriority] = useState<OrderPriority>("medium")
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(nowDateTimeLocal)
  const [note, setNote] = useState("")
  const [search, setSearch] = useState("")
  const [formError, setFormError] = useState("")

  const metrics = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += 1

        if (order.status === "to-deliver") {
          acc.toDeliver += 1
        }

        if (order.status === "delivered") {
          acc.delivered += 1
        }

        if (order.priority === "high") {
          acc.highPriority += 1
        }

        return acc
      },
      {
        total: 0,
        toDeliver: 0,
        delivered: 0,
        highPriority: 0,
      },
    )
  }, [orders])

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orders.filter((order) => {
      const statusOk =
        activeStatusTab === "all" ? true : order.status === activeStatusTab
      const searchOk =
        query.length === 0
          ? true
          : order.id.toLowerCase().includes(query) ||
            order.clientName.toLowerCase().includes(query) ||
            order.productName.toLowerCase().includes(query)

      return statusOk && searchOk
    })
  }, [orders, activeStatusTab, search])

  useEffect(() => {
    setPendingOrdersCount(metrics.toDeliver)
  }, [metrics.toDeliver])

  function statusTabCount(tab: OrderStatusTab) {
    if (tab === "all") {
      return metrics.total
    }

    if (tab === "to-deliver") {
      return metrics.toDeliver
    }

    return metrics.delivered
  }

  function resetForm() {
    setClientId(clientsData[0]?.id ?? "")
    setProductId(productsData[0]?.id ?? "")
    setQuantityInput("1")
    setPriority("medium")
    setExpectedDeliveryDate(toDateTimeLocalValue(new Date()))
    setNote("")
    setFormError("")
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")

    const selectedClient = clientsData.find((client) => client.id === clientId)
    const selectedProduct = productsData.find((product) => product.id === productId)
    const quantity = Number(quantityInput)

    if (!selectedClient || !selectedProduct) {
      setFormError("Sélectionnez un client et un produit.")
      return
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      setFormError("La quantité doit être supérieure ou égale à 1.")
      return
    }

    if (!expectedDeliveryDate) {
      setFormError("Choisissez une date de livraison prévisionnelle.")
      return
    }

    const expectedTimestamp = new Date(expectedDeliveryDate).getTime()
    const nowTimestamp = Date.now()

    if (Number.isNaN(expectedTimestamp)) {
      setFormError("La date et l'heure de livraison est invalide.")
      return
    }

    if (expectedTimestamp < nowTimestamp) {
      setFormError("La date et l'heure de livraison doit être dans le futur.")
      return
    }

    const nextOrder: OrderRecord = {
      id: buildOrderId(orders.length + 1),
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      priority,
      expectedDeliveryDate,
      note: note.trim(),
      status: "to-deliver",
      createdAt: nowDateIso,
    }

    setOrders((previous) => [nextOrder, ...previous])
    setActiveViewTab("list")
    setActiveStatusTab("to-deliver")
    resetForm()
  }

  function toggleDeliveryStatus(orderId: string) {
    const today = new Date().toISOString().slice(0, 10)

    setOrders((previous) =>
      previous.map((order) => {
        if (order.id !== orderId) {
          return order
        }

        if (order.status === "to-deliver") {
          return {
            ...order,
            status: "delivered",
            deliveredAt: today,
          }
        }

        return {
          ...order,
          status: "to-deliver",
          deliveredAt: undefined,
        }
      }),
    )
  }

  const hasFilteredOrders = filteredOrders.length > 0

  return (
    <section className="page orders-page clients-page">
      <div className="page-header">
        <h2 className="page-title">Commandes</h2>
        <p className="page-subtitle">
          Enregistrez les commandes par priorité et suivez les livraisons.
        </p>
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
            <strong>{metrics.total}</strong>
          </article>
          <article className="stat-card">
            <span>À livrer</span>
            <strong>{metrics.toDeliver}</strong>
          </article>
          <article className="stat-card">
            <span>Livrées</span>
            <strong>{metrics.delivered}</strong>
          </article>
          <article className="stat-card">
            <span>Priorite haute</span>
            <strong>{metrics.highPriority}</strong>
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
                <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
                  {clientsData.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.id})
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span>Produit *</span>
                <select value={productId} onChange={(event) => setProductId(event.target.value)}>
                  {productsData.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.id})
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span>Quantité *</span>
                <input
                  type="number"
                  min={1}
                  value={quantityInput}
                  onChange={(event) => setQuantityInput(event.target.value)}
                />
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
                  placeholder="Ex: contacter le client 30 min avant la livraison"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
            </div>

            {formError ? <p className="supplier-payment-error">{formError}</p> : null}

            <div className="client-form-actions">
              <button type="submit" className="btn btn-primary">
                <Plus size={16} />
                Enregistrer
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
              Une commande enregistrée apparaît automatiquement dans l'onglet
              "Suivi livraisons" avec le statut "À livrer".
            </p>
          </aside>
        </div>
      ) : (
        <>
          <div className="clients-toolbar sales-toolbar">
            <label className="search-input-wrap">
              <Search size={16} />
              <input
                type="search"
                placeholder="Rechercher par code, client ou produit"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <p className="clients-page-indicator">
              {filteredOrders.length} commande(s) affichee(s) sur {orders.length}
            </p>
          </div>

          <div className="sales-tabs" role="tablist" aria-label="Statuts commandes">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`sales-tab-btn${activeStatusTab === tab.value ? " is-active" : ""}`}
                role="tab"
                aria-selected={activeStatusTab === tab.value}
                onClick={() => setActiveStatusTab(tab.value)}
              >
                <span>{tab.label}</span>
                <strong>{statusTabCount(tab.value)}</strong>
              </button>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="placeholder-state">
              <ClipboardList size={38} strokeWidth={1.25} className="text-muted" />
              <p>Aucune commande enregistrée pour le moment.</p>
            </div>
          ) : !hasFilteredOrders ? (
            <div className="placeholder-state">
              <ClipboardList size={36} strokeWidth={1.25} className="text-muted" />
              <p>Aucune commande ne correspond à ce filtre.</p>
            </div>
          ) : (
            <>
              <div className="table-wrap orders-table-wrap">
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Client</th>
                      <th>Produit</th>
                      <th>Qt</th>
                      <th>Priorité</th>
                      <th>Livraison prévue</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.clientName}</td>
                        <td>{order.productName}</td>
                        <td>{order.quantity}</td>
                        <td>
                          <span className={`status-chip ${priorityClassName(order.priority)}`}>
                            {priorityLabel(order.priority)}
                          </span>
                        </td>
                        <td>{formatOrderDateTime(order.expectedDeliveryDate)}</td>
                        <td>
                          <span className={`status-chip ${statusClassName(order.status)}`}>
                            {statusLabel(order.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost orders-action-btn"
                            onClick={() => toggleDeliveryStatus(order.id)}
                          >
                            {order.status === "to-deliver" ? (
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="clients-mobile-list orders-mobile-list">
                {filteredOrders.map((order) => (
                  <article key={`${order.id}-mobile`} className="client-mobile-card">
                    <div className="client-mobile-head">
                      <div>
                        <strong>{order.clientName}</strong>
                        <small>{order.id}</small>
                      </div>
                      <span className={`status-chip ${statusClassName(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </div>

                    <div className="client-mobile-grid">
                      <p>
                        <span>Produit</span>
                        <strong>{order.productName}</strong>
                      </p>
                      <p>
                        <span>Quantité</span>
                        <strong>{order.quantity}</strong>
                      </p>
                      <p>
                        <span>Priorité</span>
                        <strong>{priorityLabel(order.priority)}</strong>
                      </p>
                      <p>
                        <span>Livraison prévue</span>
                        <strong>{formatOrderDateTime(order.expectedDeliveryDate)}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost orders-action-btn"
                      onClick={() => toggleDeliveryStatus(order.id)}
                    >
                      {order.status === "to-deliver" ? (
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
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
