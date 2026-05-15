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

    return {
      data: items,
      meta,
    }
  } catch (error) {
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
