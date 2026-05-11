import type { Category } from "./categoryTypes"

export const categoriesData: Category[] = [
  {
    id: "CAT-001",
    name: "Informatique",
    description: "Terminaux, routeurs, claviers et equipements IT.",
    status: "active",
    productsCount: 18,
    createdAt: "2025-10-10",
  },
  {
    id: "CAT-002",
    name: "Electromenager",
    description: "Articles electromenagers grand public et pro.",
    status: "active",
    productsCount: 7,
    createdAt: "2025-11-14",
  },
  {
    id: "CAT-003",
    name: "Accessoires",
    description: "Petits accessoires et peripheriques.",
    status: "active",
    productsCount: 22,
    createdAt: "2026-01-21",
  },
  {
    id: "CAT-004",
    name: "Consommables",
    description: "Cartouches, papiers, piles et fournitures.",
    status: "inactive",
    productsCount: 4,
    createdAt: "2026-02-08",
  },
]

export function getCategoryById(categoryId: string) {
  return categoriesData.find((category) => category.id === categoryId)
}
