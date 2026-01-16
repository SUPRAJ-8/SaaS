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

// Add interceptor to handle 401 Unauthorized errors globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401 Unauthorized, it means the session has expired
    if (error.response && error.response.status === 401) {
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;

      // Avoid redirecting if we are already on the login or signup pages
      if (!pathname.includes('/login') && !pathname.includes('/signup')) {
        console.warn('🔐 Session expired or unauthorized. Redirecting to login...');

        // Determine correct login URL (preserving subdomains)
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        const baseDomain = (hostname.endsWith('.localhost') || hostname === 'localhost') ? 'localhost' : 'nepostore.xyz';

        // Redirect to login on the app subdomain
        const loginUrl = `${protocol}//app.${baseDomain}${port}/login?expired=true`;

        window.location.href = loginUrl;
      }
    }
    return Promise.reject(error);
  }
);

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
