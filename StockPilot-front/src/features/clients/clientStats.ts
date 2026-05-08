import type { Client } from "./clientTypes"

export function getClientStats(clients: Client[]) {
  const totalPurchases = clients.reduce((sum, client) => sum + client.purchasesTotal, 0)
  const totalDebt = clients.reduce((sum, client) => sum + client.debtTotal, 0)
  const totalPayments = clients.reduce((sum, client) => sum + client.paymentsTotal, 0)
  const blockedCount = clients.filter((client) => client.status === "blocked").length

  return {
    totalClients: clients.length,
    totalPurchases,
    totalDebt,
    totalPayments,
    blockedCount,
  }
}
