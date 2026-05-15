import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  dashboardMetrics,
  monthlyPerformance,
  operationsEvolution,
  stockDistribution,
} from "../features/dashboard/dashboardData"

const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat("fr-FR")

function formatMetricValue(label: string, value: number) {
  const normalized = label.toLowerCase()

  if (
    normalized.includes("ventes") ||
    normalized.includes("revenus") ||
    normalized.includes("dettes") ||
    normalized.includes("benefice")
  ) {
    return moneyFormatter.format(value)
  }

  return numberFormatter.format(value)
}

function getStockSegmentColor(name: string) {
  if (name === "Disponible") {
    return "#3b82f6"
  }

  if (name === "Bas stock") {
    return "#f59e0b"
  }

  return "#ef4444"
}

function formatMonthTick(month: string, isMobile: boolean) {
  if (!isMobile) {
    return month
  }

  return month.slice(0, 3)
}

function formatMetricLabel(label: string, isMobile: boolean) {
  const labels: Record<string, string> = {
    "Benefices(semaine en cours)": "Benefices semaine",
    "Total ventes (semaine en cours)": "Ventes semaine",
    "Revenus du jour": "Revenus jour",
    "Clients (nombre)": "Clients",
    "Fournisseurs (nombre)": "Fournisseurs",
    "Dettes clients": "Dette clients",
    "Dettes fournisseurs": "Dette fournisseurs",
    "Benefice mensuel": "Benefice mensuel",
  }

  if (isMobile) {
    return labels[label] ?? label.replace(/\s*\([^)]*\)/g, "").trim()
  }

  return labels[label] ?? label.replace(/\s*\([^)]*\)/g, "").trim()
}

function getMetricKicker(label: string) {
  const normalized = label.toLowerCase()

  if (normalized.includes("semaine")) {
    return "Semaine"
  }

  if (normalized.includes("jour")) {
    return "Aujourd'hui"
  }

  if (normalized.includes("mensuel")) {
    return "Mensuel"
  }

  if (normalized.includes("dettes")) {
    return "Encours"
  }

  if (normalized.includes("clients") || normalized.includes("fournisseurs")) {
    return "Base active"
  }

  return "Suivi"
}

function formatMetricDelta(delta: number, isMobile: boolean) {
  const prefix = delta > 0 ? "+" : ""

  if (isMobile) {
    return `${prefix}${delta.toFixed(1)}%`
  }

  return `${prefix}${delta.toFixed(1)}% vs mois précédent`
}

export function DashboardPage() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }

    return window.matchMedia("(max-width: 640px)").matches
  })

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const media = window.matchMedia("(max-width: 640px)")
    const listener = (event: MediaQueryListEvent) => setIsMobile(event.matches)

    media.addEventListener("change", listener)

    return () => media.removeEventListener("change", listener)
  }, [])

  return (
    <div className="page dashboard-page">
      <section className="metrics-grid" aria-label="Widgets metiers">
        {dashboardMetrics.map((metric, index) => (
          <article
            key={metric.label}
            className={`metric-card ${index < 2 ? "metric-card-featured" : ""}`}
          >
            <div className="metric-copy">
              <span className="metric-kicker">{getMetricKicker(metric.label)}</span>
              <p className="metric-label" title={metric.label}>
                {formatMetricLabel(metric.label, isMobile)}
              </p>
              <p className="metric-value">
                {formatMetricValue(metric.label, metric.value)}
              </p>
            </div>
            <p
              className={`metric-delta ${metric.delta >= 0 ? "is-up" : "is-down"}`}
            >
              {metric.delta >= 0 ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {formatMetricDelta(metric.delta, isMobile)}
            </p>
            <span className={`metric-accent accent-${metric.variant}`} />
          </article>
        ))}
      </section>

      <section className="dashboard-layout" aria-label="Graphiques principaux">
        <article className="chart-card chart-card-wide">
          <div className="chart-title-wrap">
            <h3>Ventes mensuelles et benefice (evolution)</h3>
            <p>Comparaison CA et benefice net par mois</p>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="month"
                  stroke="var(--color-text-muted)"
                  tick={{ fontSize: isMobile ? 11 : 12 }}
                  interval={0}
                />
                <YAxis
                  yAxisId="left"
                  stroke="var(--color-text-muted)"
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  hide={isMobile}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--color-text-muted)"
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  hide={isMobile}
                />
                <Tooltip
                  formatter={(value) =>
                    moneyFormatter.format(Number(value ?? 0))
                  }
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                  }}
                />
                {!isMobile ? <Legend /> : null}
                <Bar
                  yAxisId="left"
                  dataKey="sales"
                  name="Ventes"
                  fill="var(--color-brand)"
                  radius={[6, 6, 0, 0]}
                  barSize={isMobile ? 16 : 24}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="profit"
                  name="Benefice"
                  stroke="var(--color-success)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card chart-card-wide">
          <div className="chart-title-wrap">
            <h3>Evolution dette clients/fournisseurs et stock</h3>
            <p>Suivi des niveaux de risque et de rotation inventaire</p>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={operationsEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="month"
                  stroke="var(--color-text-muted)"
                  tick={{ fontSize: isMobile ? 11 : 12 }}
                  interval={0}
                />
                <YAxis stroke="var(--color-text-muted)" hide={isMobile} />
                <Tooltip
                  formatter={(value, name) => {
                    const numericValue = Number(value ?? 0)
                    if (name === "stock" || name === "newClients") {
                      return numberFormatter.format(numericValue)
                    }
                    return moneyFormatter.format(numericValue)
                  }}
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                  }}
                />
                {!isMobile ? <Legend /> : null}
                <Area
                  type="monotone"
                  dataKey="clientDebt"
                  name="Dettes clients"
                  stroke="var(--color-warning)"
                  fill="var(--color-warning-soft)"
                  fillOpacity={0.55}
                />
                <Area
                  type="monotone"
                  dataKey="supplierDebt"
                  name="Dettes fournisseurs"
                  stroke="var(--color-danger)"
                  fill="var(--color-danger-soft)"
                  fillOpacity={0.45}
                />
                <Line
                  type="monotone"
                  dataKey="stock"
                  name="Stock"
                  stroke="var(--color-brand)"
                  strokeWidth={isMobile ? 2 : 2.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card">
          <div className="chart-title-wrap">
            <h3>Statistiques stock</h3>
            <p>Repartition produits disponible / alerte / rupture</p>
          </div>
          <div className="chart-box small client-evolution-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={isMobile ? 40 : 56}
                  outerRadius={isMobile ? 68 : 86}
                  paddingAngle={3}
                >
                  {stockDistribution.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={getStockSegmentColor(entry.name)}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value ?? 0)}%`} />
                {!isMobile ? <Legend /> : null}
              </PieChart>
            </ResponsiveContainer>
          </div>
          {isMobile ? (
            <ul className="chart-mobile-legend" aria-label="Legende statistiques stock">
              {stockDistribution.map((entry) => (
                <li key={entry.name}>
                  <span
                    className="chart-mobile-legend-dot"
                    style={{ backgroundColor: getStockSegmentColor(entry.name) }}
                    aria-hidden="true"
                  />
                  <span>{entry.name}</span>
                  <strong>{entry.value}%</strong>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className="chart-card">
          <div className="chart-title-wrap">
            <h3>Evolution nouveaux clients</h3>
            <p>Acquisition clients et developpement fournisseurs</p>
          </div>
          <div className="chart-box small">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={operationsEvolution}
                margin={{
                  top: 8,
                  right: isMobile ? 8 : 16,
                  left: isMobile ? 2 : 8,
                  bottom: isMobile ? 36 : 8,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="month"
                  stroke="var(--color-text-muted)"
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  tickFormatter={(value) => formatMonthTick(String(value ?? ""), isMobile)}
                  tickMargin={isMobile ? 12 : 6}
                  height={isMobile ? 52 : 30}
                  interval={isMobile ? "preserveStartEnd" : 0}
                  minTickGap={isMobile ? 16 : 8}
                />
                <YAxis stroke="var(--color-text-muted)" hide={isMobile} />
                <Tooltip />
                {!isMobile ? <Legend /> : null}
                <Bar
                  dataKey="newClients"
                  name="Nouveaux clients"
                  fill="var(--color-brand)"
                  radius={[6, 6, 0, 0]}
                  barSize={isMobile ? 16 : 24}
                />
                <Line
                  type="monotone"
                  dataKey="suppliers"
                  name="Fournisseurs actifs"
                  stroke="var(--color-success)"
                  strokeWidth={isMobile ? 2 : 2.5}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  )
}
