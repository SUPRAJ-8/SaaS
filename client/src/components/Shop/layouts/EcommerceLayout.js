import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import '../theme.css';
import '../ProductStyles.css';
import './EcommerceLayout.css';
import EcommerceHeader from './EcommerceHeader';
import EcommerceFooter from './EcommerceFooter';
import NexusHeader from './NexusHeader';
import NexusFooter from './NexusFooter';
import HeroSection from './HeroSection';

import { applyStoreSettings, getShopPath } from '../../../themeUtils';
import ShopSEO from '../ShopSEO';


import axios from 'axios';

const EcommerceLayout = () => {
  const location = useLocation();
  const isProductDetailPage = location.pathname.includes('/product/');
  const isCheckoutPage = location.pathname.includes('/checkout');

  const settings = JSON.parse(localStorage.getItem('storeSettings') || '{}');

  useEffect(() => {
    // Re-apply settings to ensure CSS variables persist
    applyStoreSettings();

    // Fetch fresh settings from server to ensure we have the latest config (e.g. Navbar Style)
    const fetchSettings = async () => {
      try {
        // 1. Try Authenticated Fetch (Works if Admin is logged in)
        let response;
        try {
          response = await axios.get('/api/store-settings');
        } catch (e) {
          // 2. If Auth fails, try Public Fetch based on subdomain
          const hostname = window.location.hostname;
          const parts = hostname.split('.');
          if (parts.length > 2 || (hostname.endsWith('.localhost') && parts.length > 1)) {
            const subdomain = parts[0];
            if (subdomain !== 'app' && subdomain !== 'www') {
              response = await axios.get(`/api/store-settings/public/${subdomain}`);
            }
          }
        }

        if (response && response.data) {
          const data = response.data;
          localStorage.setItem('storeSettings', JSON.stringify(data));

          // Sync navbar settings specifically 
          if (data.navbarStyle) {
            localStorage.setItem('navbarSettings', JSON.stringify({ navbarStyle: data.navbarStyle }));
          }

          applyStoreSettings();

          // Trigger updates
          window.dispatchEvent(new Event('navbarSettingsUpdated'));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (error) {
        console.warn("Settings sync failed:", error.message);
      }
    };
    fetchSettings();
  }, [location.pathname]);

  return (
    <div className="ecommerce-layout shop-container">
      <ShopSEO storeSettings={settings} />
      <EcommerceHeader />
      <main>
        {(location.pathname === getShopPath('/') || location.pathname === '/' || location.pathname === '/shop' || location.pathname === '/shop/') && (
          <HeroSection />
        )}
        <Outlet />
      </main>
      <EcommerceFooter />
    </div>
  );
};

export default EcommerceLayout;
