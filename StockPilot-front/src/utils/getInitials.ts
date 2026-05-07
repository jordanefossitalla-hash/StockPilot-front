export function getInitials(fullName: string): string {
  const trimmedName = fullName.trim()
  if (!trimmedName) {
    return "US"
  }

  const parts = trimmedName.split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}
