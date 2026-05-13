export type AuthUser = {
  id: string
  name: string
  email: string
  phone: string
  role: string
}

export type AuthRole = "ADMIN" | "MANAGER" | "AGENT"

export type LoginCredentials = {
  phone: string
  password: string
}

export type AuthSession = {
  token: string
  refreshToken: string
  user: AuthUser
}

export type RegisterPayload = {
  phone: string
  password: string
  role: AuthRole
}

export type ForgotPasswordPayload = {
  email: string
}

export type ResetPasswordPayload = {
  token: string
  password: string
}
