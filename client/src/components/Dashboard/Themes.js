import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ThemeContext } from '../../contexts/ThemeContext';
import API_URL from '../../apiConfig';
import './Themes.css';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaPalette, FaInfoCircle, FaRocket, FaEdit } from 'react-icons/fa';

const Themes = () => {
  const { theme: activeTheme, setTheme, setEnabledFeatures } = useContext(ThemeContext) || {};
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [homePageId, setHomePageId] = useState(null);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const [themesRes, websitesRes] = await Promise.all([
          axios.get(`${API_URL}/api/themes`, { withCredentials: true }),
          axios.get(`${API_URL}/api/websites`, { withCredentials: true })
        ]);

        setThemes(themesRes.data);

        // Find home page ID for customization
        if (websitesRes.data.length > 0) {
          const mainSite = websitesRes.data[0];
          const homePage = mainSite.pages.find(p => p.slug === '');
          if (homePage) {
            setHomePageId(homePage._id);
          }
        }
      } catch (error) {
        console.error('Error fetching themes/websites:', error);
        toast.error('Failed to load available themes.');
      } finally {
        setLoading(false);
      }
    };
    fetchThemes();
  }, []);

  const handleApplyTheme = async (themeObj) => {
    setApplyingId(themeObj._id);

    try {
      // 1. Call Backend to apply theme (updates settings and clones blueprint)
      const response = await axios.post(`${API_URL}/api/themes/apply/${themeObj._id}`, {}, {
        withCredentials: true
      });

      // 2. Update Local Context
      if (setTheme) setTheme(themeObj.id);
      if (setEnabledFeatures) setEnabledFeatures(themeObj.features);

      // 3. Sync with LocalStorage for immediate UI feedback
      const savedSettings = localStorage.getItem('storeSettings');
      let storeData = savedSettings ? JSON.parse(savedSettings) : {};

      const updatedStoreData = {
        ...storeData,
        selectedThemeId: themeObj.id,
        themeFeatures: themeObj.features
      };

      localStorage.setItem('storeSettings', JSON.stringify(updatedStoreData));
      localStorage.setItem('themeId', themeObj.id);

      // Dispatch event to notify layout components
      window.dispatchEvent(new Event('storeSettingsUpdated'));

      toast.success(response.data.msg || `'${themeObj.name}' applied!`);
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error(error.response?.data?.msg || 'Failed to apply theme.');
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) return (
    <div className="themes-loading-container">
      <div className="loader">Consulting with designers...</div>
    </div>
  );

  return (
    <div className="themes-page">
      <header className="themes-header">
        <div className="header-text">
          <h1>Explore Store Templates</h1>
          <p>Each template acts as a blueprint. Apply one to jumpstart your design.</p>
        </div>
        <div className="header-badge">
          <FaPalette /> <span>{themes.length} Professional Layouts</span>
        </div>
      </header>

      <div className="themes-grid">
        {themes.map((theme) => {
          // Check if active (we compare with theme.id string like 'nexus' or 'modern-minimal')
          const isActive = activeTheme && (activeTheme === theme.id || activeTheme.id === theme.id);
          const isApplying = applyingId === theme._id;

          return (
            <div key={theme._id} className={`theme-card ${isActive ? 'active' : ''}`}>
              <div className="theme-preview">
                <img src={theme.thumbnail} alt={theme.name} className="theme-thumbnail" />
                {isActive && (
                  <div className="active-overlay">
                    <FaCheckCircle /> Currently Live
                  </div>
                )}
              </div>
              <div className="theme-info">
                <div className="theme-details">
                  <div className="title-row">
                    <h3>{theme.name}</h3>
                    <span className={`type-badge ${theme.category?.toLowerCase()}`}>{theme.category}</span>
                  </div>
                  <p className="theme-desc">{theme.description}</p>

                  <div className="feature-dots">
                    {theme.features?.ecommerce && <span title="Ecommerce Enabled">🛍️</span>}
                    {theme.features?.checkout && <span title="Checkout Ready">💳</span>}
                    {theme.features?.wishlist && <span title="Wishlist Support">❤️</span>}
                  </div>
                </div>
                <div className="theme-actions">
                  {isActive ? (
                    <div className="active-theme-btns">
                      <button className="btn btn-success disabled">
                        <FaCheckCircle /> Active template
                      </button>
                      {homePageId && (
                        <button
                          className="btn btn-customize"
                          onClick={() => navigate(`/dashboard/page-builder/${homePageId}`)}
                        >
                          <FaEdit /> Customize Theme
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      className={`btn btn-primary ${isApplying ? 'btn-loading' : ''}`}
                      onClick={() => handleApplyTheme(theme)}
                      disabled={isApplying}
                    >
                      {isApplying ? 'Setting up...' : (
                        <><FaRocket /> Apply Template</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="themes-footer">
        <div className="info-tip">
          <FaInfoCircle />
          <span>Switching templates updates your Home Page layout while preserving your store colors and fonts.</span>
        </div>
      </footer>
    </div>
  );
};

export default Themes;
