import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  supplierFormSchema,
  type SupplierFormValues,
} from "../features/suppliers/supplierSchemas"
import type { Supplier } from "../features/suppliers/supplierTypes"
import { getSupplierByIdApi, updateSupplier } from "../services/supplierService"

const supplierEditFormSchema = supplierFormSchema.omit({ initialBalance: true })
type SupplierEditFormValues = Omit<SupplierFormValues, "initialBalance">

export function SupplierEditPage() {
  const navigate = useNavigate()
  const { supplierId } = useParams<{ supplierId: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SupplierEditFormValues>({
    resolver: zodResolver(supplierEditFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
    },
  })

  useEffect(() => {
    let isMounted = true

    async function loadSupplier() {
      if (!supplierId) {
        setLoadError("Fournisseur introuvable.")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        const result = await getSupplierByIdApi(supplierId)

        if (!isMounted) {
          return
        }

        setSupplier(result)
        setSubmitError(null)
        reset({
          name: result.name,
          phone: result.phone,
          email: result.email ?? "",
          address: result.address ?? "",
          status: result.status,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message = error instanceof Error ? error.message : "Fournisseur introuvable."
        setLoadError(message)
        setSupplier(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSupplier()

    return () => {
      isMounted = false
    }
  }, [reset, supplierId])

  if (isLoading) {
    return (
      <section className="page clients-page">
        <p className="clients-empty-row">Chargement du fournisseur...</p>
      </section>
    )
  }

  if (loadError || !supplier) {
    return (
      <section className="page clients-page">
        <p className="form-error-banner">{loadError ?? "Fournisseur introuvable."}</p>
        <div className="clients-actions">
          <Link to="/suppliers" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </div>
      </section>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    if (!isDirty) {
      setSubmitError("Aucune modification detectee. Modifiez au moins un champ.")
      return
    }

    setIsSubmitting(true)

    try {
      await updateSupplier(supplier.id, {
        name: values.name,
        phone: values.phone,
        email: values.email,
        address: values.address,
        status: values.status,
        initialBalance: supplier.debtTotal - supplier.paymentsTotal,
      })

      navigate("/suppliers", {
        replace: true,
        state: { notice: "Fournisseur modifie avec succes." },
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Mise a jour fournisseur impossible."
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Modifier fournisseur</h2>
          <p className="page-subtitle">Mise à jour de la fiche {supplier.name}.</p>
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
              <input type="text" value={supplier.code ?? supplier.id} readOnly />
              <small className="field-help">Code de référence utilisé côté API.</small>
            </label>

            <label className="field-block supplier-field-block supplier-field-block-wide">
              <span>Nom fournisseur *</span>
              <input type="text" {...register("name")} />
              {errors.name ? <small>{errors.name.message}</small> : null}
            </label>
          </div>

          <div className="supplier-form-row">
            <label className="field-block supplier-field-block">
              <span>Téléphone *</span>
              <input type="tel" {...register("phone")} />
              {errors.phone ? <small>{errors.phone.message}</small> : null}
            </label>

            <label className="field-block supplier-field-block">
              <span>Email</span>
              <input type="email" {...register("email")} />
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
          </div>

          <label className="field-block supplier-field-block field-block-full">
            <span>Adresse</span>
            <textarea rows={4} {...register("address")} />
            {errors.address ? <small>{errors.address.message}</small> : null}
          </label>
        </div>

        {submitError ? <p className="form-error-banner">{submitError}</p> : null}

        <div className="client-form-actions">
          <Link to="/suppliers" className="btn btn-ghost">
            Liste fournisseurs
          </Link>
          <Link to={`/suppliers/${supplier.id}`} className="btn btn-ghost">
            Retour au detail
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !isDirty}
          >
            <Save size={16} />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  )
}
