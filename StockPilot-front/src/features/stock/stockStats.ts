import type { StockItem, StockLevel } from "./stockTypes"

export function getStockLevel(item: StockItem): StockLevel {
  if (item.quantityAvailable <= 0) {
    return "out-of-stock"
  }

  if (item.quantityAvailable <= item.lowThreshold) {
    return "low-stock"
  }

  return "in-stock"
}

export function getStockStats(items: StockItem[]) {
  const lowStockCount = items.filter((item) => getStockLevel(item) === "low-stock").length
  const outOfStockCount = items.filter(
    (item) => getStockLevel(item) === "out-of-stock",
  ).length
  const totalAvailable = items.reduce(
    (sum, item) => sum + item.quantityAvailable,
    0,
  )

  return {
    totalItems: items.length,
    lowStockCount,
    outOfStockCount,
    totalAvailable,
  }
}
