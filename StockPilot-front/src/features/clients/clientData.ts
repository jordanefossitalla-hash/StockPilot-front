import type { Client } from "./clientTypes"

export const clientsData: Client[] = [
  {
    id: "CL-001",
    name: "Awa Traore",
    phone: "+2250700010203",
    email: "awa.traore@demo.ci",
    address: "Cocody Angre, Abidjan",
    status: "active",
    createdAt: "2025-09-14",
    purchasesTotal: 4860000,
    debtTotal: 720000,
    paymentsTotal: 4140000,
    lastPurchaseDate: "2026-05-06",
    transactions: [
      {
        id: "TRX-1001",
        date: "2026-05-06",
        description: "Commande ERP Retail Pack",
        type: "purchase",
        amount: 580000,
        reference: "CMD-9081",
      },
      {
        id: "TRX-1002",
        date: "2026-05-03",
        description: "Paiement Mobile Money",
        type: "payment",
        amount: 300000,
        method: "Mobile Money",
      },
      {
        id: "TRX-1003",
        date: "2026-04-24",
        description: "Ajustement avoir client",
        type: "adjustment",
        amount: -20000,
      },
    ],
  },
  {
    id: "CL-002",
    name: "Moussa Kone",
    phone: "+2250101012211",
    email: "moussa.kone@demo.ci",
    address: "Yopougon Siporex, Abidjan",
    status: "active",
    createdAt: "2025-12-01",
    purchasesTotal: 2945000,
    debtTotal: 310000,
    paymentsTotal: 2635000,
    lastPurchaseDate: "2026-05-05",
    transactions: [
      {
        id: "TRX-2001",
        date: "2026-05-05",
        description: "Commande Point de vente",
        type: "purchase",
        amount: 430000,
        reference: "CMD-9112",
      },
      {
        id: "TRX-2002",
        date: "2026-05-02",
        description: "Virement bancaire",
        type: "payment",
        amount: 250000,
        method: "Virement",
      },
    ],
  },
  {
    id: "CL-003",
    name: "Fatou Diallo",
    phone: "+2250707788990",
    email: "fatou.diallo@demo.ci",
    address: "Bouake Centre",
    status: "blocked",
    createdAt: "2025-07-11",
    purchasesTotal: 1880000,
    debtTotal: 660000,
    paymentsTotal: 1220000,
    lastPurchaseDate: "2026-04-29",
    transactions: [
      {
        id: "TRX-3001",
        date: "2026-04-29",
        description: "Renouvellement licence caisse",
        type: "purchase",
        amount: 210000,
        reference: "CMD-8905",
      },
      {
        id: "TRX-3002",
        date: "2026-04-18",
        description: "Paiement espece",
        type: "payment",
        amount: 120000,
        method: "Espece",
      },
    ],
  },
  {
    id: "CL-004",
    name: "Ibrahim Coulibaly",
    phone: "+2250505040302",
    email: "ibrahim.coulibaly@demo.ci",
    address: "San Pedro quartier Cite",
    status: "active",
    createdAt: "2026-02-21",
    purchasesTotal: 1225000,
    debtTotal: 185000,
    paymentsTotal: 1040000,
    lastPurchaseDate: "2026-05-04",
    transactions: [
      {
        id: "TRX-4001",
        date: "2026-05-04",
        description: "Ajout module facturation",
        type: "purchase",
        amount: 175000,
        reference: "CMD-9076",
      },
      {
        id: "TRX-4002",
        date: "2026-05-01",
        description: "Paiement Mobile Money",
        type: "payment",
        amount: 90000,
        method: "Mobile Money",
      },
    ],
  },
]

export function getClientById(clientId: string) {
  return clientsData.find((client) => client.id === clientId)
}

export function addClient(client: Client) {
  clientsData.unshift(client)
}
