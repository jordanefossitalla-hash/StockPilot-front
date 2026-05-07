import { Link } from "react-router-dom"

export function NotFoundPage() {
  return (
    <section className="page-section">
      <h2>Page not found</h2>
      <p className="page-subtitle">The requested page does not exist.</p>
      <Link to="/" className="link-btn">
        Return to dashboard
      </Link>
    </section>
  )
}
