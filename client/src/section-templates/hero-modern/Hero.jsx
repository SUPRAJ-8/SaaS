import React from 'react';
import {
    FaArrowRight, FaPlay, FaCheckCircle, FaVideo, FaDownload,
    FaArrowAltCircleRight, FaSearch, FaBolt, FaStar, FaGlobe, FaEnvelope
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../apiConfig';
import { resolveImageUrl } from '../../themeUtils';
import styles from './hero.module.css';

const Hero = ({ data = {} }) => {
    const navigate = useNavigate();

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
    } = data;

    const containerStyle = {
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        background: useThemeBg ? 'var(--background-color, var(--theme-bg, #ffffff))' : bgColor
    };

    // Split title to highlight specific part
    const renderTitle = () => {
        if (!highlightedText || !title || showHighlight === false) return title;

        const regex = new RegExp(`(${highlightedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = title.split(regex);

        const highlightStyle = useThemeHighlight !== false ? {} : { color: highlightColor };

        return parts.map((part, i) =>
            part.toLowerCase() === highlightedText.toLowerCase() ?
                <span key={i} className={styles.heroHighlight} style={highlightStyle}>{part}</span> : part
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
        <section className={styles.modernHero} style={containerStyle}>
            <div className={styles.modernHeroContainer}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>{renderTitle()}</h1>
                    <p className={styles.heroSubtitle}>{subtitle}</p>

                    <div className={styles.heroActions}>
                        {showPrimaryBtn && (
                            <button
                                className={styles.btnPrimaryModern}
                                onClick={() => handleAction(primaryBtnLink)}
                                style={useThemePrimaryBtn === false ? {
                                    backgroundColor: primaryBtnBgColor,
                                    color: primaryBtnTextColor
                                } : {}}
                            >
                                {primaryBtnText} <FaArrowRight className={styles.btnIcon} />
                            </button>
                        )}
                        {showSecondaryBtn && (
                            <button
                                className={styles.btnSecondaryModern}
                                onClick={() => handleAction(secondaryBtnLink)}
                                style={useThemeSecondaryBtn === false ? {
                                    backgroundColor: secondaryBtnBgColor,
                                    color: secondaryBtnTextColor,
                                    borderColor: secondaryBtnBgColor !== '#ffffff' ? secondaryBtnBgColor : undefined
                                } : {}}
                            >
                                {showSecondaryBtnIcon !== false && <span className={styles.playIconWrapper}>{renderIcon(secondaryBtnIcon)}</span>}
                                {secondaryBtnText}
                            </button>
                        )}
                    </div>

                    <div className={styles.heroChecklist}>
                        {(checklistItems || []).slice(0, 4).map((item, index) => (
                            <div key={index} className={styles.checklistItem}>
                                <FaCheckCircle className={styles.checkIcon} />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {imageUrl && (
                    <div className={styles.heroVisual}>
                        <div className={styles.visualImageWrapper}>
                            <img src={resolveImageUrl(imageUrl, API_URL)} alt="Hero Illustration" />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Hero;
