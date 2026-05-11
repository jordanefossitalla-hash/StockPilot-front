import { ArrowDownCircle, ArrowUpCircle, History, Layers } from "lucide-react"
import { NavLink } from "react-router-dom"

const items = [
  { to: "/stock", label: "État", icon: Layers },
  { to: "/stock/in", label: "Entrée", icon: ArrowUpCircle },
  { to: "/stock/out", label: "Sortie", icon: ArrowDownCircle },
  { to: "/stock/history", label: "Historique", icon: History },
]

export function StockSubnav() {
  return (
    <nav className="stock-subnav" aria-label="Navigation stock">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/stock"}
          className={({ isActive }) =>
            `stock-subnav-item${isActive ? " stock-subnav-item--active" : ""}`
          }
        >
          <Icon size={15} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
