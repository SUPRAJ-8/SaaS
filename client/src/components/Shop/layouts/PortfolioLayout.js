import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import '../ProductStyles.css';
import './PortfolioLayout.css'; // This file will be created next

import { applyStoreSettings } from '../../../themeUtils';
import axios from 'axios';

// Call it immediately
applyStoreSettings();

export const PortfolioHeader = () => {
  const [storeLogo, setStoreLogo] = useState(null);
  const [storeName, setStoreName] = useState('My Portfolio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Load store settings from localStorage
    const settings = localStorage.getItem('storeSettings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      if (parsedSettings.logo) {
        setStoreLogo(parsedSettings.logo);
      }
      if (parsedSettings.storeName) {
        setStoreName(parsedSettings.storeName);
      }
    }
  }, []);

  return (
    <header className="portfolio-header">
      <div className="portfolio-header-container">
        <div className="portfolio-logo" onClick={() => window.location.href = '/shop'}>
          {storeLogo ? (
            <img src={storeLogo} alt={storeName} className="portfolio-logo-img" />
          ) : (
            <h1>{storeName}</h1>
          )}
        </div>

        <nav className="portfolio-nav-desktop">
          <a href="/shop">Home</a>
          <a href="/shop/projects">Projects</a>
          <a href="/shop/contact">Contact</a>
        </nav>

        <button className="portfolio-mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`portfolio-mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
          <nav className="portfolio-mobile-nav" onClick={e => e.stopPropagation()}>
            <a href="/shop" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
            <a href="/shop/projects" onClick={() => setIsMobileMenuOpen(false)}>Projects</a>
            <a href="/shop/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export const PortfolioFooter = () => {
  const [storeName, setStoreName] = useState('Jane Doe');

  useEffect(() => {
    const settings = localStorage.getItem('storeSettings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      if (parsedSettings.storeName) {
        setStoreName(parsedSettings.storeName);
      }
    }
  }, []);

  return (
    <footer className="portfolio-footer">
      <p>&copy; 2025 {storeName}. All rights reserved.</p>
    </footer>
  );
};

const PortfolioLayout = () => {
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        let response;
        try {
          response = await axios.get('/api/store-settings');
        } catch (e) {
          const hostname = window.location.hostname;
          const parts = hostname.split('.');
          if (parts.length > 2 || (hostname.endsWith('.localhost') && parts.length > 1)) {
            const subdomain = parts[0];
            if (subdomain !== 'app' && subdomain !== 'www') {
              response = await axios.get(`/api/store-settings/public/${subdomain}`);
            }
          }
        }

        if (response && response.data) {
          const data = response.data;
          localStorage.setItem('storeSettings', JSON.stringify(data));
          if (data.navbarStyle) {
            localStorage.setItem('navbarSettings', JSON.stringify({ navbarStyle: data.navbarStyle }));
          }
          applyStoreSettings();
          window.dispatchEvent(new Event('navbarSettingsUpdated'));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (error) {
        console.warn("Portfolio sync failed:", error.message);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="portfolio-layout">
      <PortfolioHeader />
      <main className="portfolio-content">
        <Outlet />
      </main>
      <PortfolioFooter />
    </div>
  );
};

export default PortfolioLayout;
