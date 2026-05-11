import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { getProductById } from "../features/products/productData"
import {
  productFormSchema,
  type ProductFormValues,
} from "../features/products/productSchemas"

export function ProductEditPage() {
  const navigate = useNavigate()
  const { productId } = useParams<{ productId: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const product = productId ? getProductById(productId) : undefined

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      category: product?.category ?? "informatique",
      purchasePrice: product?.purchasePrice ?? 0,
      salePrice: product?.salePrice ?? 0,
      quantity: product?.quantity ?? 0,
    },
  })

  if (!product) {
    return <Navigate to="/products" replace />
  }

  const onSubmit = handleSubmit(async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    navigate(`/products/${product.id}`)
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Modifier produit</h2>
          <p className="page-subtitle">Mise a jour de la fiche {product.name}.</p>
        </div>

        <div className="clients-actions">
          <Link to="/products" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour a la liste
          </Link>
        </div>
      </div>

      <form className="client-form-card" onSubmit={onSubmit}>
        <div className="client-form-grid">
          <label className="field-block field-block-full">
            <span>Nom produit *</span>
            <input type="text" {...register("name")} />
            {errors.name ? <small>{errors.name.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Categorie *</span>
            <select {...register("category")}>
              <option value="informatique">Informatique</option>
              <option value="electromenager">Electromenager</option>
              <option value="accessoire">Accessoire</option>
              <option value="consommable">Consommable</option>
            </select>
            {errors.category ? <small>{errors.category.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Quantite *</span>
            <input type="number" min={0} {...register("quantity", { valueAsNumber: true })} />
            {errors.quantity ? <small>{errors.quantity.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Prix achat (FCFA) *</span>
            <input
              type="number"
              min={1}
              {...register("purchasePrice", { valueAsNumber: true })}
            />
            {errors.purchasePrice ? <small>{errors.purchasePrice.message}</small> : null}
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
        </div>

        <div className="client-form-actions">
          <Link to="/products" className="btn btn-ghost">
            Liste produits
          </Link>
          <Link to={`/products/${product.id}`} className="btn btn-ghost">
            Retour detail
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <Save size={16} />
            {isSubmitting ? "Mise a jour..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </section>
  )
}
