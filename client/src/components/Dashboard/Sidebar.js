import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { FaHome, FaStore, FaUsers, FaBoxOpen, FaShoppingCart, FaExclamationCircle, FaTags, FaPalette, FaUpload, FaCog, FaPaintBrush, FaFileAlt, FaChevronRight, FaPlug, FaTimes, FaChartLine, FaBell } from 'react-icons/fa';
import StoresModal from './StoresModal';
import API_URL from '../../apiConfig';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [isStoresModalOpen, setIsStoresModalOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchClientInfo = async () => {
    try {
      const userRes = await axios.get(`${API_URL}/auth/current_user`, { withCredentials: true });
      if (userRes.data && userRes.data.clientId) {
        // Use populated data if available or fetch from safe endpoint
        if (typeof userRes.data.clientId === 'object' && userRes.data.clientId.subdomain) {
          setClient(userRes.data.clientId);
        } else {
          const clientRes = await axios.get(`${API_URL}/api/store-settings/my-store`, { withCredentials: true });
          setClient(clientRes.data);
        }

        // Fetch unread notifications count
        const notesRes = await axios.get(`${API_URL}/api/notifications`, { withCredentials: true });
        if (Array.isArray(notesRes.data)) {
          const unread = notesRes.data.filter(n => n.status === 'unread').length;
          setUnreadCount(unread);
        }
      }
    } catch (error) {
      console.error('Error fetching sidebar client info:', error);
    }
  };


  useEffect(() => {
    fetchClientInfo();

    // Listen for updates from StoreSettings
    const handleUpdate = () => fetchClientInfo();
    window.addEventListener('storeSettingsUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('storeSettingsUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleNavClick = () => {
    if (window.innerWidth <= 1024 && isOpen) {
      toggleSidebar();
    }
  };

  return (
    <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="dashboard-sidebar-header">
        <div className="header-brand-section" onClick={() => setIsStoresModalOpen(true)}>
          <div className="logo">
            {client?.settings?.logo ? (
              <img src={client.settings.logo} alt="Store Logo" className="sidebar-logo-img" />
            ) : (
              client?.name ? client.name.charAt(0).toUpperCase() : 'N'
            )}
          </div>
          <div className="company-details">
            <div className="company-name-wrapper">
              <span className="company-name">
                {client?.settings?.brandName?.trim() || client?.name || 'My Store'}
              </span>
              <FaChevronRight className="header-arrow" />
            </div>
          </div>
        </div>
        <button className="mobile-close-btn" onClick={toggleSidebar}>
          <FaTimes />
        </button>
      </div>
      <StoresModal isOpen={isStoresModalOpen} onClose={() => setIsStoresModalOpen(false)} />
      <nav className="dashboard-sidebar-nav">
        <h3 className="nav-title">Main Links</h3>
        <ul>
          <li><NavLink to="/dashboard" end onClick={handleNavClick}><FaHome className="nav-icon" /> Home</NavLink></li>
          <li><NavLink to="/dashboard/store-user" onClick={handleNavClick}><FaStore className="nav-icon" /> Store Users</NavLink></li>
          <li><NavLink to="/dashboard/customers" className={({ isActive }) => isActive ? 'active' : ''} onClick={handleNavClick}><FaUsers className="nav-icon" /> Customers</NavLink></li>
          <li><NavLink to="/dashboard/products" onClick={handleNavClick}><FaBoxOpen className="nav-icon" /> Products</NavLink></li>
          <li><NavLink to="/dashboard/bulk-upload" onClick={handleNavClick}><FaUpload className="nav-icon" /> Bulk Upload</NavLink></li>
          <li><NavLink to="/dashboard/categories" onClick={handleNavClick}><FaTags className="nav-icon" /> Categories</NavLink></li>
          <li><NavLink to="/dashboard/analytics" onClick={handleNavClick}><FaChartLine className="nav-icon" /> Analytics</NavLink></li>
          <li>
            <NavLink to="/dashboard/notifications" onClick={handleNavClick}>
              <div className="nav-link-with-badge">
                <FaBell className="nav-icon" />
                <span>Notifications</span>
                {unreadCount > 0 && <span className="sidebar-notification-badge">{unreadCount}</span>}
              </div>
            </NavLink>
          </li>


          <li><NavLink to="/dashboard/orders" onClick={handleNavClick}><FaShoppingCart className="nav-icon" /> Orders</NavLink></li>
          <li><NavLink to="/dashboard/issue" onClick={handleNavClick}><FaExclamationCircle className="nav-icon" /> Issues</NavLink></li>
        </ul>
        <h3 className="nav-title">Customization</h3>
        <ul>
          <li><NavLink to="/dashboard/pages" onClick={handleNavClick}><FaFileAlt className="nav-icon" /> Pages</NavLink></li>
          <li><NavLink to="/dashboard/themes" onClick={handleNavClick}><FaPalette className="nav-icon" /> Themes</NavLink></li>
          <li><NavLink to="/dashboard/plugins" onClick={handleNavClick}><FaPlug className="nav-icon" /> Plugins</NavLink></li>
          <li><NavLink to="/dashboard/store-settings" onClick={handleNavClick}><FaCog className="nav-icon" /> Store Settings</NavLink></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
