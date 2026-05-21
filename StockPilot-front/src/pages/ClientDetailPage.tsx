import { ArrowLeft, CreditCard, FilePenLine } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import type { Client } from "../features/clients/clientTypes"
import { formatDate, formatFcfa } from "../features/clients/clientFormatters"
import { getClientByIdApi } from "../services/clientService"

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadClient() {
      if (!clientId) {
        setLoadError("Client introuvable.")
        setClient(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        const result = await getClientByIdApi(clientId)

        if (!isMounted) {
          return
        }

        setClient(result)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setLoadError(error instanceof Error ? error.message : "Client introuvable.")
        setClient(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadClient()

    return () => {
      isMounted = false
    }
  }, [clientId])

  if (isLoading) {
    return (
      <section className="page clients-page">
        <p className="clients-empty-row">Chargement du client...</p>
      </section>
    )
  }

  if (loadError || !client) {
    return (
      <section className="page clients-page">
        <p className="form-error-banner">{loadError ?? "Client introuvable."}</p>
        <div className="clients-actions">
          <Link className="btn btn-ghost" to="/clients">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Détail client</h2>
          <p className="page-subtitle">Suivi complet des opérations de {client.name}.</p>
        </div>
        <div className="clients-actions">
          <Link className="btn btn-ghost" to="/clients">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
          <Link
            className="btn btn-primary"
            to={`/clients/${client.id}/edit`}
            state={{ client }}
          >
            <FilePenLine size={16} />
            Modifier
          </Link>
        </div>
      </div>

      <article className="client-detail-card">
        <div className="client-identity">
          <div>
            <h3>{client.name}</h3>
            <p>{client.phone}</p>
            <p>{client.email ?? "Aucun email"}</p>
            <p>{client.address ?? "Adresse non renseignée"}</p>
          </div>
          <span
            className={`status-chip ${
              client.status === "active" ? "status-active" : "status-blocked"
            }`}
          >
            {client.status === "active" ? "Actif" : "Bloqué"}
          </span>
        </div>

        <div className="client-stats-grid">
          <div className="client-stat-box">
            <span>Achats</span>
            <strong>{formatFcfa(client.purchasesTotal)}</strong>
          </div>
          <div className="client-stat-box">
            <span>Dettes</span>
            <strong>{formatFcfa(client.debtTotal)}</strong>
          </div>
          <div className="client-stat-box">
            <span>Paiements</span>
            <strong>{formatFcfa(client.paymentsTotal)}</strong>
          </div>
          <div className="client-stat-box">
            <span>Dernier achat</span>
            <strong>
              {client.lastPurchaseDate ? formatDate(client.lastPurchaseDate) : "N/A"}
            </strong>
          </div>
        </div>
      </article>

      <article className="client-history-card">
        <div className="client-history-head">
          <h3>Historique transactions</h3>
          <span>
            <CreditCard size={14} /> {client.transactions.length} opérations
          </span>
        </div>

        <div className="table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Référence</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {client.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{transaction.description}</td>
                  <td>
                    {transaction.type === "purchase"
                      ? "Achat"
                      : transaction.type === "payment"
                        ? "Paiement"
                        : "Ajustement"}
                  </td>
                  <td>{transaction.reference ?? transaction.method ?? "-"}</td>
                  <td>{formatFcfa(transaction.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
