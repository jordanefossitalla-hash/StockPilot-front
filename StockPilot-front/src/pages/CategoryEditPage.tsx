import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "../features/categories/categorySchemas"
import type { Category } from "../features/categories/categoryTypes"
import { getCategoryByIdApi, updateCategory } from "../services/categoryService"

export function CategoryEditPage() {
  const navigate = useNavigate()
  const { categoryId } = useParams<{ categoryId: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [category, setCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      status: "active",
    },
  })

  useEffect(() => {
    let isMounted = true

    async function loadCategory() {
      if (!categoryId) {
        setLoadError("Catégorie introuvable.")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        const result = await getCategoryByIdApi(categoryId)

        if (!isMounted) {
          return
        }

        setCategory(result)
        setSubmitError(null)
        reset({
          name: result.name,
          description: result.description,
          status: result.status,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message = error instanceof Error ? error.message : "Catégorie introuvable."
        setLoadError(message)
        setCategory(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadCategory()

    return () => {
      isMounted = false
    }
  }, [categoryId, reset])

  if (isLoading) {
    return (
      <section className="page clients-page">
        <p className="clients-empty-row">Chargement de la catégorie...</p>
      </section>
    )
  }

  if (loadError || !category) {
    return (
      <section className="page clients-page">
        <p className="form-error-banner">{loadError ?? "Catégorie introuvable."}</p>
        <div className="clients-actions">
          <Link to="/categories" className="btn btn-ghost">
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
      await updateCategory(category.id, values)
      navigate("/categories", {
        replace: true,
        state: { notice: "Catégorie modifiée avec succès." },
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Mise à jour catégorie impossible."
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
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
        {submitError ? <p className="form-error-banner">{submitError}</p> : null}

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
