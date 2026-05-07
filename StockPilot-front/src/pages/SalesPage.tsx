import { TrendingUp } from "lucide-react"

export function SalesPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Ventes</h2>
        <p className="page-subtitle">
          Suivi des ventes, objectifs et performance commerciale.
        </p>
      </div>

      <div className="placeholder-state">
        <TrendingUp size={40} strokeWidth={1.25} className="text-muted" />
        <p>Les graphiques de ventes seront intégrés ici.</p>
      </div>
    </div>
  )
}
