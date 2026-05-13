import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, KeyRound, Phone } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { z } from "zod"
import { AuthLayout } from "../components/AuthLayout"
import { useAuthStore } from "../store/authStore"

const registerSchema = z
  .object({
    phone: z
      .string()
      .regex(
        /^\+?[0-9][0-9\s-]{7,14}$/,
        "Saisissez un numéro de téléphone valide.",
      ),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  const isLoading = useAuthStore((state) => state.isLoading)
  const authError = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    clearError()
    setSubmitError(null)

    try {
      await register({
        phone: values.phone,
        password: values.password,
        role: "ADMIN",
      })
      navigate("/", { replace: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Création de compte impossible."
      setSubmitError(message)
    }
  }

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Créez votre compte administrateur avec votre numéro de téléphone."
      footer={
        <Link to="/login" className="auth-link">
          Déjà un compte ? Se connecter
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
            placeholder="+237 6 95 94 70 75"
            {...registerField("phone")}
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
            autoComplete="new-password"
            placeholder="Votre mot de passe"
            {...registerField("password")}
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
            placeholder="Confirmez votre mot de passe"
            {...registerField("confirmPassword")}
          />
          <button
            type="button"
            className="auth-ghost-btn"
            aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            onClick={() => setShowConfirmPassword((current) => !current)}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword ? (
          <p className="auth-error">{errors.confirmPassword.message}</p>
        ) : null}

        {submitError || authError ? (
          <p className="auth-error">{submitError ?? authError}</p>
        ) : null}

        <button className="auth-submit-btn" type="submit" disabled={isLoading}>
          {isLoading ? "Création..." : "Créer le compte"}
        </button>
      </form>
    </AuthLayout>
  )
}
