import axios from "axios"
import { useAuthStore } from "../store/authStore"

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL?.trim() ||
    "https://api.stockpilots.net/api/v1")
    .replace(/\/+$/, "")

type CreateSaleResponse = {
  data?: {
    id?: string
  }
}

type SaleResponse = {
  data?: BackendSale
}

type AddSalePaymentResponse = {
  data?: BackendSale
}

type CancelSaleResponse = {
  data?: BackendSale
}

type SalesReportResponse = {
  data?: BackendSalesReport
}

type BackendSaleStatus = "PAID" | "PARTIAL" | "CONFIRMED" | "CANCELLED"

type BackendSalesReport = {
  period?: {
    from?: string
    to?: string
    groupBy?: string
  }
  summary?: {
    salesCount?: number
    grossRevenue?: number | string
    totalCollected?: number | string
    totalOutstanding?: number | string
    cancelledSalesCount?: number
    costTotal?: number | string
    profitTotal?: number | string
    marginRate?: number | string
    collectionRate?: number | string
    profitMode?: string
  }
  byStatus?: Array<{
    status?: BackendSaleStatus
    count?: number
    total?: number | string
  }>
  evolution?: Array<{
    period?: string
    revenue?: number | string
    collected?: number | string
    outstanding?: number | string
    profit?: number | string
  }>
  topProducts?: Array<{
    productId?: string
    sku?: string
    name?: string
    quantitySold?: number
    revenue?: number | string
    costTotal?: number | string
    profit?: number | string
  }>
  topClients?: Array<{
    clientId?: string
    code?: string
    name?: string
    salesCount?: number
    revenue?: number | string
    paidAmount?: number | string
    profit?: number | string
  }>
  sales?: BackendSale[]
}

type ListSalesResponse = {
  data?: BackendSale[]
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

type BackendSale = {
  id?: string
  code?: string
  clientId?: string
  clientOrderId?: string | null
  status?: BackendSaleStatus
  subtotal?: string | number
  total?: string | number
  paidAmount?: string | number
  remainingAmount?: string | number
  soldAt?: string
  createdAt?: string
  updatedAt?: string
  client?: {
    id?: string
    name?: string
  }
  items?: Array<{
    id?: string
    productId?: string
    quantity?: number
    unitPrice?: string | number
    lineTotal?: string | number
    product?: {
      id?: string
      name?: string
    }
  }>
  payments?: Array<{
    id?: string
    amount?: string | number
    method?: string
    recordedBy?: string | null
    createdAt?: string
  }>
}

export type SalePaymentStatus = "paid" | "partial" | "unpaid" | "cancelled"

export type SaleListItem = {
  id: string
  code: string
  date: string
  clientId: string
  clientName: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  amountPaid: number
  amountRemaining: number
  paymentStatus: SalePaymentStatus
}

export type ListSalesResult = {
  data: SaleListItem[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export type SaleDetail = {
  id: string
  code: string
  clientId: string
  clientOrderId?: string
  clientName: string
  status: SalePaymentStatus
  subtotal: number
  total: number
  paidAmount: number
  remainingAmount: number
  soldAt: string
  createdAt: string
  updatedAt: string
  items: Array<{
    id: string
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }>
  payments: Array<{
    id: string
    amount: number
    method: string
    recordedBy: string
    createdAt: string
  }>
}

export type SalesReportData = {
  period: {
    from: string
    to: string
    groupBy: string
  }
  summary: {
    salesCount: number
    grossRevenue: number
    totalCollected: number
    totalOutstanding: number
    cancelledSalesCount: number
    costTotal: number
    profitTotal: number
    marginRate: number
    collectionRate: number
    profitMode: string
  }
  byStatus: Array<{
    status: SalePaymentStatus
    count: number
    total: number
  }>
  evolution: Array<{
    period: string
    revenue: number
    collected: number
    outstanding: number
    profit: number
  }>
  topProducts: Array<{
    productId: string
    sku: string
    name: string
    quantitySold: number
    revenue: number
    costTotal: number
    profit: number
  }>
  topClients: Array<{
    clientId: string
    code: string
    name: string
    salesCount: number
    revenue: number
    paidAmount: number
    profit: number
  }>
  sales: SaleDetail[]
}

function mapSaleStatus(status?: BackendSaleStatus): SalePaymentStatus {
  if (status === "CANCELLED") {
    return "cancelled"
  }

  if (status === "PAID") {
    return "paid"
  }

  if (status === "PARTIAL") {
    return "partial"
  }

  return "unpaid"
}

function toNumber(value: string | number | undefined): number {
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

function mapBackendSale(item: BackendSale): SaleListItem {
  const firstItem = item.items?.[0]
  const fallbackDate = new Date().toISOString()

  return {
    id: item.id?.trim() || `VNT-${Math.random().toString(36).slice(2, 10)}`,
    code: item.code?.trim() || "-",
    date: item.soldAt || item.createdAt || fallbackDate,
    clientId: item.client?.id?.trim() || "",
    clientName: item.client?.name?.trim() || "Client inconnu",
    productId: firstItem?.product?.id?.trim() || "",
    productName: firstItem?.product?.name?.trim() || "Produit inconnu",
    quantity: Math.max(0, firstItem?.quantity ?? 0),
    unitPrice: toNumber(firstItem?.unitPrice),
    totalAmount: toNumber(item.total),
    amountPaid: toNumber(item.paidAmount),
    amountRemaining: toNumber(item.remainingAmount),
    paymentStatus: mapSaleStatus(item.status),
  }
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

export async function createSale(payload: {
  clientId: string
  clientOrderId?: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
  }>
  paidAmount: number
  note?: string
}): Promise<string | undefined> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.post<CreateSaleResponse>(
        `${apiBaseUrl}/sales`,
        {
          clientId: payload.clientId.trim(),
          clientOrderId: payload.clientOrderId?.trim() || undefined,
          items: payload.items,
          paidAmount: payload.paidAmount,
          note: payload.note?.trim() || undefined,
        },
        {
          headers: getAuthHeader(token),
        },
      )
    }, false)

    return response.data?.data?.id
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Création vente impossible."), {
      cause: error,
    })
  }
}

export async function listSales(params?: {
  page?: number
  limit?: number
  search?: string
  clientId?: string
  from?: string
  to?: string
}): Promise<ListSalesResult> {
  const page = Math.max(1, params?.page ?? 1)
  const limit = Math.max(1, params?.limit ?? 20)
  const search = params?.search?.trim() || undefined
  const clientId = params?.clientId?.trim() || undefined
  const from = params?.from?.trim() || undefined
  const to = params?.to?.trim() || undefined

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<ListSalesResponse>(`${apiBaseUrl}/sales`, {
        params: {
          page,
          limit,
          search,
          clientId,
          from,
          to,
        },
        headers: getAuthHeader(token),
      })
    }, false)

    const items = (response.data?.data ?? []).map(mapBackendSale)

    return {
      data: items,
      meta: {
        page: response.data?.meta?.page ?? page,
        limit: response.data?.meta?.limit ?? limit,
        total: response.data?.meta?.total ?? items.length,
      },
    }
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Chargement des ventes impossible."), {
      cause: error,
    })
  }
}

function mapBackendSaleDetail(item: BackendSale): SaleDetail {
  const fallbackDate = new Date().toISOString()

  return {
    id: item.id?.trim() || "",
    code: item.code?.trim() || "-",
    clientId: item.clientId?.trim() || item.client?.id?.trim() || "",
    clientOrderId: item.clientOrderId?.trim() || undefined,
    clientName: item.client?.name?.trim() || "Client inconnu",
    status: mapSaleStatus(item.status),
    subtotal: toNumber(item.subtotal),
    total: toNumber(item.total),
    paidAmount: toNumber(item.paidAmount),
    remainingAmount: toNumber(item.remainingAmount),
    soldAt: item.soldAt || item.createdAt || fallbackDate,
    createdAt: item.createdAt || item.soldAt || fallbackDate,
    updatedAt: item.updatedAt || item.createdAt || item.soldAt || fallbackDate,
    items: (item.items ?? []).map((saleItem) => ({
      id: saleItem.id?.trim() || "",
      productId: saleItem.productId?.trim() || saleItem.product?.id?.trim() || "",
      productName: saleItem.product?.name?.trim() || "Produit inconnu",
      quantity: Math.max(0, saleItem.quantity ?? 0),
      unitPrice: toNumber(saleItem.unitPrice),
      lineTotal: toNumber(saleItem.lineTotal),
    })),
    payments: (item.payments ?? []).map((payment) => ({
      id: payment.id?.trim() || "",
      amount: toNumber(payment.amount),
      method: payment.method?.trim() || "-",
      recordedBy: payment.recordedBy?.trim() || "-",
      createdAt: payment.createdAt || fallbackDate,
    })),
  }
}

export async function getSaleById(saleId: string): Promise<SaleDetail> {
  const normalizedSaleId = saleId.trim()

  if (!normalizedSaleId) {
    throw new Error("Identifiant de vente invalide.")
  }

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<SaleResponse>(`${apiBaseUrl}/sales/${normalizedSaleId}`, {
        headers: getAuthHeader(token),
      })
    }, false)

    return mapBackendSaleDetail(response.data?.data ?? {})
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Chargement de la vente impossible."), {
      cause: error,
    })
  }
}

export async function addSalePayment(
  saleId: string,
  payload: {
    amount: number
    method: string
    recordedBy?: string
  },
): Promise<SaleDetail> {
  const normalizedSaleId = saleId.trim()

  if (!normalizedSaleId) {
    throw new Error("Identifiant de vente invalide.")
  }

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.post<AddSalePaymentResponse>(
        `${apiBaseUrl}/sales/${normalizedSaleId}/payments`,
        {
          amount: payload.amount,
          method: payload.method.trim(),
          recordedBy: payload.recordedBy?.trim() || undefined,
        },
        {
          headers: getAuthHeader(token),
        },
      )
    }, false)

    return mapBackendSaleDetail(response.data?.data ?? {})
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Ajout du paiement impossible."), {
      cause: error,
    })
  }
}

export async function cancelSale(saleId: string): Promise<SaleDetail> {
  const normalizedSaleId = saleId.trim()

  if (!normalizedSaleId) {
    throw new Error("Identifiant de vente invalide.")
  }

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.post<CancelSaleResponse>(
        `${apiBaseUrl}/sales/${normalizedSaleId}/cancel`,
        {},
        {
          headers: getAuthHeader(token),
        },
      )
    }, false)

    return mapBackendSaleDetail(response.data?.data ?? {})
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Annulation de la vente impossible."), {
      cause: error,
    })
  }
}

function mapBackendSalesReport(report?: BackendSalesReport): SalesReportData {
  const fallbackIso = new Date().toISOString()

  return {
    period: {
      from: report?.period?.from || fallbackIso,
      to: report?.period?.to || fallbackIso,
      groupBy: report?.period?.groupBy || "DAY",
    },
    summary: {
      salesCount: Number(report?.summary?.salesCount ?? 0) || 0,
      grossRevenue: toNumber(report?.summary?.grossRevenue),
      totalCollected: toNumber(report?.summary?.totalCollected),
      totalOutstanding: toNumber(report?.summary?.totalOutstanding),
      cancelledSalesCount: Number(report?.summary?.cancelledSalesCount ?? 0) || 0,
      costTotal: toNumber(report?.summary?.costTotal),
      profitTotal: toNumber(report?.summary?.profitTotal),
      marginRate: toNumber(report?.summary?.marginRate),
      collectionRate: toNumber(report?.summary?.collectionRate),
      profitMode: report?.summary?.profitMode?.trim() || "N/A",
    },
    byStatus: (report?.byStatus ?? []).map((item) => ({
      status: mapSaleStatus(item.status),
      count: Number(item.count ?? 0) || 0,
      total: toNumber(item.total),
    })),
    evolution: (report?.evolution ?? []).map((item) => ({
      period: item.period || "-",
      revenue: toNumber(item.revenue),
      collected: toNumber(item.collected),
      outstanding: toNumber(item.outstanding),
      profit: toNumber(item.profit),
    })),
    topProducts: (report?.topProducts ?? []).map((item) => ({
      productId: item.productId?.trim() || "",
      sku: item.sku?.trim() || "-",
      name: item.name?.trim() || "Produit",
      quantitySold: Number(item.quantitySold ?? 0) || 0,
      revenue: toNumber(item.revenue),
      costTotal: toNumber(item.costTotal),
      profit: toNumber(item.profit),
    })),
    topClients: (report?.topClients ?? []).map((item) => ({
      clientId: item.clientId?.trim() || "",
      code: item.code?.trim() || "-",
      name: item.name?.trim() || "Client",
      salesCount: Number(item.salesCount ?? 0) || 0,
      revenue: toNumber(item.revenue),
      paidAmount: toNumber(item.paidAmount),
      profit: toNumber(item.profit),
    })),
    sales: (report?.sales ?? []).map((item) => mapBackendSaleDetail(item)),
  }
}

export async function getSalesReport(params: {
  from: string
  to: string
}): Promise<SalesReportData> {
  const from = params.from.trim()
  const to = params.to.trim()

  if (!from || !to) {
    throw new Error("Période du rapport invalide.")
  }

  if (new Date(from).getTime() > new Date(to).getTime()) {
    throw new Error("La date de début ne peut pas dépasser la date de fin.")
  }

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<SalesReportResponse>(`${apiBaseUrl}/sales/report`, {
        params: {
          from,
          to,
        },
        headers: getAuthHeader(token),
      })
    }, false)

    return mapBackendSalesReport(response.data?.data)
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Génération du rapport ventes impossible."), {
      cause: error,
    })
  }
}