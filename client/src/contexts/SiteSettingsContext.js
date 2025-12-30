import React, { createContext, useState, useEffect, useContext } from 'react';

export const SiteSettingsContext = createContext();

export const SiteSettingsProvider = ({ children }) => {
    const [siteSettings, setSiteSettings] = useState(() => {
        // Get stored settings from localStorage
        const savedSettings = localStorage.getItem('storeSettings');
        if (savedSettings) {
            try {
                return JSON.parse(savedSettings);
            } catch (error) {
                console.error('Failed to load site settings:', error);
                return { siteUnderConstruction: false };
            }
        }
        return { siteUnderConstruction: false };
    });

    useEffect(() => {
        // Listen for changes to localStorage (from StoreSettings component)
        const handleStorageChange = () => {
            const savedSettings = localStorage.getItem('storeSettings');
            if (savedSettings) {
                try {
                    setSiteSettings(JSON.parse(savedSettings));
                } catch (error) {
                    console.error('Failed to load site settings:', error);
                }
            }
        };

        // Listen for storage events (changes from other tabs/windows)
        window.addEventListener('storage', handleStorageChange);

        // Custom event for same-tab updates
        window.addEventListener('storeSettingsUpdated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('storeSettingsUpdated', handleStorageChange);
        };
    }, []);

    return (
        <SiteSettingsContext.Provider value={{ siteSettings, setSiteSettings }}>
            {children}
        </SiteSettingsContext.Provider>
    );
};

// Custom hook for easy access
export const useSiteSettings = () => {
    const context = useContext(SiteSettingsContext);
    if (!context) {
        throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
    }
    return context;
};
