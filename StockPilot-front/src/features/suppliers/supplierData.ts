import type { Supplier } from "./supplierTypes"

export const suppliersData: Supplier[] = [
  {
    id: "SUP-001",
    name: "TechSource CI",
    phone: "+2250700112233",
    email: "contact@techsource.ci",
    address: "Cocody Riviera, Abidjan",
    status: "active",
    createdAt: "2025-08-19",
    debtTotal: 1480000,
    paymentsTotal: 3420000,
    suppliedProducts: [
      {
        id: "PRD-001",
        name: "POS Terminal T20",
        category: "Informatique",
        lastSupplyDate: "2026-05-08",
        totalSuppliedQuantity: 84,
        totalSuppliedAmount: 7140000,
      },
      {
        id: "PRD-006",
        name: "Clavier mecanique K87",
        category: "Informatique",
        lastSupplyDate: "2026-04-30",
        totalSuppliedQuantity: 44,
        totalSuppliedAmount: 792000,
      },
    ],
    history: [
      {
        id: "SH-1001",
        date: "2026-05-08",
        type: "supply",
        description: "Livraison lot POS T20",
        amount: 510000,
        reference: "BL-5501",
      },
      {
        id: "SH-1002",
        date: "2026-05-05",
        type: "payment",
        description: "Paiement partiel fournisseur",
        amount: 300000,
        method: "Virement",
      },
      {
        id: "SH-1003",
        date: "2026-05-01",
        type: "adjustment",
        description: "Ajustement facture transport",
        amount: 45000,
        reference: "ADJ-110",
      },
    ],
  },
  {
    id: "SUP-002",
    name: "ElectroHub Afrique",
    phone: "+2250101223344",
    email: "sales@electrohub.af",
    address: "Zone 4, Abidjan",
    status: "active",
    createdAt: "2025-10-03",
    debtTotal: 920000,
    paymentsTotal: 1980000,
    suppliedProducts: [
      {
        id: "PRD-003",
        name: "Micro-onde Nova 30L",
        category: "Electromenager",
        lastSupplyDate: "2026-04-25",
        totalSuppliedQuantity: 30,
        totalSuppliedAmount: 1560000,
      },
      {
        id: "PRD-007",
        name: "Frigo compact 120L",
        category: "Electromenager",
        lastSupplyDate: "2026-05-02",
        totalSuppliedQuantity: 18,
        totalSuppliedAmount: 1764000,
      },
    ],
    history: [
      {
        id: "SH-2001",
        date: "2026-05-02",
        type: "supply",
        description: "Livraison frigos 120L",
        amount: 588000,
        reference: "BL-7702",
      },
      {
        id: "SH-2002",
        date: "2026-04-28",
        type: "payment",
        description: "Paiement Mobile Money",
        amount: 200000,
        method: "Mobile Money",
      },
    ],
  },
  {
    id: "SUP-003",
    name: "AccessPro Trading",
    phone: "+2250505060708",
    email: "ops@accesspro.ci",
    address: "Yopougon, Abidjan",
    status: "inactive",
    createdAt: "2026-01-12",
    debtTotal: 240000,
    paymentsTotal: 620000,
    suppliedProducts: [
      {
        id: "PRD-004",
        name: "Balance connectee S2",
        category: "Accessoire",
        lastSupplyDate: "2026-04-20",
        totalSuppliedQuantity: 62,
        totalSuppliedAmount: 558000,
      },
      {
        id: "PRD-008",
        name: "Batterie externe 20k",
        category: "Accessoire",
        lastSupplyDate: "2026-04-01",
        totalSuppliedQuantity: 75,
        totalSuppliedAmount: 510000,
      },
    ],
    history: [
      {
        id: "SH-3001",
        date: "2026-04-20",
        type: "supply",
        description: "Reapprovisionnement accessoires",
        amount: 180000,
        reference: "BL-9201",
      },
      {
        id: "SH-3002",
        date: "2026-04-18",
        type: "payment",
        description: "Paiement espece",
        amount: 120000,
        method: "Espece",
      },
    ],
  },
]

export function getSupplierById(supplierId: string) {
  return suppliersData.find((supplier) => supplier.id === supplierId)
}

export function addSupplier(supplier: Supplier) {
  const existingIndex = suppliersData.findIndex((item) => item.id === supplier.id)

  if (existingIndex >= 0) {
    suppliersData[existingIndex] = supplier
    return
  }

  suppliersData.unshift(supplier)
}
