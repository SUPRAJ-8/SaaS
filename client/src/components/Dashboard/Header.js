import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaSignOutAlt, FaBars, FaEye, FaBell } from 'react-icons/fa';
import { BsLayoutSidebar } from 'react-icons/bs';
import API_URL from '../../apiConfig';
import './Header.css';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get(`${API_URL}/auth/current_user`);
        setUser(userRes.data);

        if (userRes.data?.clientId) {
          const clientRes = await axios.get(`${API_URL}/api/super-admin/clients/${userRes.data.clientId}`);
          setClient(clientRes.data);

          // Fetch unread notifications count
          const notesRes = await axios.get(`${API_URL}/api/notifications`);
          const unread = notesRes.data.filter(n => n.status === 'unread').length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const handleVisitStore = (e) => {
    e.preventDefault();
    if (!client || !client.subdomain) return;

    const hostname = window.location.hostname;
    let baseDomain = hostname.includes('nepostore.xyz') ? 'nepostore.xyz' : 'localhost';
    let protocol = hostname.includes('nepostore.xyz') ? 'https:' : 'http:';
    let port = hostname.includes('nepostore.xyz') ? '' : ':3000';

    const shopUrl = `${protocol}//${client.subdomain}.${baseDomain}${port}`;
    window.open(shopUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className={`dashboard-header ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
      <div className="layout-toggle-icons">
        <button
          className={`layout-btn ${isSidebarOpen ? 'active' : ''}`}
          title="Toggle Sidebar"
          onClick={toggleSidebar}
        >
          <BsLayoutSidebar />
        </button>
      </div>

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

        <button
          className="header-visit-store-btn"
          onClick={handleVisitStore}
          disabled={!client?.subdomain}
          title="View Live Store"
        >
          <FaEye /> <span>View Store</span>
        </button>
      </div>
      <div className="header-right">
        <Link to="/dashboard/notifications" className="header-notification-btn" title="Notifications">
          <FaBell />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </Link>
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
