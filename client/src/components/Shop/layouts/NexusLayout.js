import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import '../theme.css';
import '../ProductStyles.css';
import './NexusLayout.css';
import NexusHeader from './NexusHeader';
import NexusFooter from './NexusFooter';
import { applyStoreSettings, getTenantId } from '../../../themeUtils';
import axios from 'axios';
import API_URL from '../../../apiConfig';

const NexusLayout = () => {
    const location = useLocation();

    // Load settings and update title/favicon
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const tenantId = getTenantId();

                let response;
                if (tenantId) {
                    // Always use public API for shop tenants (subdomain or custom domain)
                    try {
                        response = await axios.get(`${API_URL}/api/store-settings/public/${tenantId}`);
                    } catch (e) {
                        console.warn("Public settings fetch failed for tenant:", tenantId);
                    }
                } else {
                    // Fallback for app platform or internal testing
                    try {
                        response = await axios.get(`${API_URL}/api/store-settings`);
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
