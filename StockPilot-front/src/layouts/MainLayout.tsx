import { useMemo, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AppFooter } from "../components/AppFooter"
import { AppHeader } from "../components/AppHeader"
import { AppSidebar } from "../components/AppSidebar"
import { BottomNav } from "../components/BottomNav"
import { useTheme } from "../hooks/useTheme"
import { useAuthStore } from "../store/authStore"
import { getInitials } from "../utils/getInitials"

const COLLAPSE_KEY = "sp-sidebar-collapsed"

const PAGE_TITLES: Record<string, string> = {
  "/": "Tableau de bord",
  "/sales": "Ventes",
  "/clients": "Clients",
  "/orders": "Commandes",
  "/products": "Produits",
  "/categories": "Categories",
  "/stock": "Etat du stock",
  "/suppliers": "Fournisseurs",
  "/reports": "Rapports",
  "/settings": "Paramètres",
}

function resolvePageTitle(pathname: string) {
  if (pathname === "/clients/new") {
    return "Ajouter client"
  }

  if (pathname === "/products/new") {
    return "Ajouter produit"
  }

  if (pathname === "/categories/new") {
    return "Ajouter categorie"
  }

  if (pathname === "/suppliers/new") {
    return "Ajouter fournisseur"
  }

  if (/^\/clients\/[^/]+\/edit$/.test(pathname)) {
    return "Modifier client"
  }

  if (/^\/clients\/[^/]+$/.test(pathname)) {
    return "Detail client"
  }

  if (/^\/products\/[^/]+\/edit$/.test(pathname)) {
    return "Modifier produit"
  }

  if (/^\/products\/[^/]+$/.test(pathname)) {
    return "Detail produit"
  }

  if (/^\/categories\/[^/]+\/edit$/.test(pathname)) {
    return "Modifier categorie"
  }

  if (/^\/suppliers\/[^/]+\/edit$/.test(pathname)) {
    return "Modifier fournisseur"
  }

  if (/^\/suppliers\/[^/]+$/.test(pathname)) {
    return "Detail fournisseur"
  }

  if (pathname === "/stock/in") {
    return "Entree stock"
  }

  if (pathname === "/stock/out") {
    return "Sortie stock"
  }

  if (pathname === "/stock/history") {
    return "Historique stock"
  }

  if (pathname === "/settings/profile") {
    return "Profil utilisateur"
  }

  if (pathname === "/settings/shop") {
    return "Parametres boutique"
  }

  if (pathname === "/settings/users") {
    return "Gestion utilisateurs"
  }

  return PAGE_TITLES[pathname] ?? "StockPilot"
}

export function MainLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "true",
  )
  const { theme, toggleTheme } = useTheme()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const currentUserName = user?.name ?? "Utilisateur"
  const currentUserRole = user?.role ?? "Utilisateur"

  const title = useMemo(() => resolvePageTitle(location.pathname), [location.pathname])
  const userInitials = useMemo(() => getInitials(currentUserName), [currentUserName])

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
        userName={currentUserName}
        userRole={currentUserRole}
        userInitials={userInitials}
        onLogout={logout}
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
