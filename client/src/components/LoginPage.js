import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaEye, FaEyeSlash, FaArrowRight, FaStore } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../apiConfig';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = () => {
    // Redirect to the backend Google auth route
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const loginUrl = API_URL ? `${API_URL}/api/auth/login` : '/api/auth/login';
    console.log('🔐 Login attempt:', { email, url: loginUrl, API_URL });
    
    const performLogin = async (url) => {
      const response = await axios.post(url, { email, password }, { withCredentials: true });
      console.log('✅ Login response:', response.data);
      
      if (response.data.success) {
        console.log('✅ Login successful, preparing redirect...');
        console.log('User data:', response.data.user);
        toast.success('Successfully logged in! Redirecting...');
        
        // Wait a moment for session cookie to be set, then redirect
        // Use window.location.href for full page reload to ensure ProtectedRoute picks up session
        setTimeout(() => {
          console.log('🔄 Redirecting to dashboard...');
          console.log('Current location:', window.location.href);
          console.log('Cookies before redirect:', document.cookie);
          
          // Force redirect - try multiple methods to ensure it works
          try {
            window.location.href = '/dashboard';
          } catch (e) {
            console.error('Redirect error:', e);
            window.location.replace('/dashboard');
          }
        }, 500); // Wait for session to be saved
        
        return true;
      }
      return false;
    };
    
    try {
      const success = await performLogin(loginUrl);
      if (success) {
        // Don't set loading to false here - let the redirect happen
        return;
      } else {
        setLoading(false);
        toast.error('Login failed - no success response');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      // If it's a 404, try direct backend URL as fallback
      if (error.response?.status === 404 && !API_URL) {
        console.log('🔄 Trying direct backend URL as fallback...');
        try {
          const fallbackUrl = 'http://localhost:5002/api/auth/login';
          const success = await performLogin(fallbackUrl);
          if (success) {
            // Don't set loading to false here - let the redirect happen
            return;
          } else {
            setLoading(false);
            toast.error('Login failed - no success response');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback login also failed:', fallbackError);
          toast.error(fallbackError.response?.data?.msg || 'Invalid Credentials');
          setLoading(false);
          return;
        }
      }
      
      // Show specific error message
      const errorMessage = error.response?.data?.msg || error.message || 'Invalid Credentials';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-login-page">
      <div className="login-container-card">
        <div className="login-side-decoration">
          <div className="brand-section">
            <div className="brand-icon-wrapper">
              <FaStore /> {/* Placeholder for the stylized W logo */}
            </div>
            <span>WHCH SaaS</span>
          </div>

          <div className="decoration-content">
            <h1>Empowering Nepal's E-commerce Revolution.</h1>
            <p>Join thousands of entrepreneurs who are building their legacy with our no-code CMS platform.</p>
          </div>

          <div className="stats-mini-grid">
            <div className="stat-mini-item">
              <span className="stat-value">12k+</span>
              <span className="stat-label">Stores Built</span>
            </div>
            <div className="stat-mini-item">
              <span className="stat-value">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
          </div>

          <div className="floating-shapes">
            <div className="shape shape-1"></div>
          </div>
        </div>

        <div className="login-side-form">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2>Welcome Back</h2>
              <p>Enter your details to access your dashboard</p>
            </div>

            <form className="auth-form" onSubmit={handleEmailLogin}>
              <div className="premium-input-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="premium-input-group">
                <div className="label-row">
                  <label>Password</label>
                  <a href="#" className="forgot-password">Forgot?</a>
                </div>
                <div className="input-with-icon">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="remember-me-row">
                <label className="checkbox-container">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember for 30 days
                </label>
              </div>

              <button type="submit" className="premium-submit-btn" disabled={loading}>
                {loading ? 'Please wait...' : 'Sign In to Dashboard'}
                <FaArrowRight className="btn-arrow" />
              </button>
            </form>

            <div className="form-divider">
              <span>or sign in with</span>
            </div>

            <button onClick={handleGoogleLogin} className="google-auth-btn">
              <FaGoogle className="google-icon" />
              <span>Continue with Google</span>
            </button>

            <div className="form-footer">
              <p>Don't have an account? <Link to="/signup">Start Free Trial</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};

export default LoginPage;
