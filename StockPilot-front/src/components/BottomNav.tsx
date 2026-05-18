import {
  Boxes,
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import {
  getPendingOrdersCount,
  ORDER_PENDING_EVENT,
  ORDER_PENDING_STORAGE_KEY,
} from "../utils/orderPendingSignal"

const items = [
  { to: "/", label: "Accueil", icon: LayoutDashboard },
  { to: "/sales", label: "Ventes", icon: TrendingUp },
  { to: "/orders", label: "Commandes", icon: ShoppingCart },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/products", label: "Produits", icon: Package },
  { to: "/categories", label: "Catégories", icon: Boxes },
]

export function BottomNav() {
  const [pendingOrdersCount, setPendingOrdersCount] = useState(() => getPendingOrdersCount())

  useEffect(() => {
    const syncPendingOrders = () => {
      setPendingOrdersCount(getPendingOrdersCount())
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === ORDER_PENDING_STORAGE_KEY) {
        syncPendingOrders()
      }
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener(ORDER_PENDING_EVENT, syncPendingOrders)
    syncPendingOrders()

    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(ORDER_PENDING_EVENT, syncPendingOrders)
    }
  }, [])

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
          {to === "/orders" && pendingOrdersCount > 0 ? (
            <span className="bottom-nav-badge" aria-label={`${pendingOrdersCount} commandes à livrer`}>
              {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
            </span>
          ) : null}
          <Icon size={20} strokeWidth={1.75} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
