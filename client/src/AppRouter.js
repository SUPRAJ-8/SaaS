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
import Wishlist from './components/Shop/Wishlist';
import LandingPage from './components/LandingPage';
import FloatingPlugins from './components/Shop/FloatingPlugins';
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
import Plugins from './components/Dashboard/Plugins';
import Analytics from './components/Dashboard/Analytics';
import Notifications from './components/Dashboard/Notifications';
import LoginPage from './components/LoginPage';
import GetStartedPage from './components/GetStartedPage';
import SignupPage from './components/SignupPage';
import ContactPage from './components/ContactPage';
import ProtectedRoute from './components/ProtectedRoute';



import ComingSoon from './components/Dashboard/ComingSoon';

const Issue = () => <ComingSoon title="Issue Reporting" description="We're building a comprehensive issue tracking system to help you manage store queries and problems better." />;


const ExternalRedirect = ({ url }) => {
  React.useEffect(() => {
    window.location.href = url;
  }, [url]);
  return <div className="loading-screen">Redirecting...</div>;
};


function AppRouter() {
  const { siteSettings } = useSiteSettings();
  const isUnderConstruction = siteSettings?.siteUnderConstruction || false;

  // Domain/Subdomain Detection Logic (v2.0.0)
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';

  // 1. Identify Main Platform Domains
  const isMainLanding = hostname === 'nepostore.xyz' || hostname === 'www.nepostore.xyz';
  const isDashboard = hostname === 'app.nepostore.xyz' || (hostname.endsWith('.localhost') && parts[0] === 'app');

  // 2. Identify Subdomains on NepoStore
  const isNepoSubdomain = hostname.endsWith('.nepostore.xyz') && !isMainLanding && !isDashboard;

  // 3. Identify Localhost Shops
  const isLocalhostShop = hostname.endsWith('.localhost') && parts[0] !== 'app';

  // 4. Identify Custom Domains
  // If it's not nepostore.xyz and not localhost, it's a custom domain shop
  const isCustomDomain = !hostname.endsWith('nepostore.xyz') && !hostname.includes('localhost');

  // Decision flags
  // In development, treat plain localhost as dashboard (app subdomain) for easier testing
  // Unless a tenant query param explicitly says otherwise
  const tenantParam = new URLSearchParams(window.location.search).get('tenant');
  const isLandingPage = isMainLanding;
  const isDashboardSubdomain = isDashboard || (hostname === 'localhost' && (!tenantParam || tenantParam === 'app'));
  const isShopSubdomain = isNepoSubdomain || isLocalhostShop || isCustomDomain || (hostname === 'localhost' && tenantParam && tenantParam !== 'app');

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
              {/* Template Builder Route - Reuses PageBuilder in template mode */}
              <Route path="template-builder/:id" element={<PageBuilder mode="template" />} />
              <Route path="plugins" element={<Plugins />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="notifications" element={<Notifications />} />
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
                <Route index element={<ProductList key="home" />} />
                <Route path=":slug" element={<ProductList key="slug" />} />
                <Route path="product/:id" element={<ProductDetail />} />
                <Route path="category/:id" element={<CategoryProducts />} />
                <Route path="wishlist" element={<Wishlist />} />
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

      {/* Platform-wide Floating Plugins (WhatsApp, etc.) - Only for Shop pages now */}
      {isShopSubdomain && <FloatingPlugins />}
    </Router>
  );
}

export default AppRouter;
