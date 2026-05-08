import { ArrowDownRight, ArrowUpRight } from "lucide-react"
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

export function DashboardPage() {
  return (
    <div className="page dashboard-page">
      <section className="metrics-grid" aria-label="Widgets metiers">
        {dashboardMetrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <p className="metric-label">{metric.label}</p>
            <p className="metric-value">
              {formatMetricValue(metric.label, metric.value)}
            </p>
            <p
              className={`metric-delta ${metric.delta >= 0 ? "is-up" : "is-down"}`}
            >
              {metric.delta >= 0 ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {metric.delta > 0 ? "+" : ""}
              {metric.delta.toFixed(1)}% vs mois precedent
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
                <XAxis dataKey="month" stroke="var(--color-text-muted)" />
                <YAxis
                  yAxisId="left"
                  stroke="var(--color-text-muted)"
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--color-text-muted)"
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
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
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="sales"
                  name="Ventes"
                  fill="var(--color-brand)"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
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
                <XAxis dataKey="month" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" />
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
                <Legend />
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
                  strokeWidth={2.5}
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
          <div className="chart-box small">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={86}
                  paddingAngle={3}
                >
                  {stockDistribution.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name === "Disponible"
                          ? "#3b82f6"
                          : entry.name === "Bas stock"
                            ? "#f59e0b"
                            : "#ef4444"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value ?? 0)}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card">
          <div className="chart-title-wrap">
            <h3>Evolution nouveaux clients</h3>
            <p>Acquisition clients et developpement fournisseurs</p>
          </div>
          <div className="chart-box small">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={operationsEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="newClients"
                  name="Nouveaux clients"
                  fill="var(--color-brand)"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="suppliers"
                  name="Fournisseurs actifs"
                  stroke="var(--color-success)"
                  strokeWidth={2.5}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  )
}
