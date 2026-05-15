import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import {
  supplierFormSchema,
  type SupplierFormValues,
} from "../features/suppliers/supplierSchemas"
import { createSupplier, getNextSupplierCode } from "../services/supplierService"

export function SupplierCreatePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supplierCode, setSupplierCode] = useState("")
  const [isLoadingCode, setIsLoadingCode] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)

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

  useEffect(() => {
    let isMounted = true

    async function loadSupplierCode() {
      try {
        const nextCode = await getNextSupplierCode()
        if (isMounted) {
          setSupplierCode(nextCode)
        }
      } finally {
        if (isMounted) {
          setIsLoadingCode(false)
        }
      }
    }

    loadSupplierCode()

    return () => {
      isMounted = false
    }
  }, [])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    if (!supplierCode) {
      setSubmitError("Impossible de générer le code fournisseur. Réessayez.")
      return
    }

    const normalizedCode = supplierCode.trim().toUpperCase()
    if (!/^SUP-\d{4,}$/.test(normalizedCode)) {
      setSubmitError("Code fournisseur invalide. Format attendu: SUP-0001")
      return
    }

    setIsSubmitting(true)

    try {
      await createSupplier({
        code: normalizedCode,
        name: values.name,
        phone: values.phone,
        email: values.email,
        address: values.address,
        status: values.status,
        initialBalance: values.initialBalance,
      })
      navigate("/suppliers")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Création fournisseur impossible."
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Ajouter fournisseur</h2>
          <p className="page-subtitle">Création d une nouvelle fiche fournisseur.</p>
        </div>

        <div className="clients-actions">
          <Link to="/suppliers" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </div>
      </div>

      <form className="client-form-card supplier-form-card" onSubmit={onSubmit}>
        <div className="supplier-form-layout">
          <div className="supplier-form-row supplier-form-row-identity">
            <label className="field-block supplier-field-block">
              <span>Code fournisseur</span>
              <input
                type="text"
                value={supplierCode}
                placeholder={isLoadingCode ? "Génération..." : "SUP-0001"}
                onChange={(event) => setSupplierCode(event.target.value.toUpperCase())}
                disabled={isLoadingCode}
                maxLength={20}
              />
              <small className="field-help">
                Vous pouvez modifier le code proposé (format: SUP-0001).
              </small>
            </label>

            <label className="field-block supplier-field-block supplier-field-block-wide">
              <span>Nom fournisseur *</span>
              <input type="text" placeholder="Ex: TechSource CI" {...register("name")} />
              {errors.name ? <small>{errors.name.message}</small> : null}
            </label>
          </div>

          <div className="supplier-form-row">
            <label className="field-block supplier-field-block">
              <span>Téléphone *</span>
              <input type="tel" placeholder="Ex: +2250700000000" {...register("phone")} />
              {errors.phone ? <small>{errors.phone.message}</small> : null}
            </label>

            <label className="field-block supplier-field-block">
              <span>Email</span>
              <input type="email" placeholder="contact@fournisseur.ci" {...register("email")} />
              {errors.email ? <small>{errors.email.message}</small> : null}
            </label>
          </div>

          <div className="supplier-form-row">
            <label className="field-block supplier-field-block">
              <span>Statut</span>
              <select {...register("status")}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
              {errors.status ? <small>{errors.status.message}</small> : null}
            </label>

            <label className="field-block supplier-field-block">
              <span>Solde initial (FCFA)</span>
              <input
                type="number"
                step={1000}
                placeholder="Ex: 0, 80000 ou -15000"
                {...register("initialBalance", { valueAsNumber: true })}
              />
              <small className="field-help">
                Positif = avance chez le fournisseur, negatif = dette a regler.
              </small>
              {errors.initialBalance ? <small>{errors.initialBalance.message}</small> : null}
            </label>
          </div>

          <label className="field-block supplier-field-block field-block-full">
            <span>Adresse</span>
            <textarea
              rows={4}
              placeholder="Commune, ville, details logistiques"
              {...register("address")}
            />
            {errors.address ? <small>{errors.address.message}</small> : null}
          </label>
        </div>

        {submitError ? <p className="form-error-banner">{submitError}</p> : null}

        <div className="client-form-actions">
          <Link to="/suppliers" className="btn btn-ghost">
            Annuler
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isLoadingCode}
          >
            <Save size={16} />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  )
}
