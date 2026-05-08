export type AuthUser = {
  id: string
  name: string
  email: string
  phone: string
  role: string
}

export type LoginCredentials = {
  phone: string
  password: string
}

export type AuthSession = {
  token: string
  user: AuthUser
}

export type ForgotPasswordPayload = {
  email: string
}

export type ResetPasswordPayload = {
  token: string
  password: string
}
