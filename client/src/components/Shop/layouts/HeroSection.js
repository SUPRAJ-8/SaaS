import React, { useContext } from 'react';
import ModernHeroTemplate from '../../Dashboard/templates/ModernHeroTemplate';
import { SiteSettingsContext } from '../../../contexts/SiteSettingsContext';
import './EcommerceLayout.css';
import './NexusLayout.css';

const HeroSection = () => {
    const { siteSettings } = useContext(SiteSettingsContext);
    const storeName = siteSettings?.brandName || siteSettings?.storeName || 'NEXUS';

    const defaultContent = {
        title: "Experience the Future of Premium Audio",
        highlightedText: "Premium Audio",
        subtitle: "Join thousands of audiophiles who have upgraded their listening experience with our state-of-the-art noise cancellation technology.",
        primaryBtnText: "Shop Collection",
        secondaryBtnText: "Learn More",
        checklistItems: ["2-Year Warranty", "Free Global Shipping"],
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        paddingTop: 80,
        paddingBottom: 80
    };

    return (
        <section className="nexus-brand-watermark-section" data-brand={storeName}>
            <div className="nexus-glass-card-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
                <ModernHeroTemplate content={defaultContent} />
            </div>
        </section>
    );
};

export default HeroSection;
