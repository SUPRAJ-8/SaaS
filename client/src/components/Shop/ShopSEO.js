import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * ShopSEO Component
 * Handles dynamic metadata for the shopfront.
 * 
 * @param {Object} props
 * @param {string} props.title - Page title (overrides default)
 * @param {string} props.description - Meta description (overrides default)
 * @param {string} props.image - OG image (overrides default)
 * @param {Array} props.keywords - Meta keywords
 * @param {Object} props.storeSettings - Global store settings
 */
const ShopSEO = ({ title, description, image, keywords, storeSettings }) => {
    const storeName = storeSettings?.brandName || storeSettings?.storeName || 'NepoStore';
    const defaultDesc = storeSettings?.seoSettings?.metaDescription || `Welcome to ${storeName}`;

    const seoTitle = title ? `${title} | ${storeName}` : (storeSettings?.seoSettings?.metaTitle || storeName);
    const seoDesc = description || defaultDesc;
    const seoImage = image || storeSettings?.seoSettings?.ogImage || storeSettings?.logo;
    const seoKeywords = keywords?.length > 0 ? keywords.join(', ') : storeSettings?.seoSettings?.keywords?.join(', ');

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{seoTitle}</title>
            <meta name="description" content={seoDesc} />
            {seoKeywords && <meta name="keywords" content={seoKeywords} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={seoTitle} />
            <meta property="og:description" content={seoDesc} />
            {seoImage && <meta property="og:image" content={seoImage} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={seoTitle} />
            <meta name="twitter:description" content={seoDesc} />
            {seoImage && <meta name="twitter:image" content={seoImage} />}

            {/* Favicon */}
            {storeSettings?.favicon && <link rel="icon" href={storeSettings.favicon} />}
        </Helmet>
    );
};

export default ShopSEO;
