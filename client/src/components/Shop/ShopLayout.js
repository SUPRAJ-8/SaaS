import React, { useContext, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import '../../shop-theme.css';

// Dynamically import the layout components
const EcommerceLayout = lazy(() => import('./layouts/EcommerceLayout'));
const PortfolioLayout = lazy(() => import('./layouts/PortfolioLayout'));

// Map layout names to their components
const layouts = {
  ecommerce: EcommerceLayout,
  portfolio: PortfolioLayout,
};

const ShopLayout = () => {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();

  // Define pages that should use the standard Ecommerce layout regardless of theme
  const isCommonPage =
    location.pathname === '/shop/products' ||
    location.pathname === '/shop/checkout' ||
    location.pathname === '/shop/cart' ||
    location.pathname === '/shop/wishlist' ||
    location.pathname.startsWith('/shop/products/') || /* In case of pagination or params */
    location.pathname.startsWith('/shop/category/') ||
    location.pathname.startsWith('/shop/product/');

  // Determine which layout component to render based on the theme
  // If it's a common page, force EcommerceLayout (Standard Store Layout)
  const LayoutComponent = isCommonPage
    ? EcommerceLayout
    : (layouts[theme.layout] || EcommerceLayout);

  return (
    <Suspense fallback={<div>Loading Layout...</div>}>
      <LayoutComponent />
    </Suspense>
  );
};

export default ShopLayout;