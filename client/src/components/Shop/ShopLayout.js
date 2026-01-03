import React, { useContext, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import '../../shop-theme.css';

// Dynamically import the layout components
const EcommerceLayout = lazy(() => import('./layouts/EcommerceLayout'));
const PortfolioLayout = lazy(() => import('./layouts/PortfolioLayout'));
const NexusLayout = lazy(() => import('./layouts/NexusLayout'));

// Map layout names to their components
const layouts = {
  ecommerce: EcommerceLayout,
  portfolio: PortfolioLayout,
  nexus: NexusLayout,
};

const ShopLayout = () => {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();

  // Determine which layout component to render based on the theme
  const LayoutComponent = layouts[theme.layout] || EcommerceLayout;

  return (
    <Suspense fallback={<div>Loading Layout...</div>}>
      <LayoutComponent />
    </Suspense>
  );
};

export default ShopLayout;