import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import {
  createProductFormSchema,
  type CreateProductFormValues,
} from "../features/products/productSchemas"
import type { Category } from "../features/categories/categoryTypes"
import { listCategories } from "../services/categoryService"
import { createProduct } from "../services/productService"

export function ProductCreatePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductFormSchema),
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

    async function fetchCategories() {
      setIsLoadingCategories(true)
      setLoadError(null)

      try {
        const response = await listCategories({ page: 1, limit: 100, status: "active" })

        if (!isMounted) {
          return
        }

        setCategories(response.data)
        reset((currentValues) => ({
          ...currentValues,
          categoryId: currentValues.categoryId || response.data[0]?.id || "",
        }))
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error ? error.message : "Chargement catégories impossible."
        setLoadError(message)
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
  }, [reset])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await createProduct(values)
      navigate("/products", {
        replace: true,
        state: { notice: "Produit cree avec succes." },
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Création produit impossible."
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Ajouter produit</h2>
          <p className="page-subtitle">Création d une nouvelle fiche produit.</p>
        </div>

        <div className="clients-actions">
          <Link to="/products" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </div>
      </div>

      <form className="client-form-card" onSubmit={onSubmit}>
        {loadError ? <p className="form-error-banner">{loadError}</p> : null}
        {submitError ? <p className="form-error-banner">{submitError}</p> : null}

        <div className="client-form-grid">
          <label className="field-block">
            <span>SKU *</span>
            <input type="text" placeholder="Ex: SKU-0001" {...register("sku")} />
            {errors.sku ? <small>{errors.sku.message}</small> : null}
          </label>

          <label className="field-block field-block-full">
            <span>Nom produit *</span>
            <input type="text" placeholder="Ex: POS Terminal T20" {...register("name")} />
            {errors.name ? <small>{errors.name.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Catégorie *</span>
            <select {...register("categoryId")} disabled={isLoadingCategories || categories.length === 0}>
              {categories.length === 0 ? (
                <option value="">
                  {isLoadingCategories ? "Chargement..." : "Aucune catégorie disponible"}
                </option>
              ) : null}
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
            <span>Stock initial *</span>
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
            Annuler
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isLoadingCategories || categories.length === 0}
          >
            <Save size={16} />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  )
}
