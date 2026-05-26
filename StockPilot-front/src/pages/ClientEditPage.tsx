import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import {
  clientFormSchema,
  type ClientFormValues,
} from "../features/clients/clientSchemas"
import type { Client } from "../features/clients/clientTypes"
import { getClientByIdApi, updateClient } from "../services/clientService"

type EditLocationState = {
  client?: Client
}

export function ClientEditPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { clientId } = useParams<{ clientId: string }>()
  const [client, setClient] = useState<Client | null>(
    (location.state as EditLocationState | null)?.client ?? null,
  )
  const [isLoading, setIsLoading] = useState(!((location.state as EditLocationState | null)?.client))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      code: client?.code ?? "",
      name: client?.name ?? "",
      phone: client?.phone ?? "",
      email: client?.email ?? "",
      address: client?.address ?? "",
      status: client?.status ?? "active",
      initialBalance: client?.debtTotal ?? 0,
    },
  })

  useEffect(() => {
    if (!client) {
      return
    }

    reset({
      code: client.code ?? "",
      name: client.name,
      phone: client.phone,
      email: client.email ?? "",
      address: client.address ?? "",
      status: client.status,
      initialBalance: client.debtTotal,
    })
  }, [client, reset])

  useEffect(() => {
    let isMounted = true

    async function loadClient() {
      if (!clientId) {
        setClient(null)
        setIsLoading(false)
        return
      }

      if (client && client.id === clientId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setSubmitError(null)

      try {
        const result = await getClientByIdApi(clientId)

        if (!isMounted) {
          return
        }

        setClient(result)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setSubmitError(
          error instanceof Error
            ? error.message
            : "Chargement du client impossible.",
        )
        setClient(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadClient()

    return () => {
      isMounted = false
    }
  }, [client, clientId])

  if (!clientId) {
    return null
  }

  if (isLoading) {
    return (
      <section className="page clients-page">
        <p className="clients-empty-row">Chargement du client...</p>
      </section>
    )
  }

  if (!client || client.id !== clientId) {
    return (
      <section className="page clients-page">
        <p className="form-error-banner">{submitError ?? "Client introuvable."}</p>
        <div className="clients-actions">
          <Link to="/clients" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </div>
      </section>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const updated = await updateClient(client.id, values)
      navigate("/clients", { replace: true, state: { updatedClientId: updated.id } })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Modification client impossible. Veuillez reessayer.",
      )
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Modifier client</h2>
          <p className="page-subtitle">Mise à jour de la fiche {client.name}.</p>
        </div>
        <div className="clients-actions">
          <Link to="/clients" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </div>
      </div>

      <form className="client-form-card" onSubmit={onSubmit}>
        {submitError ? <p className="auth-error">{submitError}</p> : null}

        <div className="client-form-grid">
          <label className="field-block">
            <span>Code client</span>
            <input type="text" readOnly {...register("code")} />
            {errors.code ? <small>{errors.code.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Nom complet *</span>
            <input type="text" {...register("name")} />
            {errors.name ? <small>{errors.name.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Téléphone *</span>
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
              <option value="blocked">Bloqué</option>
            </select>
            {errors.status ? <small>{errors.status.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Solde initial (FCFA)</span>
            <input
              type="number"
              step={1}
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
          <Link to="/clients" className="btn btn-ghost">
            Liste clients
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
