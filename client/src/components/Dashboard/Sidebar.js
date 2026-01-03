import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { FaHome, FaStore, FaUsers, FaBoxOpen, FaShoppingCart, FaExclamationCircle, FaTags, FaPalette, FaUpload, FaCog, FaPaintBrush, FaFileAlt, FaChevronRight } from 'react-icons/fa';
import StoresModal from './StoresModal';
import API_URL from '../../apiConfig';
import './Sidebar.css';

const Sidebar = () => {
  const [isStoresModalOpen, setIsStoresModalOpen] = useState(false);
  const [client, setClient] = useState(null);

  const fetchClientInfo = async () => {
    try {
      const userRes = await axios.get(`${API_URL}/auth/current_user`);
      if (userRes.data && userRes.data.clientId) {
        const clientRes = await axios.get(`${API_URL}/api/super-admin/clients/${userRes.data.clientId}`);
        setClient(clientRes.data);
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

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-header" onClick={() => setIsStoresModalOpen(true)}>
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
      <StoresModal isOpen={isStoresModalOpen} onClose={() => setIsStoresModalOpen(false)} />
      <nav className="dashboard-sidebar-nav">
        <h3 className="nav-title">Main Links</h3>
        <ul>
          <li><NavLink to="/dashboard" end><FaHome className="nav-icon" /> Home</NavLink></li>
          <li><NavLink to="/dashboard/store-user"><FaStore className="nav-icon" /> Store Users</NavLink></li>
          <li><NavLink to="/dashboard/customers" className={({ isActive }) => isActive ? 'active' : ''}><FaUsers className="nav-icon" /> Customers</NavLink></li>
          <li><NavLink to="/dashboard/products"><FaBoxOpen className="nav-icon" /> Products</NavLink></li>
          <li><NavLink to="/dashboard/bulk-upload"><FaUpload className="nav-icon" /> Bulk Upload</NavLink></li>
          <li><NavLink to="/dashboard/categories"><FaTags className="nav-icon" /> Categories</NavLink></li>


          <li><NavLink to="/dashboard/orders"><FaShoppingCart className="nav-icon" /> Orders</NavLink></li>
          <li><NavLink to="/dashboard/issue"><FaExclamationCircle className="nav-icon" /> Issues</NavLink></li>
        </ul>
        <h3 className="nav-title">Customization</h3>
        <ul>
          <li><NavLink to="/dashboard/pages"><FaFileAlt className="nav-icon" /> Pages</NavLink></li>
          <li><NavLink to="/dashboard/themes"><FaPalette className="nav-icon" /> Themes</NavLink></li>
          <li><NavLink to="/dashboard/store-settings"><FaCog className="nav-icon" /> Store Settings</NavLink></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
