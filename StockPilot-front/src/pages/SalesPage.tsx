import { ChevronDown, ChevronUp, DollarSign, Plus, Receipt, Search, Wallet } from "lucide-react"
import { useMemo, useState } from "react"
import { clientsData } from "../features/clients/clientData"
import { formatDate, formatFcfa } from "../features/clients/clientFormatters"
import { productsData } from "../features/products/productData"

type PaymentStatus = "paid" | "partial" | "unpaid"
type SalesFilterTab = "all" | PaymentStatus
type SalesViewTab = "entry" | "list"

type SaleRecord = {
  id: string
  date: string
  clientId: string
  clientName: string
  productId: string
  productName: string
  quantity: number
  salePrice: number
  totalAmount: number
  amountPaid: number
  amountRemaining: number
  paymentStatus: PaymentStatus
}

const paymentStatusOptions: Array<{ value: PaymentStatus; label: string }> = [
  { value: "paid", label: "Payé totalement" },
  { value: "partial", label: "Payé partiellement" },
  { value: "unpaid", label: "Non payé" },
]

const salesTabs: Array<{ value: SalesFilterTab; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "paid", label: "Payées" },
  { value: "partial", label: "Partielles" },
  { value: "unpaid", label: "Impayées" },
]

function formatInputAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return ""
  }

  return String(Math.round(value))
}

function paymentStatusLabel(status: PaymentStatus) {
  if (status === "paid") {
    return "Payé"
  }

  if (status === "partial") {
    return "Partiel"
  }

  return "Impayée"
}

function paymentStatusClassName(status: PaymentStatus) {
  if (status === "paid") {
    return "status-active"
  }

  if (status === "partial") {
    return "status-warning"
  }

  return "status-blocked"
}

function buildSaleId(index: number) {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "")
  return `VNT-${stamp}-${String(index).padStart(3, "0")}`
}

export function SalesPage() {
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [clientId, setClientId] = useState(clientsData[0]?.id ?? "")
  const [productId, setProductId] = useState(productsData[0]?.id ?? "")
  const [quantityInput, setQuantityInput] = useState("1")
  const [salePriceInput, setSalePriceInput] = useState(
    formatInputAmount(productsData[0]?.salePrice ?? 0),
  )
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid")
  const [amountPaidInput, setAmountPaidInput] = useState("0")
  const [search, setSearch] = useState("")
  const [formError, setFormError] = useState("")
  const [activeTab, setActiveTab] = useState<SalesFilterTab>("all")
  const [isMobileKpiOpen, setIsMobileKpiOpen] = useState(false)
  const [activeViewTab, setActiveViewTab] = useState<SalesViewTab>("entry")

  const quantity = Number(quantityInput)
  const salePrice = Number(salePriceInput)
  const totalAmount = Number.isFinite(quantity * salePrice)
    ? Math.max(0, quantity * salePrice)
    : 0
  const amountPaid = Number(amountPaidInput)

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase()

    return sales.filter((sale) => {
      const statusOk = activeTab === "all" ? true : sale.paymentStatus === activeTab
      const searchOk =
        query.length === 0
          ? true
          : sale.id.toLowerCase().includes(query) ||
            sale.clientName.toLowerCase().includes(query) ||
            sale.productName.toLowerCase().includes(query)

      return (
        statusOk && searchOk
      )
    })
  }, [sales, search, activeTab])

  const summary = useMemo(() => {
    return sales.reduce(
      (acc, sale) => {
        acc.count += 1
        acc.total += sale.totalAmount
        acc.paid += sale.amountPaid
        acc.remaining += sale.amountRemaining

        if (sale.paymentStatus === "paid") {
          acc.countPaid += 1
        }

        if (sale.paymentStatus === "partial") {
          acc.countPartial += 1
        }

        if (sale.paymentStatus === "unpaid") {
          acc.countUnpaid += 1
        }

        return acc
      },
      {
        count: 0,
        total: 0,
        paid: 0,
        remaining: 0,
        countPaid: 0,
        countPartial: 0,
        countUnpaid: 0,
      },
    )
  }, [sales])

  function syncPaidField(nextStatus: PaymentStatus, nextTotal: number) {
    if (nextStatus === "paid") {
      setAmountPaidInput(formatInputAmount(nextTotal))
      return
    }

    if (nextStatus === "unpaid") {
      setAmountPaidInput("0")
      return
    }

    const currentPaid = Number(amountPaidInput)

    if (!Number.isFinite(currentPaid) || currentPaid <= 0) {
      setAmountPaidInput(formatInputAmount(Math.max(1, Math.floor(nextTotal * 0.4))))
      return
    }

    if (currentPaid >= nextTotal) {
      setAmountPaidInput(formatInputAmount(Math.max(1, nextTotal - 1)))
    }
  }

  function handleProductChange(nextProductId: string) {
    setProductId(nextProductId)

    const product = productsData.find((item) => item.id === nextProductId)
    const nextPrice = product?.salePrice ?? 0
    setSalePriceInput(formatInputAmount(nextPrice))

    const nextQuantity = Number(quantityInput)
    const nextTotal = Math.max(0, nextQuantity * nextPrice)
    syncPaidField(paymentStatus, nextTotal)
  }

  function handleQuantityChange(nextQuantityInput: string) {
    setQuantityInput(nextQuantityInput)
    const nextQuantity = Number(nextQuantityInput)
    const nextTotal = Math.max(0, nextQuantity * Number(salePriceInput))
    syncPaidField(paymentStatus, nextTotal)
  }

  function handleSalePriceChange(nextSalePriceInput: string) {
    setSalePriceInput(nextSalePriceInput)
    const nextSalePrice = Number(nextSalePriceInput)
    const nextTotal = Math.max(0, Number(quantityInput) * nextSalePrice)
    syncPaidField(paymentStatus, nextTotal)
  }

  function handleStatusChange(nextStatus: PaymentStatus) {
    setPaymentStatus(nextStatus)
    syncPaidField(nextStatus, totalAmount)
  }

  function resetForm() {
    setClientId(clientsData[0]?.id ?? "")
    setProductId(productsData[0]?.id ?? "")
    setQuantityInput("1")
    setSalePriceInput(formatInputAmount(productsData[0]?.salePrice ?? 0))
    setPaymentStatus("paid")
    setAmountPaidInput(formatInputAmount(productsData[0]?.salePrice ?? 0))
    setFormError("")
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")

    const selectedClient = clientsData.find((client) => client.id === clientId)
    const selectedProduct = productsData.find((product) => product.id === productId)
    const quantityValue = Number(quantityInput)
    const salePriceValue = Number(salePriceInput)

    if (!selectedClient || !selectedProduct) {
      setFormError("Sélectionnez un client et un produit.")
      return
    }

    if (!Number.isFinite(quantityValue) || quantityValue < 1) {
      setFormError("La quantité doit être supérieure ou égale à 1.")
      return
    }

    if (!Number.isFinite(salePriceValue) || salePriceValue <= 0) {
      setFormError("Le prix de vente doit être supérieur à 0.")
      return
    }

    const total = quantityValue * salePriceValue
    let paid = Number(amountPaidInput)

    if (!Number.isFinite(paid) || paid < 0) {
      paid = 0
    }

    if (paymentStatus === "paid") {
      paid = total
    }

    if (paymentStatus === "unpaid") {
      paid = 0
    }

    if (paymentStatus === "partial" && (paid <= 0 || paid >= total)) {
      setFormError("Pour un paiement partiel, le montant payé doit être entre 1 et le total - 1.")
      return
    }

    const remaining = Math.max(0, total - paid)

    const nextSale: SaleRecord = {
      id: buildSaleId(sales.length + 1),
      date: new Date().toISOString().slice(0, 10),
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: quantityValue,
      salePrice: salePriceValue,
      totalAmount: total,
      amountPaid: paid,
      amountRemaining: remaining,
      paymentStatus,
    }

    setSales((previous) => [nextSale, ...previous])
    setActiveViewTab("list")
    resetForm()
  }

  function tabCount(tab: SalesFilterTab) {
    if (tab === "all") {
      return summary.count
    }

    if (tab === "paid") {
      return summary.countPaid
    }

    if (tab === "partial") {
      return summary.countPartial
    }

    return summary.countUnpaid
  }

  const hasFilteredSales = filteredSales.length > 0

  return (
    <section className="page sales-page">
      <div className="page-header">
        <h2 className="page-title">Ventes</h2>
        <p className="page-subtitle">
          Enregistrez une vente avec client, produit, prix et niveau de paiement.
        </p>
      </div>

      <div className="sales-main-tabs" role="tablist" aria-label="Vue ventes">
        <button
          type="button"
          className={`sales-main-tab-btn${activeViewTab === "entry" ? " is-active" : ""}`}
          role="tab"
          aria-selected={activeViewTab === "entry"}
          onClick={() => setActiveViewTab("entry")}
        >
          Enregistrer une vente
        </button>
        <button
          type="button"
          className={`sales-main-tab-btn${activeViewTab === "list" ? " is-active" : ""}`}
          role="tab"
          aria-selected={activeViewTab === "list"}
          onClick={() => setActiveViewTab("list")}
        >
          Liste des ventes
        </button>
      </div>

      <div className={`sales-kpi-block${isMobileKpiOpen ? " is-open" : ""}`}>
        <button
          type="button"
          className="sales-kpi-toggle"
          onClick={() => setIsMobileKpiOpen((current) => !current)}
          aria-expanded={isMobileKpiOpen}
        >
          <span>KPIs ventes</span>
          {isMobileKpiOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <div className="kpi-grid sales-kpi-grid">
          <article className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Montant vendu</span>
              <span className="kpi-icon kpi-icon--blue">
                <Receipt size={17} />
              </span>
            </div>
            <p className="kpi-value">{formatFcfa(summary.total)}</p>
            <span className="kpi-trend">{summary.count} vente(s)</span>
          </article>

          <article className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Encaisse</span>
              <span className="kpi-icon kpi-icon--green">
                <Wallet size={17} />
              </span>
            </div>
            <p className="kpi-value">{formatFcfa(summary.paid)}</p>
            <span className="kpi-trend kpi-trend--up">{summary.countPaid} payée(s)</span>
          </article>

          <article className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Reste à payer</span>
              <span className="kpi-icon kpi-icon--orange">
                <DollarSign size={17} />
              </span>
            </div>
            <p className="kpi-value">{formatFcfa(summary.remaining)}</p>
            <span className="kpi-trend">{summary.countPartial} partielle(s)</span>
          </article>

          <article className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Ventes non payées</span>
              <span className="kpi-icon kpi-icon--red">
                <Receipt size={17} />
              </span>
            </div>
            <p className="kpi-value">{summary.countUnpaid}</p>
            <span className="kpi-trend kpi-trend--down">A relancer</span>
          </article>
        </div>
      </div>

      {activeViewTab === "entry" ? (
        <div className="sales-layout-grid">
          <form className="client-form-card sales-form-card" onSubmit={handleSubmit}>
            <div className="sales-form-head">
              <h3>Nouvelle vente</h3>
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
                >
                  {clientsData.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.id})
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span>Produit *</span>
                <select
                  value={productId}
                  onChange={(event) => handleProductChange(event.target.value)}
                >
                  {productsData.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({formatFcfa(product.salePrice)})
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
                  onChange={(event) => handleQuantityChange(event.target.value)}
                />
              </label>

              <label className="field-block">
                <span>Prix de vente unitaire (FCFA) *</span>
                <input
                  type="number"
                  min={1}
                  value={salePriceInput}
                  onChange={(event) => handleSalePriceChange(event.target.value)}
                />
              </label>

              <label className="field-block field-block-full">
                <span>Statut de paiement *</span>
                <select
                  value={paymentStatus}
                  onChange={(event) => handleStatusChange(event.target.value as PaymentStatus)}
                >
                  {paymentStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-block field-block-full">
                <span>Montant déjà payé (FCFA)</span>
                <input
                  type="number"
                  min={0}
                  max={Math.max(0, totalAmount)}
                  value={amountPaidInput}
                  onChange={(event) => setAmountPaidInput(event.target.value)}
                  disabled={paymentStatus !== "partial"}
                />
                <small className="sales-inline-help">
                  {paymentStatus === "paid"
                    ? "Le système enregistre automatiquement le total comme payé."
                    : null}
                  {paymentStatus === "unpaid"
                    ? "Le système enregistre automatiquement 0 FCFA comme payé."
                    : null}
                  {paymentStatus === "partial"
                    ? "Saisissez un montant strictement inférieur au total de la vente."
                    : null}
                </small>
              </label>
            </div>

            <div className="sales-live-summary">
              <p>
                <span>Total vente</span>
                <strong>{formatFcfa(totalAmount)}</strong>
              </p>
              <p>
                <span>Montant payé</span>
                <strong>{formatFcfa(Math.max(0, Number.isFinite(amountPaid) ? amountPaid : 0))}</strong>
              </p>
              <p>
                <span>Reste</span>
                <strong>{formatFcfa(Math.max(0, totalAmount - (Number.isFinite(amountPaid) ? amountPaid : 0)))}</strong>
              </p>
            </div>

            {formError ? <p className="supplier-payment-error">{formError}</p> : null}

            <div className="client-form-actions">
              <button type="submit" className="btn btn-primary">
                <Plus size={16} />
                Enregistrer la vente
              </button>
            </div>
          </form>

          <aside className="client-form-card sales-info-card">
            <h3>Règles de paiement</h3>
            <ul className="sales-info-list">
              <li>Payé totalement: montant payé = total vente.</li>
              <li>Payé partiellement: montant payé entre 1 et total - 1.</li>
              <li>Non payé: montant payé = 0.</li>
            </ul>

            <div className="sales-status-counters">
              <p>
                <span className="status-chip status-active">Payées</span>
                <strong>{summary.countPaid}</strong>
              </p>
              <p>
                <span className="status-chip status-warning">Partielles</span>
                <strong>{summary.countPartial}</strong>
              </p>
              <p>
                <span className="status-chip status-blocked">Impayées</span>
                <strong>{summary.countUnpaid}</strong>
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <>
          <div className="clients-toolbar sales-toolbar">
            <label className="search-input-wrap">
              <Search size={16} />
              <input
                type="search"
                placeholder="Rechercher par référence, client ou produit"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <p className="clients-page-indicator">
              {filteredSales.length} vente(s) affichee(s) sur {sales.length}
            </p>
          </div>

          <div className="sales-tabs" role="tablist" aria-label="Filtres ventes">
            {salesTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`sales-tab-btn${activeTab === tab.value ? " is-active" : ""}`}
                role="tab"
                aria-selected={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
              >
                <span>{tab.label}</span>
                <strong>{tabCount(tab.value)}</strong>
              </button>
            ))}
          </div>

          {sales.length === 0 ? (
            <div className="placeholder-state">
              <Receipt size={40} strokeWidth={1.25} className="text-muted" />
              <p>Aucune vente enregistrée pour le moment.</p>
            </div>
          ) : !hasFilteredSales ? (
            <div className="placeholder-state">
              <Receipt size={36} strokeWidth={1.25} className="text-muted" />
              <p>Aucune vente ne correspond à ce filtre.</p>
            </div>
          ) : (
            <>
              <div className="table-wrap sales-table-wrap">
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Date</th>
                      <th>Client</th>
                      <th>Produit</th>
                      <th>Qt</th>
                      <th>PU</th>
                      <th>Total</th>
                      <th>Payé</th>
                      <th>Reste</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{sale.id}</td>
                        <td>{formatDate(sale.date)}</td>
                        <td>{sale.clientName}</td>
                        <td>{sale.productName}</td>
                        <td>{sale.quantity}</td>
                        <td>{formatFcfa(sale.salePrice)}</td>
                        <td>{formatFcfa(sale.totalAmount)}</td>
                        <td>{formatFcfa(sale.amountPaid)}</td>
                        <td>{formatFcfa(sale.amountRemaining)}</td>
                        <td>
                          <span className={`status-chip ${paymentStatusClassName(sale.paymentStatus)}`}>
                            {paymentStatusLabel(sale.paymentStatus)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="clients-mobile-list sales-mobile-list">
                {filteredSales.map((sale) => (
                  <article key={`${sale.id}-mobile`} className="client-mobile-card">
                    <div className="client-mobile-head">
                      <div>
                        <strong>{sale.clientName}</strong>
                        <small>
                          {sale.id} - {formatDate(sale.date)}
                        </small>
                      </div>
                      <span className={`status-chip ${paymentStatusClassName(sale.paymentStatus)}`}>
                        {paymentStatusLabel(sale.paymentStatus)}
                      </span>
                    </div>

                    <div className="client-mobile-grid">
                      <p>
                        <span>Produit</span>
                        <strong>{sale.productName}</strong>
                      </p>
                      <p>
                        <span>Quantité</span>
                        <strong>{sale.quantity}</strong>
                      </p>
                      <p>
                        <span>Total</span>
                        <strong>{formatFcfa(sale.totalAmount)}</strong>
                      </p>
                      <p>
                        <span>Payé / Reste</span>
                        <strong>
                          {formatFcfa(sale.amountPaid)} / {formatFcfa(sale.amountRemaining)}
                        </strong>
                      </p>
                    </div>
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
