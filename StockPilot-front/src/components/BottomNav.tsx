import {
  Boxes,
  LayoutDashboard,
  Package,
  TrendingUp,
  Users,
} from "lucide-react"
import { NavLink } from "react-router-dom"

const items = [
  { to: "/", label: "Accueil", icon: LayoutDashboard },
  { to: "/sales", label: "Ventes", icon: TrendingUp },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/products", label: "Produits", icon: Package },
  { to: "/categories", label: "Catégories", icon: Boxes },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale mobile">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `bottom-nav-item${isActive ? " bottom-nav-item--active" : ""}`
          }
        >
          <Icon size={20} strokeWidth={1.75} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
