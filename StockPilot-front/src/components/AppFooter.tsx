export function AppFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="app-footer">
      <span>© {year} StockPilot — Gestion des ventes</span>
      <span className="footer-version">v0.1.0</span>
    </footer>
  )
}
