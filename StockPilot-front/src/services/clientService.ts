import axios from "axios"
import type { Client, ClientStatus } from "../features/clients/clientTypes"
import {
  type CachedListEntry,
  getOfflineActionMessage,
  isRetriableOfflineError,
  readJsonStorage,
  writeJsonStorage,
} from "./offlineSupport"
import { useAuthStore } from "../store/authStore"

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL?.trim() ||
    "https://api.stockpilots.net/api/v1")
    .replace(/\/+$/, "")

type BackendClientStatus = "ACTIVE" | "BLOCKED"

type BackendClient = {
  id?: string
  code?: string
  name?: string
  phone?: string
  email?: string
  address?: string
  status?: BackendClientStatus
  balance?: string | number
  createdAt?: string
  updatedAt?: string
}

type CreateClientPayload = {
  code: string
  name: string
  phone: string
  email?: string
  address?: string
  balance: string
  status: BackendClientStatus
}

type UpdateClientPayload = {
  name: string
  phone: string
  email?: string
  address?: string
  balance: string
  status: BackendClientStatus
}

type CreateClientResponse = {
  data?: BackendClient
}

type ListClientsResponse = {
  data?: BackendClient[]
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

type DeleteClientResponse = {
  data?: {
    id?: string
  }
}

export type ListClientsResult = {
  clients: Client[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

type CachedClientListEntry = CachedListEntry<ListClientsResult>

const CLIENT_LIST_CACHE_KEY = "clients.list-cache"

function formatClientCode(value: number): string {
  return `CLI-${String(value).padStart(4, "0")}`
}

function buildClientQueryKey(params?: {
  status?: ClientStatus
  search?: string
  page?: number
  limit?: number
}) {
  return JSON.stringify({
    status: params?.status ?? null,
    search: params?.search?.trim() || null,
    page: params?.page ?? 1,
    limit: params?.limit ?? 15,
  })
}

function readCachedClientLists() {
  return readJsonStorage<Record<string, CachedClientListEntry>>(CLIENT_LIST_CACHE_KEY, {})
}

function saveCachedClientListResult(
  params: { status?: ClientStatus; search?: string; page?: number; limit?: number },
  result: ListClientsResult,
) {
  const cache = readCachedClientLists()
  cache[buildClientQueryKey(params)] = {
    result,
    cachedAt: new Date().toISOString(),
  }
  writeJsonStorage(CLIENT_LIST_CACHE_KEY, cache)
}

function getCachedClientListResult(params?: {
  status?: ClientStatus
  search?: string
  page?: number
  limit?: number
}) {
  return readCachedClientLists()[buildClientQueryKey(params)]?.result ?? null
}

function findClientInCachedLists(clientId: string): Client | null {
  for (const entry of Object.values(readCachedClientLists())) {
    const client = entry.result.clients.find((item) => item.id === clientId)
    if (client) {
      return client
    }
  }

  return null
}

function extractClientCodeNumber(code?: string): number {
  if (!code) {
    return 0
  }

  const match = /^CLI-(\d+)$/i.exec(code.trim())
  if (!match) {
    return 0
  }

  return Number(match[1]) || 0
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

function mapStatusToBackend(status: ClientStatus): BackendClientStatus {
  return status === "blocked" ? "BLOCKED" : "ACTIVE"
}

function mapStatusToClient(status?: BackendClientStatus): ClientStatus {
  return status === "BLOCKED" ? "blocked" : "active"
}

function mapBackendClient(item: BackendClient): Client {
  if (!item.id || !item.name || !item.phone || !item.createdAt) {
    throw new Error("Réponse client invalide du serveur.")
  }

  return {
    id: item.id,
    code: item.code,
    name: item.name,
    phone: item.phone,
    email: item.email,
    address: item.address,
    status: mapStatusToClient(item.status),
    createdAt: item.createdAt,
    purchasesTotal: 0,
    debtTotal: Number(item.balance ?? 0) || 0,
    paymentsTotal: 0,
    lastPurchaseDate: undefined,
    transactions: [],
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

export async function listClients(params?: {
  status?: ClientStatus
  search?: string
  page?: number
  limit?: number
}): Promise<ListClientsResult> {
  const status = params?.status
  const search = params?.search?.trim()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 15

  try {
    const result = await executeWithRefreshRetry(async (token) => {
      const response = await axios.get<ListClientsResponse>(`${apiBaseUrl}/clients`, {
        params: {
          search: search || undefined,
          status: status ? mapStatusToBackend(status) : undefined,
          page,
          limit,
        },
        headers: getAuthHeader(token),
      })

      const items = response.data?.data ?? []
      const meta = response.data?.meta

      return {
        clients: items.map((item) => mapBackendClient(item)),
        meta: {
          page: meta?.page ?? page,
          limit: meta?.limit ?? limit,
          total: meta?.total ?? items.length,
        },
      }
    }, false)

    saveCachedClientListResult({ status, search, page, limit }, result)
    return result
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      const cached = getCachedClientListResult({ status, search, page, limit })
      if (cached) {
        return cached
      }
    }

    throw new Error(resolveErrorMessage(error, "Chargement des clients impossible."), {
      cause: error,
    })
  }
}

export async function getClientByIdApi(clientId: string): Promise<Client> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<CreateClientResponse>(`${apiBaseUrl}/clients/${clientId}`, {
        headers: getAuthHeader(token),
      })
    }, false)

    return mapBackendClient(response.data?.data ?? {})
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      const cached = findClientInCachedLists(clientId)
      if (cached) {
        return cached
      }
    }

    throw new Error(resolveErrorMessage(error, "Client introuvable."), {
      cause: error,
    })
  }
}

export async function createClient(payload: {
  code: string
  name: string
  phone: string
  email?: string
  address?: string
  status: ClientStatus
  initialBalance: number
}): Promise<Client> {
  const requestBody: CreateClientPayload = {
    code: payload.code.trim(),
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: payload.email?.trim() || undefined,
    address: payload.address?.trim() || undefined,
    balance: String(payload.initialBalance),
    status: mapStatusToBackend(payload.status),
  }

  async function postClient(token: string) {
    return axios.post<CreateClientResponse>(`${apiBaseUrl}/clients`, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  try {
    const response = await executeWithRefreshRetry(
      async (token) => postClient(token ?? ""),
      true,
    )
    const created = response.data?.data

    const mappedClient = mapBackendClient({
      ...created,
      code: created?.code || payload.code.trim(),
      balance: created?.balance ?? payload.initialBalance,
    })

    return mappedClient
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      throw new Error(getOfflineActionMessage("Création client"), {
        cause: error,
      })
    }

    throw new Error(resolveErrorMessage(error, "Creation client impossible."), {
      cause: error,
    })
  }
}

export async function updateClient(
  clientId: string,
  payload: {
    name: string
    phone: string
    email?: string
    address?: string
    status: ClientStatus
    initialBalance: number
  },
): Promise<Client> {
  const requestBody: UpdateClientPayload = {
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: payload.email?.trim() || undefined,
    address: payload.address?.trim() || undefined,
    status: mapStatusToBackend(payload.status),
    balance: String(payload.initialBalance),
  }

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.patch<CreateClientResponse>(
        `${apiBaseUrl}/clients/${clientId}`,
        requestBody,
        {
          headers: getAuthHeader(token),
        },
      )
    }, true)

    const updated = response.data?.data
    return mapBackendClient({
      ...updated,
      balance: updated?.balance ?? payload.initialBalance,
    })
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      throw new Error(getOfflineActionMessage("Modification client"), {
        cause: error,
      })
    }

    throw new Error(resolveErrorMessage(error, "Modification client impossible."), {
      cause: error,
    })
  }
}

export async function getNextClientCode(): Promise<string> {
  try {
    const firstPage = await listClients({ page: 1, limit: 200 })
    const maxCodeNumber = firstPage.clients.reduce((max, client) => {
      return Math.max(max, extractClientCodeNumber(client.code))
    }, 0)

    return formatClientCode(Math.max(maxCodeNumber + 1, 10))
  } catch {
    return formatClientCode(10)
  }
}

export async function deleteClient(clientId: string): Promise<string> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.delete<DeleteClientResponse>(`${apiBaseUrl}/clients/${clientId}`, {
        headers: getAuthHeader(token),
      })
    }, true)

    const deletedId = response.data?.data?.id
    if (!deletedId) {
      throw new Error("Réponse suppression client invalide du serveur.")
    }

    return deletedId
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      throw new Error(getOfflineActionMessage("Suppression client"), {
        cause: error,
      })
    }

    throw new Error(resolveErrorMessage(error, "Suppression client impossible."), {
      cause: error,
    })
  }
}
