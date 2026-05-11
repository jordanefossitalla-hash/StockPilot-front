export type ProductCategory =
  | "informatique"
  | "electromenager"
  | "accessoire"
  | "consommable"

export type StockMovementType = "in" | "out" | "adjustment"

export type ProductSale = {
  id: string
  date: string
  quantity: number
  unitPrice: number
  total: number
  invoiceRef: string
  clientName: string
}

export type StockMovement = {
  id: string
  date: string
  type: StockMovementType
  quantity: number
  reason: string
  reference?: string
}

export type Product = {
  id: string
  name: string
  category: ProductCategory
  purchasePrice: number
  salePrice: number
  quantity: number
  createdAt: string
  salesHistory: ProductSale[]
  stockMovements: StockMovement[]
}
