const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}
