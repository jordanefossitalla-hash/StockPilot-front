import { useMemo, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AppFooter } from "../components/AppFooter"
import { AppHeader } from "../components/AppHeader"
import { AppSidebar } from "../components/AppSidebar"
import { BottomNav } from "../components/BottomNav"
import { useTheme } from "../hooks/useTheme"
import { getInitials } from "../utils/getInitials"

const COLLAPSE_KEY = "sp-sidebar-collapsed"
const CURRENT_USER_NAME = "Admin User"
const CURRENT_USER_ROLE = "Administrateur"

const PAGE_TITLES: Record<string, string> = {
  "/": "Tableau de bord",
  "/sales": "Ventes",
  "/clients": "Clients",
  "/orders": "Commandes",
  "/products": "Produits",
  "/reports": "Rapports",
  "/settings": "Paramètres",
}

export function MainLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "true",
  )
  const { theme, toggleTheme } = useTheme()

  const title = useMemo(
    () => PAGE_TITLES[location.pathname] ?? "StockPilot",
    [location.pathname],
  )
  const userInitials = useMemo(() => getInitials(CURRENT_USER_NAME), [])

  function handleToggleCollapse() {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSE_KEY, String(next))
      return next
    })
  }

  return (
    <div
      className={`app-shell${sidebarCollapsed ? " shell--sidebar-collapsed" : ""}`}
    >
      <AppSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={handleToggleCollapse}
        userName={CURRENT_USER_NAME}
        userRole={CURRENT_USER_ROLE}
        userInitials={userInitials}
      />

      <div className="app-body">
        <AppHeader
          title={title}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          theme={theme}
          onToggleTheme={toggleTheme}
          userInitials={userInitials}
        />

        <main className="app-main">
          <Outlet />
        </main>

        <AppFooter />
      </div>

      <BottomNav />
    </div>
  )
}
