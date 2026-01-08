import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import '../theme.css';
import '../ProductStyles.css';
import './NexusLayout.css';
import NexusHeader from './NexusHeader';
import NexusFooter from './NexusFooter';
import { applyStoreSettings } from '../../../themeUtils';
import axios from 'axios';

const NexusLayout = () => {
    const location = useLocation();

    // Load settings and update title/favicon
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const hostname = window.location.hostname;
                const parts = hostname.split('.');
                let subdomain = null;
                if (parts.length > 2 || (hostname.endsWith('.localhost') && parts.length > 1)) {
                    const firstPart = parts[0];
                    if (firstPart !== 'app' && firstPart !== 'www') {
                        subdomain = firstPart;
                    }
                }

                let response;
                if (subdomain) {
                    // If on a store subdomain, always use public API first
                    try {
                        response = await axios.get(`/api/store-settings/public/${subdomain}`);
                    } catch (e) {
                        console.warn("Public settings fetch failed for subdomain:", subdomain);
                    }
                } else {
                    // Fallback for app subdomain or localhost (trying to get logged-in user's store)
                    try {
                        response = await axios.get('/api/store-settings');
                    } catch (e) {
                        console.warn("Private settings fetch failed");
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
                console.warn("Nexus sync failed:", error.message);
            }
        };

        fetchSettings();
    }, [location.pathname]);

    return (
        <div className="nexus-layout shop-container nexus-theme">
            <NexusHeader />
            <main>
                {/* Nexus might have its own hero logic or use PageBuilder content */}
                <Outlet />
            </main>
            <NexusFooter />
        </div>
    );
};

export default NexusLayout;
