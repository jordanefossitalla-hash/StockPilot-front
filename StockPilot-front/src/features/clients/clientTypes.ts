export type ClientStatus = "active" | "blocked"

export type ClientTransactionType = "purchase" | "payment" | "adjustment"

export type ClientTransaction = {
  id: string
  date: string
  description: string
  type: ClientTransactionType
  amount: number
  method?: string
  reference?: string
}

export type Client = {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  status: ClientStatus
  createdAt: string
  purchasesTotal: number
  debtTotal: number
  paymentsTotal: number
  lastPurchaseDate?: string
  transactions: ClientTransaction[]
}
