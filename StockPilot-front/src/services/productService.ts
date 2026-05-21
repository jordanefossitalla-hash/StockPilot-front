import axios from "axios"
import { useAuthStore } from "../store/authStore"

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL?.trim() ||
    "https://api.stockpilots.net/api/v1")
    .replace(/\/+$/, "")

type BackendProductStatus = "ACTIVE" | "INACTIVE"

type BackendProduct = {
  id?: string
  sku?: string
  name?: string
  categoryId?: string
  costPrice?: number | string
  salePrice?: number | string
  stockQuantity?: number | string
  stockMinThreshold?: number | string
  status?: BackendProductStatus
  createdAt?: string
  updatedAt?: string
}

type CreateProductPayload = {
  sku: string
  name: string
  categoryId: string
  costPrice: number
  salePrice: number
  stockQuantity: number
  stockMinThreshold: number
  status: BackendProductStatus
}

type CreateProductResponse = {
  data?: BackendProduct
}

type GetProductResponse = {
  data?: BackendProduct
}

type DeleteProductResponse = {
  data?: {
    id?: string
  }
}

type ListProductsResponse = {
  data?: BackendProduct[]
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

export type CreateProductInput = {
  sku: string
  name: string
  categoryId: string
  costPrice: number
  salePrice: number
  stockQuantity: number
  stockMinThreshold: number
  status: "active" | "inactive"
}

export type CreatedProduct = {
  id: string
  sku: string
  name: string
  categoryId: string
  costPrice: number
  salePrice: number
  stockQuantity: number
  stockMinThreshold: number
  status: "active" | "inactive"
  createdAt: string
}

export type ProductListItem = {
  id: string
  sku: string
  name: string
  categoryId: string
  costPrice: number
  salePrice: number
  stockQuantity: number
  stockMinThreshold: number
  status: "active" | "inactive"
  createdAt: string
}

export type ProductDetail = ProductListItem & {
  updatedAt: string
}

export type ListProductsParams = {
  search?: string
  categoryId?: string
  status?: "active" | "inactive"
  page?: number
  limit?: number
}

export type ListProductsResult = {
  data: ProductListItem[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

type CachedProductListEntry = {
  result: ListProductsResult
  cachedAt: string
}

const PRODUCT_LIST_CACHE_KEY = "products.list-cache"

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

function buildProductQueryKey(params: ListProductsParams = {}) {
  return JSON.stringify({
    search: params.search?.trim() || null,
    categoryId: params.categoryId?.trim() || null,
    status: params.status ?? null,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  })
}

function readCachedProductLists() {
  return readJsonStorage<Record<string, CachedProductListEntry>>(PRODUCT_LIST_CACHE_KEY, {})
}

function saveCachedProductListResult(params: ListProductsParams, result: ListProductsResult) {
  const cache = readCachedProductLists()
  cache[buildProductQueryKey(params)] = {
    result,
    cachedAt: new Date().toISOString(),
  }
  writeJsonStorage(PRODUCT_LIST_CACHE_KEY, cache)
}

function getCachedProductListResult(params: ListProductsParams = {}) {
  return readCachedProductLists()[buildProductQueryKey(params)]?.result ?? null
}

function findProductInCachedLists(productId: string): ProductDetail | null {
  for (const entry of Object.values(readCachedProductLists())) {
    const product = entry.result.data.find((item) => item.id === productId)
    if (product) {
      return {
        ...product,
        updatedAt: product.createdAt,
      }
    }
  }

  return null
}

function mapStatusToBackend(status: "active" | "inactive"): BackendProductStatus {
  return status === "inactive" ? "INACTIVE" : "ACTIVE"
}

function mapStatusToFrontend(status?: BackendProductStatus): "active" | "inactive" {
  return status === "INACTIVE" ? "inactive" : "active"
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

function mapBackendProduct(item: BackendProduct, inputFallback?: CreateProductPayload): CreatedProduct {
  const id = item.id
  const sku = item.sku ?? inputFallback?.sku
  const name = item.name ?? inputFallback?.name
  const categoryId = item.categoryId ?? inputFallback?.categoryId

  if (!id || !sku || !name || !categoryId) {
    throw new Error("Réponse produit invalide du serveur.")
  }

  return {
    id,
    sku,
    name,
    categoryId,
    costPrice: Number(item.costPrice ?? inputFallback?.costPrice ?? 0),
    salePrice: Number(item.salePrice ?? inputFallback?.salePrice ?? 0),
    stockQuantity: Number(item.stockQuantity ?? inputFallback?.stockQuantity ?? 0),
    stockMinThreshold: Number(item.stockMinThreshold ?? inputFallback?.stockMinThreshold ?? 0),
    status: mapStatusToFrontend(item.status ?? inputFallback?.status),
    createdAt: item.createdAt ?? new Date().toISOString(),
  }
}

function mapBackendProductDetail(
  item: BackendProduct,
  inputFallback?: CreateProductPayload,
): ProductDetail {
  const mapped = mapBackendProduct(item, inputFallback)

  return {
    ...mapped,
    updatedAt: item.updatedAt ?? mapped.createdAt,
  }
}

export async function createProduct(payload: CreateProductInput): Promise<CreatedProduct> {
  const requestBody: CreateProductPayload = {
    sku: payload.sku.trim().toUpperCase(),
    name: payload.name.trim(),
    categoryId: payload.categoryId.trim(),
    costPrice: payload.costPrice,
    salePrice: payload.salePrice,
    stockQuantity: payload.stockQuantity,
    stockMinThreshold: payload.stockMinThreshold,
    status: mapStatusToBackend(payload.status),
  }

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.post<CreateProductResponse>(`${apiBaseUrl}/products`, requestBody, {
        headers: getAuthHeader(token),
      })
    }, false)

    return mapBackendProduct(response.data?.data ?? {}, requestBody)
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Création produit impossible."), {
      cause: error,
    })
  }
}

export async function getProductByIdApi(productId: string): Promise<ProductDetail> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.get<GetProductResponse>(`${apiBaseUrl}/products/${productId}`, {
        headers: getAuthHeader(token),
      })
    }, false)

    return mapBackendProductDetail(response.data?.data ?? {})
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      const cached = findProductInCachedLists(productId)
      if (cached) {
        return cached
      }
    }

    throw new Error(resolveErrorMessage(error, "Produit introuvable."), {
      cause: error,
    })
  }
}

export async function updateProduct(
  productId: string,
  payload: CreateProductInput,
): Promise<ProductDetail> {
  const requestBody: CreateProductPayload = {
    sku: payload.sku.trim().toUpperCase(),
    name: payload.name.trim(),
    categoryId: payload.categoryId.trim(),
    costPrice: payload.costPrice,
    salePrice: payload.salePrice,
    stockQuantity: payload.stockQuantity,
    stockMinThreshold: payload.stockMinThreshold,
    status: mapStatusToBackend(payload.status),
  }

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.patch<GetProductResponse>(
        `${apiBaseUrl}/products/${productId}`,
        requestBody,
        {
          headers: getAuthHeader(token),
        },
      )
    }, false)

    return mapBackendProductDetail(
      {
        ...response.data?.data,
        id: response.data?.data?.id ?? productId,
      },
      requestBody,
    )
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Mise à jour produit impossible."), {
      cause: error,
    })
  }
}

export async function deleteProduct(productId: string): Promise<string> {
  try {
    const response = await executeWithRefreshRetry(async (token) => {
      return axios.delete<DeleteProductResponse>(`${apiBaseUrl}/products/${productId}`, {
        headers: getAuthHeader(token),
      })
    }, false)

    return response.data?.data?.id ?? productId
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Suppression produit impossible."), {
      cause: error,
    })
  }
}

function mapBackendProductListItem(item: BackendProduct): ProductListItem {
  const mapped = mapBackendProduct(item)

  return {
    id: mapped.id,
    sku: mapped.sku,
    name: mapped.name,
    categoryId: mapped.categoryId,
    costPrice: mapped.costPrice,
    salePrice: mapped.salePrice,
    stockQuantity: mapped.stockQuantity,
    stockMinThreshold: mapped.stockMinThreshold,
    status: mapped.status,
    createdAt: mapped.createdAt,
  }
}

export async function listProducts(
  params: ListProductsParams = {},
): Promise<ListProductsResult> {
  const page = Math.max(1, params.page ?? 1)
  const limit = Math.min(100, Math.max(1, params.limit ?? 20))

  try {
    const response = await executeWithRefreshRetry(async (token) => {
      const result = await axios.get<ListProductsResponse>(`${apiBaseUrl}/products`, {
        params: {
          page,
          limit,
          search: params.search?.trim() || undefined,
          category: params.categoryId?.trim() || undefined,
          status: params.status ? mapStatusToBackend(params.status) : undefined,
        },
        headers: getAuthHeader(token),
      })

      return result.data
    }, false)

    const items = (response.data ?? []).map(mapBackendProductListItem)

    const result = {
      data: items,
      meta: {
        page: response.meta?.page ?? page,
        limit: response.meta?.limit ?? limit,
        total: response.meta?.total ?? items.length,
      },
    }
    saveCachedProductListResult(params, result)
    return result
  } catch (error) {
    if (isRetriableOfflineError(error)) {
      const cached = getCachedProductListResult(params)
      if (cached) {
        return cached
      }
    }

    throw new Error(resolveErrorMessage(error, "Chargement produits impossible."), {
      cause: error,
    })
  }
}