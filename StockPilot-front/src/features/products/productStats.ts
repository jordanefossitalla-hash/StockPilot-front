export type ProductStockStatus = "in-stock" | "low-stock" | "out-of-stock"

type ProductStockMetrics = {
  quantity: number
  purchasePrice: number
  salePrice: number
  stockMinThreshold?: number
}

export function getProductStockStatus(
  quantity: number,
  stockMinThreshold = 5,
): ProductStockStatus {
  if (quantity <= 0) {
    return "out-of-stock"
  }

  if (quantity <= Math.max(stockMinThreshold, 0)) {
    return "low-stock"
  }

  return "in-stock"
}

export function getProductStats(products: ProductStockMetrics[]) {
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
    (product) =>
      getProductStockStatus(product.quantity, product.stockMinThreshold) === "low-stock",
  ).length
  const outOfStockCount = products.filter(
    (product) =>
      getProductStockStatus(product.quantity, product.stockMinThreshold) === "out-of-stock",
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
