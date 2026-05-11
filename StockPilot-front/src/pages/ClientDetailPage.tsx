import { ArrowLeft, CreditCard, FilePenLine } from "lucide-react"
import { Link, Navigate, useParams } from "react-router-dom"
import { getClientById } from "../features/clients/clientData"
import { formatDate, formatFcfa } from "../features/clients/clientFormatters"

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const client = clientId ? getClientById(clientId) : undefined

  if (!client) {
    return <Navigate to="/clients" replace />
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
          <Link className="btn btn-primary" to={`/clients/${client.id}/edit`}>
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
