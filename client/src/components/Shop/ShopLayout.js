import React, { useContext, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import '../../shop-theme.css';

// Dynamically import the layout components
const NexusLayout = lazy(() => import('./layouts/NexusLayout'));

// Map layout names to their components
const layouts = {
  nexus: NexusLayout,
};

const ShopLayout = () => {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();

  // Nexus is the only layout now
  const LayoutComponent = layouts[theme.layout] || NexusLayout;

  return (
    <Suspense fallback={<div>Loading Layout...</div>}>
      <LayoutComponent />
    </Suspense>
  );
};

export default ShopLayout;