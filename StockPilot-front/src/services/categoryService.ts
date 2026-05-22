import axios from "axios"
import type { Category, CategoryStatus } from "../features/categories/categoryTypes"
import { useAuthStore } from "../store/authStore"

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL?.trim() ||
    "https://api.stockpilots.net/api/v1")
    .replace(/\/+$/, "")

type BackendCategoryStatus = "ACTIVE" | "INACTIVE"

type BackendCategory = {
  id?: string
  name?: string
  description?: string
  status?: BackendCategoryStatus
  productsCount?: number
  productCount?: number
  createdAt?: string
  updatedAt?: string
}

type CategoryMutationPayload = {
  name: string
  description: string
  status: BackendCategoryStatus
}

type ListCategoriesResponse = {
  data?: BackendCategory[]
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

type GetCategoryResponse = {
  data?: BackendCategory
}

type DeleteCategoryResponse = {
  data?: {
    id?: string
  }
}

export type ListCategoriesParams = {
  status?: CategoryStatus
  search?: string
  page?: number
  limit?: number
}

export type ListCategoriesResult = {
  data: Category[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

type CachedCategoryListEntry = {
  result: ListCategoriesResult
  cachedAt: string
}

const CATEGORY_LIST_CACHE_KEY = "categories.list-cache"

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

function buildCategoryQueryKey(params: ListCategoriesParams = {}) {
  return JSON.stringify({
    status: params.status ?? null,
    search: params.search?.trim() || null,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  })
}

function readCachedCategoryLists() {
  return readJsonStorage<Record<string, CachedCategoryListEntry>>(CATEGORY_LIST_CACHE_KEY, {})
}

function saveCachedCategoryListResult(params: ListCategoriesParams, result: ListCategoriesResult) {
  const cache = readCachedCategoryLists()
  cache[buildCategoryQueryKey(params)] = {
    result,
    cachedAt: new Date().toISOString(),
  }
  writeJsonStorage(CATEGORY_LIST_CACHE_KEY, cache)
}

function getCachedCategoryListResult(params: ListCategoriesParams = {}) {
  return readCachedCategoryLists()[buildCategoryQueryKey(params)]?.result ?? null
}

function findCategoryInCachedLists(categoryId: string): Category | null {
  for (const entry of Object.values(readCachedCategoryLists())) {
    const category = entry.result.data.find((item) => item.id === categoryId)
    if (category) {
      return category
    }
  }

  return null
}

function mapStatusToBackend(status: CategoryStatus): BackendCategoryStatus {
  return status === "inactive" ? "INACTIVE" : "ACTIVE"
}

function mapStatusToCategory(status?: BackendCategoryStatus): CategoryStatus {
  return status === "INACTIVE" ? "inactive" : "active"
}

function mapBackendCategory(item: BackendCategory): Category {
  if (!item.id || !item.name || !item.description) {
    throw new Error("Réponse catégorie invalide du serveur.")
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    status: mapStatusToCategory(item.status),
    productsCount: Number(item.productsCount ?? item.productCount ?? 0) || 0,
    createdAt: item.createdAt ?? new Date().toISOString(),
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

export async function listCategories(
  params: ListCategoriesParams = {},
): Promise<ListCategoriesResult> {
  const page = Math.max(1, params.page ?? 1)
  const limit = Math.min(100, Math.max(1, params.limit ?? 20))

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      const result = await axios.get<ListCategoriesResponse>(`${apiBaseUrl}/categories`, {
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

    const items = (response.data ?? []).map(mapBackendCategory)
    const meta = {
      page: response.meta?.page ?? page,
      limit: response.meta?.limit ?? limit,
      total: response.meta?.total ?? items.length,
    }

    const result = {
      data: items,
      meta,
    }
    saveCachedCategoryListResult(params, result)
    return result
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      const cached = getCachedCategoryListResult(params)
      if (cached) {
        return cached
      }
    }

    throw new Error(resolveErrorMessage(error, "Chargement catégories impossible."), {
      cause: error,
    })
  }
}

export async function getCategoryByIdApi(categoryId: string): Promise<Category> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<GetCategoryResponse>(`${apiBaseUrl}/categories/${categoryId}`, {
        headers: getAuthHeader(token),
      })
    }, false)

    return mapBackendCategory(response.data?.data ?? {})
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      const cached = findCategoryInCachedLists(categoryId)
      if (cached) {
        return cached
      }
    }

    throw new Error(resolveErrorMessage(error, "Catégorie introuvable."), {
      cause: error,
    })
  }
}

export async function createCategory(payload: {
  name: string
  description: string
  status: CategoryStatus
}): Promise<Category> {
  const requestBody: CategoryMutationPayload = {
    name: payload.name.trim(),
    description: payload.description.trim(),
    status: mapStatusToBackend(payload.status),
  }

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.post<GetCategoryResponse>(`${apiBaseUrl}/categories`, requestBody, {
        headers: getAuthHeader(token),
      })
    }, false)

    const created = response.data?.data
    return mapBackendCategory({
      ...created,
      name: created?.name ?? requestBody.name,
      description: created?.description ?? requestBody.description,
      status: created?.status ?? requestBody.status,
      createdAt: created?.createdAt ?? new Date().toISOString(),
    })
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Création catégorie impossible."), {
      cause: error,
    })
  }
}

export async function updateCategory(
  categoryId: string,
  payload: {
    name: string
    description: string
    status: CategoryStatus
  },
): Promise<Category> {
  const requestBody: CategoryMutationPayload = {
    name: payload.name.trim(),
    description: payload.description.trim(),
    status: mapStatusToBackend(payload.status),
  }

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.patch<GetCategoryResponse>(
        `${apiBaseUrl}/categories/${categoryId}`,
        requestBody,
        {
          headers: getAuthHeader(token),
        },
      )
    }, false)

    const updated = response.data?.data
    return mapBackendCategory({
      ...updated,
      id: updated?.id ?? categoryId,
      name: updated?.name ?? requestBody.name,
      description: updated?.description ?? requestBody.description,
      status: updated?.status ?? requestBody.status,
      createdAt: updated?.createdAt ?? new Date().toISOString(),
    })
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Mise à jour catégorie impossible."), {
      cause: error,
    })
  }
}

export async function deleteCategory(categoryId: string): Promise<string> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.delete<DeleteCategoryResponse>(`${apiBaseUrl}/categories/${categoryId}`, {
        headers: getAuthHeader(token),
      })
    }, false)

    return response.data?.data?.id ?? categoryId
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Suppression catégorie impossible."), {
      cause: error,
    })
  }
}