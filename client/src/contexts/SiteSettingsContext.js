import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_URL from '../apiConfig';
import { applyStoreSettings } from '../themeUtils';

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
        // Function to fetch public settings if this is a shop page
        const fetchPublicSettings = async () => {
            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            let subdomain = null;

            if (hostname.endsWith('.localhost')) {
                subdomain = parts[0];
            } else if (hostname.endsWith('.nepostore.xyz')) {
                subdomain = parts[0];
            } else if (parts.length > 2) { // Generic subdomain support
                subdomain = parts[0];
            }

            // If it's a valid shop subdomain (not app, www, or local root)
            if (subdomain && subdomain !== 'app' && subdomain !== 'www' && subdomain !== 'localhost') {
                try {
                    const response = await axios.get(`${API_URL}/api/store-settings/public/${subdomain}`);
                    if (response.data) {
                        const settings = response.data;
                        setSiteSettings(prev => ({ ...prev, ...settings }));

                        // Apply theme styling immediately
                        applyStoreSettings(settings);

                        // If theme layout is specified, we might want to update local storage so ThemeContext picks it up
                        // (This is a bit hacky, but ThemeContext relies on localStorage/defaults)
                        if (settings.layoutStyle) {
                            // This helps ThemeContext pick up the layout on next render or refresh
                            // But for immediate effect, we might need a way to update ThemeContext state directly.
                            // Since we can't easily access ThemeContext here without circular dependency or lifting state up...
                            // We will rely on ShopLayout or App to use siteSettings.
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch public store settings:', error);
                }
            }
        };

        fetchPublicSettings();

        // Listen for changes to localStorage (from StoreSettings component - mostly for Dashboard preview)
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
