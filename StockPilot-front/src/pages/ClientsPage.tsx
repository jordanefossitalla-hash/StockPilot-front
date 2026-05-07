import { Users } from "lucide-react"

export function ClientsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Clients</h2>
        <p className="page-subtitle">
          Gestion de la base clients, historique et fidélisation.
        </p>
      </div>

      <div className="placeholder-state">
        <Users size={40} strokeWidth={1.25} className="text-muted" />
        <p>La liste des clients sera intégrée ici.</p>
      </div>
    </div>
  )
}
