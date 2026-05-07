import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { MainLayout } from "../layouts/MainLayout"
import { ClientsPage } from "../pages/ClientsPage"
import { DashboardPage } from "../pages/DashboardPage"
import { NotFoundPage } from "../pages/NotFoundPage"
import { OrdersPage } from "../pages/OrdersPage"
import { ProductsPage } from "../pages/ProductsPage"
import { ReportsPage } from "../pages/ReportsPage"
import { SalesPage } from "../pages/SalesPage"
import { SettingsPage } from "../pages/SettingsPage"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Legacy redirects */}
          <Route path="/markets" element={<Navigate to="/sales" replace />} />
          <Route path="/portfolio" element={<Navigate to="/clients" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
