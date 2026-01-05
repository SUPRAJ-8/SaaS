import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSignOutAlt, FaBars } from 'react-icons/fa';
import API_URL from '../../apiConfig';
import './Header.css';

const Header = ({ toggleSidebar }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/current_user`);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      await axios.get(`${API_URL}/auth/logout`, {
        withCredentials: true
      });

      // Determine redirect URL based on current location
      const hostname = window.location.hostname;
      let redirectUrl = '/login';

      if (hostname.includes('nepostore.xyz')) {
        // Production: stay on app subdomain
        redirectUrl = 'https://app.nepostore.xyz/login';
      } else if (hostname.includes('app.localhost')) {
        // Development with subdomain
        redirectUrl = 'http://app.localhost:3000/login';
      } else {
        // Development: use relative path
        redirectUrl = '/login';
      }

      // Redirect to login page
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to login
      window.location.href = '/login';
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <div className="header-logo">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0L28 14L14 28L0 14L14 0Z" fill="#5866f2" />
            <path d="M14 4.66667L23.3333 14L14 23.3333L4.66667 14L14 4.66667Z" fill="white" />
          </svg>
        </div>
        <span className="header-company-name">WHCH</span>

        <div className="dashboard-search-box">
          <div className="search-icon-btn"></div>
          <input type="text" placeholder="Search orders, products, customers..." />
        </div>
      </div>
      <div className="header-right">
        <div className="user-profile-header">
          <div className="user-avatar-wrapper">
            <img
              src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=ffe4bc&color=854d0e`}
              alt="User"
              className="header-user-avatar"
            />
          </div>
          <div className="user-info-text">
            <span className="user-name-display">{user ? user.name : (loading ? 'Loading...' : 'Guest')}</span>
            <span className="user-role-display">Admin</span>
          </div>

          <div className="profile-dropdown">
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt className="logout-icon" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
