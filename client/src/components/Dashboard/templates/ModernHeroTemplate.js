import React from 'react';
import {
    FaArrowRight, FaPlay, FaCheckCircle, FaVideo, FaDownload,
    FaArrowAltCircleRight, FaSearch, FaBolt, FaStar, FaGlobe, FaEnvelope
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../../apiConfig';
import { resolveImageUrl } from '../../../themeUtils';
import './ModernHeroTemplate.css';

const ModernHeroTemplate = ({ content }) => {
    const navigate = useNavigate();
    // Parse content
    const config = typeof content === 'string' ? JSON.parse(content) : content;

    const {
        title = "Automate Your Workflow with Intelligent Analytics",
        highlightedText = "Intelligent Analytics",
        showHighlight = true,
        useThemeHighlight = true,
        highlightColor = "#2563eb",
        subtitle = "Stop guessing. Hover over the dashboard to see how our AI uncovers hidden revenue opportunities in real-time.",
        primaryBtnText = "Start Exploring Now",
        showPrimaryBtn = true,
        useThemePrimaryBtn = true,
        primaryBtnBgColor = '#2563eb',
        primaryBtnTextColor = '#ffffff',
        secondaryBtnText = "Watch Video",
        primaryBtnLink = "/",
        secondaryBtnLink = "/",
        showSecondaryBtn = true,
        secondaryBtnIcon = 'play',
        showSecondaryBtnIcon = true,
        useThemeSecondaryBtn = true,
        secondaryBtnBgColor = '#ffffff',
        secondaryBtnTextColor = '#0f172a',
        checklistItems = ["No credit card required", "14-day free trial"],
        imageUrl = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
        paddingTop = 80,
        paddingBottom = 80,
        marginTop = 0,
        marginBottom = 0,
        useThemeBg = true,
        bgColor = '#ffffff'
    } = config || {};

    const containerStyle = {
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        background: useThemeBg ? 'var(--background-color, var(--theme-bg, #ffffff))' : bgColor
    };

    // Split title to highlight specific part - Case insensitive and robust
    const renderTitle = () => {
        if (!highlightedText || !title || showHighlight === false) return title;

        const regex = new RegExp(`(${highlightedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = title.split(regex);

        const style = useThemeHighlight !== false ? {} : { color: highlightColor };

        return parts.map((part, i) =>
            part.toLowerCase() === highlightedText.toLowerCase() ?
                <span key={i} className="hero-highlight" style={style}>{part}</span> : part
        );
    };

    const handleAction = (link) => {
        if (!link) return;
        if (link.startsWith('http')) {
            window.open(link, '_blank');
        } else {
            navigate(link);
        }
    };

    // Helper to render icon
    const renderIcon = (type) => {
        switch (type) {
            case 'play': return <FaPlay />;
            case 'video': return <FaVideo />;
            case 'download': return <FaDownload />;
            case 'arrow': return <FaArrowAltCircleRight />;
            case 'search': return <FaSearch />;
            case 'bolt': return <FaBolt />;
            case 'star': return <FaStar />;
            case 'globe': return <FaGlobe />;
            case 'envelope': return <FaEnvelope />;
            default: return <FaPlay />;
        }
    };

    return (
        <section className="modern-hero-template" style={containerStyle}>
            <div className="modern-hero-container">
                <div className="hero-content">
                    <h1 className="hero-title">{renderTitle()}</h1>
                    <p className="hero-subtitle">{subtitle}</p>

                    <div className="hero-actions">
                        {showPrimaryBtn && (
                            <button
                                className="btn-primary-modern"
                                onClick={() => handleAction(primaryBtnLink)}
                                style={useThemePrimaryBtn === false ? {
                                    backgroundColor: primaryBtnBgColor,
                                    color: primaryBtnTextColor
                                } : {}}
                            >
                                {primaryBtnText} <FaArrowRight className="btn-icon" />
                            </button>
                        )}
                        {showSecondaryBtn && (
                            <button
                                className="btn-secondary-modern"
                                onClick={() => handleAction(secondaryBtnLink)}
                                style={useThemeSecondaryBtn === false ? {
                                    backgroundColor: secondaryBtnBgColor,
                                    color: secondaryBtnTextColor,
                                    borderColor: secondaryBtnBgColor !== '#ffffff' ? secondaryBtnBgColor : undefined
                                } : {}}
                            >
                                {showSecondaryBtnIcon !== false && <span className="play-icon-wrapper">{renderIcon(secondaryBtnIcon)}</span>}
                                {secondaryBtnText}
                            </button>
                        )}
                    </div>

                    <div className="hero-checklist">
                        {(checklistItems || []).slice(0, 4).map((item, index) => (
                            <div key={index} className="checklist-item">
                                <FaCheckCircle className="check-icon" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {imageUrl && (
                    <div className="hero-visual">
                        <div className="visual-image-wrapper">
                            <img src={resolveImageUrl(imageUrl, API_URL)} alt="Dashboard Preview" />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ModernHeroTemplate;
