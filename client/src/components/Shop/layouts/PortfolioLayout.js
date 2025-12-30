import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import './PortfolioLayout.css'; // This file will be created next

import { applyStoreSettings } from '../../../themeUtils';

// Call it immediately
applyStoreSettings();

export const PortfolioHeader = () => {
  const [storeLogo, setStoreLogo] = useState(null);
  const [storeName, setStoreName] = useState('My Portfolio');

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
      {storeLogo ? (
        <img src={storeLogo} alt={storeName} className="portfolio-logo-img" />
      ) : (
        <h1>{storeName}</h1>
      )}
      <nav>
        <a href="/shop">Home</a>
        <a href="/shop/projects">Projects</a>
        <a href="/shop/contact">Contact</a>
      </nav>
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
    // Load settings from localStorage
    const settings = localStorage.getItem('storeSettings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);

      // Update favicon
      if (parsedSettings.favicon) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = parsedSettings.favicon;
      }

      // Update page title with store name
      if (parsedSettings.storeName) {
        document.title = parsedSettings.storeName;
      }

      // Re-apply settings to ensure they persist
      applyStoreSettings();
    }
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
