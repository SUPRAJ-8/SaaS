import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../apiConfig';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async (retryCount = 0) => {
      // Determine the correct auth URL based on API_URL
      // If API_URL is empty, use proxy (relative URL)
      // If API_URL is set, use it directly
      const authUrl = API_URL ? `${API_URL}/auth/current_user` : '/auth/current_user';
      console.log('🔍 Checking auth with URL:', authUrl, 'API_URL:', API_URL);
      
      const performAuthCheck = async (url) => {
        console.log('🔍 Performing auth check:', url);
        const response = await axios.get(url, {
          withCredentials: true
        });
        console.log('✅ Auth check response:', response.data);
        if (response.data && response.data.clientId) {
          setIsAuthenticated(true);
          setLoading(false);
          return true;
        } else {
          console.log('❌ No clientId in response');
          setIsAuthenticated(false);
          setLoading(false);
          return false;
        }
      };
      
      try {
        const success = await performAuthCheck(authUrl);
        if (success) return;
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        console.error('Error details:', {
          status: error.response?.status,
          message: error.response?.data,
          cookies: document.cookie,
          url: authUrl,
          hostname: window.location.hostname
        });
        
        // If 404 and no API_URL (using proxy), try direct backend
        if (error.response?.status === 404 && !API_URL) {
          console.log('🔄 Auth check proxy failed (404), trying direct backend...');
          try {
            const fallbackUrl = 'http://localhost:5002/auth/current_user';
            console.log('🔄 Trying fallback URL:', fallbackUrl);
            const success = await performAuthCheck(fallbackUrl);
            if (success) {
              console.log('✅ Fallback auth check succeeded');
              return;
            }
          } catch (fallbackError) {
            console.error('❌ Fallback auth check also failed:', fallbackError);
            console.error('Fallback error status:', fallbackError.response?.status);
            // If fallback also fails with 401, it means session cookie isn't being sent
            // This is expected when using direct backend URL from different domain
            if (fallbackError.response?.status === 401) {
              console.log('⚠️ Session cookie not available - this is expected when proxy fails');
            }
          }
        }
        
        // Retry once after a short delay if this might be a timing issue
        if (retryCount === 0 && error.response?.status === 401) {
          console.log('🔄 Retrying auth check after delay (401)...');
          setTimeout(() => {
            checkAuth(1);
          }, 1000); // Increased delay
        } else {
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    };

    // Small delay to ensure session cookie is available after login redirect
    const timer = setTimeout(() => {
      checkAuth();
    }, 200); // Increased delay

    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="loading-fade">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

