import { ArrowLeft, FilePenLine, History, ShoppingBag } from "lucide-react"
import { Link, Navigate, useParams } from "react-router-dom"
import { getProductById } from "../features/products/productData"
import {
  formatDate,
  formatFcfa,
  formatProductCategory,
} from "../features/products/productFormatters"
import { getProductStockStatus } from "../features/products/productStats"

function getStatusLabel(quantity: number) {
  const status = getProductStockStatus(quantity)

  if (status === "out-of-stock") {
    return { text: "Rupture", className: "status-blocked" }
  }

  if (status === "low-stock") {
    return { text: "Stock faible", className: "status-warning" }
  }

  return { text: "Disponible", className: "status-active" }
}

function formatMovementType(type: "in" | "out" | "adjustment") {
  if (type === "in") {
    return "Entrée"
  }

  if (type === "out") {
    return "Sortie"
  }

  return "Ajustement"
}

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const product = productId ? getProductById(productId) : undefined

  if (!product) {
    return <Navigate to="/products" replace />
  }

  const unitMargin = product.salePrice - product.purchasePrice
  const stockValueSale = product.salePrice * product.quantity
  const status = getStatusLabel(product.quantity)

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Détail produit</h2>
          <p className="page-subtitle">
            Historique ventes et mouvements stock de {product.name}.
          </p>
        </div>

        <div className="clients-actions">
          <Link className="btn btn-ghost" to="/products">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
          <Link className="btn btn-primary" to={`/products/${product.id}/edit`}>
            <FilePenLine size={16} />
            Modifier
          </Link>
        </div>
      </div>

      <article className="client-detail-card">
        <div className="client-identity">
          <div>
            <h3>{product.name}</h3>
            <p>{product.id}</p>
            <p>{formatProductCategory(product.category)}</p>
            <p>Ajouté le {formatDate(product.createdAt)}</p>
          </div>
          <span className={`status-chip ${status.className}`}>{status.text}</span>
        </div>

        <div className="client-stats-grid">
          <div className="client-stat-box">
            <span>Prix achat</span>
            <strong>{formatFcfa(product.purchasePrice)}</strong>
          </div>
          <div className="client-stat-box">
            <span>Prix vente</span>
            <strong>{formatFcfa(product.salePrice)}</strong>
          </div>
          <div className="client-stat-box">
            <span>Marge unitaire</span>
            <strong>{formatFcfa(unitMargin)}</strong>
          </div>
          <div className="client-stat-box">
            <span>Quantité en stock</span>
            <strong>{product.quantity}</strong>
          </div>
          <div className="client-stat-box">
            <span>Valeur stock</span>
            <strong>{formatFcfa(stockValueSale)}</strong>
          </div>
        </div>
      </article>

      <article className="client-history-card">
        <div className="client-history-head">
          <h3>Historique ventes</h3>
          <span>
            <ShoppingBag size={14} /> {product.salesHistory.length} ventes
          </span>
        </div>

        <div className="table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Facture</th>
                <th>Qté</th>
                <th>PU</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {product.salesHistory.map((sale) => (
                <tr key={sale.id}>
                  <td>{formatDate(sale.date)}</td>
                  <td>{sale.clientName}</td>
                  <td>{sale.invoiceRef}</td>
                  <td>{sale.quantity}</td>
                  <td>{formatFcfa(sale.unitPrice)}</td>
                  <td>{formatFcfa(sale.total)}</td>
                </tr>
              ))}

              {product.salesHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="clients-empty-row">
                    Aucune vente enregistrée.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="clients-mobile-list">
          {product.salesHistory.map((sale) => (
            <article key={sale.id} className="client-mobile-card">
              <div className="client-mobile-head">
                <div>
                  <strong>{sale.clientName}</strong>
                  <small>{sale.invoiceRef}</small>
                </div>
                <strong>{formatFcfa(sale.total)}</strong>
              </div>
              <div className="client-mobile-grid">
                <p>
                  <span>Date</span>
                  <strong>{formatDate(sale.date)}</strong>
                </p>
                <p>
                  <span>Quantité</span>
                  <strong>{sale.quantity}</strong>
                </p>
                <p>
                  <span>Prix unitaire</span>
                  <strong>{formatFcfa(sale.unitPrice)}</strong>
                </p>
              </div>
            </article>
          ))}

          {product.salesHistory.length === 0 ? (
            <article className="client-mobile-card">
              <p className="clients-empty-row">Aucune vente enregistrée.</p>
            </article>
          ) : null}
        </div>
      </article>

      <article className="client-history-card">
        <div className="client-history-head">
          <h3>Mouvements stock</h3>
          <span>
            <History size={14} /> {product.stockMovements.length} mouvements
          </span>
        </div>

        <div className="table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Qté</th>
                <th>Motif</th>
                <th>Référence</th>
              </tr>
            </thead>
            <tbody>
              {product.stockMovements.map((movement) => (
                <tr key={movement.id}>
                  <td>{formatDate(movement.date)}</td>
                  <td>{formatMovementType(movement.type)}</td>
                  <td>{movement.quantity}</td>
                  <td>{movement.reason}</td>
                  <td>{movement.reference ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="clients-mobile-list">
          {product.stockMovements.map((movement) => (
            <article key={movement.id} className="client-mobile-card">
              <div className="client-mobile-head">
                <div>
                  <strong>{formatMovementType(movement.type)}</strong>
                  <small>{formatDate(movement.date)}</small>
                </div>
                <strong>{movement.quantity}</strong>
              </div>

              <div className="client-mobile-grid">
                <p>
                  <span>Motif</span>
                  <strong>{movement.reason}</strong>
                </p>
                <p>
                  <span>Référence</span>
                  <strong>{movement.reference ?? "-"}</strong>
                </p>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  )
}
