import { ArrowLeft, ChevronDown, CreditCard, FilePenLine, Search, SlidersHorizontal } from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { formatDate, formatFcfa } from "../features/suppliers/supplierFormatters"
import type { Supplier } from "../features/suppliers/supplierTypes"
import {
  createSupplierPayment,
  getSupplierByIdApi,
  listSupplierPayments,
  type SupplierPayment,
} from "../services/supplierService"

type PaymentPeriodPreset = "all" | "this-week" | "this-month" | "custom"

function toDateInput(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function getStartOfWeek(date: Date): Date {
  const copy = new Date(date)
  const day = copy.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setUTCDate(copy.getUTCDate() + diff)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}

export function SupplierDetailPage() {
  const { supplierId } = useParams<{ supplierId: string }>()
  const location = useLocation()
  const [supplierState, setSupplierState] = useState<Supplier | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Virement")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentNote, setPaymentNote] = useState("")
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)

  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const [movementQuery, setMovementQuery] = useState("")
  const [payments, setPayments] = useState<SupplierPayment[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [paymentsMeta, setPaymentsMeta] = useState({ page: 1, limit: 20, total: 0 })
  const [paymentsRefreshKey, setPaymentsRefreshKey] = useState(0)
  const [paymentPeriodPreset, setPaymentPeriodPreset] = useState<PaymentPeriodPreset>("this-month")
  const [paymentFromDate, setPaymentFromDate] = useState("")
  const [paymentToDate, setPaymentToDate] = useState("")
  const [isPaymentFiltersOpen, setIsPaymentFiltersOpen] = useState(false)

  const notice =
    (location.state as { notice?: string } | null)?.notice ?? null

  useEffect(() => {
    let isMounted = true

    async function loadSupplier() {
      if (!supplierId) {
        setLoadError("Fournisseur introuvable.")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        const supplier = await getSupplierByIdApi(supplierId)

        if (!isMounted) {
          return
        }

        setSupplierState(supplier)
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message = error instanceof Error ? error.message : "Fournisseur introuvable."
        setLoadError(message)
        setSupplierState(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSupplier()

    return () => {
      isMounted = false
    }
  }, [supplierId])

  useEffect(() => {
    const today = new Date()

    if (paymentPeriodPreset === "this-week") {
      setPaymentFromDate(toDateInput(getStartOfWeek(today)))
      setPaymentToDate(toDateInput(today))
      return
    }

    if (paymentPeriodPreset === "this-month") {
      const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
      setPaymentFromDate(toDateInput(startOfMonth))
      setPaymentToDate(toDateInput(today))
      return
    }

    if (paymentPeriodPreset === "all") {
      setPaymentFromDate("")
      setPaymentToDate("")
    }
  }, [paymentPeriodPreset])

  useEffect(() => {
    setPaymentsPage(1)
  }, [paymentFromDate, paymentToDate, paymentPeriodPreset])

  useEffect(() => {
    let isActive = true

    async function fetchPayments() {
      if (!supplierId) {
        return
      }

      setIsLoadingPayments(true)
      setPaymentsError(null)

      try {
        const fromIso = paymentFromDate
          ? new Date(`${paymentFromDate}T00:00:00.000Z`).toISOString()
          : undefined
        const toIso = paymentToDate
          ? new Date(`${paymentToDate}T23:59:59.999Z`).toISOString()
          : undefined

        const result = await listSupplierPayments(supplierId, {
          from: fromIso,
          to: toIso,
          page: paymentsPage,
          limit: 20,
        })

        if (!isActive) {
          return
        }

        setPayments(result.data)
        setPaymentsMeta(result.meta)
      } catch (error) {
        if (!isActive) {
          return
        }

        setPayments([])
        setPaymentsError(
          error instanceof Error
            ? error.message
            : "Chargement des versements impossible.",
        )
      } finally {
        if (isActive) {
          setIsLoadingPayments(false)
        }
      }
    }

    void fetchPayments()

    return () => {
      isActive = false
    }
  }, [supplierId, paymentsPage, paymentFromDate, paymentToDate, paymentsRefreshKey])

  const filteredPayments = useMemo(() => {
    const search = movementQuery.trim().toLowerCase()

    if (!search) {
      return payments
    }

    return payments.filter((entry) => {
      return (
        entry.id.toLowerCase().includes(search) ||
        (entry.recordedBy ?? "").toLowerCase().includes(search)
      )
    })
  }, [payments, movementQuery])

  async function handleRecordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(paymentAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Montant invalide. Saisissez une valeur supérieure à 0.")
      return
    }

    if (!supplierState) {
      setPaymentError("Fournisseur introuvable.")
      return
    }

    setIsRecordingPayment(true)
    setPaymentError(null)

    try {
      const payment = await createSupplierPayment(supplierState.id, {
        amount,
        paidAt: new Date(`${paymentDate}T00:00:00.000Z`).toISOString(),
        recordedBy: "cashier-01",
      })

      setSupplierState((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          debtTotal: current.debtTotal + payment.amount,
          paymentsTotal: current.paymentsTotal + payment.amount,
          history: current.history,
        }
      })

      setPaymentsPage(1)
      setPaymentsRefreshKey((current) => current + 1)

      setPaymentAmount("")
      setPaymentDate(new Date().toISOString().slice(0, 10))
      setPaymentReference("")
      setPaymentNote("")
      setPaymentError(null)
      setPaymentModalOpen(false)
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Versement fournisseur impossible.",
      )
    } finally {
      setIsRecordingPayment(false)
    }
  }

  if (isLoading) {
    return (
      <section className="page clients-page">
        <p className="clients-empty-row">Chargement du fournisseur...</p>
      </section>
    )
  }

  if (loadError || !supplierState) {
    return (
      <section className="page clients-page">
        <p className="form-error-banner">{loadError ?? "Fournisseur introuvable."}</p>
        <div className="clients-actions">
          <Link className="btn btn-ghost" to="/suppliers">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="page clients-page supplier-detail-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Détail fournisseur</h2>
          <p className="page-subtitle">
            Compte fournisseur en temps réel de {supplierState.name}.
          </p>
        </div>

        <div className="clients-actions">
          <Link className="btn btn-ghost" to="/suppliers">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
          <Link className="btn btn-primary" to={`/suppliers/${supplierState.id}/edit`}>
            <FilePenLine size={16} />
            Modifier
          </Link>
        </div>
      </div>

      {notice ? <p className="form-success-banner">{notice}</p> : null}

      <article className="client-detail-card">
        <div className="client-identity">
          <div>
            <h3>{supplierState.name}</h3>
            <p>{supplierState.phone}</p>
            <p>{supplierState.email ?? "Aucun email"}</p>
            <p>{supplierState.address ?? "Adresse non renseignée"}</p>
            <p>Depuis le {formatDate(supplierState.createdAt)}</p>
          </div>
          <span
            className={`status-chip ${
              supplierState.status === "active" ? "status-active" : "status-blocked"
            }`}
          >
            {supplierState.status === "active" ? "Actif" : "Inactif"}
          </span>
        </div>
      </article>

      <article className="client-form-card supplier-payment-card">
        <div className="client-history-head">
          <h3>Enregistrer un mouvement</h3>
          <span>
            <CreditCard size={14} /> Opérations en modal
          </span>
        </div>

        <div className="clients-actions">
          <button type="button" className="btn btn-primary" onClick={() => setPaymentModalOpen(true)}>
            <CreditCard size={16} />
            Versement (+)
          </button>
        </div>
      </article>

      <article className="client-history-card">
        <div className="client-history-head">
          <h3>Historique des versements</h3>
          <span>
            <CreditCard size={14} /> Solde actuel: {supplierState.debtTotal >= 0 ? "avance" : "dette"} {formatFcfa(Math.abs(supplierState.debtTotal))}
          </span>
        </div>

        <button
          type="button"
          className="supplier-filters-toggle"
          onClick={() => setIsPaymentFiltersOpen((open) => !open)}
          aria-expanded={isPaymentFiltersOpen}
          aria-controls="supplier-payments-filters-panel"
        >
          <span>
            <SlidersHorizontal size={14} /> Filtres
          </span>
          <ChevronDown
            size={14}
            className={isPaymentFiltersOpen ? "supplier-filters-toggle-icon is-open" : "supplier-filters-toggle-icon"}
          />
        </button>

        <div
          id="supplier-payments-filters-panel"
          className={
            isPaymentFiltersOpen
              ? "supplier-filters-panel is-open"
              : "supplier-filters-panel"
          }
        >
          <div className="clients-actions supplier-payment-filters">
            <button
              type="button"
              className={`btn ${paymentPeriodPreset === "this-week" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPaymentPeriodPreset("this-week")}
            >
              Cette semaine
            </button>
            <button
              type="button"
              className={`btn ${paymentPeriodPreset === "this-month" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPaymentPeriodPreset("this-month")}
            >
              Ce mois
            </button>
            <button
              type="button"
              className={`btn ${paymentPeriodPreset === "all" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPaymentPeriodPreset("all")}
            >
              Tout
            </button>
            <button
              type="button"
              className={`btn ${paymentPeriodPreset === "custom" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPaymentPeriodPreset("custom")}
            >
              Personnalisé
            </button>
          </div>

          {paymentPeriodPreset === "custom" ? (
            <div className="supplier-form-row supplier-payment-range">
              <label className="field-block supplier-field-block">
                <span>Du</span>
                <input
                  type="date"
                  value={paymentFromDate}
                  onChange={(event) => setPaymentFromDate(event.target.value)}
                />
              </label>
              <label className="field-block supplier-field-block">
                <span>Au</span>
                <input
                  type="date"
                  value={paymentToDate}
                  onChange={(event) => setPaymentToDate(event.target.value)}
                />
              </label>
            </div>
          ) : null}

          <label className="search-input-wrap supplier-inline-search">
            <Search size={14} />
            <input
              type="search"
              placeholder="Rechercher ID versement ou caissier"
              value={movementQuery}
              onChange={(event) => setMovementQuery(event.target.value)}
            />
          </label>
        </div>

        {paymentsError ? <p className="form-error-banner">{paymentsError}</p> : null}

        <div className="table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Montant</th>
                <th>Enregistré par</th>
                <th>Référence</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.paidAt)}</td>
                  <td className="text-success">+{formatFcfa(entry.amount)}</td>
                  <td>{entry.recordedBy ?? "-"}</td>
                  <td>{`PAY-${entry.id.slice(0, 8).toUpperCase()}`}</td>
                </tr>
              ))}

              {!isLoadingPayments && filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="clients-empty-row">
                    Aucun versement trouvé.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="clients-mobile-list">
          {filteredPayments.map((entry) => (
            <article key={entry.id} className="client-mobile-card">
              <div className="client-mobile-head">
                <div>
                  <strong>Versement</strong>
                  <small>{formatDate(entry.paidAt)}</small>
                </div>
                <strong className="text-success">+{formatFcfa(entry.amount)}</strong>
              </div>

              <div className="client-mobile-grid">
                <p>
                  <span>Enregistré par</span>
                  <strong>{entry.recordedBy ?? "-"}</strong>
                </p>
                <p>
                  <span>Référence</span>
                  <strong>{`PAY-${entry.id.slice(0, 8).toUpperCase()}`}</strong>
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="client-form-actions supplier-payments-pagination">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={paymentsMeta.page <= 1 || isLoadingPayments}
            onClick={() => setPaymentsPage((page) => Math.max(1, page - 1))}
          >
            Page précédente
          </button>
          <span className="clients-page-indicator">
            {paymentsMeta.total} versement(s) - page {paymentsMeta.page}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={paymentsMeta.page * paymentsMeta.limit >= paymentsMeta.total || isLoadingPayments}
            onClick={() => setPaymentsPage((page) => page + 1)}
          >
            Page suivante
          </button>
        </div>
      </article>

      {paymentModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setPaymentModalOpen(false)}>
          <article
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Enregistrer un versement"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Versement (+)</h3>
            </div>

            <form className="client-form-grid" onSubmit={handleRecordPayment}>
              <label className="field-block">
                <span>Montant *</span>
                <input
                  type="number"
                  min={1}
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="Ex: 150000"
                />
              </label>

              <label className="field-block">
                <span>Date *</span>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                />
              </label>

              <label className="field-block">
                <span>Méthode *</span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  <option value="Virement">Virement</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Espece">Espèce</option>
                  <option value="Cheque">Chèque</option>
                </select>
              </label>

              <label className="field-block">
                <span>Référence</span>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  placeholder="Ex: VIR-55210"
                />
              </label>

              <label className="field-block field-block-full">
                <span>Note</span>
                <textarea
                  rows={2}
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                  placeholder="Commentaire du versement"
                />
              </label>

              {paymentError ? <p className="supplier-payment-error">{paymentError}</p> : null}

              <div className="client-form-actions supplier-payment-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={isRecordingPayment}
                  onClick={() => setPaymentModalOpen(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={isRecordingPayment}>
                  {isRecordingPayment ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

    </section>
  )
}
