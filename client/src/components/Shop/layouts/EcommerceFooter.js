import React from 'react';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import { getShopPath } from '../../../themeUtils';
import './EcommerceLayout.css';

const EcommerceFooter = () => {
    // Read Store Settings
    const storeSettings = JSON.parse(localStorage.getItem('storeSettings') || '{}');
    const storeName = storeSettings.brandName || storeSettings.storeName || 'Ecommerce';
    const facebook = storeSettings.facebook || '#';
    const instagram = storeSettings.instagram || '#';
    const tiktok = storeSettings.tiktok || '#';

    // Read Footer Settings (from Page Builder)
    const footerSettings = JSON.parse(localStorage.getItem('footerSettings') || '{}');

    // Content Configuration with Fallbacks
    const tagline = footerSettings.tagline || 'Your one-stop destination for premium products and exceptional shopping experience.';

    const col1Title = footerSettings.col1Title || 'Shop';
    const col1Links = footerSettings.col1Links || [
        { text: 'All Products', url: '/products' },
        { text: 'New Arrivals', url: '/products' },
        { text: 'Featured', url: '/products' },
        { text: 'Offers', url: '/products' }
    ];

    const col2Title = footerSettings.col2Title || 'Support';
    const col2Links = footerSettings.col2Links || [
        { text: 'About Us', url: '/about' },
        { text: 'Contact Us', url: '/contact' },
        { text: 'Track Order', url: '/track-order' },
        { text: 'FAQs', url: '/faq' },
        { text: 'Shipping Info', url: '/shipping' }
    ];

    const contactEmail = footerSettings.contactEmail || storeSettings.contactEmail || '';
    const contactNumber = footerSettings.contactNumber || footerSettings.contactPhone || storeSettings.contactNumber || '';
    const storeAddress = footerSettings.contactAddress || storeSettings.storeAddress || '';

    // Appearance
    const textColor = footerSettings.textColor || 'var(--theme-text, #ffffff)';
    const backgroundColor = footerSettings.useThemeColor
        ? 'var(--theme-secondary, #1a1a1a)'
        : (footerSettings.backgroundColor || 'var(--theme-secondary, #1a1a1a)');

    // Common style object for links/text
    const textStyle = { color: textColor };

    return (
        <footer className="ecommerce-footer" style={{ backgroundColor, color: textColor }}>
            <div className="footer-top">
                <div className="footer-brand-section">
                    <h2 className="footer-logo" style={{ color: 'var(--theme-accent, #7c3aed)' }}>{storeName}</h2>
                    <p className="footer-tagline" style={{ color: 'var(--theme-text-offset, #9ca3af)' }}>{tagline}</p>
                    <div className="footer-socials">
                        {facebook !== '#' && <a href={facebook} target="_blank" rel="noopener noreferrer"><FaFacebook /></a>}
                        {instagram !== '#' && <a href={instagram} target="_blank" rel="noopener noreferrer"><FaInstagram /></a>}
                        <a href={tiktok} target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                        <a href="#"><FaYoutube /></a>
                    </div>
                </div>

                <div className="footer-links-grid">
                    <div className="footer-column">
                        <h3 style={textStyle}>{col1Title}</h3>
                        <ul>
                            {col1Links.map((link, i) => (
                                <li key={i}><a href={getShopPath(link.url)} style={{ color: 'var(--theme-text-offset, #9ca3af)' }}>{link.text}</a></li>
                            ))}
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h3 style={textStyle}>{col2Title}</h3>
                        <ul>
                            {col2Links.map((link, i) => (
                                <li key={i}><a href={getShopPath(link.url)} style={{ color: 'var(--theme-text-offset, #9ca3af)' }}>{link.text}</a></li>
                            ))}
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h3 style={textStyle}>Contact</h3>
                        <ul className="footer-contact-info">
                            {storeAddress && <li><FaMapMarkerAlt /> <span style={{ color: 'var(--theme-text-offset, #9ca3af)' }}>{storeAddress}</span></li>}
                            {contactNumber && <li><FaPhoneAlt /> <span style={{ color: 'var(--theme-text-offset, #9ca3af)' }}>{contactNumber}</span></li>}
                            {contactEmail && <li><FaEnvelope /> <span style={{ color: 'var(--theme-text-offset, #9ca3af)' }}>{contactEmail}</span></li>}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="copyright" style={{ color: 'var(--theme-text-offset, #6b7280)' }}>
                    © {new Date().getFullYear()} {storeName}. All rights reserved.
                </div>
                <div className="footer-legal-links">
                    <a href={getShopPath("/terms")} style={{ color: 'var(--theme-text-offset, #6b7280)' }}>Terms</a>
                    <a href={getShopPath("/privacy")} style={{ color: 'var(--theme-text-offset, #6b7280)' }}>Privacy</a>
                    <a href={getShopPath("/cookies")} style={{ color: 'var(--theme-text-offset, #6b7280)' }}>Cookies</a>
                </div>
            </div>
        </footer>
    );
};

export default EcommerceFooter;
