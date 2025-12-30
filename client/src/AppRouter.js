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

  // Subdomain Detection Logic (v1.0.2)
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Logic for production vs localhost
  let subdomain = null;
  if (parts.length > 2) {
    // e.g., tenant.nepostore.xyz -> subdomain = parts[0]
    subdomain = parts[0];
  } else if (hostname === 'localhost') {
    // For local testing, use search param: http://localhost:3000?tenant=app
    const params = new URLSearchParams(window.location.search);
    subdomain = params.get('tenant');
  }

  const isDashboardSubdomain = subdomain === 'app';
  const isLandingPage = !subdomain || subdomain === 'www';
  const isShopSubdomain = subdomain && !isDashboardSubdomain && !isLandingPage;

  return (
    <Router>
      <Routes>
        {/* CASE 1: Main Domain (nepostore.xyz) -> SHOW LANDING PAGE */}
        {isLandingPage && (
          <>
            <Route path="/" element={<LandingPage />} />
            {/* If they accidentally try to visit /dashboard or /shop on root domain, redirect to landing or the correct subdomain */}
            <Route path="/dashboard/*" element={<Navigate to="https://app.nepostore.xyz" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* CASE 2: App Subdomain (app.nepostore.xyz) -> SHOW ADMIN DASHBOARD */}
        {isDashboardSubdomain && (
          <>
            {/* The root of app.nepostore.xyz is the dashboard */}
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
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
            </Route>
            {/* Handle the /dashboard path by showing the same dashboard or redirecting to root */}
            <Route path="/dashboard/*" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* CASE 3: All other subdomains (tenant.nepostore.xyz) -> SHOW SHOP */}
        {isShopSubdomain && (
          <>
            {isUnderConstruction ? (
              <Route path="*" element={<UnderConstruction />} />
            ) : (
              <Route path="/" element={<ShopLayout />}>
                <Route index element={<ProductList />} />
                <Route path=":slug" element={<ProductList />} />
                <Route path="product/:id" element={<ProductDetail />} />
                <Route path="category/:id" element={<CategoryProducts />} />
                <Route path="checkout" element={<Checkout />} />
              </Route>
            )}
            {/* Any subpath besides the ones above should stay in the shop or home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Localhost fallback logic (if no tenant param is provided) */}
        {!subdomain && hostname === 'localhost' && (
          <Route path="/*" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="products" element={<Products />} />
            {/* ... other standard routes for local dev without subdomain ... */}
          </Route>
        )}
      </Routes>
    </Router>
  );
}

export default AppRouter;
