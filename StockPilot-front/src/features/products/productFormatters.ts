const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const categoryLabelMap = {
  informatique: "Informatique",
  electromenager: "Electromenager",
  accessoire: "Accessoire",
  consommable: "Consommable",
} as const

export function formatFcfa(value: number) {
  return moneyFormatter.format(value)
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

export function formatProductCategory(
  category: keyof typeof categoryLabelMap,
): string {
  return categoryLabelMap[category]
}
