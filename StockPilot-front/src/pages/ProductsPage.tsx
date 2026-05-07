import { Package } from "lucide-react"

export function ProductsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Produits</h2>
        <p className="page-subtitle">
          Catalogue produits, stocks et gestion des prix.
        </p>
      </div>

      <div className="placeholder-state">
        <Package size={40} strokeWidth={1.25} className="text-muted" />
        <p>Le catalogue produits sera intégré ici.</p>
      </div>
    </div>
  )
}
