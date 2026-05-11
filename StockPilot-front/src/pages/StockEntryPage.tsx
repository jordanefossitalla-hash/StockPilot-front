import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { StockSubnav } from "../components/StockSubnav"
import { stockItemsData } from "../features/stock/stockData"
import {
  stockEntrySchema,
  type StockEntryFormValues,
} from "../features/stock/stockSchemas"

export function StockEntryPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StockEntryFormValues>({
    resolver: zodResolver(stockEntrySchema),
    defaultValues: {
      productId: stockItemsData[0]?.productId ?? "",
      quantity: 1,
      reason: "Reapprovisionnement",
      reference: "",
    },
  })

  const onSubmit = handleSubmit(async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    navigate("/stock")
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

      <form className="client-form-card" onSubmit={onSubmit}>
        <div className="client-form-grid">
          <label className="field-block field-block-full">
            <span>Produit *</span>
            <select {...register("productId")}>
              {stockItemsData.map((item) => (
                <option key={item.id} value={item.productId}>
                  {item.productName} ({item.productId})
                </option>
              ))}
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

          <label className="field-block field-block-full">
            <span>Motif *</span>
            <textarea rows={3} {...register("reason")} />
            {errors.reason ? <small>{errors.reason.message}</small> : null}
          </label>
        </div>

        <div className="client-form-actions">
          <Link to="/stock" className="btn btn-ghost">
            Annuler
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <Save size={16} />
            {isSubmitting ? "Traitement..." : "Valider entrée"}
          </button>
        </div>
      </form>
    </section>
  )
}
