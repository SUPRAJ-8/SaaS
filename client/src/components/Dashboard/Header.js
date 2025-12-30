import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="dashboard-header">
      <div className="header-left">
        <div className="header-logo">
          {/* A simple SVG logo as a placeholder */}
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
        {/* Search bar, user profile, etc. can be added here later */}
      </div>
    </header>
  );
};

export default Header;
