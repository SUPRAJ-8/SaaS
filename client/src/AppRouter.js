import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import UnderConstruction from './pages/UnderConstruction';
import NotFound from './pages/NotFound';
import ShopLayout from './components/Shop/ShopLayout';
import ProductList from './components/Shop/ProductList';
import ProductDetail from './components/Shop/ProductDetail';
import CategoryProducts from './components/Shop/CategoryProducts';
import Checkout from './components/Shop/Checkout';
import { useSiteSettings } from './contexts/SiteSettingsContext';
import OrderTracking from './components/Shop/OrderTracking';
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
import SuperAdminClients from './components/Dashboard/SuperAdminClients';
import LoginPage from './components/LoginPage';
import GetStartedPage from './components/GetStartedPage';
import SignupPage from './components/SignupPage';
import ContactPage from './components/ContactPage';
import ProtectedRoute from './components/ProtectedRoute';



const Issue = () => <h2>Issue</h2>;

const ExternalRedirect = ({ url }) => {
  React.useEffect(() => {
    window.location.href = url;
  }, [url]);
  return <div className="loading-screen">Redirecting...</div>;
};


function AppRouter() {
  const { siteSettings } = useSiteSettings();
  const isUnderConstruction = siteSettings?.siteUnderConstruction || false;

  // Subdomain Detection Logic (v1.0.2)
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Logic for production vs localhost
  let subdomain = null;
  if (hostname.endsWith('.localhost')) {
    // e.g., app.localhost, tenant.localhost
    subdomain = parts[0];
  } else if (hostname === 'localhost') {
    // For local testing, use search param: http://localhost:3000?tenant=app
    const params = new URLSearchParams(window.location.search);
    subdomain = params.get('tenant');
  } else if (hostname === 'nepostore.xyz' || hostname === 'www.nepostore.xyz') {
    // Main domain - no subdomain (landing page)
    subdomain = null;
  } else if (hostname.endsWith('.nepostore.xyz')) {
    // Production subdomain: app.nepostore.xyz, tenant.nepostore.xyz, etc.
    subdomain = parts[0];
  } else if (parts.length > 2) {
    // Fallback for other domains with subdomains
    subdomain = parts[0];
  }

  const isDashboardSubdomain = subdomain === 'app';
  const isLandingPage = !subdomain || subdomain === 'www';
  const isShopSubdomain = subdomain && !isDashboardSubdomain && !isLandingPage;

  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  const baseDomain = (hostname.endsWith('.localhost') || hostname === 'localhost') ? 'localhost' : 'nepostore.xyz';
  const dashboardUrl = `${protocol}//app.${baseDomain}${port}/dashboard`;

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* CASE 1: Main Domain (nepostore.xyz) -> SHOW LANDING PAGE */}
        {isLandingPage && (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            {/* Redirect auth pages to app subdomain */}
            <Route path="/login" element={<ExternalRedirect url={`${protocol}//app.${baseDomain}${port}/login`} />} />
            <Route path="/signup" element={<ExternalRedirect url={`${protocol}//app.${baseDomain}${port}/signup`} />} />
            <Route path="/get-started" element={<ExternalRedirect url={`${protocol}//app.${baseDomain}${port}/signup`} />} />

            {/* Super Admin Manage Customers (Tenants) */}
            <Route path="/superadmin/*" element={<SuperAdminClients />} />
            {/* If they accidentally try to visit /dashboard on root domain, redirect to the correct subdomain */}
            <Route path="/dashboard/*" element={<ExternalRedirect url={dashboardUrl} />} />
            {/* Fallback for Landing Page */}
            <Route path="*" element={<NotFound />} />
          </>
        )}

        {/* CASE 2: App Subdomain (app.nepostore.xyz) -> SHOW ADMIN DASHBOARD */}
        {isDashboardSubdomain && (
          <>
            {/* Auth routes on dashboard subdomain */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/get-started" element={<SignupPage />} />

            {/* On app subdomain, /dashboard is the entry point */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
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
            {/* Redirect root to /dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
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
                <Route path="track-order" element={<OrderTracking />} />
                <Route path="track-order/:orderId" element={<OrderTracking />} />
                {/* Catch-all for unknown paths within the shop layout */}
                <Route path="*" element={<NotFound />} />
              </Route>
            )}
            {/* Catch-all for unknown paths outside of the shop layout (if any) */}
            <Route path="*" element={<NotFound />} />
          </>
        )}

      </Routes>
    </Router>
  );
}

export default AppRouter;
