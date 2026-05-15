import { Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import type { Category } from "../features/categories/categoryTypes"
import {
  formatDate,
  formatFcfa,
  formatProductCategory,
} from "../features/products/productFormatters"
import { getProductStats, getProductStockStatus } from "../features/products/productStats"
import { listCategories } from "../services/categoryService"
import {
  deleteProduct,
  getProductByIdApi,
  listProducts,
  type ProductDetail,
  type ProductListItem,
} from "../services/productService"

type ProductRow = ProductListItem & {
  categoryName: string
}

export function ProductsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [productToDelete, setProductToDelete] = useState<ProductRow | null>(null)
  const [detailProductId, setDetailProductId] = useState<string | null>(null)
  const [detailProduct, setDetailProduct] = useState<ProductDetail | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const PAGE_SIZE = 20

  useEffect(() => {
    let isMounted = true

    async function fetchCategories() {
      setIsLoadingCategories(true)

      try {
        const response = await listCategories({ page: 1, limit: 100 })

        if (!isMounted) {
          return
        }

        setCategories(response.data)
      } catch {
        if (!isMounted) {
          return
        }

        setCategories([])
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false)
        }
      }
    }

    fetchCategories()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function fetchProducts() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await listProducts({
          search: query,
          categoryId: categoryFilter === "all" ? undefined : categoryFilter,
          status: "active",
          page,
          limit: PAGE_SIZE,
        })

        if (!isMounted) {
          return
        }

        setProducts(
          response.data.map((product) => {
            const categoryName =
              categories.find((category) => category.id === product.categoryId)?.name ??
              product.categoryId

            return {
              ...product,
              categoryName,
            }
          }),
        )
        setTotalItems(response.meta.total)
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error ? error.message : "Chargement produits impossible."
        setLoadError(message)
        setProducts([])
        setTotalItems(0)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      isMounted = false
    }
  }, [categories, categoryFilter, page, query])

  useEffect(() => {
    const state = location.state as { notice?: string } | null
    const message = state?.notice

    if (!message) {
      return
    }

    setNotice(message)
    navigate(location.pathname + location.search, { replace: true, state: null })
  }, [location.pathname, location.search, location.state, navigate])

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const currentPageProducts = products

  const stats = useMemo(
    () =>
      getProductStats(
        products.map((product) => ({
          quantity: product.stockQuantity,
          purchasePrice: product.costPrice,
          salePrice: product.salePrice,
          stockMinThreshold: product.stockMinThreshold,
        })),
      ),
    [products],
  )

  const startRow = products.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const endRow = Math.min((pageSafe - 1) * PAGE_SIZE + products.length, totalItems)

  async function handleDeleteConfirm() {
    if (!productToDelete) {
      return
    }

    setDeleteError(null)
    setIsDeleting(true)

    try {
      const deletedId = await deleteProduct(productToDelete.id)

      setProducts((previous) =>
        previous.filter((product) => product.id !== deletedId),
      )
      setProductToDelete(null)
      setTotalItems((previous) => Math.max(previous - 1, 0))
      setNotice("Produit supprime avec succes.")

      if (products.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1))
      }
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Suppression produit impossible.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function fetchProductDetail() {
      if (!detailProductId) {
        return
      }

      setIsDetailLoading(true)
      setDetailError(null)

      try {
        const response = await getProductByIdApi(detailProductId)

        if (!isMounted) {
          return
        }

        setDetailProduct(response)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setDetailError(
          error instanceof Error ? error.message : "Chargement détail produit impossible.",
        )
        setDetailProduct(null)
      } finally {
        if (isMounted) {
          setIsDetailLoading(false)
        }
      }
    }

    fetchProductDetail()

    return () => {
      isMounted = false
    }
  }, [detailProductId])

  function openDetailModal(productId: string) {
    setProductToDelete(null)
    setDetailProductId(productId)
    setDetailProduct(null)
    setDetailError(null)
  }

  function closeDetailModal() {
    setDetailProductId(null)
    setDetailProduct(null)
    setDetailError(null)
    setIsDetailLoading(false)
  }

  function getStockBadge(quantity: number, stockMinThreshold: number) {
    const status = getProductStockStatus(quantity, stockMinThreshold)

    if (status === "out-of-stock") {
      return { label: "Rupture", className: "status-blocked" }
    }

    if (status === "low-stock") {
      return { label: "Stock faible", className: "status-warning" }
    }

    return { label: "Disponible", className: "status-active" }
  }

  const detailCategoryName =
    detailProduct
      ? categories.find((category) => category.id === detailProduct.categoryId)?.name ??
        detailProduct.categoryId
      : ""

  const detailStock = detailProduct
    ? getStockBadge(detailProduct.stockQuantity, detailProduct.stockMinThreshold)
    : null

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Produits</h2>
          <p className="page-subtitle">
            Catalogue produits, gestion des prix et suivi du stock.
          </p>
        </div>

        <div className="clients-actions">
          <Link className="btn btn-primary" to="/products/new">
            <Plus size={16} />
            Ajouter produit
          </Link>
        </div>
      </div>

      <div className="clients-stats-grid">
        <article className="stat-card">
          <span>Total produits</span>
          <strong>{stats.totalProducts}</strong>
        </article>
        <article className="stat-card">
          <span>Unites en stock</span>
          <strong>{stats.totalStockUnits}</strong>
        </article>
        <article className="stat-card">
          <span>Valeur stock (achat)</span>
          <strong>{formatFcfa(stats.totalStockValuePurchase)}</strong>
        </article>
        <article className="stat-card">
          <span>Valeur stock (vente)</span>
          <strong>{formatFcfa(stats.totalStockValueSale)}</strong>
        </article>
      </div>

      <div className="products-toolbar-grid">
        <label className="search-input-wrap">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher par nom, code, catégorie"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
        </label>

        <label className="products-filter-field">
          <span>Catégorie</span>
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value)
              setPage(1)
            }}
            disabled={isLoadingCategories}
          >
            <option value="all">Toutes</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

      </div>

      <div className="clients-toolbar">
        <p className="clients-page-indicator">
          {startRow}-{endRow} sur {totalItems}
        </p>
      </div>

      {notice ? <p className="form-success-banner">{notice}</p> : null}

      {loadError ? <p className="form-error-banner">{loadError}</p> : null}

      <div className="table-wrap">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Prix achat</th>
              <th>Prix vente</th>
              <th>Marge</th>
              <th>Stock</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageProducts.map((product) => {
              const stock = getStockBadge(product.stockQuantity, product.stockMinThreshold)
              return (
                <tr key={product.id}>
                  <td>
                    <div className="client-main-cell">
                      <strong>{product.name}</strong>
                      <small>{product.sku}</small>
                    </div>
                  </td>
                  <td>{formatProductCategory(product.categoryName)}</td>
                  <td>{formatFcfa(product.costPrice)}</td>
                  <td>{formatFcfa(product.salePrice)}</td>
                  <td>{formatFcfa(product.salePrice - product.costPrice)}</td>
                  <td>{product.stockQuantity}</td>
                  <td>
                    <span className={`status-chip ${stock.className}`}>{stock.label}</span>
                  </td>
                  <td>
                    <div className="table-actions-icons">
                      <Link
                        to="#"
                        className="icon-action-btn"
                        aria-label={`Voir ${product.name}`}
                        onClick={(event) => {
                          event.preventDefault()
                          openDetailModal(product.id)
                        }}
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        to={`/products/${product.id}/edit`}
                        className="icon-action-btn"
                        aria-label={`Modifier ${product.name}`}
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        className="icon-action-btn danger"
                        aria-label={`Supprimer ${product.name}`}
                        onClick={() => setProductToDelete(product)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {!isLoading && currentPageProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="clients-empty-row">
                  Aucun produit trouvé.
                </td>
              </tr>
            ) : null}

            {isLoading ? (
              <tr>
                <td colSpan={8} className="clients-empty-row">
                  Chargement des produits...
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="clients-mobile-list">
        {currentPageProducts.map((product) => {
          const stock = getStockBadge(product.stockQuantity, product.stockMinThreshold)
          return (
            <article key={product.id} className="client-mobile-card">
              <div className="client-mobile-head">
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.sku}</small>
                </div>
                <span className={`status-chip ${stock.className}`}>{stock.label}</span>
              </div>

              <div className="client-mobile-grid">
                <p>
                  <span>Catégorie</span>
                  <strong>{formatProductCategory(product.categoryName)}</strong>
                </p>
                <p>
                  <span>Prix achat</span>
                  <strong>{formatFcfa(product.costPrice)}</strong>
                </p>
                <p>
                  <span>Prix vente</span>
                  <strong>{formatFcfa(product.salePrice)}</strong>
                </p>
                <p>
                  <span>Stock</span>
                  <strong>{product.stockQuantity}</strong>
                </p>
                <p>
                  <span>Ajouté le</span>
                  <strong>{formatDate(product.createdAt)}</strong>
                </p>
              </div>

              <div className="table-actions-icons">
                <Link
                  to="#"
                  className="icon-action-btn"
                  aria-label={`Voir ${product.name}`}
                  onClick={(event) => {
                    event.preventDefault()
                    openDetailModal(product.id)
                  }}
                >
                  <Eye size={15} />
                </Link>
                <Link
                  to={`/products/${product.id}/edit`}
                  className="icon-action-btn"
                  aria-label={`Modifier ${product.name}`}
                >
                  <Pencil size={15} />
                </Link>
                <button
                  type="button"
                  className="icon-action-btn danger"
                  aria-label={`Supprimer ${product.name}`}
                  onClick={() => setProductToDelete(product)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="clients-pagination">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={pageSafe === 1}
        >
          Précédent
        </button>

        <div className="clients-pagination-pages">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`page-chip ${pageNumber === pageSafe ? "active" : ""}`}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={pageSafe === totalPages}
        >
          Suivant
        </button>
      </div>

      {productToDelete ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setProductToDelete(null)}
        >
          <article
            className="modal-card modal-danger"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmer suppression produit"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Supprimer produit</h3>
              <button
                type="button"
                className="icon-action-btn"
                aria-label="Fermer"
                onClick={() => setProductToDelete(null)}
              >
                <X size={16} />
              </button>
            </div>

            <p className="modal-warning-text">
              Voulez-vous vraiment supprimer {productToDelete.name} ? Cette action
              est irreversible.
            </p>

            <div className="modal-actions">
              {deleteError ? <p className="form-error-banner">{deleteError}</p> : null}

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setProductToDelete(null)
                  setDeleteError(null)
                }}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </article>
        </div>
      ) : null}

      {detailProductId ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={closeDetailModal}
        >
          <article
            className="modal-card modal-product-detail"
            role="dialog"
            aria-modal="true"
            aria-label="Détail produit"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Détail produit</h3>
              <button
                type="button"
                className="icon-action-btn"
                aria-label="Fermer"
                onClick={closeDetailModal}
              >
                <X size={16} />
              </button>
            </div>

            {isDetailLoading ? (
              <p className="clients-empty-row">Chargement du détail produit...</p>
            ) : null}

            {detailError ? <p className="form-error-banner">{detailError}</p> : null}

            {detailProduct && !isDetailLoading ? (
              <div className="modal-product-detail-grid">
                <p>
                  <span>SKU</span>
                  <strong>{detailProduct.sku}</strong>
                </p>
                <p>
                  <span>Nom</span>
                  <strong>{detailProduct.name}</strong>
                </p>
                <p>
                  <span>Catégorie</span>
                  <strong>{detailCategoryName}</strong>
                </p>
                <p>
                  <span>Statut stock</span>
                  <strong className={detailStock?.className ? detailStock.className : ""}>
                    {detailStock?.label ?? "-"}
                  </strong>
                </p>
                <p>
                  <span>Prix achat</span>
                  <strong>{formatFcfa(detailProduct.costPrice)}</strong>
                </p>
                <p>
                  <span>Prix vente</span>
                  <strong>{formatFcfa(detailProduct.salePrice)}</strong>
                </p>
                <p>
                  <span>Marge unitaire</span>
                  <strong>{formatFcfa(detailProduct.salePrice - detailProduct.costPrice)}</strong>
                </p>
                <p>
                  <span>Stock</span>
                  <strong>{detailProduct.stockQuantity}</strong>
                </p>
                <p>
                  <span>Seuil minimum</span>
                  <strong>{detailProduct.stockMinThreshold}</strong>
                </p>
                <p>
                  <span>Statut API</span>
                  <strong>{detailProduct.status === "active" ? "Actif" : "Inactif"}</strong>
                </p>
                <p>
                  <span>Créé le</span>
                  <strong>{formatDate(detailProduct.createdAt)}</strong>
                </p>
                <p>
                  <span>Mis à jour le</span>
                  <strong>{formatDate(detailProduct.updatedAt)}</strong>
                </p>
              </div>
            ) : null}

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={closeDetailModal}>
                Fermer
              </button>
              {detailProduct ? (
                <Link className="btn btn-primary" to={`/products/${detailProduct.id}/edit`}>
                  Modifier
                </Link>
              ) : null}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}
