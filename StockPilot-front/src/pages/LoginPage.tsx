import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, KeyRound, Phone } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { z } from "zod"
import { AuthLayout } from "../components/AuthLayout"
import { useAuthStore } from "../store/authStore"

const loginSchema = z.object({
  phone: z
    .string()
    .regex(
      /^\+?[0-9][0-9\s-]{7,14}$/,
      "Saisissez un numéro de téléphone valide.",
    ),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginLocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const authError = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  })

  const from =
    (location.state as LoginLocationState | null)?.from?.pathname ?? "/"

  async function onSubmit(values: LoginFormValues) {
    clearError()
    setSubmitError(null)

    try {
      await login(values)
      navigate(from, { replace: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Connexion impossible."
      setSubmitError(message)
    }
  }

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Connectez-vous avec votre numéro de téléphone et votre mot de passe."
      footer={
        <Link to="/forgot-password" className="auth-link">
          Mot de passe oublié ?
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        <label className="auth-label" htmlFor="phone">
          Numéro de téléphone
        </label>
        <div className="auth-input-wrap">
          <Phone size={16} />
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+225 07 00 11 22 33"
            {...register("phone")}
          />
        </div>
        {errors.phone ? <p className="auth-error">{errors.phone.message}</p> : null}

        <label className="auth-label" htmlFor="password">
          Mot de passe
        </label>
        <div className="auth-input-wrap">
          <KeyRound size={16} />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Votre mot de passe"
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

        {submitError || authError ? (
          <p className="auth-error">{submitError ?? authError}</p>
        ) : null}

        <button className="auth-submit-btn" type="submit" disabled={isLoading}>
          {isLoading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </AuthLayout>
  )
}
