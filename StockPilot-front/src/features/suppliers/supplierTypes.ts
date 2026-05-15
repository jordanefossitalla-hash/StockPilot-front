export type SupplierStatus = "active" | "inactive"

export type SupplierHistoryType = "supply" | "payment" | "adjustment"

export type SupplierSuppliedProduct = {
  id: string
  name: string
  category: string
  lastSupplyDate: string
  totalSuppliedQuantity: number
  totalSuppliedAmount: number
}

export type SupplierHistoryItem = {
  id: string
  date: string
  type: SupplierHistoryType
  description: string
  amount: number
  reference?: string
  method?: string
}

export type Supplier = {
  id: string
  code?: string
  name: string
  phone: string
  email?: string
  address?: string
  status: SupplierStatus
  createdAt: string
  debtTotal: number
  paymentsTotal: number
  suppliedProducts: SupplierSuppliedProduct[]
  history: SupplierHistoryItem[]
}
