import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useSearchParams } from "react-router-dom"
import { z } from "zod"
import { AuthLayout } from "../components/AuthLayout"
import { authService } from "../services/authService"

const resetSchema = z
  .object({
    token: z.string().min(6, "Le token de réinitialisation est requis."),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(8, "Confirmation requise."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  })

type ResetFormValues = z.infer<typeof resetSchema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const tokenFromQuery = searchParams.get("token") ?? ""
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: tokenFromQuery,
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: ResetFormValues) {
    setIsSubmitting(true)
    setSuccess(null)
    setError(null)

    try {
      await authService.resetPassword({
        token: values.token,
        password: values.password,
      })
      setSuccess("Mot de passe mis à jour avec succès.")
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "La réinitialisation a échoué."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Réinitialiser le mot de passe"
      subtitle="Définissez un nouveau mot de passe sécurisé pour votre compte."
      footer={
        <Link to="/login" className="auth-link">
          Retour à la connexion
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        <label className="auth-label" htmlFor="token">
          Token de réinitialisation
        </label>
        <div className="auth-input-wrap">
          <ShieldCheck size={16} />
          <input id="token" type="text" placeholder="Token" {...register("token")} />
        </div>
        {errors.token ? <p className="auth-error">{errors.token.message}</p> : null}

        <label className="auth-label" htmlFor="password">
          Nouveau mot de passe
        </label>
        <div className="auth-input-wrap">
          <KeyRound size={16} />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="********"
            {...register("password")}
          />
          <button
            type="button"
            className="auth-ghost-btn"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password ? <p className="auth-error">{errors.password.message}</p> : null}

        <label className="auth-label" htmlFor="confirmPassword">
          Confirmer le mot de passe
        </label>
        <div className="auth-input-wrap">
          <KeyRound size={16} />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="********"
            {...register("confirmPassword")}
          />
          <button
            type="button"
            className="auth-ghost-btn"
            aria-label={
              showConfirmPassword
                ? "Masquer la confirmation"
                : "Afficher la confirmation"
            }
            onClick={() => setShowConfirmPassword((current) => !current)}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword ? (
          <p className="auth-error">{errors.confirmPassword.message}</p>
        ) : null}

        {success ? <p className="auth-success">{success}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        <button className="auth-submit-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </form>
    </AuthLayout>
  )
}
