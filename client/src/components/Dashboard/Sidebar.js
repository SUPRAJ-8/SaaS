import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaStore, FaUsers, FaBoxOpen, FaShoppingCart, FaExclamationCircle, FaTags, FaPalette, FaUpload, FaCog, FaPaintBrush, FaFileAlt } from 'react-icons/fa';
import StoresModal from './StoresModal';
import './Sidebar.css';

const Sidebar = () => {
  const [isStoresModalOpen, setIsStoresModalOpen] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-header" onClick={() => setIsStoresModalOpen(true)} style={{ cursor: 'pointer' }}>
        <div className="logo">N</div>
        <div className="company-details">
          <span className="company-name">NEPO</span>
          <span className="company-role">OWNER</span>
        </div>
      </div>
      <StoresModal isOpen={isStoresModalOpen} onClose={() => setIsStoresModalOpen(false)} />
      <nav className="sidebar-nav">
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
