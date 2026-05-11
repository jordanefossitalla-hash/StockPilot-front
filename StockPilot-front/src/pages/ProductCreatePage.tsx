import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import {
  productFormSchema,
  type ProductFormValues,
} from "../features/products/productSchemas"

export function ProductCreatePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category: "informatique",
      purchasePrice: 0,
      salePrice: 0,
      quantity: 0,
    },
  })

  const onSubmit = handleSubmit(async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    navigate("/products")
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Ajouter produit</h2>
          <p className="page-subtitle">Creation d une nouvelle fiche produit.</p>
        </div>
      </div>

      <form className="client-form-card" onSubmit={onSubmit}>
        <div className="client-form-grid">
          <label className="field-block field-block-full">
            <span>Nom produit *</span>
            <input type="text" placeholder="Ex: POS Terminal T20" {...register("name")} />
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
            Annuler
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <Save size={16} />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  )
}
