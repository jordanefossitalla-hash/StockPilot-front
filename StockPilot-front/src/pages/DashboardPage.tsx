import {
  ArrowDownRight,
  ArrowUpRight,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

type Kpi = {
  label: string
  value: string
  trend: string
  up: boolean
  icon: LucideIcon
  color: "blue" | "green" | "orange" | "red"
}

const kpis: Kpi[] = [
  {
    label: "Chiffre d'affaires",
    value: "142 580 €",
    trend: "+8.2 % ce mois",
    up: true,
    icon: TrendingUp,
    color: "blue",
  },
  {
    label: "Commandes",
    value: "1 248",
    trend: "+12.4 % ce mois",
    up: true,
    icon: ShoppingCart,
    color: "green",
  },
  {
    label: "Clients actifs",
    value: "3 867",
    trend: "+4.1 % ce mois",
    up: true,
    icon: Users,
    color: "orange",
  },
  {
    label: "Taux de conversion",
    value: "68.2 %",
    trend: "-1.3 % ce mois",
    up: false,
    icon: Package,
    color: "red",
  },
]

export function DashboardPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Tableau de bord</h2>
        <p className="page-subtitle">
          Vue d'ensemble de votre activité commerciale.
        </p>
      </div>

      <div className="kpi-grid">
        {kpis.map(({ label, value, trend, up, icon: Icon, color }) => (
          <article key={label} className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">{label}</span>
              <span className={`kpi-icon kpi-icon--${color}`}>
                <Icon size={16} strokeWidth={1.75} />
              </span>
            </div>
            <p className="kpi-value">{value}</p>
            <p className={`kpi-trend kpi-trend--${up ? "up" : "down"}`}>
              {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {trend}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
