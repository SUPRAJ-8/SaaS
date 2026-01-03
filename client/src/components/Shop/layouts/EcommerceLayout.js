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


const EcommerceLayout = () => {
  const location = useLocation();
  const isProductDetailPage = location.pathname.includes('/product/');
  const isCheckoutPage = location.pathname.includes('/checkout');

  // Load settings and update title/favicon
  useEffect(() => {
    const settings = localStorage.getItem('storeSettings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);

      // Update favicon
      if (parsedSettings.favicon) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = parsedSettings.favicon;
      }

      // Update page title with brand name or store name
      const displayTitle = parsedSettings.brandName || parsedSettings.storeName || 'Ecommerce Store';
      document.title = displayTitle;

      // Re-apply settings to ensure they persist
      applyStoreSettings();
    }
  }, [location.pathname]); // Update on route changes too

  return (
    <div className="ecommerce-layout shop-container">
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
