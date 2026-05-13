import { create } from "zustand"
import axios from "axios"
import { authService } from "../services/authService"
import type { AuthSession, AuthUser, LoginCredentials, RegisterPayload } from "../types/auth"

type AuthStore = {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isInitializing: boolean
  isLoading: boolean
  error: string | null
  initializeSession: () => Promise<void>
  login: (credentials: LoginCredentials) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  refreshSession: () => Promise<string>
  logout: () => Promise<void>
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
  isInitializing: false,
  isLoading: false,
  error: null,
  initializeSession: async () => {
    const state = useAuthStore.getState()

    if (!state.token) {
      set({ isInitializing: false })
      return
    }

    set({ isInitializing: true })

    try {
      const profile = await authService.me(state.token)
      const syncedSession: AuthSession = {
        token: state.token,
        refreshToken: state.refreshToken ?? "",
        user: profile,
      }

      saveSession(syncedSession)
      set({
        user: profile,
        isAuthenticated: true,
        isInitializing: false,
        error: null,
      })
      return
    } catch (error) {
      const isUnauthorized = axios.isAxiosError(error) && error.response?.status === 401

      if (!isUnauthorized || !state.refreshToken) {
        saveSession(null)
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isInitializing: false,
          error: null,
        })
        return
      }
    }

    try {
      const refreshed = await authService.refresh(state.refreshToken)
      const profile = await authService.me(refreshed.token)

      const nextSession: AuthSession = {
        token: refreshed.token,
        refreshToken: refreshed.refreshToken,
        user: profile,
      }

      saveSession(nextSession)
      set({
        token: refreshed.token,
        refreshToken: refreshed.refreshToken,
        user: profile,
        isAuthenticated: true,
        isInitializing: false,
        error: null,
      })
    } catch {
      saveSession(null)
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isInitializing: false,
        error: null,
      })
    }
  },
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
  refreshSession: async () => {
    const currentRefreshToken = useAuthStore.getState().refreshToken

    if (!currentRefreshToken) {
      throw new Error("Aucun refresh token disponible.")
    }

    try {
      const refreshed = await authService.refresh(currentRefreshToken)
      const currentUser = useAuthStore.getState().user

      if (!currentUser) {
        throw new Error("Session utilisateur introuvable.")
      }

      const nextSession: AuthSession = {
        token: refreshed.token,
        refreshToken: refreshed.refreshToken,
        user: currentUser,
      }

      saveSession(nextSession)
      set({
        token: refreshed.token,
        refreshToken: refreshed.refreshToken,
        isAuthenticated: true,
        error: null,
      })

      return refreshed.token
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant le rafraîchissement de session."

      saveSession(null)
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
  logout: async () => {
    const currentRefreshToken = useAuthStore.getState().refreshToken

    try {
      if (currentRefreshToken) {
        await authService.logout(currentRefreshToken)
      }
    } finally {
      saveSession(null)
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  },
  clearError: () => set({ error: null }),
}))
