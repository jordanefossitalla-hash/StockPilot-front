import type { LucideIcon } from "lucide-react"
import {
  Archive,
  Boxes,
  ChevronLeft,
  ChevronRight,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import appLogo from "../assets/stockpilot-logo-retained.png"

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  badge?: number
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
      { to: "/sales", label: "Ventes", icon: TrendingUp },
      { to: "/clients", label: "Clients", icon: Users },
      { to: "/orders", label: "Commandes", icon: ShoppingCart, badge: 4 },
      { to: "/products", label: "Produits", icon: Package },
      { to: "/categories", label: "Catégories", icon: Boxes },
      { to: "/stock", label: "Stock", icon: Archive },
      { to: "/suppliers", label: "Fournisseurs", icon: Truck },
    ],
  },
  {
    title: "Analyse",
    items: [
      { to: "/reports", label: "Rapports", icon: FileBarChart2 },
      { to: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
]

type AppSidebarProps = {
  isOpen: boolean
  isCollapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
  onLogout: () => void | Promise<void>
  userName: string
  userRole: string
  userInitials: string
}

export function AppSidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
  onLogout,
  userName,
  userRole,
  userInitials,
}: AppSidebarProps) {
  return (
    <>
      <aside
        className={[
          "app-sidebar",
          isOpen ? "sidebar-mobile-open" : "",
          isCollapsed ? "sidebar-collapsed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <img src={appLogo} className="brand-image-lockup" alt="StockPilot" />
            <div className="brand-copy" aria-hidden="true">
              <p className="brand-title">StockPilot</p>
              <p className="brand-subtitle">Gestion des ventes</p>
            </div>
            <div className="brand-mark" aria-hidden="true">
              <img src={appLogo} className="brand-image-mark" alt="" />
            </div>
          </div>
          <button
            type="button"
            className="collapse-btn"
            onClick={onToggleCollapse}
            aria-label={
              isCollapsed ? "Développer la sidebar" : "Réduire la sidebar"
            }
          >
            {isCollapsed ? (
              <ChevronRight size={13} />
            ) : (
              <ChevronLeft size={13} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Navigation principale">
          {navGroups.map((group) => (
            <div key={group.title} className="nav-group">
              <span className="nav-group-label">{group.title}</span>
              {group.items.map(({ to, label, icon: Icon, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `nav-item${isActive ? " nav-item--active" : ""}`
                  }
                  onClick={onClose}
                >
                  <span className="nav-icon-wrap">
                    <Icon size={18} strokeWidth={1.75} />
                    {badge !== undefined && (
                      <span className="nav-badge">{badge}</span>
                    )}
                  </span>
                  <span className="nav-label">{label}</span>
                  <span className="nav-tooltip" aria-hidden="true">
                    {label}
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="sidebar-user-section">
          <div className="sidebar-user">
            <span className="user-avatar-sm">{userInitials}</span>
            <div className="user-meta">
              <p className="user-name">{userName}</p>
              <p className="user-role">{userRole}</p>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-logout-btn"
            aria-label="Se déconnecter"
            onClick={onLogout}
          >
            <LogOut size={15} strokeWidth={1.75} />
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Fermer la navigation"
          onClick={onClose}
        />
      )}
    </>
  )
}
