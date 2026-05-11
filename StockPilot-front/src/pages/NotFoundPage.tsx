import { Link } from "react-router-dom"

export function NotFoundPage() {
  return (
    <section className="page-section">
      <h2>Page introuvable</h2>
      <p className="page-subtitle">La page demandee n'existe pas.</p>
      <Link to="/" className="link-btn">
        Retour au tableau de bord
      </Link>
    </section>
  )
}
