import React, { useContext, useEffect } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import axios from 'axios';
import API_URL from '../../apiConfig';
import { SiteSettingsContext } from '../../contexts/SiteSettingsContext';
import './FloatingPlugins.css';

const FloatingPlugins = () => {
    const { siteSettings } = useContext(SiteSettingsContext);
    const [globalSettings, setGlobalSettings] = React.useState(null);

    // Support both casings just in case
    const whatsappNumber = siteSettings?.whatsappNumber || siteSettings?.whatsAppNumber || globalSettings?.whatsAppNumber;
    const tawkToId = siteSettings?.tawkToId || globalSettings?.tawkToId;

    useEffect(() => {
        // If we are on landing/contact page, fetch global settings
        const hostname = window.location.hostname;
        const parts = hostname.split('.');

        // Root domain detection (localhost, nepostore.xyz, or www.nepostore.xyz)
        let isRoot = false;
        if (hostname === 'localhost' || parts.length <= 2 || (parts.length === 3 && parts[0] === 'www')) {
            // But exclude 'app' subdomain if it happens to be caught
            if (parts[0] !== 'app') {
                isRoot = true;
            }
        }

        if (isRoot) {
            axios.get(`${API_URL}/api/public-settings`)
                .then(response => {
                    if (response.data) {
                        setGlobalSettings(response.data);
                    }
                })
                .catch(err => console.error('Error fetching global settings:', err));
        }
    }, []);

    useEffect(() => {
        // Load Tawk.to if ID exists
        if (tawkToId) {
            window.Tawk_API = window.Tawk_API || {};
            window.Tawk_LoadStart = new Date();

            // Nudge tawk.to up to make room for WhatsApp below it
            window.Tawk_API.customStyle = {
                visibility: {
                    desktop: {
                        yOffset: 95
                    },
                    mobile: {
                        yOffset: 85
                    }
                }
            };

            const s1 = document.createElement("script");
            s1.async = true;
            s1.src = `https://embed.tawk.to/${tawkToId.trim()}/default`;
            s1.charset = 'UTF-8';
            s1.setAttribute('crossorigin', '*');
            const s0 = document.getElementsByTagName("script")[0];
            if (s0 && s0.parentNode) {
                s0.parentNode.insertBefore(s1, s0);
            } else {
                document.head.appendChild(s1);
            }

            return () => {
                // Cleanup script if needed
                if (s1.parentNode) {
                    s1.parentNode.removeChild(s1);
                }
            };
        }
    }, [tawkToId]);

    if (!whatsappNumber) return null;

    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');

    return (
        <a
            href={`https://wa.me/${cleanNumber}`}
            className="shop-whatsapp-float"
            target="_blank"
            rel="noopener noreferrer"
            title="Chat with us on WhatsApp"
        >
            <FaWhatsapp className="whatsapp-icon" />
        </a>
    );
};

export default FloatingPlugins;
