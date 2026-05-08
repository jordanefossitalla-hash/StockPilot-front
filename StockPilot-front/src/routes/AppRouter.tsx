import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { MainLayout } from "../layouts/MainLayout"
import { ClientCreatePage } from "../pages/ClientCreatePage"
import { ClientDetailPage } from "../pages/ClientDetailPage"
import { ClientEditPage } from "../pages/ClientEditPage"
import { ClientsPage } from "../pages/ClientsPage"
import { DashboardPage } from "../pages/DashboardPage"
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage"
import { LoginPage } from "../pages/LoginPage"
import { NotFoundPage } from "../pages/NotFoundPage"
import { OrdersPage } from "../pages/OrdersPage"
import { ProductsPage } from "../pages/ProductsPage"
import { ReportsPage } from "../pages/ReportsPage"
import { ResetPasswordPage } from "../pages/ResetPasswordPage"
import { SalesPage } from "../pages/SalesPage"
import { SettingsPage } from "../pages/SettingsPage"
import { PublicOnlyRoute } from "./PublicOnlyRoute"
import { RequireAuth } from "./RequireAuth"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/new" element={<ClientCreatePage />} />
            <Route path="/clients/:clientId" element={<ClientDetailPage />} />
            <Route path="/clients/:clientId/edit" element={<ClientEditPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Legacy redirects */}
            <Route path="/markets" element={<Navigate to="/sales" replace />} />
            <Route path="/portfolio" element={<Navigate to="/clients" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
