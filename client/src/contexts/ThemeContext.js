import React, { createContext, useState, useEffect } from 'react';
import { themes } from '../themes';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    // Get stored theme from localStorage or default to 'ecommerce'
    let storedId = localStorage.getItem('themeId') || 'ecommerce';
    // Migration: raw renamed to nexus
    if (storedId === 'raw' || storedId === 'base') return 'nexus';
    return storedId;
  });

  const currentTheme = themes.find((t) => t.id === themeId) || themes[0];

  useEffect(() => {
    // Save the selected theme to localStorage
    localStorage.setItem('themeId', themeId);

    // We no longer apply colors here because we want to use the colors 
    // selected in 'Store Settings' (Appearances) as the primary source.
    // The Layout Theme only controls the structure.
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme: setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
};
