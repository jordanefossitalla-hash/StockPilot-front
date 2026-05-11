import type { Product } from "./productTypes"

export type ProductStockStatus = "in-stock" | "low-stock" | "out-of-stock"

export function getProductStockStatus(quantity: number): ProductStockStatus {
  if (quantity <= 0) {
    return "out-of-stock"
  }

  if (quantity <= 5) {
    return "low-stock"
  }

  return "in-stock"
}

export function getProductStats(products: Product[]) {
  const totalStockUnits = products.reduce((sum, product) => sum + product.quantity, 0)
  const totalStockValuePurchase = products.reduce(
    (sum, product) => sum + product.purchasePrice * product.quantity,
    0,
  )
  const totalStockValueSale = products.reduce(
    (sum, product) => sum + product.salePrice * product.quantity,
    0,
  )
  const lowStockCount = products.filter(
    (product) => getProductStockStatus(product.quantity) === "low-stock",
  ).length
  const outOfStockCount = products.filter(
    (product) => getProductStockStatus(product.quantity) === "out-of-stock",
  ).length

  return {
    totalProducts: products.length,
    totalStockUnits,
    totalStockValuePurchase,
    totalStockValueSale,
    lowStockCount,
    outOfStockCount,
  }
}
