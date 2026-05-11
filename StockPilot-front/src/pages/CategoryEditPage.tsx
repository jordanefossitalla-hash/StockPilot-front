import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { getCategoryById } from "../features/categories/categoryData"
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "../features/categories/categorySchemas"

export function CategoryEditPage() {
  const navigate = useNavigate()
  const { categoryId } = useParams<{ categoryId: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const category = categoryId ? getCategoryById(categoryId) : undefined

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
      status: category?.status ?? "active",
    },
  })

  if (!category) {
    return <Navigate to="/categories" replace />
  }

  const onSubmit = handleSubmit(async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    navigate("/categories")
  })

  return (
    <section className="page clients-page">
      <div className="clients-page-head">
        <div>
          <h2 className="page-title">Modifier catégorie</h2>
          <p className="page-subtitle">Mise à jour de la catégorie {category.name}.</p>
        </div>

        <div className="clients-actions">
          <Link to="/categories" className="btn btn-ghost">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </div>
      </div>

      <form className="client-form-card" onSubmit={onSubmit}>
        <div className="client-form-grid">
          <label className="field-block">
            <span>Nom catégorie *</span>
            <input type="text" {...register("name")} />
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
            <textarea rows={4} {...register("description")} />
            {errors.description ? <small>{errors.description.message}</small> : null}
          </label>
        </div>

        <div className="client-form-actions">
          <Link to="/categories" className="btn btn-ghost">
            Liste catégories
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
