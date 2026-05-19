import { ArrowDownRight, ArrowUpRight, FileDown, LoaderCircle } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
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
import { type Supplier } from "../features/suppliers/supplierTypes"
import { getSupplierReport, listSuppliers, type SupplierReportData } from "../services/supplierService"

const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat("fr-FR")
const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
})
const pdfDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
})

function formatDateRangeInput(value: Date): string {
  const year = value.getUTCFullYear()
  const month = String(value.getUTCMonth() + 1).padStart(2, "0")
  const day = String(value.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toStartOfDayIso(dateInput: string): string {
  return new Date(`${dateInput}T00:00:00.000Z`).toISOString()
}

function toEndOfDayIso(dateInput: string): string {
  return new Date(`${dateInput}T23:59:59.999Z`).toISOString()
}

function formatDateLabel(value?: string): string {
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }

  return dateFormatter.format(parsed)
}

function formatPdfDateLabel(value?: string): string {
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }

  return pdfDateFormatter.format(parsed)
}

function formatPdfMoney(value: number): string {
  const absoluteValue = Math.abs(Math.round(value))
  const formatted = String(absoluteValue).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${formatted} F CFA`
}

function formatSignedPdfMoney(value: number): string {
  const sign = value >= 0 ? "+" : "-"
  return `${sign} ${formatPdfMoney(value)}`
}

function shortenReference(value?: string): string {
  if (!value) {
    return "-"
  }

  return value.length > 13 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value
}

function normalizeOrderCell(order: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = order[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return "-"
}

function buildSupplierReportPdf(report: SupplierReportData) {
  type AutoTableDoc = jsPDF & { lastAutoTable?: { finalY?: number } }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  const mutedText: [number, number, number] = [100, 116, 139]
  const titleText: [number, number, number] = [15, 23, 42]
  const borderColor: [number, number, number] = [226, 232, 240]
  const softSlate: [number, number, number] = [248, 250, 252]
  const safeName = report.supplier.name.replace(/[^a-zA-Z0-9-_]+/g, "_").toLowerCase()
  const periodLabel = `${formatPdfDateLabel(report.period.from)} - ${formatPdfDateLabel(report.period.to)}`

  function lastY(fallback: number): number {
    return (doc as AutoTableDoc).lastAutoTable?.finalY ?? fallback
  }

  function ensureSpace(currentY: number, needed = 40): number {
    if (currentY + needed <= pageHeight - 20) {
      return currentY
    }

    doc.addPage()
    return 22
  }

  function drawSectionTitle(title: string, y: number): number {
    const safeY = ensureSpace(y, 22)
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.2)
    doc.line(margin, safeY - 2, pageWidth - margin, safeY - 2)
    doc.setTextColor(...titleText)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(title, margin, safeY + 5)
    return safeY + 10
  }

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageWidth, 24, "F")
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, 3, 24, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Rapport fournisseur", margin, 10)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.4)
  doc.text(`StockPilot | ${periodLabel}`, margin, 16.5)
  doc.text(`Édité le ${formatDateLabel(new Date().toISOString())}`, pageWidth - margin, 10, {
    align: "right",
  })

  let cursorY = 30
  doc.setTextColor(...mutedText)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.8)
  doc.text("Fournisseur", margin, cursorY)
  doc.setTextColor(...titleText)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text(report.supplier.name, margin, cursorY + 5.5)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.6)
  doc.setTextColor(...mutedText)
  doc.text(
    [
      report.supplier.code ?? "Code non défini",
      report.supplier.phone,
      report.supplier.email || "Email non renseigné",
      report.supplier.address || "Adresse non renseignée",
    ].join("  |  "),
    margin,
    cursorY + 10.5,
    { maxWidth: contentWidth - 58 },
  )

  doc.setFillColor(...softSlate)
  doc.setDrawColor(...borderColor)
  doc.roundedRect(pageWidth - margin - 56, cursorY - 1, 56, 16, 2.5, 2.5, "FD")
  doc.setTextColor(...mutedText)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.text("Solde actuel", pageWidth - margin - 51, cursorY + 4)
  doc.setTextColor(...titleText)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.5)
  doc.text(formatSignedPdfMoney(report.summary.currentBalance), pageWidth - margin - 51, cursorY + 10.5)

  cursorY += 20
  cursorY = drawSectionTitle("Synthèse financière", cursorY)

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.8,
      lineColor: borderColor,
      lineWidth: 0.15,
      textColor: titleText,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    alternateRowStyles: { fillColor: softSlate },
    body: [
      ["Réceptions", formatPdfMoney(report.summary.totalReceived)],
      ["Versements", formatPdfMoney(report.summary.totalPaid)],
      ["Variation période", formatSignedPdfMoney(report.summary.periodBalanceDelta)],
      ["Solde de clôture", formatSignedPdfMoney(report.summary.closingBalance)],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 68 },
      1: { halign: "right" },
    },
  })

  cursorY = lastY(cursorY) + 10
  cursorY = drawSectionTitle("Produits réceptionnés", cursorY)
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: {
      fontSize: 8.4,
      cellPadding: 2.6,
      lineColor: borderColor,
      lineWidth: 0.15,
      textColor: titleText,
    },
    headStyles: {
      fillColor: softSlate,
      textColor: titleText,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [250, 252, 255] },
    head: [["SKU", "Produit", "Quantité", "Coût total"]],
    body:
      report.receivedProducts.length > 0
        ? report.receivedProducts.map((entry) => [
            entry.sku,
            entry.name,
            numberFormatter.format(entry.quantity),
            formatPdfMoney(entry.totalCost),
          ])
        : [["-", "Aucun produit réceptionné sur la période", "0", formatPdfMoney(0)]],
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
    },
  })

  cursorY = drawSectionTitle("Versements", lastY(cursorY) + 10)
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: {
      fontSize: 8.2,
      cellPadding: 2.6,
      lineColor: borderColor,
      lineWidth: 0.15,
      textColor: titleText,
    },
    headStyles: {
      fillColor: softSlate,
      textColor: titleText,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [250, 252, 255] },
    head: [["Date", "Montant", "Saisi par", "Référence"]],
    body:
      report.payments.length > 0
        ? report.payments.map((entry) => [
            formatDateLabel(entry.paidAt),
            formatPdfMoney(entry.amount),
            entry.recordedBy || "-",
            shortenReference(entry.id),
          ])
        : [["-", formatPdfMoney(0), "-", "Aucun versement sur la période"]],
    columnStyles: {
      1: { halign: "right" },
      3: { halign: "right" },
    },
  })

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(...borderColor)
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...mutedText)
    doc.text("StockPilot", margin, pageHeight - 8)
    doc.text(`Rapport fournisseur - Page ${page}/${pageCount}`, pageWidth - margin, pageHeight - 8, {
      align: "right",
    })
  }

  doc.save(`rapport-fournisseur-${safeName || "supplier"}.pdf`)
}

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
  const today = new Date()
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }

    return window.matchMedia("(max-width: 640px)").matches
  })
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)
  const [supplierOptionsError, setSupplierOptionsError] = useState<string | null>(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [reportFrom, setReportFrom] = useState(formatDateRangeInput(monthStart))
  const [reportTo, setReportTo] = useState(formatDateRangeInput(today))
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportSuccess, setReportSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const media = window.matchMedia("(max-width: 640px)")
    const listener = (event: MediaQueryListEvent) => setIsMobile(event.matches)

    media.addEventListener("change", listener)

    return () => media.removeEventListener("change", listener)
  }, [])

  useEffect(() => {
    let isMounted = true
    void loadSupplierOptions()

    async function loadSupplierOptions() {
      setIsLoadingSuppliers(true)
      setSupplierOptionsError(null)

      try {
        const result = await listSuppliers({ page: 1, limit: 100 })

        if (!isMounted) {
          return
        }

        setSuppliers(result.data)
        setSelectedSupplierId((current) => {
          if (result.data.length === 0) {
            return ""
          }

          const currentExists = result.data.some((supplier) => supplier.id === current)
          if (currentExists) {
            return current
          }

          return result.data[0].id
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setSuppliers([])
        setSupplierOptionsError(
          error instanceof Error
            ? error.message
            : "Chargement des fournisseurs impossible.",
        )
      } finally {
        if (isMounted) {
          setIsLoadingSuppliers(false)
        }
      }
    }

    return () => {
      isMounted = false
    }
  }, [])

  async function handleGenerateSupplierReport() {
    setReportError(null)
    setReportSuccess(null)

    if (!selectedSupplierId) {
      setReportError("Veuillez sélectionner un fournisseur.")
      return
    }

    if (!reportFrom || !reportTo) {
      setReportError("Veuillez renseigner une période complète.")
      return
    }

    if (new Date(reportFrom).getTime() > new Date(reportTo).getTime()) {
      setReportError("La date de début ne peut pas dépasser la date de fin.")
      return
    }

    setIsGeneratingReport(true)

    try {
      const report = await getSupplierReport(selectedSupplierId, {
        from: toStartOfDayIso(reportFrom),
        to: toEndOfDayIso(reportTo),
      })

      buildSupplierReportPdf(report)
      setReportSuccess("Rapport PDF généré avec succès.")
    } catch (error) {
      setReportError(
        error instanceof Error
          ? error.message
          : "Impossible de générer le rapport fournisseur.",
      )
    } finally {
      setIsGeneratingReport(false)
    }
  }

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

      <section className="dashboard-report-card" aria-label="Rapport fournisseur PDF">
        <div className="dashboard-report-label">
          <FileDown size={14} />
          Rapport fournisseur
        </div>

        <div className="dashboard-report-row">
          <div className="report-supplier-group">
            <select
              id="reportSupplierId"
              aria-label="Fournisseur"
              value={selectedSupplierId}
              onChange={(event) => setSelectedSupplierId(event.target.value)}
              disabled={isLoadingSuppliers || suppliers.length === 0}
              className="report-select"
            >
              {suppliers.length === 0 ? (
                <option value="">
                  {isLoadingSuppliers ? "Chargement..." : "Aucun fournisseur"}
                </option>
              ) : null}
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}{supplier.code ? ` · ${supplier.code}` : ""}
                </option>
              ))}
            </select>
          </div>

          <label className="report-date-field" htmlFor="reportFromDate">
            <span>Du</span>
            <input
              id="reportFromDate"
              type="date"
              value={reportFrom}
              onChange={(event) => setReportFrom(event.target.value)}
            />
          </label>

          <label className="report-date-field" htmlFor="reportToDate">
            <span>Au</span>
            <input
              id="reportToDate"
              type="date"
              value={reportTo}
              onChange={(event) => setReportTo(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="btn report-btn"
            onClick={handleGenerateSupplierReport}
            disabled={
              isGeneratingReport ||
              isLoadingSuppliers ||
              !selectedSupplierId ||
              !reportFrom ||
              !reportTo
            }
          >
            {isGeneratingReport ? (
              <LoaderCircle size={14} className="icon-spin" />
            ) : (
              <FileDown size={14} />
            )}
            {isGeneratingReport ? "Génération..." : "PDF"}
          </button>
        </div>

        {(supplierOptionsError ?? reportError ?? reportSuccess) ? (
          <p className={`dashboard-report-message ${
            reportSuccess ? "is-success" : "is-error"
          }`}>
            {supplierOptionsError ?? reportError ?? reportSuccess}
          </p>
        ) : null}
      </section>
    </div>
  )
}
