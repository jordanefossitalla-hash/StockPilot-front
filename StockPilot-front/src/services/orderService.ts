import axios from "axios"
import { useAuthStore } from "../store/authStore"

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL?.trim() ||
    "https://api.stockpilots.net/api/v1")
    .replace(/\/+$/, "")

type BackendOrderPriority = "HIGH" | "MEDIUM" | "LOW"
type BackendDeliveryStatus = "TO_DELIVER" | "DELIVERED"

type BackendClientOrder = {
  id?: string
  clientId?: string
  priority?: BackendOrderPriority
  deliveryStatus?: BackendDeliveryStatus
  orderedAt?: string
  deliveryDueAt?: string
  note?: string
  createdAt?: string
}

type ListClientOrdersResponse = {
  data?: BackendClientOrder[]
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

type CreateClientOrderResponse = {
  data?: BackendClientOrder
}

type DeleteClientOrderResponse = {
  data?: {
    id?: string
  }
}

type ClientOrdersStatsResponse = {
  data?: {
    toDeliver?: number
    delivered?: number
    highPriority?: number
  }
}

export type OrderPriority = "high" | "medium" | "low"
export type OrderStatus = "to-deliver" | "delivered"

export type ClientOrder = {
  id: string
  clientId: string
  priority: OrderPriority
  status: OrderStatus
  orderedAt: string
  deliveryDueAt: string
  note: string
  createdAt?: string
}

export type ListClientOrdersResult = {
  data: ClientOrder[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export type ClientOrdersStats = {
  toDeliver: number
  delivered: number
  highPriority: number
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

function mapPriorityToBackend(priority: OrderPriority): BackendOrderPriority {
  if (priority === "high") {
    return "HIGH"
  }

  if (priority === "medium") {
    return "MEDIUM"
  }

  return "LOW"
}

function mapPriorityToClient(priority?: BackendOrderPriority): OrderPriority {
  if (priority === "HIGH") {
    return "high"
  }

  if (priority === "LOW") {
    return "low"
  }

  return "medium"
}

function mapStatusToBackend(status: OrderStatus): BackendDeliveryStatus {
  return status === "delivered" ? "DELIVERED" : "TO_DELIVER"
}

function mapStatusToClient(status?: BackendDeliveryStatus): OrderStatus {
  return status === "DELIVERED" ? "delivered" : "to-deliver"
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

function mapBackendOrder(item: BackendClientOrder): ClientOrder {
  const id = item.id?.trim() || `CMD-${Math.random().toString(36).slice(2, 10)}`
  const clientId = item.clientId?.trim() || ""
  const orderedAt = item.orderedAt || item.createdAt || new Date().toISOString()
  const deliveryDueAt = item.deliveryDueAt || orderedAt

  return {
    id,
    clientId,
    priority: mapPriorityToClient(item.priority),
    status: mapStatusToClient(item.deliveryStatus),
    orderedAt,
    deliveryDueAt,
    note: item.note?.trim() || "",
    createdAt: item.createdAt,
  }
}

export async function listClientOrders(params: {
  status?: OrderStatus
  priority?: OrderPriority
  page?: number
  limit?: number
}): Promise<ListClientOrdersResult> {
  const page = Math.max(1, params.page ?? 1)
  const limit = Math.max(1, params.limit ?? 20)

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<ListClientOrdersResponse>(`${apiBaseUrl}/client-orders`, {
        params: {
          deliveryStatus: params.status ? mapStatusToBackend(params.status) : undefined,
          priority: params.priority ? mapPriorityToBackend(params.priority) : undefined,
          page,
          limit,
        },
        headers: getAuthHeader(token),
      })
    }, false)

    const items = (response.data?.data ?? []).map(mapBackendOrder)

    return {
      data: items,
      meta: {
        page: response.data?.meta?.page ?? page,
        limit: response.data?.meta?.limit ?? limit,
        total: response.data?.meta?.total ?? items.length,
      },
    }
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Chargement des commandes impossible."), {
      cause: error,
    })
  }
}

export async function createClientOrder(payload: {
  clientId: string
  orderedAt: string
  deliveryDueAt: string
  priority: OrderPriority
  note?: string
}): Promise<ClientOrder> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.post<CreateClientOrderResponse>(
        `${apiBaseUrl}/client-orders`,
        {
          clientId: payload.clientId.trim(),
          orderedAt: payload.orderedAt,
          deliveryDueAt: payload.deliveryDueAt,
          priority: mapPriorityToBackend(payload.priority),
          note: payload.note?.trim() || undefined,
        },
        {
          headers: getAuthHeader(token),
        },
      )
    }, false)

    return mapBackendOrder({
      ...response.data?.data,
      clientId: response.data?.data?.clientId ?? payload.clientId,
      orderedAt: response.data?.data?.orderedAt ?? payload.orderedAt,
      deliveryDueAt: response.data?.data?.deliveryDueAt ?? payload.deliveryDueAt,
      priority: response.data?.data?.priority ?? mapPriorityToBackend(payload.priority),
      deliveryStatus: response.data?.data?.deliveryStatus ?? "TO_DELIVER",
      note: response.data?.data?.note ?? payload.note,
    })
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Création commande impossible."), {
      cause: error,
    })
  }
}

export async function updateClientOrderDeliveryStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ClientOrder> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.patch<CreateClientOrderResponse>(
        `${apiBaseUrl}/client-orders/${orderId}/delivery-status`,
        {
          deliveryStatus: mapStatusToBackend(status),
        },
        {
          headers: getAuthHeader(token),
        },
      )
    }, false)

    return mapBackendOrder({
      ...response.data?.data,
      id: response.data?.data?.id ?? orderId,
      deliveryStatus: response.data?.data?.deliveryStatus ?? mapStatusToBackend(status),
    })
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Mise à jour du statut impossible."), {
      cause: error,
    })
  }
}

export async function deleteClientOrder(orderId: string): Promise<string> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.delete<DeleteClientOrderResponse>(`${apiBaseUrl}/client-orders/${orderId}`, {
        headers: getAuthHeader(token),
      })
    }, false)

    return response.data?.data?.id ?? orderId
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Suppression commande impossible."), {
      cause: error,
    })
  }
}

export async function getClientOrdersStats(): Promise<ClientOrdersStats> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<ClientOrdersStatsResponse>(`${apiBaseUrl}/client-orders/stats`, {
        headers: getAuthHeader(token),
      })
    }, false)

    return {
      toDeliver: response.data?.data?.toDeliver ?? 0,
      delivered: response.data?.data?.delivered ?? 0,
      highPriority: response.data?.data?.highPriority ?? 0,
    }
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Chargement des statistiques commandes impossible."), {
      cause: error,
    })
  }
}