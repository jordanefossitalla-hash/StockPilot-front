import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { CategoriesPage } from "../pages/CategoriesPage"
import { CategoryCreatePage } from "../pages/CategoryCreatePage"
import { CategoryEditPage } from "../pages/CategoryEditPage"
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
import { ProductCreatePage } from "../pages/ProductCreatePage"
import { ProductDetailPage } from "../pages/ProductDetailPage"
import { ProductEditPage } from "../pages/ProductEditPage"
import { ProductsPage } from "../pages/ProductsPage"
import { ReportsPage } from "../pages/ReportsPage"
import { ResetPasswordPage } from "../pages/ResetPasswordPage"
import { SalesPage } from "../pages/SalesPage"
import { SettingsPage } from "../pages/SettingsPage"
import { SettingsProfilePage } from "../pages/SettingsProfilePage"
import { SettingsShopPage } from "../pages/SettingsShopPage"
import { SettingsUsersPage } from "../pages/SettingsUsersPage"
import { StockEntryPage } from "../pages/StockEntryPage"
import { StockExitPage } from "../pages/StockExitPage"
import { StockHistoryPage } from "../pages/StockHistoryPage"
import { StockStatusPage } from "../pages/StockStatusPage"
import { SupplierCreatePage } from "../pages/SupplierCreatePage"
import { SupplierDetailPage } from "../pages/SupplierDetailPage"
import { SupplierEditPage } from "../pages/SupplierEditPage"
import { SuppliersPage } from "../pages/SuppliersPage"
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
            <Route path="/products/new" element={<ProductCreatePage />} />
            <Route path="/products/:productId" element={<ProductDetailPage />} />
            <Route path="/products/:productId/edit" element={<ProductEditPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/new" element={<CategoryCreatePage />} />
            <Route path="/categories/:categoryId/edit" element={<CategoryEditPage />} />
            <Route path="/stock" element={<StockStatusPage />} />
            <Route path="/stock/in" element={<StockEntryPage />} />
            <Route path="/stock/out" element={<StockExitPage />} />
            <Route path="/stock/history" element={<StockHistoryPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/suppliers/new" element={<SupplierCreatePage />} />
            <Route path="/suppliers/:supplierId" element={<SupplierDetailPage />} />
            <Route path="/suppliers/:supplierId/edit" element={<SupplierEditPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
            <Route path="/settings/legacy" element={<SettingsPage />} />
            <Route path="/settings/profile" element={<SettingsProfilePage />} />
            <Route path="/settings/shop" element={<SettingsShopPage />} />
            <Route path="/settings/users" element={<SettingsUsersPage />} />
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
