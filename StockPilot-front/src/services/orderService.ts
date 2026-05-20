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
export type OrderSyncStatus = "synced" | "pending"

export type ListClientOrdersParams = {
  status?: OrderStatus
  priority?: OrderPriority
  page?: number
  limit?: number
}

export type ClientOrder = {
  id: string
  clientId: string
  priority: OrderPriority
  status: OrderStatus
  orderedAt: string
  deliveryDueAt: string
  note: string
  createdAt?: string
  syncStatus?: OrderSyncStatus
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

type CachedListEntry = {
  result: ListClientOrdersResult
  cachedAt: string
}

type CachedStatsEntry = {
  stats: ClientOrdersStats
  cachedAt: string
}

type PendingCreateOrderMutation = {
  id: string
  type: "create"
  createdAt: string
  localOrder: ClientOrder
  payload: {
    clientId: string
    orderedAt: string
    deliveryDueAt: string
    priority: OrderPriority
    note?: string
  }
}

type PendingUpdateOrderStatusMutation = {
  id: string
  type: "delivery-status"
  createdAt: string
  orderId: string
  status: OrderStatus
  snapshot?: ClientOrder
}

type PendingDeleteOrderMutation = {
  id: string
  type: "delete"
  createdAt: string
  orderId: string
  snapshot?: ClientOrder
}

type PendingOrderMutation =
  | PendingCreateOrderMutation
  | PendingUpdateOrderStatusMutation
  | PendingDeleteOrderMutation

type OrderSyncState = {
  isSyncing: boolean
  pendingCount: number
  lastError: string | null
  isOnline: boolean
}

const ORDER_LIST_CACHE_KEY = "orders.list-cache"
const ORDER_STATS_CACHE_KEY = "orders.stats-cache"
const ORDER_MUTATION_QUEUE_KEY = "orders.mutation-queue"
export const ORDER_SYNC_EVENT = "orders:sync-state"

let isSyncingPendingOrders = false
let hasInitializedOrderSync = false
let lastOrderSyncError: string | null = null

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

function buildQueryKey(params: ListClientOrdersParams) {
  return JSON.stringify({
    status: params.status ?? null,
    priority: params.priority ?? null,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  })
}

function createIdentifier(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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

function readCachedLists() {
  return readJsonStorage<Record<string, CachedListEntry>>(ORDER_LIST_CACHE_KEY, {})
}

function writeCachedLists(cache: Record<string, CachedListEntry>) {
  writeJsonStorage(ORDER_LIST_CACHE_KEY, cache)
}

function saveCachedListResult(params: ListClientOrdersParams, result: ListClientOrdersResult) {
  const cache = readCachedLists()

  cache[buildQueryKey(params)] = {
    result,
    cachedAt: new Date().toISOString(),
  }

  writeCachedLists(cache)
}

function getCachedListResult(params: ListClientOrdersParams) {
  return readCachedLists()[buildQueryKey(params)]?.result ?? null
}

function saveCachedStats(stats: ClientOrdersStats) {
  writeJsonStorage(ORDER_STATS_CACHE_KEY, {
    stats,
    cachedAt: new Date().toISOString(),
  } satisfies CachedStatsEntry)
}

function getCachedStats() {
  const cached = readJsonStorage<CachedStatsEntry | null>(ORDER_STATS_CACHE_KEY, null)
  return cached?.stats ?? null
}

function readPendingOrderMutations() {
  return readJsonStorage<PendingOrderMutation[]>(ORDER_MUTATION_QUEUE_KEY, [])
}

function writePendingOrderMutations(queue: PendingOrderMutation[]) {
  writeJsonStorage(ORDER_MUTATION_QUEUE_KEY, queue)
}

function cloneOrder(order: ClientOrder): ClientOrder {
  return {
    ...order,
    syncStatus: order.syncStatus ?? "synced",
  }
}

function createOrderSyncState(): OrderSyncState {
  return {
    isSyncing: isSyncingPendingOrders,
    pendingCount: readPendingOrderMutations().length,
    lastError: lastOrderSyncError,
    isOnline: isOnline(),
  }
}

function emitOrderSyncState() {
  if (!isBrowser()) {
    return
  }

  window.dispatchEvent(
    new CustomEvent<OrderSyncState>(ORDER_SYNC_EVENT, {
      detail: createOrderSyncState(),
    }),
  )
}

export function getOrderSyncState() {
  return createOrderSyncState()
}

function replacePendingOrderQueue(updater: (queue: PendingOrderMutation[]) => PendingOrderMutation[]) {
  const nextQueue = updater(readPendingOrderMutations())
  writePendingOrderMutations(nextQueue)
  emitOrderSyncState()
}

function isLocalOrderId(orderId: string) {
  return orderId.startsWith("local-order-")
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
  const id = item.id?.trim() || createIdentifier("CMD")
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
    syncStatus: "synced",
  }
}

function matchesOrderFilters(order: ClientOrder, params: ListClientOrdersParams) {
  const statusMatches = !params.status || order.status === params.status
  const priorityMatches = !params.priority || order.priority === params.priority
  return statusMatches && priorityMatches
}

function sortOrdersByCreatedAtDesc(orders: ClientOrder[]) {
  return [...orders].sort((left, right) => {
    const leftValue = new Date(left.createdAt ?? left.orderedAt).getTime()
    const rightValue = new Date(right.createdAt ?? right.orderedAt).getTime()
    return rightValue - leftValue
  })
}

function findOrderInCachedLists(orderId: string) {
  for (const entry of Object.values(readCachedLists())) {
    const match = entry.result.data.find((item) => item.id === orderId)

    if (match) {
      return cloneOrder(match)
    }
  }

  return null
}

function findOrderSnapshot(orderId: string) {
  const queue = readPendingOrderMutations()

  for (let index = queue.length - 1; index >= 0; index -= 1) {
    const mutation = queue[index]

    if (mutation.type === "create" && mutation.localOrder.id === orderId) {
      return cloneOrder(mutation.localOrder)
    }

    if (mutation.type !== "create" && mutation.orderId === orderId && mutation.snapshot) {
      return cloneOrder(mutation.snapshot)
    }
  }

  return findOrderInCachedLists(orderId)
}

function applyPendingMutationsToOrders(
  baseResult: ListClientOrdersResult,
  params: ListClientOrdersParams,
): ListClientOrdersResult {
  const page = Math.max(1, params.page ?? baseResult.meta.page ?? 1)
  const limit = Math.max(1, params.limit ?? baseResult.meta.limit ?? 20)
  let items = baseResult.data.map((item) => cloneOrder({ ...item, syncStatus: "synced" }))
  let total = baseResult.meta.total

  for (const mutation of readPendingOrderMutations()) {
    if (mutation.type === "create") {
      const order = cloneOrder({ ...mutation.localOrder, syncStatus: "pending" })

      if (!matchesOrderFilters(order, params)) {
        continue
      }

      total += 1

      if (page === 1) {
        items = sortOrdersByCreatedAtDesc([
          order,
          ...items.filter((item) => item.id !== order.id),
        ]).slice(0, limit)
      }

      continue
    }

    if (mutation.type === "delivery-status") {
      const currentIndex = items.findIndex((item) => item.id === mutation.orderId)
      const snapshot = mutation.snapshot ? cloneOrder(mutation.snapshot) : findOrderSnapshot(mutation.orderId)
      const nextOrder = snapshot
        ? cloneOrder({ ...snapshot, status: mutation.status, syncStatus: "pending" })
        : null

      if (currentIndex >= 0) {
        const currentOrder = cloneOrder({
          ...items[currentIndex],
          status: mutation.status,
          syncStatus: "pending",
        })

        if (matchesOrderFilters(currentOrder, params)) {
          items[currentIndex] = currentOrder
        } else {
          items.splice(currentIndex, 1)
          total = Math.max(0, total - 1)
        }

        continue
      }

      if (nextOrder && matchesOrderFilters(nextOrder, params)) {
        total += 1

        if (page === 1) {
          items = sortOrdersByCreatedAtDesc([nextOrder, ...items]).slice(0, limit)
        }
      }

      continue
    }

    const currentIndex = items.findIndex((item) => item.id === mutation.orderId)
    const snapshot = mutation.snapshot ? cloneOrder(mutation.snapshot) : findOrderSnapshot(mutation.orderId)

    if (currentIndex >= 0) {
      items.splice(currentIndex, 1)
      total = Math.max(0, total - 1)
      continue
    }

    if (snapshot && matchesOrderFilters(snapshot, params)) {
      total = Math.max(0, total - 1)
    }
  }

  return {
    data: items.map((item) => cloneOrder(item)),
    meta: {
      page,
      limit,
      total: Math.max(0, total),
    },
  }
}

function applyPendingMutationsToStats(baseStats: ClientOrdersStats): ClientOrdersStats {
  const stats = { ...baseStats }

  for (const mutation of readPendingOrderMutations()) {
    if (mutation.type === "create") {
      if (mutation.localOrder.status === "to-deliver") {
        stats.toDeliver += 1
      } else {
        stats.delivered += 1
      }

      if (mutation.localOrder.priority === "high") {
        stats.highPriority += 1
      }

      continue
    }

    const snapshot = mutation.snapshot ? cloneOrder(mutation.snapshot) : findOrderSnapshot(mutation.orderId)

    if (!snapshot) {
      continue
    }

    if (mutation.type === "delivery-status") {
      if (snapshot.status === mutation.status) {
        continue
      }

      if (snapshot.status === "to-deliver") {
        stats.toDeliver = Math.max(0, stats.toDeliver - 1)
        stats.delivered += 1
      } else {
        stats.delivered = Math.max(0, stats.delivered - 1)
        stats.toDeliver += 1
      }

      continue
    }

    if (snapshot.status === "to-deliver") {
      stats.toDeliver = Math.max(0, stats.toDeliver - 1)
    } else {
      stats.delivered = Math.max(0, stats.delivered - 1)
    }

    if (snapshot.priority === "high") {
      stats.highPriority = Math.max(0, stats.highPriority - 1)
    }
  }

  return stats
}

function makeLocalOrder(payload: {
  clientId: string
  orderedAt: string
  deliveryDueAt: string
  priority: OrderPriority
  note?: string
}) {
  return {
    id: createIdentifier("local-order"),
    clientId: payload.clientId.trim(),
    priority: payload.priority,
    status: "to-deliver",
    orderedAt: payload.orderedAt,
    deliveryDueAt: payload.deliveryDueAt,
    note: payload.note?.trim() || "",
    createdAt: payload.orderedAt,
    syncStatus: "pending",
  } satisfies ClientOrder
}

function queueCreateOrder(payload: {
  clientId: string
  orderedAt: string
  deliveryDueAt: string
  priority: OrderPriority
  note?: string
}) {
  const localOrder = makeLocalOrder(payload)

  replacePendingOrderQueue((queue) => [
    ...queue,
    {
      id: createIdentifier("mutation"),
      type: "create",
      createdAt: new Date().toISOString(),
      localOrder,
      payload,
    },
  ])

  return localOrder
}

function queueOrderStatusUpdate(orderId: string, status: OrderStatus, snapshot?: ClientOrder) {
  replacePendingOrderQueue((queue) => [
    ...queue,
    {
      id: createIdentifier("mutation"),
      type: "delivery-status",
      createdAt: new Date().toISOString(),
      orderId,
      status,
      snapshot: snapshot ? cloneOrder(snapshot) : findOrderSnapshot(orderId) ?? undefined,
    },
  ])
}

function queueOrderDeletion(orderId: string, snapshot?: ClientOrder) {
  replacePendingOrderQueue((queue) => {
    if (isLocalOrderId(orderId)) {
      return queue.filter((mutation) => {
        if (mutation.type === "create") {
          return mutation.localOrder.id !== orderId
        }

        return mutation.orderId !== orderId
      })
    }

    const nextQueue = queue.filter((mutation) => {
      if (mutation.type === "create") {
        return true
      }

      return mutation.orderId !== orderId
    })

    nextQueue.push({
      id: createIdentifier("mutation"),
      type: "delete",
      createdAt: new Date().toISOString(),
      orderId,
      snapshot: snapshot ? cloneOrder(snapshot) : findOrderSnapshot(orderId) ?? undefined,
    })

    return nextQueue
  })
}

async function requestClientOrders(params: ListClientOrdersParams): Promise<ListClientOrdersResult> {
  const page = Math.max(1, params.page ?? 1)
  const limit = Math.max(1, params.limit ?? 20)

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
}

async function requestCreateClientOrder(payload: {
  clientId: string
  orderedAt: string
  deliveryDueAt: string
  priority: OrderPriority
  note?: string
}): Promise<ClientOrder> {
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
}

async function requestUpdateClientOrderDeliveryStatus(orderId: string, status: OrderStatus) {
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
}

async function requestDeleteClientOrder(orderId: string) {
  const response = await executeWithRefreshRetry(async (token) => {
    return axios.delete<DeleteClientOrderResponse>(`${apiBaseUrl}/client-orders/${orderId}`, {
      headers: getAuthHeader(token),
    })
  }, false)

  return response.data?.data?.id ?? orderId
}

async function requestClientOrdersStats(): Promise<ClientOrdersStats> {
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
}

export async function syncQueuedOrderMutations() {
  if (!isBrowser() || isSyncingPendingOrders || !isOnline()) {
    emitOrderSyncState()
    return
  }

  let remainingQueue = readPendingOrderMutations()

  if (remainingQueue.length === 0) {
    lastOrderSyncError = null
    emitOrderSyncState()
    return
  }

  isSyncingPendingOrders = true
  lastOrderSyncError = null
  emitOrderSyncState()

  try {
    for (const mutation of [...remainingQueue]) {
      try {
        if (mutation.type === "create") {
          const createdOrder = await requestCreateClientOrder(mutation.payload)

          remainingQueue = remainingQueue.map((item) => {
            if (item.type === "create") {
              return item
            }

            if (item.orderId !== mutation.localOrder.id) {
              return item
            }

            return {
              ...item,
              orderId: createdOrder.id,
              snapshot: item.snapshot
                ? cloneOrder({ ...item.snapshot, id: createdOrder.id })
                : item.snapshot,
            }
          })
        } else if (mutation.type === "delivery-status") {
          if (!isLocalOrderId(mutation.orderId)) {
            await requestUpdateClientOrderDeliveryStatus(mutation.orderId, mutation.status)
          }
        } else if (!isLocalOrderId(mutation.orderId)) {
          await requestDeleteClientOrder(mutation.orderId)
        }

        remainingQueue = remainingQueue.filter((item) => item.id !== mutation.id)
        writePendingOrderMutations(remainingQueue)
        emitOrderSyncState()
      } catch (error) {
        lastOrderSyncError = resolveErrorMessage(error, "Synchronisation des commandes impossible.")
        writePendingOrderMutations(remainingQueue)
        break
      }
    }
  } finally {
    isSyncingPendingOrders = false
    emitOrderSyncState()
  }
}

export function initOrderOfflineSync() {
  if (!isBrowser() || hasInitializedOrderSync) {
    return
  }

  hasInitializedOrderSync = true

  const handleOnline = () => {
    emitOrderSyncState()
    void syncQueuedOrderMutations()
  }

  const handleOffline = () => {
    emitOrderSyncState()
  }

  window.addEventListener("online", handleOnline)
  window.addEventListener("offline", handleOffline)
  emitOrderSyncState()

  if (isOnline()) {
    void syncQueuedOrderMutations()
  }
}

export async function listClientOrders(params: ListClientOrdersParams): Promise<ListClientOrdersResult> {
  try {
    const result = await requestClientOrders(params)
    saveCachedListResult(params, result)
    return applyPendingMutationsToOrders(result, params)
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      const cachedResult = getCachedListResult(params) ?? {
        data: [],
        meta: {
          page: Math.max(1, params.page ?? 1),
          limit: Math.max(1, params.limit ?? 20),
          total: 0,
        },
      }

      return applyPendingMutationsToOrders(cachedResult, params)
    }

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
    return await requestCreateClientOrder(payload)
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      return queueCreateOrder(payload)
    }

    throw new Error(resolveErrorMessage(error, "Création commande impossible."), {
      cause: error,
    })
  }
}

export async function updateClientOrderDeliveryStatus(
  orderId: string,
  status: OrderStatus,
  snapshot?: ClientOrder,
): Promise<ClientOrder> {
  try {
    return await requestUpdateClientOrderDeliveryStatus(orderId, status)
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      const nextSnapshot = cloneOrder({
        ...(snapshot ??
          findOrderSnapshot(orderId) ?? {
            id: orderId,
            clientId: "",
            priority: "medium",
            status,
            orderedAt: new Date().toISOString(),
            deliveryDueAt: new Date().toISOString(),
            note: "",
          }),
        status,
        syncStatus: "pending",
      })

      queueOrderStatusUpdate(orderId, status, nextSnapshot)
      return nextSnapshot
    }

    throw new Error(resolveErrorMessage(error, "Mise à jour du statut impossible."), {
      cause: error,
    })
  }
}

export async function deleteClientOrder(orderId: string, snapshot?: ClientOrder): Promise<string> {
  try {
    return await requestDeleteClientOrder(orderId)
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      queueOrderDeletion(orderId, snapshot)
      return orderId
    }

    throw new Error(resolveErrorMessage(error, "Suppression commande impossible."), {
      cause: error,
    })
  }
}

export async function getClientOrdersStats(): Promise<ClientOrdersStats> {
  try {
    const stats = await requestClientOrdersStats()
    saveCachedStats(stats)
    return applyPendingMutationsToStats(stats)
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      const cachedStats = getCachedStats() ?? {
        toDeliver: 0,
        delivered: 0,
        highPriority: 0,
      }

      return applyPendingMutationsToStats(cachedStats)
    }

    throw new Error(resolveErrorMessage(error, "Chargement des statistiques commandes impossible."), {
      cause: error,
    })
  }
}
