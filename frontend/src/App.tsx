import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage/HomePage';
import { ProductListPage } from './pages/ProductListPage/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetailPage/ProductDetailPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { AccountPage } from './pages/Account/AccountPage';
import { AccountReviewsPage } from './pages/Account/AccountReviewsPage';
import { AdminUsersPage } from './pages/Admin/AdminUsersPage';
import { AdminOrdersPage } from './pages/Admin/AdminOrdersPage';
import { AdminReviewsPage } from './pages/Admin/AdminReviewsPage';
import { CartPage } from './pages/Cart/CartPage';
import { CheckoutPage } from './pages/Checkout/CheckoutPage';
import { OrderListPage } from './pages/Order/OrderListPage';
import { OrderDetailPage } from './pages/Order/OrderDetailPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public catalog routes */}
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductListPage />} />
              <Route path="products/:slug" element={<ProductDetailPage />} />

              {/* Public auth routes */}
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forbidden" element={<ForbiddenPage />} />

              {/* Authenticated user routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="account" element={<AccountPage />} />
                <Route path="account/orders" element={<OrderListPage />} />
                <Route path="account/orders/:id" element={<OrderDetailPage />} />
                <Route path="orders" element={<OrderListPage />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
                <Route path="account/reviews" element={<AccountReviewsPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
              </Route>

              {/* Protected Admin routes */}
              <Route element={<AdminRoute />}>
                <Route path="admin/users" element={<AdminUsersPage />} />
                <Route path="admin/orders" element={<AdminOrdersPage />} />
                <Route path="admin/reviews" element={<AdminReviewsPage />} />
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
