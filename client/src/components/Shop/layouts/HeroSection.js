import React from 'react';
import ModernHeroTemplate from '../../Dashboard/templates/ModernHeroTemplate';
import './EcommerceLayout.css';

const HeroSection = () => {
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

    return <ModernHeroTemplate content={defaultContent} />;
};

export default HeroSection;
