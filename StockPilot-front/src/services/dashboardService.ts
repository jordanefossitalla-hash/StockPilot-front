import axios from "axios"
import { useAuthStore } from "../store/authStore"

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL?.trim() ||
    "https://api.stockpilots.net/api/v1")
    .replace(/\/+$/, "")

export type DashboardOverviewGroupBy = "DAY" | "WEEK" | "MONTH"

type DashboardOverviewResponse = {
  data?: BackendDashboardOverviewData
}

type BackendOverviewPoint = {
  period?: string
  value?: number | string
}

type BackendDashboardOverviewData = {
  period?: {
    from?: string
    to?: string
    groupBy?: DashboardOverviewGroupBy
  }
  kpis?: {
    totalRevenue?: number | string
    collectedRevenue?: number | string
    outstandingRevenue?: number | string
    grossProfit?: number | string
    marginRate?: number | string
    salesCount?: number
    activeClientsCount?: number
    newClientsCount?: number
    productsOutOfStock?: number
    productsLowStock?: number
    ordersPendingReception?: number
    clientOrdersToDeliver?: number
  }
  charts?: {
    revenueEvolution?: BackendOverviewPoint[]
    profitEvolution?: BackendOverviewPoint[]
    collectionsEvolution?: BackendOverviewPoint[]
    clientsEvolution?: BackendOverviewPoint[]
    salesByStatus?: Array<{
      label?: string
      value?: number | string
    }>
    stockHealthDistribution?: Array<{
      label?: string
      value?: number | string
    }>
  }
  tops?: {
    topClients?: Array<{
      clientId?: string
      code?: string
      name?: string
      salesCount?: number
      revenue?: number | string
      paidAmount?: number | string
      profit?: number | string
    }>
    topDebtors?: Array<{
      clientId?: string
      code?: string
      name?: string
      phone?: string
      currentDebt?: number | string
    }>
  }
}

export type DashboardOverviewData = {
  period: {
    from: string
    to: string
    groupBy: DashboardOverviewGroupBy
  }
  kpis: {
    totalRevenue: number
    collectedRevenue: number
    outstandingRevenue: number
    grossProfit: number
    marginRate: number
    salesCount: number
    activeClientsCount: number
    newClientsCount: number
    productsOutOfStock: number
    productsLowStock: number
    ordersPendingReception: number
    clientOrdersToDeliver: number
  }
  charts: {
    revenueEvolution: Array<{ period: string; value: number }>
    profitEvolution: Array<{ period: string; value: number }>
    collectionsEvolution: Array<{ period: string; value: number }>
    clientsEvolution: Array<{ period: string; value: number }>
    salesByStatus: Array<{ label: string; value: number }>
    stockHealthDistribution: Array<{ label: string; value: number }>
  }
  tops: {
    topClients: Array<{
      clientId: string
      code: string
      name: string
      salesCount: number
      revenue: number
      paidAmount: number
      profit: number
    }>
    topDebtors: Array<{
      clientId: string
      code: string
      name: string
      phone: string
      currentDebt: number
    }>
  }
}

function toNumber(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsedValue = Number(value)
    if (Number.isFinite(parsedValue)) {
      return parsedValue
    }
  }

  return 0
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { message?: string | string[] }
      | undefined
    const apiMessage = responseData?.message

    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage
    }

    if (Array.isArray(apiMessage)) {
      const joinedMessage = apiMessage.filter(Boolean).join(" ").trim()
      if (joinedMessage) {
        return joinedMessage
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

function getAuthHeader(token?: string) {
  if (!token) {
    return undefined
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

async function executeWithRefreshRetry<T>(
  run: (token?: string) => Promise<T>,
  requireToken: boolean,
): Promise<T> {
  const store = useAuthStore.getState()

  if (requireToken && !store.token) {
    throw new Error("Session expirée. Veuillez vous reconnecter.")
  }

  try {
    return await run(store.token ?? undefined)
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !store.refreshToken) {
      throw error
    }

    const refreshedToken = await useAuthStore.getState().refreshSession()
    return run(refreshedToken)
  }
}

function mapOverviewPoints(items?: BackendOverviewPoint[]) {
  return (items ?? []).map((item) => ({
    period: item.period?.trim() || "-",
    value: toNumber(item.value),
  }))
}

function mapDashboardOverview(data?: BackendDashboardOverviewData): DashboardOverviewData {
  const fallbackDate = new Date().toISOString()

  return {
    period: {
      from: data?.period?.from || fallbackDate,
      to: data?.period?.to || fallbackDate,
      groupBy: data?.period?.groupBy || "DAY",
    },
    kpis: {
      totalRevenue: toNumber(data?.kpis?.totalRevenue),
      collectedRevenue: toNumber(data?.kpis?.collectedRevenue),
      outstandingRevenue: toNumber(data?.kpis?.outstandingRevenue),
      grossProfit: toNumber(data?.kpis?.grossProfit),
      marginRate: toNumber(data?.kpis?.marginRate),
      salesCount: Number(data?.kpis?.salesCount ?? 0) || 0,
      activeClientsCount: Number(data?.kpis?.activeClientsCount ?? 0) || 0,
      newClientsCount: Number(data?.kpis?.newClientsCount ?? 0) || 0,
      productsOutOfStock: Number(data?.kpis?.productsOutOfStock ?? 0) || 0,
      productsLowStock: Number(data?.kpis?.productsLowStock ?? 0) || 0,
      ordersPendingReception: Number(data?.kpis?.ordersPendingReception ?? 0) || 0,
      clientOrdersToDeliver: Number(data?.kpis?.clientOrdersToDeliver ?? 0) || 0,
    },
    charts: {
      revenueEvolution: mapOverviewPoints(data?.charts?.revenueEvolution),
      profitEvolution: mapOverviewPoints(data?.charts?.profitEvolution),
      collectionsEvolution: mapOverviewPoints(data?.charts?.collectionsEvolution),
      clientsEvolution: mapOverviewPoints(data?.charts?.clientsEvolution),
      salesByStatus: (data?.charts?.salesByStatus ?? []).map((item) => ({
        label: item.label?.trim() || "UNKNOWN",
        value: toNumber(item.value),
      })),
      stockHealthDistribution: (data?.charts?.stockHealthDistribution ?? []).map((item) => ({
        label: item.label?.trim() || "UNKNOWN",
        value: toNumber(item.value),
      })),
    },
    tops: {
      topClients: (data?.tops?.topClients ?? []).map((item) => ({
        clientId: item.clientId?.trim() || "",
        code: item.code?.trim() || "-",
        name: item.name?.trim() || "Client",
        salesCount: Number(item.salesCount ?? 0) || 0,
        revenue: toNumber(item.revenue),
        paidAmount: toNumber(item.paidAmount),
        profit: toNumber(item.profit),
      })),
      topDebtors: (data?.tops?.topDebtors ?? []).map((item) => ({
        clientId: item.clientId?.trim() || "",
        code: item.code?.trim() || "-",
        name: item.name?.trim() || "Client",
        phone: item.phone?.trim() || "-",
        currentDebt: toNumber(item.currentDebt),
      })),
    },
  }
}

export async function getDashboardOverview(params: {
  from: string
  to: string
  groupBy?: DashboardOverviewGroupBy
}): Promise<DashboardOverviewData> {
  const from = params.from.trim()
  const to = params.to.trim()
  const groupBy = params.groupBy ?? "DAY"

  if (!from || !to) {
    throw new Error("Période du tableau de bord invalide.")
  }

  if (new Date(from).getTime() > new Date(to).getTime()) {
    throw new Error("La date de début ne peut pas dépasser la date de fin.")
  }

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<DashboardOverviewResponse>(`${apiBaseUrl}/dashboard/overview`, {
        params: {
          from,
          to,
          groupBy,
        },
        headers: getAuthHeader(token),
      })
    }, false)

    return mapDashboardOverview(response.data?.data)
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Chargement du tableau de bord impossible."), {
      cause: error,
    })
  }
}
