const ORDER_PENDING_STORAGE_KEY = "orders.pendingToDeliverCount"
const ORDER_PENDING_EVENT = "orders:pending-updated"

function normalizeCount(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.trunc(value))
}

export function getPendingOrdersCount() {
  if (typeof window === "undefined") {
    return 0
  }

  const rawValue = window.localStorage.getItem(ORDER_PENDING_STORAGE_KEY)

  if (!rawValue) {
    return 0
  }

  return normalizeCount(Number(rawValue))
}

export function setPendingOrdersCount(count: number) {
  if (typeof window === "undefined") {
    return
  }

  const normalizedCount = normalizeCount(count)
  window.localStorage.setItem(ORDER_PENDING_STORAGE_KEY, String(normalizedCount))
  window.dispatchEvent(
    new CustomEvent(ORDER_PENDING_EVENT, {
      detail: { count: normalizedCount },
    }),
  )
}

export { ORDER_PENDING_EVENT, ORDER_PENDING_STORAGE_KEY }