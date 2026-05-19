import axios from "axios"
import { useAuthStore } from "../store/authStore"

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL?.trim() ||
    "https://api.stockpilots.net/api/v1")
    .replace(/\/+$/, "")

type StockEntryResponse = {
  data?: {
    id?: string
  }
}

type StockExitResponse = {
  data?: {
    id?: string
  }
}

type BackendStockHistoryType = "ENTRY" | "EXIT" | "ADJUSTMENT" | "SALE" | "ORDER_RECEIVE"

type BackendStockHistoryItem = {
  id?: string
  productId?: string
  type?: BackendStockHistoryType
  quantity?: number
  unitCost?: number | string | null
  referenceType?: string | null
  referenceId?: string | null
  note?: string | null
  createdBy?: string | null
  createdAt?: string
  product?: {
    id?: string
    sku?: string
    name?: string
    category?: {
      id?: string
      name?: string
    }
  }
}

type StockHistoryResponse = {
  data?: BackendStockHistoryItem[]
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

export type StockHistoryType = "in" | "out" | "adjustment"
export type StockHistoryApiType = BackendStockHistoryType

export type StockHistoryItem = {
  id: string
  productId: string
  productName: string
  productSku?: string
  categoryName?: string
  type: StockHistoryType
  quantity: number
  unitCost?: number
  referenceType?: string
  referenceId?: string
  note?: string
  createdAt: string
}

export type StockHistoryListResult = {
  data: StockHistoryItem[]
  meta: {
    page: number
    limit: number
    total: number
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

export async function createStockEntry(payload: {
  supplierId: string
  productId: string
  quantity: number
  unitCost: number
  reference?: string
  note?: string
}): Promise<string | undefined> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.post<StockEntryResponse>(
        `${apiBaseUrl}/stock/entries`,
        {
          supplierId: payload.supplierId.trim(),
          productId: payload.productId.trim(),
          quantity: payload.quantity,
          unitCost: payload.unitCost,
          reference: payload.reference?.trim() || undefined,
          note: payload.note?.trim() || undefined,
        },
        {
          headers: getAuthHeader(token),
        },
      )
    }, false)

    return response.data?.data?.id
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Entrée stock impossible."), {
      cause: error,
    })
  }
}

export async function createStockExit(payload: {
  productId: string
  quantity: number
  reference?: string
  note?: string
}): Promise<string | undefined> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.post<StockExitResponse>(
        `${apiBaseUrl}/stock/exits`,
        {
          productId: payload.productId.trim(),
          quantity: payload.quantity,
          reference: payload.reference?.trim() || undefined,
          note: payload.note?.trim() || undefined,
        },
        {
          headers: getAuthHeader(token),
        },
      )
    }, false)

    return response.data?.data?.id
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Sortie stock impossible."), {
      cause: error,
    })
  }
}

function mapHistoryType(type?: BackendStockHistoryType): StockHistoryType {
  if (type === "EXIT") {
    return "out"
  }

  if (type === "SALE") {
    return "out"
  }

  if (type === "ADJUSTMENT") {
    return "adjustment"
  }

  return "in"
}

function mapHistoryItem(item: BackendStockHistoryItem): StockHistoryItem {
  return {
    id: item.id?.trim() || `hst-${Math.random().toString(36).slice(2, 10)}`,
    productId: item.productId?.trim() || item.product?.id?.trim() || "",
    productName: item.product?.name?.trim() || "Produit",
    productSku: item.product?.sku?.trim() || undefined,
    categoryName: item.product?.category?.name?.trim() || undefined,
    type: mapHistoryType(item.type),
    quantity: Number(item.quantity ?? 0) || 0,
    unitCost:
      item.unitCost === null || item.unitCost === undefined
        ? undefined
        : Number(item.unitCost),
    referenceType: item.referenceType?.trim() || undefined,
    referenceId: item.referenceId?.trim() || undefined,
    note: item.note?.trim() || undefined,
    createdAt: item.createdAt || new Date().toISOString(),
  }
}

export async function listStockHistory(params?: {
  page?: number
  limit?: number
  type?: StockHistoryApiType
  search?: string
}): Promise<StockHistoryListResult> {
  const page = Math.max(1, params?.page ?? 1)
  const limit = Math.max(1, params?.limit ?? 20)

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<StockHistoryResponse>(`${apiBaseUrl}/stock/history`, {
        params: {
          page,
          limit,
          type: params?.type,
          search: params?.search?.trim() || undefined,
        },
        headers: getAuthHeader(token),
      })
    }, false)

    const items = (response.data?.data ?? []).map(mapHistoryItem)

    return {
      data: items,
      meta: {
        page: response.data?.meta?.page ?? page,
        limit: response.data?.meta?.limit ?? limit,
        total: response.data?.meta?.total ?? items.length,
      },
    }
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Chargement de l'historique stock impossible."), {
      cause: error,
    })
  }
}

type BackendStockStatus = "ACTIVE" | "INACTIVE"

type BackendStockStatusItem = {
  id?: string
  sku?: string
  name?: string
  stockQuantity?: number | string
  stockMinThreshold?: number | string
  status?: BackendStockStatus
  updatedAt?: string
  categoryName?: string | null
}

type StockStatusResponse = {
  data?: BackendStockStatusItem[]
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

export type StockStatusItem = {
  id: string
  sku: string
  name: string
  stockQuantity: number
  stockMinThreshold: number
  status: "active" | "inactive"
  updatedAt: string
  categoryName?: string
}

export type StockStatusListResult = {
  data: StockStatusItem[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

function mapStockStatusItem(item: BackendStockStatusItem): StockStatusItem {
  return {
    id: item.id?.trim() || `stk-${Math.random().toString(36).slice(2, 10)}`,
    sku: item.sku?.trim() || "N/A",
    name: item.name?.trim() || "Produit",
    stockQuantity: Number(item.stockQuantity ?? 0) || 0,
    stockMinThreshold: Number(item.stockMinThreshold ?? 0) || 0,
    status: item.status === "INACTIVE" ? "inactive" : "active",
    updatedAt: item.updatedAt || new Date().toISOString(),
    categoryName: item.categoryName?.trim() || undefined,
  }
}

export async function listStockStatus(params?: {
  page?: number
  limit?: number
}): Promise<StockStatusListResult> {
  const page = Math.max(1, params?.page ?? 1)
  const limit = Math.max(1, params?.limit ?? 20)

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<StockStatusResponse>(`${apiBaseUrl}/stock/status`, {
        params: {
          page,
          limit,
        },
        headers: getAuthHeader(token),
      })
    }, false)

    const items = (response.data?.data ?? []).map(mapStockStatusItem)

    return {
      data: items,
      meta: {
        page: response.data?.meta?.page ?? page,
        limit: response.data?.meta?.limit ?? limit,
        total: response.data?.meta?.total ?? items.length,
      },
    }
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Chargement de l'état du stock impossible."), {
      cause: error,
    })
  }
}