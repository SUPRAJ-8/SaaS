import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import UnderConstruction from './pages/UnderConstruction';
import ShopLayout from './components/Shop/ShopLayout';
import ProductList from './components/Shop/ProductList';
import ProductDetail from './components/Shop/ProductDetail';
import CategoryProducts from './components/Shop/CategoryProducts';
import Checkout from './components/Shop/Checkout';
import { useSiteSettings } from './contexts/SiteSettingsContext';
import LandingPage from './components/LandingPage';
import './App.css';

// Admin dashboard components
import DashboardHome from './components/Dashboard/DashboardHome';
import StoreUsers from './components/Dashboard/StoreUsers';
import Customers from './components/Dashboard/Customers';
import CustomerDetails from './components/Dashboard/CustomerDetails';
import Orders from './components/Dashboard/Orders';
import Products from './components/Dashboard/Products';
import Categories from './components/Dashboard/Categories';
import Themes from './components/Dashboard/Themes';
import BulkUpload from './components/Dashboard/BulkUpload';
import StoreSettings from './components/Dashboard/StoreSettings';
import Pages from './components/Dashboard/Pages';
import PageBuilder from './components/Dashboard/PageBuilder';

const Issue = () => <h2>Issue</h2>;


function AppRouter() {
  const { siteSettings } = useSiteSettings();
  const isUnderConstruction = siteSettings?.siteUnderConstruction || false;

  // Subdomain Detection Logic
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Logic for production vs localhost
  let subdomain = null;
  if (parts.length > 2) {
    // e.g., tenant.nepostore.xyz -> subdomain = tenant
    subdomain = parts[0];
  } else if (hostname === 'localhost') {
    // For local testing, you can use search params like ?tenant=test
    const params = new URLSearchParams(window.location.search);
    subdomain = params.get('tenant');
  }

  // Define which part of the app to show
  const isDashboardSubdomain = subdomain === 'app';
  const isLandingPage = !subdomain || subdomain === 'www';
  const isShopSubdomain = subdomain && !isDashboardSubdomain && !isLandingPage;

  return (
    <Router>
      <Routes>
        {/* 1. Landing Page (nepostore.xyz) */}
        {isLandingPage && (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* 2. Admin Dashboard (app.nepostore.xyz) */}
        {isDashboardSubdomain && (
          <Route path="/*" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="dashboard" element={<Navigate to="/" replace />} />
            <Route path="store-user" element={<StoreUsers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/orders/:id" element={<CustomerDetails />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
            <Route path="issue" element={<Issue />} />
            <Route path="themes" element={<Themes />} />
            <Route path="bulk-upload" element={<BulkUpload />} />
            <Route path="store-settings" element={<StoreSettings />} />
            <Route path="pages" element={<Pages />} />
            <Route path="page-builder/:id" element={<PageBuilder />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}

        {/* 3. Customer Shops (tenant.nepostore.xyz) */}
        {isShopSubdomain && (
          <>
            {isUnderConstruction ? (
              <Route path="*" element={<UnderConstruction />} />
            ) : (
              <Route path="/*" element={<ShopLayout />}>
                <Route index element={<ProductList />} />
                <Route path=":slug" element={<ProductList />} />
                <Route path="product/:id" element={<ProductDetail />} />
                <Route path="category/:id" element={<CategoryProducts />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            )}
          </>
        )}

        {/* Fallback for local dev or unexpected states */}
        {!isLandingPage && !isDashboardSubdomain && !isShopSubdomain && (
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default AppRouter;
