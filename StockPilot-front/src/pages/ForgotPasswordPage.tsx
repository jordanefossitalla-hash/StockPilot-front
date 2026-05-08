import { zodResolver } from "@hookform/resolvers/zod"
import { Mail } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { z } from "zod"
import { AuthLayout } from "../components/AuthLayout"
import { authService } from "../services/authService"

const forgotSchema = z.object({
  email: z.string().email("Saisissez une adresse email valide."),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: ForgotFormValues) {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      await authService.forgotPassword({ email: values.email })
      setSuccess("Un email de reinitialisation a ete envoye.")
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Envoi impossible pour le moment."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Mot de passe oublie"
      subtitle="Entrez votre email de recuperation pour recevoir un lien de reinitialisation."
      footer={
        <Link to="/login" className="auth-link">
          Retour a la connexion
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        <label className="auth-label" htmlFor="email">
          Email
        </label>
        <div className="auth-input-wrap">
          <Mail size={16} />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="contact@stockpilot.app"
            {...register("email")}
          />
        </div>
        {errors.email ? <p className="auth-error">{errors.email.message}</p> : null}

        {success ? <p className="auth-success">{success}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        <button className="auth-submit-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>
    </AuthLayout>
  )
}
