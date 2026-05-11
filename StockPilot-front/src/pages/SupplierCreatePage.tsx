import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import {
  supplierFormSchema,
  type SupplierFormValues,
} from "../features/suppliers/supplierSchemas"

export function SupplierCreatePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
      initialBalance: 0,
    },
  })

  const onSubmit = handleSubmit(async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    navigate("/suppliers")
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Ajouter fournisseur</h2>
          <p className="page-subtitle">Création d une nouvelle fiche fournisseur.</p>
        </div>
      </div>

      <form className="client-form-card" onSubmit={onSubmit}>
        <div className="client-form-grid">
          <label className="field-block">
            <span>Nom fournisseur *</span>
            <input type="text" placeholder="Ex: TechSource CI" {...register("name")} />
            {errors.name ? <small>{errors.name.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Téléphone *</span>
            <input type="tel" placeholder="Ex: +2250700000000" {...register("phone")} />
            {errors.phone ? <small>{errors.phone.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Email</span>
            <input type="email" placeholder="contact@fournisseur.ci" {...register("email")} />
            {errors.email ? <small>{errors.email.message}</small> : null}
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
            <span>Solde initial (FCFA)</span>
            <input
              type="number"
              step={1000}
              placeholder="Ex: 0, 80000 ou -15000"
              {...register("initialBalance", { valueAsNumber: true })}
            />
            {errors.initialBalance ? <small>{errors.initialBalance.message}</small> : null}
          </label>

          <label className="field-block field-block-full">
            <span>Adresse</span>
            <textarea
              rows={4}
              placeholder="Commune, ville, details logistiques"
              {...register("address")}
            />
            {errors.address ? <small>{errors.address.message}</small> : null}
          </label>
        </div>

        <div className="client-form-actions">
          <Link to="/suppliers" className="btn btn-ghost">
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
