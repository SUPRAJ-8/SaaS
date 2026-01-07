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


const EcommerceLayout = () => {
  const location = useLocation();
  const isProductDetailPage = location.pathname.includes('/product/');
  const isCheckoutPage = location.pathname.includes('/checkout');

  const settings = JSON.parse(localStorage.getItem('storeSettings') || '{}');

  useEffect(() => {
    // Re-apply settings to ensure CSS variables persist
    applyStoreSettings();
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
