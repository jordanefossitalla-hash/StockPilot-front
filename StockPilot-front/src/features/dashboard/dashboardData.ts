export type DashboardMetric = {
  label: string
  value: number
  delta: number
  variant: "brand" | "success" | "warning" | "danger"
}

export type MonthlyPerformancePoint = {
  month: string
  sales: number
  profit: number
}

export type OpsPoint = {
  month: string
  stock: number
  clientDebt: number
  supplierDebt: number
  newClients: number
  suppliers: number
}

export type ProductPerformance = {
  name: string
  units: number
  revenue: number
  margin: number
}

export const weeklySales = [1820, 2460, 2140, 2760, 2980, 3340, 3120]

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Benefices(semaine en cours)",
    value: Math.round(weeklySales.reduce((sum, day) => sum + day, 0) * 0.34),
    delta: 7.3,
    variant: "success",
  },
  {
    label: "Total ventes (semaine en cours)",
    value: weeklySales.reduce((sum, day) => sum + day, 0),
    delta: 9.7,
    variant: "success",
  },
  { label: "Revenus du jour", value: 3120, delta: 6.2, variant: "success" },
  { label: "Clients (nombre)", value: 3867, delta: 3.1, variant: "brand" },
  { label: "Fournisseurs (nombre)", value: 134, delta: 1.4, variant: "warning" },
  { label: "Dettes clients", value: 26850, delta: -2.4, variant: "warning" },
  {
    label: "Dettes fournisseurs",
    value: 18970,
    delta: -1.8,
    variant: "warning",
  },
  { label: "Benefice mensuel", value: 22840, delta: 11.9, variant: "success" },
]

export const monthlyPerformance: MonthlyPerformancePoint[] = [
  { month: "Jan", sales: 38600, profit: 9200 },
  { month: "Fev", sales: 41200, profit: 10150 },
  { month: "Mar", sales: 43850, profit: 10980 },
  { month: "Avr", sales: 45700, profit: 11620 },
  { month: "Mai", sales: 47420, profit: 12250 },
  { month: "Juin", sales: 49150, profit: 12810 },
  { month: "Juil", sales: 51800, profit: 13640 },
  { month: "Aou", sales: 52640, profit: 13920 },
  { month: "Sep", sales: 55210, profit: 14780 },
  { month: "Oct", sales: 57460, profit: 15410 },
  { month: "Nov", sales: 59890, profit: 16220 },
  { month: "Dec", sales: 63140, profit: 17480 },
]

export const operationsEvolution: OpsPoint[] = [
  {
    month: "Jan",
    stock: 930,
    clientDebt: 33200,
    supplierDebt: 24500,
    newClients: 62,
    suppliers: 112,
  },
  {
    month: "Fev",
    stock: 905,
    clientDebt: 31800,
    supplierDebt: 23140,
    newClients: 68,
    suppliers: 114,
  },
  {
    month: "Mar",
    stock: 980,
    clientDebt: 30420,
    supplierDebt: 22060,
    newClients: 74,
    suppliers: 118,
  },
  {
    month: "Avr",
    stock: 1025,
    clientDebt: 29100,
    supplierDebt: 20930,
    newClients: 81,
    suppliers: 121,
  },
  {
    month: "Mai",
    stock: 1080,
    clientDebt: 27980,
    supplierDebt: 20120,
    newClients: 86,
    suppliers: 124,
  },
  {
    month: "Juin",
    stock: 1124,
    clientDebt: 26850,
    supplierDebt: 18970,
    newClients: 93,
    suppliers: 134,
  },
]

export const stockDistribution = [
  { name: "Disponible", value: 68 },
  { name: "Bas stock", value: 21 },
  { name: "Rupture", value: 11 },
]

export const topProducts: ProductPerformance[] = [
  { name: "Pack CRM Plus", units: 412, revenue: 28640, margin: 41.2 },
  { name: "Licence Stock Pro", units: 355, revenue: 24850, margin: 38.7 },
  { name: "Module Facturation", units: 296, revenue: 21120, margin: 36.1 },
  { name: "Bundle Retail", units: 241, revenue: 19780, margin: 34.6 },
  { name: "Support Premium", units: 194, revenue: 16540, margin: 44.9 },
]
