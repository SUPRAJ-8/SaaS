import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import '../theme.css';
import '../ProductStyles.css';
import './NexusLayout.css';
import NexusHeader from './NexusHeader';
import NexusFooter from './NexusFooter';
import { applyStoreSettings } from '../../../themeUtils';

const NexusLayout = () => {
    const location = useLocation();

    // Load settings and update title/favicon
    useEffect(() => {
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

            // Update page title with brand name or store name
            const displayTitle = parsedSettings.brandName || parsedSettings.storeName || 'Nexus Store';
            document.title = displayTitle;

            // Re-apply settings to ensure they persist
            applyStoreSettings();
        }
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
