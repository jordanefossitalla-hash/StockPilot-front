import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { StockSubnav } from "../components/StockSubnav"
import {
  stockEntrySchema,
  type StockEntryFormValues,
} from "../features/stock/stockSchemas"
import { listProducts, type ProductListItem } from "../services/productService"
import { createStockEntry } from "../services/stockService"

export function StockEntryPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StockEntryFormValues>({
    resolver: zodResolver(stockEntrySchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      unitCost: 0,
      reference: "",
      note: "",
    },
  })

  useEffect(() => {
    let isActive = true

    async function fetchProducts() {
      setIsLoadingProducts(true)

      try {
        const result = await listProducts({
          status: "active",
          page: 1,
          limit: 100,
        })

        if (!isActive) {
          return
        }

        setProducts(result.data)
        setValue("productId", result.data[0]?.id ?? "")
      } catch {
        if (!isActive) {
          return
        }

        setProducts([])
        setValue("productId", "")
      } finally {
        if (isActive) {
          setIsLoadingProducts(false)
        }
      }
    }

    void fetchProducts()

    return () => {
      isActive = false
    }
  }, [setValue])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await createStockEntry({
        productId: values.productId,
        quantity: values.quantity,
        unitCost: values.unitCost,
        reference: values.reference,
        note: values.note,
      })

      navigate("/stock")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Entrée stock impossible.")
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Entrée stock</h2>
          <p className="page-subtitle">Ajout de quantité sur un produit.</p>
        </div>

        <div className="clients-actions">
          <Link to="/stock" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour à l'état du stock
          </Link>
        </div>
      </div>

      <StockSubnav />

      {submitError ? <p className="form-error-banner">{submitError}</p> : null}

      <form className="client-form-card" onSubmit={onSubmit}>
        <div className="client-form-grid">
          <label className="field-block field-block-full">
            <span>Produit *</span>
            <select {...register("productId")} disabled={isLoadingProducts || products.length === 0}>
              {products.length === 0 ? (
                <option value="">Aucun produit disponible</option>
              ) : (
                products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku})
                </option>
                ))
              )}
            </select>
            {errors.productId ? <small>{errors.productId.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Quantité ajoutée *</span>
            <input type="number" min={1} {...register("quantity", { valueAsNumber: true })} />
            {errors.quantity ? <small>{errors.quantity.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Référence</span>
            <input type="text" placeholder="BON-4455" {...register("reference")} />
            {errors.reference ? <small>{errors.reference.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Coût unitaire *</span>
            <input type="number" min={1} step="0.01" {...register("unitCost", { valueAsNumber: true })} />
            {errors.unitCost ? <small>{errors.unitCost.message}</small> : null}
          </label>

          <label className="field-block field-block-full">
            <span>Note</span>
            <textarea rows={3} {...register("note")} />
            {errors.note ? <small>{errors.note.message}</small> : null}
          </label>
        </div>

        <div className="client-form-actions">
          <Link to="/stock" className="btn btn-ghost">
            Annuler
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || isLoadingProducts || products.length === 0}>
            <Save size={16} />
            {isSubmitting ? "Traitement..." : "Valider entrée"}
          </button>
        </div>
      </form>
    </section>
  )
}
