import { Building2, ShieldCheck, UserRound } from "lucide-react"
import { NavLink } from "react-router-dom"

const items = [
  { to: "/settings/profile", label: "Profil utilisateur", icon: UserRound },
  { to: "/settings/shop", label: "Parametres boutique", icon: Building2 },
  { to: "/settings/users", label: "Gestion utilisateurs", icon: ShieldCheck },
]

export function SettingsSubnav() {
  return (
    <nav className="settings-subnav" aria-label="Navigation parametres">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `settings-subnav-item${isActive ? " settings-subnav-item--active" : ""}`
          }
        >
          <Icon size={15} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
