import React from 'react';
import AppRouter from './AppRouter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { CartProvider } from './components/Shop/CartProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import { applyStoreSettings } from './themeUtils';

import axios from 'axios';

// Configure Axios to send cookies with every request (essential for sessions/subdomains)
axios.defaults.withCredentials = true;

function App() {
  React.useEffect(() => {
    // Apply settings on initial load
    applyStoreSettings();

    // Listen for updates from StoreSettings
    const handleUpdate = () => applyStoreSettings();
    window.addEventListener('storeSettingsUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('storeSettingsUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <SiteSettingsProvider>
      <ThemeProvider>
        <CartProvider>
          <div className="App">
            <AppRouter />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </CartProvider>
      </ThemeProvider>
    </SiteSettingsProvider>
  );
}

export default App;
