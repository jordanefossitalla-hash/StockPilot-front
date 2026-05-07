import { ShoppingCart } from "lucide-react"

export function OrdersPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Commandes</h2>
        <p className="page-subtitle">
          Suivi des commandes en cours, traitées et annulées.
        </p>
      </div>

      <div className="placeholder-state">
        <ShoppingCart size={40} strokeWidth={1.25} className="text-muted" />
        <p>Le tableau des commandes sera intégré ici.</p>
      </div>
    </div>
  )
}
