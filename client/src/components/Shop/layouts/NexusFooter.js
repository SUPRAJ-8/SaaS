import React from 'react';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaLinkedin } from 'react-icons/fa';
import './NexusLayout.css';
import { SiteSettingsContext } from '../../../contexts/SiteSettingsContext';
import { getShopPath } from '../../../themeUtils';

const NexusFooter = ({ previewConfig }) => {
    const { siteSettings } = React.useContext(SiteSettingsContext);
    const [footerSettings, setFooterSettings] = React.useState({});

    const loadFooterSettings = React.useCallback(() => {
        const saved = localStorage.getItem('nexus_footerSettings') || localStorage.getItem('footerSettings');
        if (saved) {
            try {
                setFooterSettings(JSON.parse(saved));
            } catch (e) {
                console.error("Error parsing footer settings", e);
            }
        }
    }, []);

    React.useEffect(() => {
        loadFooterSettings();

        const handleUpdate = () => loadFooterSettings();
        window.addEventListener('nexus_footerSettingsUpdated', handleUpdate);
        window.addEventListener('footerSettingsUpdated', handleUpdate);
        window.addEventListener('storage', handleUpdate);

        return () => {
            window.removeEventListener('nexus_footerSettingsUpdated', handleUpdate);
            window.removeEventListener('footerSettingsUpdated', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, [loadFooterSettings]);

    // Use siteSettings from context for global store data
    // Fallback to localStorage if context not ready (e.g. dashboard preview)
    const getGlobalSettings = () => {
        if (siteSettings && (siteSettings.brandName || siteSettings.storeName)) {
            return siteSettings;
        }
        try {
            return JSON.parse(localStorage.getItem('storeSettings') || '{}');
        } catch (e) {
            return {};
        }
    };

    const settings = getGlobalSettings();
    // Prioritize previewConfig if it exists, otherwise use state config
    const config = previewConfig || footerSettings;

    const rawBrand = settings.brandName?.trim();
    const rawStore = settings.storeName?.trim();
    const storeName = rawBrand || rawStore || '';
    const tagline = config.tagline || 'Digital transformation that really works.';

    // Editable columns from theme settings
    const col1Title = config.col1Title || 'Company';
    const col1Links = footerSettings.col1Links || [
        { text: 'All Products', url: '/products' },
        { text: 'New Arrivals', url: '/products' },
        { text: 'Featured', url: '/products' },
        { text: 'Offers', url: '/products' }
    ];

    const col2Title = config.col2Title || 'Navigation';
    const col2Links = config.col2Links || [
        { text: 'Main Benefits', url: '/benefits' },
        { text: 'Our Services', url: '/' },
        { text: 'Track Order', url: '/track-order' },
        { text: 'Why Salesforce', url: '/why-us' },
        { text: 'Testimonials', url: '/testimonials' }
    ];

    // Editable contact info from theme settings
    const contactEmail = config.contactEmail || settings.contactEmail || 'info@azimute.pt';
    const contactPhone = config.contactPhone || settings.contactNumber || '+351 123 456 789';
    const contactAddress = config.contactAddress || settings.storeAddress || 'Lisboa, Portugal';

    // Themeable colors with 'Use Theme Color' logic
    const backgroundColor = config.useThemeColor ? 'var(--nexus-bg)' : (config.backgroundColor || '#f8f9fa');
    const textColor = config.useThemeColor ? 'var(--nexus-text)' : (config.textColor || '#212529');

    // Editable social media links from theme settings
    const socialLinks = config.socialLinks || [
        { icon: 'FaLinkedin', url: '#' },
        { icon: 'FaInstagram', url: '#' },
        { icon: 'FaFacebook', url: '#' },
        { icon: 'FaYoutube', url: '#' }
    ];

    const iconComponents = {
        FaFacebook,
        FaInstagram,
        FaTwitter,
        FaYoutube,
        FaLinkedin
    };

    const copyrightText = config.copyrightText || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`;

    const footerStyles = {
        '--footer-bg-color': backgroundColor,
        '--footer-text-color': textColor
    };

    return (
        <footer className="nexus-footer" style={footerStyles}>
            <div className="nexus-footer-top">
                <div className="nexus-brand-col">
                    <div className="nexus-footer-brand-container">
                        {settings.logo && (
                            <img src={settings.logo} alt={storeName} className="nexus-footer-logo-img" />
                        )}
                        <h2 className="nexus-footer-logo">{storeName}</h2>
                    </div>
                </div>
                <div className="nexus-tagline-col">
                    <p style={{ color: textColor }}>{tagline}</p>
                </div>
            </div>

            <div className="nexus-footer-divider"></div>

            <div className="nexus-footer-content">
                <div className="nexus-footer-columns">
                    {/* Column 1: Empresa */}
                    <div className="nexus-col">
                        <h3>{col1Title}</h3>
                        <ul className="nexus-links-list">
                            {col1Links.map((link, index) => (
                                <li key={index}><a href={getShopPath(link.url)}>{link.text}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 2: Navegação */}
                    <div className="nexus-col">
                        <h3>{col2Title}</h3>
                        <ul className="nexus-links-list">
                            {col2Links.map((link, index) => (
                                <li key={index}><a href={getShopPath(link.url)}>{link.text}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Contacto */}
                    <div className="nexus-col">
                        <h3>{config.col3Title || 'Contact'}</h3>
                        <ul className="contact-list">
                            <li>
                                <FaEnvelope />
                                <span>{contactEmail}</span>
                            </li>
                            <li>
                                <FaPhoneAlt />
                                <span>{contactPhone}</span>
                            </li>
                            <li>
                                <FaMapMarkerAlt />
                                <span>{contactAddress}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="nexus-footer-socials">
                    <div className="social-icons">
                        {socialLinks.map((link, index) => {
                            const IconComponent = iconComponents[link.icon];
                            return IconComponent ? (
                                <a key={index} href={link.url} target="_blank" rel="noopener noreferrer">
                                    <IconComponent />
                                </a>
                            ) : null;
                        })}
                    </div>
                </div>
            </div>

            <div className="nexus-footer-bottom">
                <p style={{ color: textColor }}>{copyrightText}</p>
                <div className="nexus-legal">
                    {(config.legalLinks || [
                        { text: 'Terms and Conditions', url: '/terms' },
                        { text: 'Privacy Policy', url: '/privacy' },
                        { text: 'Cookies', url: '/cookies' }
                    ]).map((link, index) => (
                        <a key={index} href={getShopPath(link.url)}>{link.text}</a>
                    ))}
                </div>
            </div>
        </footer>
    );
};

export default NexusFooter;
