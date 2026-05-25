import axios from "axios"

export type CachedListEntry<T> = {
  result: T
  cachedAt: string
}

export function isBrowser() {
  return typeof window !== "undefined"
}

export function isOnline() {
  if (!isBrowser()) {
    return true
  }

  return window.navigator.onLine
}

export function readJsonStorage<T>(key: string, fallback: T): T {
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

export function writeJsonStorage(key: string, value: unknown) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function isRetriableOfflineError(error: unknown) {
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

export function getOfflineActionMessage(actionLabel: string) {
  return `${actionLabel} indisponible hors ligne. Réessayez dès que la connexion est rétablie.`
}
