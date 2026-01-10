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
        const userRes = await axios.get(`${API_URL}/auth/current_user`, { withCredentials: true });
        const userData = userRes.data;
        setUser(userData);
        console.log('📍 Header: current_user data:', userData);

        if (userData?.clientId) {
          // If clientId is an object with data (subdomain or custom domain), use it.
          if (typeof userData.clientId === 'object' && (userData.clientId.subdomain || userData.clientId.customDomain)) {
            console.log('✅ Header: Using populated client data');
            setClient(userData.clientId);
          } else {
            // Otherwise fetch from our new safe endpoint that doesn't require super-admin permissions
            console.log('🔄 Header: Fetching client data from my-store...');
            const clientRes = await axios.get(`${API_URL}/api/store-settings/my-store`, { withCredentials: true });
            console.log('✅ Header: my-store response:', clientRes.data);
            setClient(clientRes.data);
            if (!clientRes.data.subdomain) {
              console.warn('⚠️ Header: Client from my-store has NO subdomain!', clientRes.data);
            }
          }

          // Fetch unread notifications count
          const notesRes = await axios.get(`${API_URL}/api/notifications`, { withCredentials: true });
          if (Array.isArray(notesRes.data)) {
            const unread = notesRes.data.filter(n => n.status === 'unread').length;
            setUnreadCount(unread);
          }
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
        const currentPort = window.location.port ? `:${window.location.port}` : ':3000';
        redirectUrl = `${window.location.protocol}//app.localhost${currentPort}/login`;
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
    if (!client) {
      console.warn('Cannot visit store: Client data not loaded');
      return;
    }

    // Prioritize Custom Domain if available
    if (client.customDomain) {
      const url = client.customDomain.startsWith('http') ? client.customDomain : `https://${client.customDomain}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!client.subdomain) {
      console.warn('Cannot visit store: No subdomain set');
      return;
    }

    const { hostname, protocol, port } = window.location;
    let baseDomain = hostname.includes('nepostore.xyz') ? 'nepostore.xyz' : 'localhost';
    let targetProtocol = hostname.includes('nepostore.xyz') ? 'https:' : protocol;

    // In local development, we often use port 3000 for the frontend
    let targetPort = port ? `:${port}` : (hostname.includes('nepostore.xyz') ? '' : ':3000');

    const shopUrl = `${targetProtocol}//${client.subdomain}.${baseDomain}${targetPort}`;
    console.log(`[Visit Store] Redirecting to: ${shopUrl}`);
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
          disabled={!client?.subdomain && !client?.customDomain}
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
