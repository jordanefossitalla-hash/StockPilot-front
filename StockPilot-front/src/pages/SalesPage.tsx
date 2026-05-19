import { ChevronDown, ChevronUp, DollarSign, Plus, Receipt, Search, Wallet, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { formatDate, formatFcfa } from "../features/clients/clientFormatters"
import { listClients } from "../services/clientService"
import { listProducts } from "../services/productService"
import {
  addSalePayment,
  cancelSale,
  createSale,
  getSaleById,
  listSales,
  type SaleDetail,
} from "../services/salesService"

type ClientOption = {
  id: string
  name: string
}

type ProductOption = {
  id: string
  name: string
  salePrice: number
  status: "active" | "inactive"
}

type PaymentStatus = "paid" | "partial" | "unpaid" | "cancelled"
type SalesFilterTab = "all" | PaymentStatus
type SalesViewTab = "entry" | "list"

type SaleRecord = {
  id: string
  code: string
  date: string
  clientId: string
  clientName: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
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
  { value: "cancelled", label: "Annulées" },
]

function formatInputAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return ""
  }

  return String(Math.round(value))
}

function paymentStatusLabel(status: PaymentStatus) {
  if (status === "cancelled") {
    return "Annulée"
  }

  if (status === "paid") {
    return "Payé"
  }

  if (status === "partial") {
    return "Partiel"
  }

  return "Impayée"
}

function paymentStatusClassName(status: PaymentStatus) {
  if (status === "cancelled") {
    return "status-blocked"
  }

  if (status === "paid") {
    return "status-active"
  }

  if (status === "partial") {
    return "status-warning"
  }

  return "status-blocked"
}

function derivePaymentStatus(total: number, paid: number): PaymentStatus {
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(paid) || paid <= 0) {
    return "unpaid"
  }

  if (paid >= total) {
    return "paid"
  }

  return "partial"
}

export function SalesPage() {
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [isLoadingSales, setIsLoadingSales] = useState(true)
  const [salesError, setSalesError] = useState("")
  const [salesPage, setSalesPage] = useState(1)
  const [salesRefreshKey, setSalesRefreshKey] = useState(0)
  const [salesMeta, setSalesMeta] = useState({ page: 1, limit: 20, total: 0 })
  const [clients, setClients] = useState<ClientOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientId, setClientId] = useState("")
  const [productId, setProductId] = useState("")
  const [quantityInput, setQuantityInput] = useState("1")
  const [salePriceInput, setSalePriceInput] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid")
  const [amountPaidInput, setAmountPaidInput] = useState("0")
  const [noteInput, setNoteInput] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [clientFilterId, setClientFilterId] = useState("")
  const [fromDateFilter, setFromDateFilter] = useState("")
  const [toDateFilter, setToDateFilter] = useState("")
  const [formError, setFormError] = useState("")
  const [activeTab, setActiveTab] = useState<SalesFilterTab>("all")
  const [isMobileKpiOpen, setIsMobileKpiOpen] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [activeViewTab, setActiveViewTab] = useState<SalesViewTab>("entry")
  const [selectedSaleId, setSelectedSaleId] = useState("")
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<SaleDetail | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isLoadingSaleDetail, setIsLoadingSaleDetail] = useState(false)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [paymentAmountInput, setPaymentAmountInput] = useState("")
  const [paymentMethodInput, setPaymentMethodInput] = useState("cash")
  const [paymentRecorderInput, setPaymentRecorderInput] = useState("cashier-01")
  const [paymentError, setPaymentError] = useState("")
  const [saleToCancel, setSaleToCancel] = useState<SaleRecord | null>(null)
  const [isCancellingSale, setIsCancellingSale] = useState(false)
  const [cancelSaleError, setCancelSaleError] = useState("")

  const quantity = Number(quantityInput)
  const salePrice = Number(salePriceInput)
  const totalAmount = Number.isFinite(quantity * salePrice)
    ? Math.max(0, quantity * salePrice)
    : 0
  const amountPaid = Number(amountPaidInput)
  const totalSalesPages = Math.max(1, Math.ceil(salesMeta.total / Math.max(1, salesMeta.limit)))

  useEffect(() => {
    let isActive = true

    async function fetchOptions() {
      setIsLoadingOptions(true)

      try {
        const [clientsResult, productsResult] = await Promise.all([
          listClients({ page: 1, limit: 100 }),
          listProducts({ page: 1, limit: 100 }),
        ])

        if (!isActive) {
          return
        }

        const clientOptions: ClientOption[] = clientsResult.clients.map((client) => ({
          id: client.id,
          name: client.name,
        }))

        const productOptions: ProductOption[] = productsResult.data.map((product) => ({
          id: product.id,
          name: product.name,
          salePrice: product.salePrice,
          status: product.status,
        }))

        setClients(clientOptions)
        setProducts(productOptions)

        const defaultClientId = clientOptions[0]?.id ?? ""
        const defaultProduct = productOptions[0]

        setClientId(defaultClientId)
        setProductId(defaultProduct?.id ?? "")
        setSalePriceInput(formatInputAmount(defaultProduct?.salePrice ?? 0))
        setAmountPaidInput(formatInputAmount(defaultProduct?.salePrice ?? 0))
      } catch (error) {
        if (!isActive) {
          return
        }

        setClients([])
        setProducts([])
        setFormError(
          error instanceof Error
            ? error.message
            : "Chargement des options de vente impossible.",
        )
      } finally {
        if (isActive) {
          setIsLoadingOptions(false)
        }
      }
    }

    void fetchOptions()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchInput])

  useEffect(() => {
    setSalesPage(1)
  }, [debouncedSearch, clientFilterId, fromDateFilter, toDateFilter])

  useEffect(() => {
    let isActive = true

    async function fetchSales() {
      setIsLoadingSales(true)
      setSalesError("")

      if (fromDateFilter && toDateFilter && fromDateFilter > toDateFilter) {
        setSales([])
        setSalesMeta({ page: 1, limit: 20, total: 0 })
        setSalesError("La date de debut doit etre inferieure ou egale a la date de fin.")
        setIsLoadingSales(false)
        return
      }

      try {
        const response = await listSales({
          page: salesPage,
          limit: 20,
          search: debouncedSearch,
          clientId: clientFilterId || undefined,
          from: fromDateFilter || undefined,
          to: toDateFilter || undefined,
        })

        if (!isActive) {
          return
        }

        setSales(response.data)
        setSalesMeta(response.meta)
      } catch (error) {
        if (!isActive) {
          return
        }

        setSales([])
        setSalesError(
          error instanceof Error ? error.message : "Chargement des ventes impossible.",
        )
      } finally {
        if (isActive) {
          setIsLoadingSales(false)
        }
      }
    }

    void fetchSales()

    return () => {
      isActive = false
    }
  }, [salesPage, salesRefreshKey, debouncedSearch, clientFilterId, fromDateFilter, toDateFilter])

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      return activeTab === "all" ? true : sale.paymentStatus === activeTab
    })
  }, [sales, activeTab])

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

        if (sale.paymentStatus === "cancelled") {
          acc.countCancelled += 1
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
        countCancelled: 0,
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

    const product = products.find((item) => item.id === nextProductId)
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

  function handleAmountPaidChange(nextAmountPaidInput: string) {
    setAmountPaidInput(nextAmountPaidInput)

    const parsedPaid = Number(nextAmountPaidInput)
    if (!Number.isFinite(parsedPaid) || parsedPaid < 0) {
      return
    }

    setPaymentStatus(derivePaymentStatus(totalAmount, parsedPaid))
  }

  function resetForm() {
    setClientId(clients[0]?.id ?? "")
    setProductId(products[0]?.id ?? "")
    setQuantityInput("1")
    setSalePriceInput(formatInputAmount(products[0]?.salePrice ?? 0))
    setPaymentStatus("paid")
    setAmountPaidInput(formatInputAmount(products[0]?.salePrice ?? 0))
    setNoteInput("")
    setFormError("")
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")

    const selectedClient = clients.find((client) => client.id === clientId)
    const selectedProduct = products.find((product) => product.id === productId)
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
      paid = Math.min(Math.max(1, paid), Math.max(1, total - 1))
    }

    setIsSubmitting(true)

    try {
      await createSale({
        clientId: selectedClient.id,
        items: [
          {
            productId: selectedProduct.id,
            quantity: quantityValue,
            unitPrice: salePriceValue,
          },
        ],
        paidAmount: paid,
        note: noteInput.trim() || undefined,
      })

      setSalesPage(1)
      setSalesRefreshKey((current) => current + 1)
      setActiveViewTab("list")
      resetForm()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Création vente impossible.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function openPaymentModal(saleId: string) {
    setSelectedSaleId(saleId)
    setSelectedSaleDetail(null)
    setIsPaymentModalOpen(true)
    setIsLoadingSaleDetail(true)
    setPaymentAmountInput("")
    setPaymentMethodInput("cash")
    setPaymentRecorderInput("cashier-01")
    setPaymentError("")

    try {
      const saleDetail = await getSaleById(saleId)
      setSelectedSaleDetail(saleDetail)
      const suggestedAmount = Math.max(0, Math.min(saleDetail.remainingAmount, saleDetail.total))
      setPaymentAmountInput(suggestedAmount > 0 ? String(Math.round(suggestedAmount)) : "")
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Chargement de la vente impossible.",
      )
    } finally {
      setIsLoadingSaleDetail(false)
    }
  }

  function closePaymentModal() {
    setIsPaymentModalOpen(false)
    setSelectedSaleId("")
    setSelectedSaleDetail(null)
    setPaymentError("")
  }

  function openCancelSaleModal(sale: SaleRecord) {
    setSaleToCancel(sale)
    setCancelSaleError("")
  }

  function closeCancelSaleModal() {
    if (isCancellingSale) {
      return
    }

    setSaleToCancel(null)
    setCancelSaleError("")
  }

  async function handleConfirmCancelSale() {
    if (!saleToCancel) {
      return
    }

    setIsCancellingSale(true)
    setCancelSaleError("")

    try {
      await cancelSale(saleToCancel.id)
      setSalesRefreshKey((current) => current + 1)
      setSaleToCancel(null)
    } catch (error) {
      setCancelSaleError(
        error instanceof Error ? error.message : "Annulation de la vente impossible.",
      )
    } finally {
      setIsCancellingSale(false)
    }
  }

  async function handleRecordPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amount = Number(paymentAmountInput)
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Le montant du paiement doit être supérieur à 0.")
      return
    }

    if (!selectedSaleId) {
      setPaymentError("Vente introuvable.")
      return
    }

    if (!paymentMethodInput.trim()) {
      setPaymentError("La méthode de paiement est obligatoire.")
      return
    }

    if (selectedSaleDetail && amount > selectedSaleDetail.remainingAmount) {
      setPaymentError("Le montant ne peut pas dépasser le reste à payer.")
      return
    }

    setPaymentError("")
    setIsSubmittingPayment(true)

    try {
      await addSalePayment(selectedSaleId, {
        amount,
        method: paymentMethodInput,
        recordedBy: paymentRecorderInput,
      })

      setSalesPage(1)
      setSalesRefreshKey((current) => current + 1)
      closePaymentModal()
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Ajout du paiement impossible.",
      )
    } finally {
      setIsSubmittingPayment(false)
    }
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

    if (tab === "cancelled") {
      return summary.countCancelled
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
                  disabled={isLoadingOptions || clients.length === 0}
                >
                  {clients.length === 0 ? (
                    <option value="">Aucun client disponible</option>
                  ) : clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span>Produit *</span>
                <select
                  value={productId}
                  onChange={(event) => handleProductChange(event.target.value)}
                  disabled={isLoadingOptions || products.length === 0}
                >
                  {products.length === 0 ? (
                    <option value="">Aucun produit disponible</option>
                  ) : products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                      {product.status === "inactive" ? " [inactif]" : ""}
                      {` (${formatFcfa(product.salePrice)})`}
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

              {paymentStatus === "partial" ? (
                <label className="field-block field-block-full">
                  <span>Montant déjà payé (FCFA)</span>
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, totalAmount)}
                    value={amountPaidInput}
                    onChange={(event) => handleAmountPaidChange(event.target.value)}
                  />
                  <small className="sales-inline-help">
                    Le statut se met à jour automatiquement selon le montant saisi.
                  </small>
                </label>
              ) : null}

              <label className="field-block field-block-full">
                <span>Note (optionnel)</span>
                <textarea
                  rows={3}
                  placeholder="Ex: Commande client livrée via cette vente."
                  value={noteInput}
                  onChange={(event) => setNoteInput(event.target.value)}
                />
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
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || isLoadingOptions || clients.length === 0 || products.length === 0}>
                <Plus size={16} />
                {isSubmitting ? "Enregistrement..." : "Enregistrer la vente"}
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
              <p>
                <span className="status-chip status-blocked">Annulées</span>
                <strong>{summary.countCancelled}</strong>
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <>
          <div className="clients-toolbar sales-toolbar">
            <div className="sales-toolbar-main">
              <label className="search-input-wrap">
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Rechercher une vente"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </label>

              <button
                type="button"
                className="sales-filters-toggle"
                onClick={() => setIsMobileFiltersOpen((open) => !open)}
                aria-expanded={isMobileFiltersOpen}
                aria-controls="sales-filters-panel"
              >
                {isMobileFiltersOpen ? "Masquer filtres" : "Filtres"}
              </button>

              <div
                id="sales-filters-panel"
                className={`sales-toolbar-filters${isMobileFiltersOpen ? " is-open" : ""}`}
              >
                <label className="field-block sales-filter-field">
                  <span>Client</span>
                  <select
                    value={clientFilterId}
                    onChange={(event) => setClientFilterId(event.target.value)}
                    disabled={clients.length === 0}
                  >
                    <option value="">Tous les clients</option>
                    {clients.map((client) => (
                      <option key={`sales-client-filter-${client.id}`} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-block sales-filter-field">
                  <span>Du</span>
                  <input
                    type="date"
                    value={fromDateFilter}
                    onChange={(event) => setFromDateFilter(event.target.value)}
                  />
                </label>

                <label className="field-block sales-filter-field">
                  <span>Au</span>
                  <input
                    type="date"
                    value={toDateFilter}
                    onChange={(event) => setToDateFilter(event.target.value)}
                  />
                </label>
              </div>
            </div>

            <p className="clients-page-indicator sales-toolbar-indicator">
              {filteredSales.length} vente(s) affichée(s) sur {sales.length} (total: {salesMeta.total})
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

          {isLoadingSales ? (
            <div className="placeholder-state">
              <Receipt size={40} strokeWidth={1.25} className="text-muted" />
              <p>Chargement des ventes...</p>
            </div>
          ) : salesError ? (
            <div className="placeholder-state">
              <Receipt size={40} strokeWidth={1.25} className="text-muted" />
              <p>{salesError}</p>
            </div>
          ) : sales.length === 0 ? (
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{sale.code}</td>
                        <td>{formatDate(sale.date)}</td>
                        <td>{sale.clientName}</td>
                        <td>{sale.productName}</td>
                        <td>{sale.quantity}</td>
                        <td>{formatFcfa(sale.unitPrice)}</td>
                        <td>{formatFcfa(sale.totalAmount)}</td>
                        <td>{formatFcfa(sale.amountPaid)}</td>
                        <td>{formatFcfa(sale.amountRemaining)}</td>
                        <td>
                          <span className={`status-chip ${paymentStatusClassName(sale.paymentStatus)}`}>
                            {paymentStatusLabel(sale.paymentStatus)}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions-icons sales-table-actions">
                            <button
                              type="button"
                              className="icon-action-btn sales-action-icon-btn"
                              disabled={sale.paymentStatus === "cancelled"}
                              onClick={() => openPaymentModal(sale.id)}
                              aria-label={`Ajouter un paiement pour ${sale.code}`}
                              title="Ajouter paiement"
                            >
                              <Wallet size={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-action-btn sales-action-icon-btn danger"
                              disabled={sale.paymentStatus === "cancelled"}
                              onClick={() => openCancelSaleModal(sale)}
                              aria-label={`Annuler la vente ${sale.code}`}
                              title="Annuler vente"
                            >
                              <X size={15} />
                            </button>
                          </div>
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
                          {sale.code} - {formatDate(sale.date)}
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

                    <div className="client-form-actions sales-mobile-actions">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={sale.paymentStatus === "cancelled"}
                        onClick={() => openPaymentModal(sale.id)}
                      >
                        <Wallet size={15} />
                        Paiement
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={sale.paymentStatus === "cancelled"}
                        onClick={() => openCancelSaleModal(sale)}
                      >
                        <X size={15} />
                        Annuler
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="client-form-actions" style={{ justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={salesMeta.page <= 1 || isLoadingSales}
                  onClick={() => setSalesPage((page) => Math.max(1, page - 1))}
                >
                  Page précédente
                </button>
                <span className="clients-page-indicator">
                  Page {salesMeta.page} / {totalSalesPages}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={salesMeta.page >= totalSalesPages || isLoadingSales}
                  onClick={() => setSalesPage((page) => Math.min(totalSalesPages, page + 1))}
                >
                  Page suivante
                </button>
              </div>
            </>
          )}
        </>
      )}

      {isPaymentModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closePaymentModal}>
          <article
            className="modal-card sales-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Ajouter un paiement"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head sales-payment-modal-head">
              <div>
                <h3>Ajouter un paiement</h3>
                <p className="sales-payment-modal-subtitle">
                  Enregistrez un versement sur la vente sélectionnée.
                </p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={closePaymentModal}>
                Fermer
              </button>
            </div>

            {isLoadingSaleDetail ? (
              <p className="sales-payment-loading">Chargement de la vente...</p>
            ) : (
              <>
                {selectedSaleDetail ? (
                  <div className="sales-live-summary sales-payment-summary">
                    <p>
                      <span>Vente</span>
                      <strong>{selectedSaleDetail.code}</strong>
                    </p>
                    <p>
                      <span>Total</span>
                      <strong>{formatFcfa(selectedSaleDetail.total)}</strong>
                    </p>
                    <p>
                      <span>Reste</span>
                      <strong>{formatFcfa(selectedSaleDetail.remainingAmount)}</strong>
                    </p>
                  </div>
                ) : null}

                <form className="client-form-grid sales-payment-form" onSubmit={handleRecordPayment}>
                  <label className="field-block field-block-full">
                    <span>Montant *</span>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(0, selectedSaleDetail?.remainingAmount ?? 0)}
                      value={paymentAmountInput}
                      onChange={(event) => setPaymentAmountInput(event.target.value)}
                      placeholder="Ex: 5000"
                    />
                  </label>

                  <label className="field-block">
                    <span>Méthode *</span>
                    <select
                      value={paymentMethodInput}
                      onChange={(event) => setPaymentMethodInput(event.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_transfer">Virement bancaire</option>
                      <option value="other">Autre</option>
                    </select>
                  </label>

                  <label className="field-block field-block-full">
                    <span>Enregistré par</span>
                    <input
                      type="text"
                      value={paymentRecorderInput}
                      onChange={(event) => setPaymentRecorderInput(event.target.value)}
                      placeholder="Ex: cashier-01"
                    />
                  </label>

                  {paymentError ? <p className="supplier-payment-error">{paymentError}</p> : null}

                  {selectedSaleDetail && selectedSaleDetail.remainingAmount <= 0 ? (
                    <p className="supplier-payment-error">Cette vente est déjà entièrement réglée.</p>
                  ) : null}

                  <div className="client-form-actions sales-payment-actions">
                    <button type="button" className="btn btn-ghost" onClick={closePaymentModal}>
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmittingPayment || isLoadingSaleDetail || (selectedSaleDetail?.remainingAmount ?? 0) <= 0}
                    >
                      {isSubmittingPayment ? "Enregistrement..." : "Valider paiement"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </article>
        </div>
      ) : null}

      {saleToCancel ? (
        <div className="modal-backdrop" role="presentation" onClick={closeCancelSaleModal}>
          <article
            className="modal-card modal-danger"
            role="dialog"
            aria-modal="true"
            aria-label="Annuler une vente"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Annuler la vente</h3>
            </div>

            <p className="modal-warning-text">
              Voulez-vous vraiment annuler la vente <strong>{saleToCancel.code}</strong> ?
            </p>

            {cancelSaleError ? <p className="supplier-payment-error">{cancelSaleError}</p> : null}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={isCancellingSale}
                onClick={closeCancelSaleModal}
              >
                Retour
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isCancellingSale}
                onClick={handleConfirmCancelSale}
              >
                {isCancellingSale ? "Annulation..." : "Confirmer annulation"}
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}
