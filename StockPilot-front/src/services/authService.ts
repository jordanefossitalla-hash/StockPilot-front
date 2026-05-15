import axios from "axios"
import type {
  AuthSession,
  AuthUser,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterPayload,
  ResetPasswordPayload,
} from "../types/auth"

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL?.trim() ||
    "https://api.stockpilots.net/api/v1")
    .replace(/\/+$/, "")

function requireApiBaseUrl(): string {
  return apiBaseUrl
}

function normalizeAuthUser(rawUser: Partial<AuthUser> & { id?: string; phone?: string; role?: string }, phoneHint?: string): AuthUser {
  const normalizedPhone = (rawUser.phone ?? phoneHint ?? "").replace(/\s+/g, "")
  const lastDigits = normalizedPhone.slice(-4)

  return {
    id: rawUser.id ?? `usr-${normalizedPhone.replace(/\D/g, "") || "local"}`,
    phone: normalizedPhone,
    role: rawUser.role ?? "AGENT",
    name: rawUser.name?.trim() || `Utilisateur ${lastDigits || "SP"}`,
    email: rawUser.email?.trim() || `user${lastDigits || "0000"}@stockpilot.app`,
  }
}

function parseAuthSession(
  data: {
    accessToken?: string
    token?: string
    refreshToken?: string
    user?: Partial<AuthUser> & { id?: string; phone?: string; role?: string }
  },
  phoneHint?: string,
): AuthSession {
  const token = data.accessToken ?? data.token

  if (!token || !data.refreshToken || !data.user) {
    throw new Error("Réponse auth invalide du serveur.")
  }

  return {
    token,
    refreshToken: data.refreshToken,
    user: normalizeAuthUser(data.user, phoneHint),
  }
}

function parseRefreshTokens(data: { accessToken?: string; refreshToken?: string }): Pick<AuthSession, "token" | "refreshToken"> {
  if (!data.accessToken || !data.refreshToken) {
    throw new Error("Réponse refresh invalide du serveur.")
  }

  return {
    token: data.accessToken,
    refreshToken: data.refreshToken,
  }
}

function parseMeUser(data: unknown): AuthUser {
  if (!data || typeof data !== "object") {
    throw new Error("Réponse profil invalide du serveur.")
  }

  const raw = data as {
    user?: Partial<AuthUser> & { id?: string; phone?: string; role?: string }
    id?: string
    phone?: string
    role?: string
    name?: string
    email?: string
  }

  const userPayload = raw.user && typeof raw.user === "object" ? raw.user : raw
  return normalizeAuthUser(userPayload)
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const apiMessage = (error.response?.data as { message?: string } | undefined)?.message

    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

function delay(durationMs = 600) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const baseUrl = requireApiBaseUrl()

  try {
    const response = await axios.post(`${baseUrl}/auth/login`, {
      phone: credentials.phone.trim(),
      password: credentials.password,
    })

    return parseAuthSession(response.data, credentials.phone)
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Connexion impossible."), {
      cause: error,
    })
  }
}

async function register(payload: RegisterPayload): Promise<AuthSession> {
  const baseUrl = requireApiBaseUrl()

  try {
    const response = await axios.post(`${baseUrl}/auth/register`, {
      phone: payload.phone.trim(),
      password: payload.password,
      role: payload.role,
    })

    return parseAuthSession(response.data, payload.phone)
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Inscription impossible."), {
      cause: error,
    })
  }
}

async function refresh(refreshToken: string): Promise<Pick<AuthSession, "token" | "refreshToken">> {
  const baseUrl = requireApiBaseUrl()

  try {
    const response = await axios.post(`${baseUrl}/auth/refresh`, {
      refreshToken: refreshToken.trim(),
    })

    return parseRefreshTokens(response.data)
  } catch (error) {
    throw new Error(
      resolveErrorMessage(error, "Rafraîchissement de session impossible."),
      {
        cause: error,
      },
    )
  }
}

async function logout(refreshToken: string): Promise<void> {
  const baseUrl = requireApiBaseUrl()

  try {
    await axios.post(`${baseUrl}/auth/logout`, {
      refreshToken: refreshToken.trim(),
    })
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Déconnexion impossible."), {
      cause: error,
    })
  }
}

async function me(token: string): Promise<AuthUser> {
  const baseUrl = requireApiBaseUrl()

  try {
    const response = await axios.get(`${baseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return parseMeUser(response.data)
  } catch (error) {
    throw new Error(resolveErrorMessage(error, "Récupération du profil impossible."), {
      cause: error,
    })
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
  register,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
}
