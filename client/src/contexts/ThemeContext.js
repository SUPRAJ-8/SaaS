import React, { createContext, useState, useEffect, useContext } from 'react';
import { themes } from '../themes';
import { SiteSettingsContext } from './SiteSettingsContext';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Access site settings which are fetched from API (including public/visitor view)
  const { siteSettings } = useContext(SiteSettingsContext);

  const [themeId, setThemeId] = useState(() => {
    // Get stored theme from localStorage as initial fallback
    let storedId = localStorage.getItem('themeId') || 'ecommerce';
    // Migration: raw renamed to nexus
    if (storedId === 'raw' || storedId === 'base') return 'nexus';
    return storedId;
  });

  // Sync themeId with siteSettings when they are loaded/updated from API
  useEffect(() => {
    if (siteSettings?.selectedThemeId && siteSettings.selectedThemeId !== themeId) {
      setThemeId(siteSettings.selectedThemeId);
    }
  }, [siteSettings, themeId]);

  const currentTheme = themes.find((t) => t.id === themeId) || themes[0];

  useEffect(() => {
    // Save the selected theme to localStorage
    localStorage.setItem('themeId', themeId);
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme: setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
