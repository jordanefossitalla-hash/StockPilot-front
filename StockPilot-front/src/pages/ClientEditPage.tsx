import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { getClientById } from "../features/clients/clientData"
import {
  clientFormSchema,
  type ClientFormValues,
} from "../features/clients/clientSchemas"

export function ClientEditPage() {
  const navigate = useNavigate()
  const { clientId } = useParams<{ clientId: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const client = clientId ? getClientById(clientId) : undefined

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name ?? "",
      phone: client?.phone ?? "",
      email: client?.email ?? "",
      address: client?.address ?? "",
      status: client?.status ?? "active",
    },
  })

  if (!client) {
    return <Navigate to="/clients" replace />
  }

  const onSubmit = handleSubmit(async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    navigate(`/clients/${client.id}`)
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Modifier client</h2>
          <p className="page-subtitle">Mise a jour de la fiche {client.name}.</p>
        </div>
        <div className="clients-actions">
          <Link to="/clients" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour a la liste
          </Link>
        </div>
      </div>

      <form className="client-form-card" onSubmit={onSubmit}>
        <div className="client-form-grid">
          <label className="field-block">
            <span>Nom complet *</span>
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
              <option value="blocked">Bloque</option>
            </select>
            {errors.status ? <small>{errors.status.message}</small> : null}
          </label>

          <label className="field-block field-block-full">
            <span>Adresse</span>
            <textarea rows={4} {...register("address")} />
            {errors.address ? <small>{errors.address.message}</small> : null}
          </label>
        </div>

        <div className="client-form-actions">
          <Link to="/clients" className="btn btn-ghost">
            Liste clients
          </Link>
          <Link to={`/clients/${client.id}`} className="btn btn-ghost">
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
