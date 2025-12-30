import React from 'react';
import './UnderConstruction.css';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

const UnderConstruction = () => {
  const { siteSettings } = useSiteSettings();
  const brandName = siteSettings?.brandName || siteSettings?.storeName || 'Our Store';
  const constructionMessage = siteSettings?.constructionMessage ||
    'Our dashboard is currently under construction. We\'re working hard to bring you an amazing experience!';
  const contactEmail = siteSettings?.constructionContactEmail || '';

  const handleContactClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (contactEmail) {
      window.location.href = `mailto:${contactEmail}`;
    } else {
      alert('Contact information is not available at the moment. Please check back later.');
    }
  };

  return (
    <div className="under-construction-container">
      <div className="content">
        <h1>{brandName}</h1>
        <p>{constructionMessage}</p>
        <button
          className="contact-button"
          onClick={handleContactClick}
          type="button"
        >
          Contact us
        </button>
      </div>
      <div className="image-container">
        <img src="/under-construction.png" alt="Under Construction" />
      </div>
    </div>
  );
};

export default UnderConstruction;
