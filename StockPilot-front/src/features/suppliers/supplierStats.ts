import type { Supplier } from "./supplierTypes"

export function getSupplierStats(suppliers: Supplier[]) {
  const totalDebt = suppliers.reduce((sum, supplier) => sum + supplier.debtTotal, 0)
  const totalPayments = suppliers.reduce(
    (sum, supplier) => sum + supplier.paymentsTotal,
    0,
  )
  const totalProducts = suppliers.reduce(
    (sum, supplier) => sum + supplier.suppliedProducts.length,
    0,
  )
  const activeCount = suppliers.filter((supplier) => supplier.status === "active").length

  return {
    totalSuppliers: suppliers.length,
    totalDebt,
    totalPayments,
    totalProducts,
    activeCount,
  }
}
