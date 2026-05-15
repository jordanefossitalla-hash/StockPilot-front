import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "../features/categories/categorySchemas"
import { createCategory } from "../services/categoryService"

export function CategoryCreatePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await createCategory(values)
      navigate("/categories")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Création catégorie impossible."
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Ajouter catégorie</h2>
          <p className="page-subtitle">Création d une nouvelle catégorie.</p>
        </div>

        <div className="clients-actions">
          <Link to="/categories" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </div>
      </div>

      <form className="client-form-card" onSubmit={onSubmit}>
        {submitError ? <p className="form-error-banner">{submitError}</p> : null}

        <div className="client-form-grid">
          <label className="field-block">
            <span>Nom catégorie *</span>
            <input type="text" placeholder="Ex: Informatique" {...register("name")} />
            {errors.name ? <small>{errors.name.message}</small> : null}
          </label>

          <label className="field-block">
            <span>Statut</span>
            <select {...register("status")}>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
            {errors.status ? <small>{errors.status.message}</small> : null}
          </label>

          <label className="field-block field-block-full">
            <span>Description *</span>
            <textarea
              rows={4}
              placeholder="Description de la catégorie"
              {...register("description")}
            />
            {errors.description ? <small>{errors.description.message}</small> : null}
          </label>
        </div>

        <div className="client-form-actions">
          <Link to="/categories" className="btn btn-ghost">
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
