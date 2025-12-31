import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../apiConfig';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async (retryCount = 0) => {
      try {
        // Explicitly set withCredentials to ensure cookies are sent
        const response = await axios.get(`${API_URL}/auth/current_user`, {
          withCredentials: true
        });
        if (response.data && response.data.clientId) {
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          setIsAuthenticated(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        console.error('Error details:', {
          status: error.response?.status,
          message: error.response?.data,
          cookies: document.cookie
        });
        // Retry once after a short delay if this might be a timing issue
        if (retryCount === 0 && error.response?.status === 401) {
          console.log('Retrying auth check after delay...');
          setTimeout(() => {
            checkAuth(1);
          }, 500);
        } else {
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    };

    // Small delay to ensure session cookie is available after login redirect
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    
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

