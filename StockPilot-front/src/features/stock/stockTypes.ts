export type StockLevel = "in-stock" | "low-stock" | "out-of-stock"

export type StockItem = {
  id: string
  productId: string
  productName: string
  category: string
  quantityAvailable: number
  lowThreshold: number
  updatedAt: string
}

export type StockMovementType = "in" | "out" | "adjustment"

export type StockMovement = {
  id: string
  date: string
  productId: string
  productName: string
  type: StockMovementType
  quantity: number
  reason: string
  reference?: string
}
