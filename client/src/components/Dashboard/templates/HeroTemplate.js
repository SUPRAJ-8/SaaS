import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import API_URL from '../../../apiConfig';
import { resolveImageUrl } from '../../../themeUtils';
import './HeroTemplate.css';

const HeroTemplate = ({ content }) => {
    const location = useLocation();
    const isBuilder = location.pathname.includes('/dashboard/page-builder');
    const config = typeof content === 'string' ? JSON.parse(content) : content;

    const title = config?.title || 'Make an impact with your headline';
    const subtitle = config?.subtitle || 'Loram ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
    const button1 = config?.button1 || 'Shop Now';
    const button2 = config?.button2 || 'Learn More';
    const button1Link = config?.button1Link || '/shop/products';
    const button2Link = config?.button2Link || '/shop/products';
    const bgImage = config?.bgImage || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1600&q=80';

    const showPrimaryBtn = config?.showPrimaryBtn !== false;
    const showSecondaryBtn = config?.showSecondaryBtn !== false;

    // Extract spacing and background settings
    const paddingTop = config?.paddingTop !== undefined ? config.paddingTop : 0;
    const paddingBottom = config?.paddingBottom !== undefined ? config.paddingBottom : 0;
    const marginTop = config?.marginTop !== undefined ? config.marginTop : 5;
    const marginBottom = config?.marginBottom !== undefined ? config.marginBottom : 5;
    const useThemeBg = config?.useThemeBg || false;
    const bgColor = config?.bgColor || 'transparent';

    const resolvedBgImage = resolveImageUrl(bgImage, API_URL);

    const sectionStyle = {
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${resolvedBgImage})`,
        backgroundColor: useThemeBg ? 'var(--theme-primary, #ffffff)' : bgColor,
    };

    return (
        <section className="premium-hero-template" style={sectionStyle}>
            <div className="hero-content">
                <h1 className="hero-title">{title}</h1>
                <p className="hero-subtitle">{subtitle}</p>
                <div className="hero-actions">
                    {showPrimaryBtn && (
                        <Link to={button1Link} onClick={(e) => isBuilder && e.preventDefault()}>
                            <button className="hero-btn primary">{button1}</button>
                        </Link>
                    )}
                    {showSecondaryBtn && (
                        <Link to={button2Link} onClick={(e) => isBuilder && e.preventDefault()}>
                            <button className="hero-btn secondary">{button2}</button>
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HeroTemplate;
