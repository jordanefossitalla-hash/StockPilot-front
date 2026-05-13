import { create } from "zustand"
import { authService } from "../services/authService"
import type { AuthSession, AuthUser, LoginCredentials, RegisterPayload } from "../types/auth"

type AuthStore = {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  clearError: () => void
}

type StoredAuthState = {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
}

const AUTH_STORAGE_KEY = "sp-auth-session"

function loadSession(): StoredAuthState {
  if (typeof window === "undefined") {
    return { token: null, refreshToken: null, user: null }
  }

  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) {
    return { token: null, refreshToken: null, user: null }
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuthState
    return {
      token: parsed.token ?? null,
      refreshToken: parsed.refreshToken ?? null,
      user: parsed.user ?? null,
    }
  } catch {
    return { token: null, refreshToken: null, user: null }
  }
}

function saveSession(session: AuthSession | null) {
  if (typeof window === "undefined") {
    return
  }

  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

const initialSession = loadSession()

export const useAuthStore = create<AuthStore>((set) => ({
  token: initialSession.token,
  refreshToken: initialSession.refreshToken,
  user: initialSession.user,
  isAuthenticated: Boolean(initialSession.token),
  isLoading: false,
  error: null,
  login: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const session = await authService.login(credentials)
      saveSession(session)
      set({
        token: session.token,
        refreshToken: session.refreshToken,
        user: session.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant la connexion."
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
      })
      throw error
    }
  },
  register: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const session = await authService.register(payload)
      saveSession(session)
      set({
        token: session.token,
        refreshToken: session.refreshToken,
        user: session.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l'inscription."
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
      })
      throw error
    }
  },
  logout: () => {
    saveSession(null)
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  },
  clearError: () => set({ error: null }),
}))
