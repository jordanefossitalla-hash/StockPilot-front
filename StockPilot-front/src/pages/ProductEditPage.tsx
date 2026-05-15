import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useParams } from "react-router-dom"
import type { Category } from "../features/categories/categoryTypes"
import {
  createProductFormSchema,
  type CreateProductFormValues,
} from "../features/products/productSchemas"
import { listCategories } from "../services/categoryService"
import {
  getProductByIdApi,
  updateProduct,
  type ProductDetail,
} from "../services/productService"

export function ProductEditPage() {
  const navigate = useNavigate()
  const { productId } = useParams<{ productId: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductFormSchema),
    mode: "onChange",
    defaultValues: {
      sku: "",
      name: "",
      categoryId: "",
      costPrice: 0,
      salePrice: 0,
      stockQuantity: 0,
      stockMinThreshold: 0,
      status: "active",
    },
  })

  useEffect(() => {
    let isMounted = true

    async function loadProduct() {
      if (!productId) {
        setLoadError("Produit introuvable.")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        const [productResult, categoriesResult] = await Promise.all([
          getProductByIdApi(productId),
          listCategories({ page: 1, limit: 100 }),
        ])

        if (!isMounted) {
          return
        }

        setProduct(productResult)
        setCategories(categoriesResult.data)
        setSubmitError(null)
        reset({
          sku: productResult.sku,
          name: productResult.name,
          categoryId: productResult.categoryId,
          costPrice: productResult.costPrice,
          salePrice: productResult.salePrice,
          stockQuantity: productResult.stockQuantity,
          stockMinThreshold: productResult.stockMinThreshold,
          status: productResult.status,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setLoadError(error instanceof Error ? error.message : "Produit introuvable.")
        setProduct(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProduct()

    return () => {
      isMounted = false
    }
  }, [productId, reset])

  if (isLoading) {
    return (
      <section className="page clients-page">
        <p className="clients-empty-row">Chargement du produit...</p>
      </section>
    )
  }

  if (loadError || !product) {
    return (
      <section className="page clients-page">
        <p className="form-error-banner">{loadError ?? "Produit introuvable."}</p>
        <div className="clients-actions">
          <Link to="/products" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </div>
      </section>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    if (!isDirty) {
      setSubmitError("Aucune modification detectee. Modifiez au moins un champ.")
      return
    }

    setIsSubmitting(true)

    try {
      await updateProduct(product.id, values)
      navigate("/products", {
        replace: true,
        state: { notice: "Produit modifie avec succes." },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Mise à jour produit impossible.",
      )
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Modifier produit</h2>
          <p className="page-subtitle">Mise à jour de la fiche {product.name}.</p>
        </div>

        <div className="clients-actions">
          <Link to="/products" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </div>
      </div>

      <form className="client-form-card" onSubmit={onSubmit}>
        {submitError ? <p className="form-error-banner">{submitError}</p> : null}

        <div className="client-form-grid">
          <label className="field-block">
            <span>SKU *</span>
            <input type="text" {...register("sku")} />
            {errors.sku ? <small>{errors.sku.message}</small> : null}
          </label>

          <label className="field-block field-block-full">
            <span>Nom produit *</span>
            <input type="text" {...register("name")} />
            {errors.name ? <small>{errors.name.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Catégorie *</span>
            <select {...register("categoryId")}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId ? <small>{errors.categoryId.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Statut</span>
            <select {...register("status")}>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
            {errors.status ? <small>{errors.status.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Prix achat (FCFA) *</span>
            <input
              type="number"
              min={1}
              {...register("costPrice", { valueAsNumber: true })}
            />
            {errors.costPrice ? <small>{errors.costPrice.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Prix vente (FCFA) *</span>
            <input
              type="number"
              min={1}
              {...register("salePrice", { valueAsNumber: true })}
            />
            {errors.salePrice ? <small>{errors.salePrice.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Stock *</span>
            <input
              type="number"
              min={0}
              {...register("stockQuantity", { valueAsNumber: true })}
            />
            {errors.stockQuantity ? <small>{errors.stockQuantity.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Seuil minimum *</span>
            <input
              type="number"
              min={0}
              {...register("stockMinThreshold", { valueAsNumber: true })}
            />
            {errors.stockMinThreshold ? <small>{errors.stockMinThreshold.message}</small> : null}
          </label>
        </div>

        <div className="client-form-actions">
          <Link to="/products" className="btn btn-ghost">
            Liste produits
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !isDirty}
          >
            <Save size={16} />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  )
}
