import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { AccountLayout } from '../layouts/AccountLayout';

// Helper for code-splitting named exports
const lazyNamed = (importer, name) =>
  lazy(() => importer().then((mod) => ({ default: mod[name] })));

// Code-split pages for high performance and reduced initial bundle size
const HomePage = lazyNamed(() => import('../pages/HomePage'), 'HomePage');
const ShopPage = lazyNamed(() => import('../pages/ShopPage'), 'ShopPage');
const CategoriesPage = lazyNamed(() => import('../pages/CategoriesPage'), 'CategoriesPage');
const CategoryDetailPage = lazyNamed(() => import('../pages/CategoryDetailPage'), 'CategoryDetailPage');
const BrandDetailPage = lazyNamed(() => import('../pages/BrandDetailPage'), 'BrandDetailPage');
const NewArrivalsPage = lazyNamed(() => import('../pages/NewArrivalsPage'), 'NewArrivalsPage');
const OffersPage = lazyNamed(() => import('../pages/OffersPage'), 'OffersPage');
const SearchPage = lazyNamed(() => import('../pages/SearchPage'), 'SearchPage');
const ProductDetailPage = lazyNamed(() => import('../pages/ProductDetailPage'), 'ProductDetailPage');
const WishlistPage = lazyNamed(() => import('../pages/WishlistPage'), 'WishlistPage');
const CartPage = lazyNamed(() => import('../pages/CartPage'), 'CartPage');
const CheckoutPage = lazyNamed(() => import('../pages/CheckoutPage'), 'CheckoutPage');
const LoginPage = lazyNamed(() => import('../pages/LoginPage'), 'LoginPage');
const RegisterPage = lazyNamed(() => import('../pages/RegisterPage'), 'RegisterPage');
const ForgotPasswordPage = lazyNamed(() => import('../pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const OrderTrackingPage = lazyNamed(() => import('../pages/OrderTrackingPage'), 'OrderTrackingPage');

const AccountPage = lazyNamed(() => import('../pages/AccountPage'), 'AccountPage');
const AccountOrdersPage = lazyNamed(() => import('../pages/AccountOrdersPage'), 'AccountOrdersPage');
const AccountOrderDetailPage = lazyNamed(() => import('../pages/AccountOrderDetailPage'), 'AccountOrderDetailPage');
const AccountAddressesPage = lazyNamed(() => import('../pages/AccountAddressesPage'), 'AccountAddressesPage');
const AccountReviewsPage = lazyNamed(() => import('../pages/AccountReviewsPage'), 'AccountReviewsPage');
const AccountReturnsPage = lazyNamed(() => import('../pages/AccountReturnsPage'), 'AccountReturnsPage');

// Subtle luxury loader while loading code-split chunks
const PageFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-urban-teal/20 border-t-urban-teal rounded-full animate-spin" />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/:slug" element={<CategoryDetailPage />} />
          <Route path="brands/:slug" element={<BrandDetailPage />} />
          <Route path="new-arrivals" element={<NewArrivalsPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="product/:slug" element={<ProductDetailPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="track" element={<OrderTrackingPage />} />
          <Route path="track/:id" element={<OrderTrackingPage />} />
          <Route path="order-tracking" element={<OrderTrackingPage />} />

          {/* Customer Account Routes */}
          <Route path="account" element={<AccountLayout />}>
            <Route index element={<AccountPage />} />
            <Route path="orders" element={<AccountOrdersPage />} />
            <Route path="orders/:id" element={<AccountOrderDetailPage />} />
            <Route path="addresses" element={<AccountAddressesPage />} />
            <Route path="reviews" element={<AccountReviewsPage />} />
            <Route path="returns" element={<AccountReturnsPage />} />
          </Route>

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
