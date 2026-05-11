import type { Category } from "./categoryTypes"

export function getCategoryStats(categories: Category[]) {
  const activeCount = categories.filter((category) => category.status === "active").length
  const inactiveCount = categories.filter((category) => category.status === "inactive").length
  const totalProductsMapped = categories.reduce(
    (sum, category) => sum + category.productsCount,
    0,
  )

  return {
    totalCategories: categories.length,
    activeCount,
    inactiveCount,
    totalProductsMapped,
  }
}
