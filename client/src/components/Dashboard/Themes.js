import React, { useContext } from 'react';
import { toast } from 'react-toastify';
import { ThemeContext } from '../../contexts/ThemeContext';
import { themes } from '../../themes';
import './Themes.css';
import { FaCheckCircle, FaPalette, FaInfoCircle } from 'react-icons/fa';

const Themes = () => {
  const { theme: activeTheme, setTheme } = useContext(ThemeContext) || {};

  const handleApplyTheme = (themeId) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    // 1. Update Theme Context
    setTheme(themeId);

    // 2. Sync with Store Settings in LocalStorage
    // We only update the layout ID, preserving user's custom colors and fonts
    const savedSettings = localStorage.getItem('storeSettings');
    let storeData = savedSettings ? JSON.parse(savedSettings) : {};

    const updatedStoreData = {
      ...storeData,
      selectedThemeId: themeId // ONLY update the ID to switch layout
    };

    localStorage.setItem('storeSettings', JSON.stringify(updatedStoreData));
    localStorage.setItem('themeId', themeId);

    // 3. Notify app of change
    window.dispatchEvent(new Event('storeSettingsUpdated'));

    toast.success(`'${theme.name}' layout applied! Your colors and fonts are preserved.`);
  };

  return (
    <div className="themes-page">
      <header className="themes-header">
        <div className="header-text">
          <h1>Store Themes</h1>
          <p>Select a professional aesthetic to define your brand's presence.</p>
        </div>
        <div className="header-badge">
          <FaPalette /> <span>{themes.length} Presets Available</span>
        </div>
      </header>

      <div className="themes-grid">
        {themes.map((theme) => {
          const isActive = activeTheme && activeTheme.id === theme.id;
          return (
            <div key={theme.id} className={`theme-card ${isActive ? 'active' : ''}`}>
              <div className="theme-preview">
                <div className="preview-main">
                  <div className="preview-header">
                    <span className="preview-dot"></span>
                    <span className="preview-dot"></span>
                    <span className="preview-dot"></span>
                  </div>
                  <div className="preview-content">
                    <div className="preview-line"></div>
                    <div className="preview-line"></div>
                    <div className="preview-line short"></div>
                    <div className="preview-font-badge" style={{
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-content)',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      marginTop: '8px',
                      display: 'inline-block',
                      fontWeight: 'bold',
                      fontFamily: theme.fontFamily
                    }}>
                      Aa
                    </div>
                  </div>
                </div>
              </div>
              <div className="theme-info">
                <div className="theme-details">
                  <h3>{theme.name}</h3>
                  <p className="theme-desc">{theme.description}</p>
                </div>
                <div className="theme-actions">
                  <button
                    className={`btn ${isActive ? 'btn-success' : 'btn-primary'}`}
                    onClick={() => handleApplyTheme(theme.id)}
                    disabled={isActive}
                  >
                    {isActive ? (
                      <><FaCheckCircle /> Activated</>
                    ) : (
                      'Apply Theme'
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="themes-footer">
        <div className="info-tip">
          <FaInfoCircle />
          <span>Applied themes update colors across your entire storefront instantly.</span>
        </div>
      </footer>
    </div>
  );
};

export default Themes;
