import axios from "axios"
import type {
  AuthSession,
  AuthUser,
  ForgotPasswordPayload,
  LoginCredentials,
  ResetPasswordPayload,
} from "../types/auth"

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

function toBase64Url(payload: object): string {
  return btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function createMockToken(user: AuthUser): string {
  const now = Math.floor(Date.now() / 1000)
  const header = toBase64Url({ alg: "HS256", typ: "JWT" })
  const body = toBase64Url({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + 60 * 60 * 8,
  })

  return `${header}.${body}.stockpilot-signature`
}

function buildMockUser(phone: string): AuthUser {
  const normalizedPhone = phone.replace(/\s+/g, "")
  const lastDigits = normalizedPhone.slice(-4)

  return {
    id: `usr-${normalizedPhone.replace(/\D/g, "") || "local"}`,
    name: `User ${lastDigits || "SP"}`,
    email: `user${lastDigits || "0000"}@stockpilot.app`,
    phone: normalizedPhone,
    role: "Administrateur",
  }
}

function delay(durationMs = 600) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

async function login(credentials: LoginCredentials): Promise<AuthSession> {
  if (apiBaseUrl) {
    const response = await axios.post(`${apiBaseUrl}/auth/login`, {
      phone: credentials.phone,
      password: credentials.password,
    })

    const data = response.data as {
      accessToken?: string
      token?: string
      user?: AuthUser
    }

    const token = data.accessToken ?? data.token
    if (!token || !data.user) {
      throw new Error("Réponse login invalide du serveur.")
    }

    return {
      token,
      user: data.user,
    }
  }

  await delay()

  if (credentials.password.length < 6) {
    throw new Error("Mot de passe invalide.")
  }

  const user = buildMockUser(credentials.phone)
  return {
    token: createMockToken(user),
    user,
  }
}

async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  if (apiBaseUrl) {
    await axios.post(`${apiBaseUrl}/auth/forgot-password`, {
      email: payload.email,
    })
    return
  }

  await delay(450)
}

async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  if (apiBaseUrl) {
    await axios.post(`${apiBaseUrl}/auth/reset-password`, {
      token: payload.token,
      password: payload.password,
    })
    return
  }

  await delay(500)

  if (!payload.token.trim()) {
    throw new Error("Le token de reinitialisation est requis.")
  }
}

export const authService = {
  login,
  forgotPassword,
  resetPassword,
}
