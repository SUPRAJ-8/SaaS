import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import '../theme.css';
import './EcommerceLayout.css';
import EcommerceHeader from './EcommerceHeader';
import EcommerceFooter from './EcommerceFooter';
import NexusHeader from './NexusHeader';
import NexusFooter from './NexusFooter';
import HeroSection from './HeroSection';

import { applyStoreSettings } from '../../../themeUtils';


const EcommerceLayout = () => {
  const location = useLocation();
  const isProductDetailPage = location.pathname.startsWith('/shop/product/');
  const isCheckoutPage = location.pathname === '/shop/checkout';

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
    <div className={`ecommerce-layout shop-container ${localStorage.getItem('themeId') === 'nexus' ? 'nexus-theme' : ''}`}>
      {localStorage.getItem('themeId') === 'nexus' ? <NexusHeader /> : <EcommerceHeader />}
      <main>
        {!isProductDetailPage && !isCheckoutPage && location.pathname !== '/shop/products' && localStorage.getItem('themeId') !== 'nexus' && (
          <>
            <HeroSection />
          </>
        )}
        <Outlet />
      </main>
      {localStorage.getItem('themeId') === 'nexus' ? <NexusFooter /> : <EcommerceFooter />}
    </div>
  );
};

export default EcommerceLayout;
