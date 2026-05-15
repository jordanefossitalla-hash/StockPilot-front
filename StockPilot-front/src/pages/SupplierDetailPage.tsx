import { ArrowLeft, CreditCard, FilePenLine, PackagePlus, Search } from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { formatDate, formatFcfa } from "../features/suppliers/supplierFormatters"
import type { Supplier, SupplierHistoryType } from "../features/suppliers/supplierTypes"
import { getSupplierByIdApi } from "../services/supplierService"

function historyLabel(type: SupplierHistoryType) {
  if (type === "supply") {
    return "Réception marchandise"
  }

  if (type === "payment") {
    return "Versement"
  }

  return "Ajustement"
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

  const [supplyAmount, setSupplyAmount] = useState("")
  const [supplyDate, setSupplyDate] = useState(new Date().toISOString().slice(0, 10))
  const [supplyReference, setSupplyReference] = useState("")
  const [supplyNote, setSupplyNote] = useState("")
  const [supplyError, setSupplyError] = useState<string | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [supplyModalOpen, setSupplyModalOpen] = useState(false)

  const [movementQuery, setMovementQuery] = useState("")

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

  const historyWithBalance = useMemo(() => {
    const movementsOnly = (supplierState?.history ?? []).filter(
      (entry) => entry.type === "payment" || entry.type === "supply",
    )

    const sortedAscending = [...movementsOnly].sort((first, second) => {
      return first.date.localeCompare(second.date)
    })

    const startingBalance = supplierState?.debtTotal ?? 0

    const withBalanceAscending = sortedAscending.reduce<
      Array<(typeof sortedAscending)[number] & { delta: number; runningBalance: number }>
    >((accumulator, entry) => {
      const previousBalance =
        accumulator.length > 0
          ? accumulator[accumulator.length - 1].runningBalance
          : startingBalance
      const delta = entry.type === "payment" ? entry.amount : -entry.amount
      const runningBalance = previousBalance + delta

      accumulator.push({
        ...entry,
        delta,
        runningBalance,
      })

      return accumulator
    }, [])

    return withBalanceAscending.reverse()
  }, [supplierState?.debtTotal, supplierState?.history])

  const currentBalance = historyWithBalance[0]?.runningBalance ?? supplierState?.debtTotal ?? 0

  const filteredMovements = useMemo(() => {
    const search = movementQuery.trim().toLowerCase()

    if (!search) {
      return historyWithBalance
    }

    return historyWithBalance.filter((entry) => {
      return (
        historyLabel(entry.type).toLowerCase().includes(search) ||
        entry.description.toLowerCase().includes(search) ||
        (entry.reference ?? "").toLowerCase().includes(search) ||
        (entry.method ?? "").toLowerCase().includes(search)
      )
    })
  }, [historyWithBalance, movementQuery])

  function handleRecordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(paymentAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Montant invalide. Saisissez une valeur supérieure à 0.")
      return
    }

    setSupplierState((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        debtTotal: current.debtTotal + amount,
        paymentsTotal: current.paymentsTotal + amount,
        history: [
          {
            id: `SHP-${Date.now()}`,
            date: paymentDate,
            type: "payment",
            description:
              paymentNote.trim() || "Paiement fournisseur enregistré manuellement",
            amount,
            reference: paymentReference.trim() || `PAY-${Date.now().toString().slice(-6)}`,
            method: paymentMethod,
          },
          ...current.history,
        ],
      }
    })

    setPaymentAmount("")
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setPaymentReference("")
    setPaymentNote("")
    setPaymentError(null)
    setPaymentModalOpen(false)
  }

  function handleRecordSupply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(supplyAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setSupplyError("Montant invalide. Saisissez une valeur supérieure à 0.")
      return
    }

    setSupplierState((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        debtTotal: current.debtTotal - amount,
        history: [
          {
            id: `SHS-${Date.now()}`,
            date: supplyDate,
            type: "supply",
            description:
              supplyNote.trim() || "Réception marchandise enregistrée manuellement",
            amount,
            reference: supplyReference.trim() || `SUP-${Date.now().toString().slice(-6)}`,
          },
          ...current.history,
        ],
      }
    })

    setSupplyAmount("")
    setSupplyDate(new Date().toISOString().slice(0, 10))
    setSupplyReference("")
    setSupplyNote("")
    setSupplyError(null)
    setSupplyModalOpen(false)
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
          <button type="button" className="btn btn-ghost" onClick={() => setSupplyModalOpen(true)}>
            <PackagePlus size={16} />
            Réception (-)
          </button>
        </div>
      </article>

      <article className="client-history-card">
        <div className="client-history-head">
          <h3>Historique des mouvements</h3>
          <span>
            <CreditCard size={14} /> Solde actuel: {currentBalance >= 0 ? "avance" : "dette"} {formatFcfa(Math.abs(currentBalance))}
          </span>
        </div>

        <label className="search-input-wrap supplier-inline-search">
          <Search size={14} />
          <input
            type="search"
            placeholder="Rechercher type, note, référence ou méthode"
            value={movementQuery}
            onChange={(event) => setMovementQuery(event.target.value)}
          />
        </label>

        <div className="table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Date</th>
                  <th>Commentaire</th>
                  <th>Solde</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.date)}</td>
                    <td>{entry.description}</td>
                    <td>
                      <span
                        className={entry.runningBalance >= 0 ? "text-success" : "text-danger"}
                      >
                        {entry.runningBalance >= 0 ? "+" : "-"}
                        {formatFcfa(Math.abs(entry.runningBalance))}
                      </span>
                    </td>
                </tr>
              ))}

              {filteredMovements.length === 0 ? (
                <tr>
                    <td colSpan={3} className="clients-empty-row">
                    Aucun mouvement enregistré.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="clients-mobile-list">
          {filteredMovements.map((entry) => (
            <article key={entry.id} className="client-mobile-card">
              <div className="client-mobile-head">
                <div>
                  <strong>Mouvement</strong>
                  <small>{formatDate(entry.date)}</small>
                </div>
                <strong
                  className={entry.runningBalance >= 0 ? "text-success" : "text-danger"}
                >
                  {entry.runningBalance >= 0 ? "+" : "-"}
                  {formatFcfa(Math.abs(entry.runningBalance))}
                </strong>
              </div>

              <div className="client-mobile-grid">
                <p>
                  <span>Description</span>
                  <strong>{entry.description}</strong>
                </p>
                <p>
                  <span>Solde</span>
                  <strong
                    className={entry.runningBalance >= 0 ? "text-success" : "text-danger"}
                  >
                    {entry.runningBalance >= 0 ? "+" : "-"}
                    {formatFcfa(Math.abs(entry.runningBalance))}
                  </strong>
                </p>
              </div>
            </article>
          ))}
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
                <button type="button" className="btn btn-ghost" onClick={() => setPaymentModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      {supplyModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setSupplyModalOpen(false)}>
          <article
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Enregistrer une réception"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Réception marchandise (-)</h3>
            </div>

            <form className="client-form-grid" onSubmit={handleRecordSupply}>
              <label className="field-block">
                <span>Montant marchandises *</span>
                <input
                  type="number"
                  min={1}
                  value={supplyAmount}
                  onChange={(event) => setSupplyAmount(event.target.value)}
                  placeholder="Ex: 230000"
                />
              </label>

              <label className="field-block">
                <span>Date *</span>
                <input
                  type="date"
                  value={supplyDate}
                  onChange={(event) => setSupplyDate(event.target.value)}
                />
              </label>

              <label className="field-block field-block-full">
                <span>Référence</span>
                <input
                  type="text"
                  value={supplyReference}
                  onChange={(event) => setSupplyReference(event.target.value)}
                  placeholder="Ex: BL-7702"
                />
              </label>

              <label className="field-block field-block-full">
                <span>Note</span>
                <textarea
                  rows={2}
                  value={supplyNote}
                  onChange={(event) => setSupplyNote(event.target.value)}
                  placeholder="Commentaire de réception"
                />
              </label>

              {supplyError ? <p className="supplier-payment-error">{supplyError}</p> : null}

              <div className="client-form-actions supplier-payment-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setSupplyModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </section>
  )
}
