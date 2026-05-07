import { FileBarChart2 } from "lucide-react"

export function ReportsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Rapports</h2>
        <p className="page-subtitle">
          Analyses avancées, exports et tableaux de bord personnalisés.
        </p>
      </div>

      <div className="placeholder-state">
        <FileBarChart2 size={40} strokeWidth={1.25} className="text-muted" />
        <p>Les rapports analytiques seront intégrés ici.</p>
      </div>
    </div>
  )
}
