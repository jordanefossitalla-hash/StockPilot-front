import axios from "axios"
import type { Supplier, SupplierStatus } from "../features/suppliers/supplierTypes"
import { useAuthStore } from "../store/authStore"

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL?.trim() ||
    "https://api.stockpilots.net/api/v1")
    .replace(/\/+$/, "")

type BackendSupplierStatus = "ACTIVE" | "INACTIVE"

type BackendSupplier = {
  id?: string
  code?: string
  name?: string
  phone?: string
  email?: string
  address?: string
  status?: BackendSupplierStatus
  balance?: string | number
  createdAt?: string
  updatedAt?: string
}

type CreateSupplierPayload = {
  code: string
  name: string
  phone: string
  email?: string
  address?: string
  balance: string
  status: BackendSupplierStatus
}

type UpdateSupplierPayload = {
  name: string
  phone: string
  email?: string
  address?: string
  balance: string
  status: BackendSupplierStatus
}

type CreateSupplierResponse = {
  data?: BackendSupplier
}

type ListSuppliersResponse = {
  data?: BackendSupplier[]
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

type GetSupplierResponse = {
  data?: BackendSupplier
}

type DeleteSupplierResponse = {
  data?: {
    id?: string
  }
}

type CreateSupplierPaymentResponse = {
  data?: {
    id?: string
    supplierId?: string
    orderId?: string | null
    amount?: string | number
    paidAt?: string
    recordedBy?: string | null
  }
}

type ListSupplierPaymentsResponse = {
  data?: Array<{
    id?: string
    supplierId?: string
    orderId?: string | null
    amount?: string | number
    paidAt?: string
    recordedBy?: string | null
  }>
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

type SupplierReportResponse = {
  data?: {
    supplier?: BackendSupplier
    period?: {
      from?: string
      to?: string
    }
    summary?: {
      totalOrdered?: number
      totalReceived?: number
      totalPaid?: number
      periodBalanceDelta?: number
      openingBalance?: number
      closingBalance?: number
      currentBalance?: number
    }
    receivedProducts?: Array<{
      productId?: string
      sku?: string
      name?: string
      quantity?: number
      totalCost?: number
    }>
    payments?: Array<{
      id?: string
      amount?: string | number
      paidAt?: string
      recordedBy?: string | null
    }>
    orders?: Array<Record<string, unknown>>
    concernedOrders?: Array<Record<string, unknown>>
  }
}

type ListSuppliersParams = {
  status?: SupplierStatus
  search?: string
  page?: number
  limit?: number
}

type ListSuppliersResult = {
  data: Supplier[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

type CachedSupplierListEntry = {
  result: ListSuppliersResult
  cachedAt: string
}

type CachedSupplierPaymentsEntry = {
  result: ListSupplierPaymentsResult
  cachedAt: string
}

const SUPPLIER_LIST_CACHE_KEY = "suppliers.list-cache"
const SUPPLIER_PAYMENTS_CACHE_KEY = "suppliers.payments-cache"

export type SupplierPayment = {
  id: string
  supplierId: string
  orderId?: string
  amount: number
  paidAt: string
  recordedBy?: string
}

export type ListSupplierPaymentsResult = {
  data: SupplierPayment[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export type SupplierReportData = {
  supplier: Supplier
  period: {
    from: string
    to: string
  }
  summary: {
    totalOrdered: number
    totalReceived: number
    totalPaid: number
    periodBalanceDelta: number
    openingBalance: number
    closingBalance: number
    currentBalance: number
  }
  receivedProducts: Array<{
    productId: string
    sku: string
    name: string
    quantity: number
    totalCost: number
  }>
  payments: Array<{
    id: string
    amount: number
    paidAt: string
    recordedBy?: string
  }>
  orders: Array<Record<string, unknown>>
  concernedOrders: Array<Record<string, unknown>>
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const apiMessage = (error.response?.data as { message?: string } | undefined)?.message
    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

function isBrowser() {
  return typeof window !== "undefined"
}

function isOnline() {
  if (!isBrowser()) {
    return true
  }

  return window.navigator.onLine
}

function readJsonStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback
  }

  const rawValue = window.localStorage.getItem(key)
  if (!rawValue) {
    return fallback
  }

  try {
    return JSON.parse(rawValue) as T
  } catch {
    return fallback
  }
}

function writeJsonStorage(key: string, value: unknown) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function isRetriableOfflineError(error: unknown) {
  if (!isBrowser()) {
    return false
  }

  if (!isOnline()) {
    return true
  }

  if (axios.isAxiosError(error)) {
    return !error.response || error.code === "ERR_NETWORK" || error.code === "ECONNABORTED"
  }

  return false
}

function buildSupplierQueryKey(params: ListSuppliersParams = {}) {
  return JSON.stringify({
    status: params.status ?? null,
    search: params.search?.trim() || null,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  })
}

function readCachedSupplierLists() {
  return readJsonStorage<Record<string, CachedSupplierListEntry>>(SUPPLIER_LIST_CACHE_KEY, {})
}

function saveCachedSupplierListResult(params: ListSuppliersParams, result: ListSuppliersResult) {
  const cache = readCachedSupplierLists()
  cache[buildSupplierQueryKey(params)] = {
    result,
    cachedAt: new Date().toISOString(),
  }
  writeJsonStorage(SUPPLIER_LIST_CACHE_KEY, cache)
}

function getCachedSupplierListResult(params: ListSuppliersParams = {}) {
  return readCachedSupplierLists()[buildSupplierQueryKey(params)]?.result ?? null
}

function findSupplierInCachedLists(supplierId: string): Supplier | null {
  for (const entry of Object.values(readCachedSupplierLists())) {
    const supplier = entry.result.data.find((item) => item.id === supplierId)
    if (supplier) {
      return supplier
    }
  }

  return null
}

function buildSupplierPaymentsQueryKey(
  supplierId: string,
  params?: {
    from?: string
    to?: string
    page?: number
    limit?: number
  },
) {
  return JSON.stringify({
    supplierId,
    from: params?.from?.trim() || null,
    to: params?.to?.trim() || null,
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  })
}

function readCachedSupplierPayments() {
  return readJsonStorage<Record<string, CachedSupplierPaymentsEntry>>(SUPPLIER_PAYMENTS_CACHE_KEY, {})
}

function saveCachedSupplierPaymentsResult(
  supplierId: string,
  params: {
    from?: string
    to?: string
    page?: number
    limit?: number
  } | undefined,
  result: ListSupplierPaymentsResult,
) {
  const cache = readCachedSupplierPayments()
  cache[buildSupplierPaymentsQueryKey(supplierId, params)] = {
    result,
    cachedAt: new Date().toISOString(),
  }
  writeJsonStorage(SUPPLIER_PAYMENTS_CACHE_KEY, cache)
}

function getCachedSupplierPaymentsResult(
  supplierId: string,
  params?: {
    from?: string
    to?: string
    page?: number
    limit?: number
  },
) {
  return readCachedSupplierPayments()[buildSupplierPaymentsQueryKey(supplierId, params)]?.result ?? null
}

function prependSupplierPaymentToCachedLists(payment: SupplierPayment) {
  const cache = readCachedSupplierPayments()

  for (const [key, entry] of Object.entries(cache)) {
    const query = JSON.parse(key) as {
      supplierId?: string
      from?: string | null
      to?: string | null
      page?: number
      limit?: number
    }

    if (query.supplierId !== payment.supplierId) {
      continue
    }

    const paidAtTime = Date.parse(payment.paidAt)
    const fromTime = query.from ? Date.parse(query.from) : null
    const toTime = query.to ? Date.parse(query.to) : null
    const withinFrom = fromTime === null || paidAtTime >= fromTime
    const withinTo = toTime === null || paidAtTime <= toTime

    if (!withinFrom || !withinTo) {
      continue
    }

    const limit = Math.max(1, query.limit ?? entry.result.meta.limit ?? 20)
    const nextData = [payment, ...entry.result.data.filter((item) => item.id !== payment.id)]

    cache[key] = {
      result: {
        data: nextData.slice(0, limit),
        meta: {
          ...entry.result.meta,
          total: entry.result.meta.total + 1,
        },
      },
      cachedAt: new Date().toISOString(),
    }
  }

  writeJsonStorage(SUPPLIER_PAYMENTS_CACHE_KEY, cache)
}

function mapStatusToBackend(status: SupplierStatus): BackendSupplierStatus {
  return status === "inactive" ? "INACTIVE" : "ACTIVE"
}

function mapStatusToSupplier(status?: BackendSupplierStatus): SupplierStatus {
  return status === "INACTIVE" ? "inactive" : "active"
}

function mapBackendSupplier(item: BackendSupplier): Supplier {
  if (!item.id || !item.name || !item.phone) {
    throw new Error("Réponse fournisseur invalide du serveur.")
  }

  return {
    id: item.id,
    code: item.code,
    name: item.name,
    phone: item.phone,
    email: item.email,
    address: item.address,
    status: mapStatusToSupplier(item.status),
    createdAt: item.createdAt ?? new Date().toISOString(),
    debtTotal: Number(item.balance ?? 0) || 0,
    paymentsTotal: 0,
    suppliedProducts: [],
    history: [],
  }
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

function extractSupplierCodeNumber(code?: string): number {
  if (!code) {
    return 0
  }

  const match = /^SUP-(\d+)$/i.exec(code.trim())
  if (!match) {
    return 0
  }

  return Number(match[1]) || 0
}

function formatSupplierCode(value: number): string {
  return `SUP-${String(value).padStart(4, "0")}`
}

export async function getNextSupplierCode(): Promise<string> {
  try {
    const result = await listSuppliers({ page: 1, limit: 200 })

    const maxCodeNumber = result.data.reduce((max, supplier) => {
      return Math.max(max, extractSupplierCodeNumber(supplier.code))
    }, 0)

    return formatSupplierCode(Math.max(maxCodeNumber + 1, 1))
  } catch {
    return formatSupplierCode(1)
  }
}

export async function listSuppliers(
  params: ListSuppliersParams = {},
): Promise<ListSuppliersResult> {
  const page = Math.max(1, params.page ?? 1)
  const limit = Math.max(1, params.limit ?? 20)

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      const result = await axios.get<ListSuppliersResponse>(`${apiBaseUrl}/suppliers`, {
        params: {
          page,
          limit,
          search: params.search?.trim() || undefined,
          status: params.status ? mapStatusToBackend(params.status) : undefined,
        },
        headers: getAuthHeader(token),
      })

      return result.data
    }, false)

    const items = (response.data ?? []).map(mapBackendSupplier)
    const meta = {
      page: response.meta?.page ?? page,
      limit: response.meta?.limit ?? limit,
      total: response.meta?.total ?? items.length,
    }

    const result = {
      data: items,
      meta,
    }
    saveCachedSupplierListResult(params, result)
    return result
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      const cached = getCachedSupplierListResult(params)
      if (cached) {
        return cached
      }
    }

    throw new Error(resolveErrorMessage(error, "Chargement fournisseurs impossible."), {
      cause: error,
    })
  }
}

export async function getSupplierByIdApi(supplierId: string): Promise<Supplier> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<GetSupplierResponse>(`${apiBaseUrl}/suppliers/${supplierId}`, {
        headers: getAuthHeader(token),
      })
    }, false)

    const supplier = response.data?.data
    return mapBackendSupplier(supplier ?? {})
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      const cached = findSupplierInCachedLists(supplierId)
      if (cached) {
        return cached
      }
    }

    throw new Error(resolveErrorMessage(error, "Fournisseur introuvable."), {
      cause: error,
    })
  }
}

export async function createSupplier(payload: {
  code: string
  name: string
  phone: string
  email?: string
  address?: string
  status: SupplierStatus
  initialBalance: number
}): Promise<Supplier> {
  const requestBody: CreateSupplierPayload = {
    code: payload.code.trim(),
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: payload.email?.trim() || undefined,
    address: payload.address?.trim() || undefined,
    balance: String(payload.initialBalance),
    status: mapStatusToBackend(payload.status),
  }

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.post<CreateSupplierResponse>(`${apiBaseUrl}/suppliers`, requestBody, {
        headers: getAuthHeader(token),
      })
    }, false)

    const created = response.data?.data
    return mapBackendSupplier({
      ...created,
      code: created?.code || payload.code.trim(),
      balance: created?.balance ?? payload.initialBalance,
      status: created?.status ?? mapStatusToBackend(payload.status),
    })
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Création fournisseur impossible."), {
      cause: error,
    })
  }
}

export async function updateSupplier(
  supplierId: string,
  payload: {
    name: string
    phone: string
    email?: string
    address?: string
    status: SupplierStatus
    initialBalance: number
  },
): Promise<Supplier> {
  const requestBody: UpdateSupplierPayload = {
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: payload.email?.trim() || undefined,
    address: payload.address?.trim() || undefined,
    balance: String(payload.initialBalance),
    status: mapStatusToBackend(payload.status),
  }

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.patch<CreateSupplierResponse>(
        `${apiBaseUrl}/suppliers/${supplierId}`,
        requestBody,
        {
          headers: getAuthHeader(token),
        },
      )
    }, false)

    const updated = response.data?.data
    return mapBackendSupplier({
      ...updated,
      id: updated?.id ?? supplierId,
      balance: updated?.balance ?? payload.initialBalance,
      status: updated?.status ?? mapStatusToBackend(payload.status),
    })
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Mise à jour fournisseur impossible."), {
      cause: error,
    })
  }
}

export async function deleteSupplier(supplierId: string): Promise<string> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.delete<DeleteSupplierResponse>(`${apiBaseUrl}/suppliers/${supplierId}`, {
        headers: getAuthHeader(token),
      })
    }, false)

    const deletedId = response.data?.data?.id
    if (!deletedId) {
      throw new Error("Réponse suppression fournisseur invalide du serveur.")
    }

    return deletedId
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Suppression fournisseur impossible."), {
      cause: error,
    })
  }
}

export async function createSupplierPayment(
  supplierId: string,
  payload: {
    amount: number
    paidAt: string
    recordedBy?: string
  },
): Promise<SupplierPayment> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.post<CreateSupplierPaymentResponse>(
        `${apiBaseUrl}/suppliers/${supplierId}/payments`,
        {
          amount: payload.amount,
          paidAt: payload.paidAt,
          recordedBy: payload.recordedBy?.trim() || undefined,
        },
        {
          headers: getAuthHeader(token),
        },
      )
    }, false)

    const payment = response.data?.data
    if (!payment?.id || !payment?.supplierId) {
      throw new Error("Réponse versement fournisseur invalide du serveur.")
    }

    const result = {
      id: payment.id,
      supplierId: payment.supplierId,
      orderId: payment.orderId ?? undefined,
      amount: Number(payment.amount ?? 0) || 0,
      paidAt: payment.paidAt || new Date().toISOString(),
      recordedBy: payment.recordedBy?.trim() || undefined,
    }
    prependSupplierPaymentToCachedLists(result)
    return result
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Versement fournisseur impossible."), {
      cause: error,
    })
  }
}

export async function listSupplierPayments(
  supplierId: string,
  params?: {
    from?: string
    to?: string
    page?: number
    limit?: number
  },
): Promise<ListSupplierPaymentsResult> {
  const page = Math.max(1, params?.page ?? 1)
  const limit = Math.max(1, params?.limit ?? 20)

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<ListSupplierPaymentsResponse>(
        `${apiBaseUrl}/suppliers/${supplierId}/payments`,
        {
          params: {
            from: params?.from?.trim() || undefined,
            to: params?.to?.trim() || undefined,
            page,
            limit,
          },
          headers: getAuthHeader(token),
        },
      )
    }, false)

    const items = (response.data?.data ?? [])
      .filter((item) => item?.id && item?.supplierId)
      .map((item) => ({
        id: item.id as string,
        supplierId: item.supplierId as string,
        orderId: item.orderId ?? undefined,
        amount: Number(item.amount ?? 0) || 0,
        paidAt: item.paidAt || new Date().toISOString(),
        recordedBy: item.recordedBy?.trim() || undefined,
      }))

    const result = {
      data: items,
      meta: {
        page: response.data?.meta?.page ?? page,
        limit: response.data?.meta?.limit ?? limit,
        total: response.data?.meta?.total ?? items.length,
      },
    }
    saveCachedSupplierPaymentsResult(supplierId, params, result)
    return result
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      const cached = getCachedSupplierPaymentsResult(supplierId, params)
      if (cached) {
        return cached
      }
    }

    throw new Error(resolveErrorMessage(error, "Chargement des versements fournisseur impossible."), {
      cause: error,
    })
  }
}

export async function getSupplierReport(
  supplierId: string,
  params: { from: string; to: string },
): Promise<SupplierReportData> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<SupplierReportResponse>(`${apiBaseUrl}/suppliers/${supplierId}/report`, {
        params: {
          from: params.from,
          to: params.to,
        },
        headers: getAuthHeader(token),
      })
    }, false)

    const data = response.data?.data
    const supplier = mapBackendSupplier(data?.supplier ?? {})

    const periodFrom = data?.period?.from
    const periodTo = data?.period?.to

    if (!periodFrom || !periodTo) {
      throw new Error("Période du rapport invalide.")
    }

    return {
      supplier,
      period: {
        from: periodFrom,
        to: periodTo,
      },
      summary: {
        totalOrdered: Number(data?.summary?.totalOrdered ?? 0) || 0,
        totalReceived: Number(data?.summary?.totalReceived ?? 0) || 0,
        totalPaid: Number(data?.summary?.totalPaid ?? 0) || 0,
        periodBalanceDelta: Number(data?.summary?.periodBalanceDelta ?? 0) || 0,
        openingBalance: Number(data?.summary?.openingBalance ?? 0) || 0,
        closingBalance: Number(data?.summary?.closingBalance ?? 0) || 0,
        currentBalance: Number(data?.summary?.currentBalance ?? 0) || 0,
      },
      receivedProducts: (data?.receivedProducts ?? []).map((entry) => ({
        productId: entry.productId ?? "",
        sku: entry.sku ?? "-",
        name: entry.name ?? "Produit",
        quantity: Number(entry.quantity ?? 0) || 0,
        totalCost: Number(entry.totalCost ?? 0) || 0,
      })),
      payments: (data?.payments ?? []).map((entry) => ({
        id: entry.id ?? "",
        amount: Number(entry.amount ?? 0) || 0,
        paidAt: entry.paidAt ?? new Date().toISOString(),
        recordedBy: entry.recordedBy?.trim() || undefined,
      })),
      orders: data?.orders ?? [],
      concernedOrders: data?.concernedOrders ?? [],
    }
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Génération du rapport fournisseur impossible."), {
      cause: error,
    })
  }
}
