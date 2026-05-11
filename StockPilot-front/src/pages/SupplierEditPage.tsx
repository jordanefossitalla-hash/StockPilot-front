import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { getSupplierById } from "../features/suppliers/supplierData"
import {
  supplierFormSchema,
  type SupplierFormValues,
} from "../features/suppliers/supplierSchemas"

export function SupplierEditPage() {
  const navigate = useNavigate()
  const { supplierId } = useParams<{ supplierId: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supplier = supplierId ? getSupplierById(supplierId) : undefined

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: supplier?.name ?? "",
      phone: supplier?.phone ?? "",
      email: supplier?.email ?? "",
      address: supplier?.address ?? "",
      status: supplier?.status ?? "active",
      initialBalance:
        supplier ? supplier.debtTotal - supplier.paymentsTotal : 0,
    },
  })

  if (!supplier) {
    return <Navigate to="/suppliers" replace />
  }

  const onSubmit = handleSubmit(async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    navigate(`/suppliers/${supplier.id}`)
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Modifier fournisseur</h2>
          <p className="page-subtitle">Mise a jour de la fiche {supplier.name}.</p>
        </div>

        <div className="clients-actions">
          <Link to="/suppliers" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour a la liste
          </Link>
        </div>
      </div>

      <form className="client-form-card" onSubmit={onSubmit}>
        <div className="client-form-grid">
          <label className="field-block">
            <span>Nom fournisseur *</span>
            <input type="text" {...register("name")} />
            {errors.name ? <small>{errors.name.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Telephone *</span>
            <input type="tel" {...register("phone")} />
            {errors.phone ? <small>{errors.phone.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Email</span>
            <input type="email" {...register("email")} />
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
              {...register("initialBalance", { valueAsNumber: true })}
            />
            {errors.initialBalance ? <small>{errors.initialBalance.message}</small> : null}
          </label>

          <label className="field-block field-block-full">
            <span>Adresse</span>
            <textarea rows={4} {...register("address")} />
            {errors.address ? <small>{errors.address.message}</small> : null}
          </label>
        </div>

        <div className="client-form-actions">
          <Link to="/suppliers" className="btn btn-ghost">
            Liste fournisseurs
          </Link>
          <Link to={`/suppliers/${supplier.id}`} className="btn btn-ghost">
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
