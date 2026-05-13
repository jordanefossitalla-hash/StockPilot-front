import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import {
  clientFormSchema,
  type ClientFormValues,
} from "../features/clients/clientSchemas"
import { createClient, getNextClientCode } from "../services/clientService"

export function ClientCreatePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCode, setIsLoadingCode] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      code: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
      initialBalance: 0,
    },
  })

  useEffect(() => {
    let isActive = true

    async function hydrateClientCode() {
      setIsLoadingCode(true)
      try {
        const nextCode = await getNextClientCode()
        if (!isActive) {
          return
        }
        if (!getValues("code").trim()) {
          setValue("code", nextCode)
        }
      } finally {
        if (isActive) {
          setIsLoadingCode(false)
        }
      }
    }

    void hydrateClientCode()

    return () => {
      isActive = false
    }
  }, [getValues, setValue])

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await createClient(values)
      navigate("/clients")
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Creation client impossible. Veuillez reessayer.",
      )
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Ajouter client</h2>
          <p className="page-subtitle">Créer une nouvelle fiche client.</p>
        </div>
      </div>

      <form className="client-form-card" onSubmit={onSubmit}>
        {submitError ? <p className="auth-error">{submitError}</p> : null}

        <div className="client-form-grid">
          <label className="field-block">
            <span>Code client *</span>
            <input
              type="text"
              placeholder="Ex: CLI-0010"
              {...register("code")}
            />
            {errors.code ? <small>{errors.code.message}</small> : null}
            {isLoadingCode ? <small>Generation auto en cours (modifiable).</small> : null}
          </label>

          <label className="field-block">
            <span>Nom complet *</span>
            <input
              type="text"
              placeholder="Ex: Yao N'Guessan"
              {...register("name")}
            />
            {errors.name ? <small>{errors.name.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Téléphone *</span>
            <input
              type="tel"
              placeholder="Ex: +2250700000000"
              {...register("phone")}
            />
            {errors.phone ? <small>{errors.phone.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Email</span>
            <input
              type="email"
              placeholder="client@entreprise.ci"
              {...register("email")}
            />
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
              step={1000}
              placeholder="Ex: 0, 50000 ou -25000"
              {...register("initialBalance", { valueAsNumber: true })}
            />
            {errors.initialBalance ? <small>{errors.initialBalance.message}</small> : null}
          </label>

          <label className="field-block field-block-full">
            <span>Adresse</span>
            <textarea
              rows={4}
              placeholder="Commune, ville, point de repere"
              {...register("address")}
            />
            {errors.address ? <small>{errors.address.message}</small> : null}
          </label>
        </div>

        <div className="client-form-actions">
          <Link to="/clients" className="btn btn-ghost">
            Annuler
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            <Save size={16} />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  )
}
