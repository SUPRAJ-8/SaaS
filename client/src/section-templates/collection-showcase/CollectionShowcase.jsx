import React, { useState, useEffect } from 'react';
import { FaArrowRight, FaLeaf, FaTshirt, FaWeightHanging, FaTint, FaChevronRight, FaFire, FaStar, FaHeart, FaShoppingCart, FaBolt, FaTag, FaCheck, FaShieldAlt, FaShippingFast, FaThumbsUp, FaClock, FaMobile, FaLaptop, FaHome, FaUtensils } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import API_URL from '../../apiConfig';
import { resolveImageUrl } from '../../themeUtils';
import { getProducts } from '../../services/productService';
import styles from './collection-showcase.module.css';

const CollectionShowcase = ({ content = {} }) => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const {
        collectionTitle = "AUTUMN COLLECTION",
        productName = "Signature Hoodie",
        description = "Experience ultimate comfort with our signature heavyweight organic cotton hoodie, designed for an oversized fit and sustainable longevity.",
        heroImage,
        feature1 = "100% Organic Egyptian Cotton",
        feature2 = "Signature Oversized Fit",
        feature3 = "Sustainable Low-Impact Dye",
        feature4 = "Heavyweight 450 GSM Fabric",
        features = [], // New dynamic array
        ctaText = "Product Details",
        ctaLink = "/collections/autumn",

        galleryTitle = "CURATED GALLERY",

        // galleryImage1, - Removed unused
        // galleryTitle1 = "Teal Hoodie",
        // gallerySubtitle1 = "ESSENTIALS SERIES",
        // galleryImage2,
        // galleryTitle2 = "Heather Grey Hoodie",
        // gallerySubtitle2 = "CLASSIC CORE",
        // galleryImage3,
        // galleryTitle3 = "Classic White Hoodie",
        // gallerySubtitle3 = "PURE ORGANIC",
        // galleryImage4,
        // galleryTitle4 = "Sage Green Hoodie",
        // gallerySubtitle4 = "NATURE INSPIRED",

        bgColor = "transparent",
        accentColor = "#ef233c",
        customTextColor = "#1e293b",
        useBrandColor = true,
        useBrandTextColor = false,
        useThemeBg = true,

        showGallery = true,
        showCta = true,
        showCollectionTitle = true,
        showDescription = true,
        showFeatureList = true,
        // useProductDescription = true, - Removed unused

        // Product/Category selection
        sourceType = 'products',
        selectedProductIds = [],
        selectedCategoryId = null
    } = content;

    const selectedProductIdsStr = JSON.stringify(selectedProductIds);

    // Fetch products based on selection
    useEffect(() => {
        const fetchProductsData = async () => {
            setIsLoading(true);
            try {
                const allProducts = await getProducts();

                if (sourceType === 'categories' && selectedCategoryId) {
                    const filtered = allProducts.filter(p => {
                        const pCatId = p.category && (typeof p.category === 'object' ? p.category._id : p.category);
                        return String(pCatId) === String(selectedCategoryId);
                    });
                    setProducts(filtered.slice(0, 12));
                } else if (sourceType === 'products' && selectedProductIds && selectedProductIds.length > 0) {
                    const selected = selectedProductIds
                        .map(id => allProducts.find(p => String(p._id) === String(id)))
                        .filter(p => p !== undefined)
                        .slice(0, 12);
                    setProducts(selected);
                } else {
                    setProducts([]);
                }
                setActiveImageIndex(0);
            } catch (error) {
                console.error('Error fetching products:', error);
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sourceType, selectedCategoryId, selectedProductIdsStr]);

    // Resolve hero image or use fallback
    const firstProduct = products.length > 0 ? products[0] : null;
    const heroProductImages = firstProduct?.images || [];

    // Auto-slide logic for hero images
    useEffect(() => {
        if (heroProductImages.length <= 1) return;

        const interval = setInterval(() => {
            setActiveImageIndex((prevIndex) =>
                prevIndex === heroProductImages.length - 1 ? 0 : prevIndex + 1
            );
        }, 5000);

        return () => clearInterval(interval);
    }, [heroProductImages.length]);

    let resolvedHeroImage = (heroImage && typeof heroImage === 'string') ? resolveImageUrl(heroImage, API_URL) : "";

    if (!resolvedHeroImage && heroProductImages.length > 0) {
        resolvedHeroImage = resolveImageUrl(heroProductImages[activeImageIndex] || heroProductImages[0], API_URL);
    }

    if (!resolvedHeroImage) {
        resolvedHeroImage = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop";
    }

    const resolvedProductName = (firstProduct && (!productName || productName === "Signature Hoodie"))
        ? firstProduct.name
        : productName;

    const useProdDesc = content.useProductDescription !== false; // Default to true
    let resolvedDescription = useProdDesc
        ? (firstProduct?.longDescription || firstProduct?.shortDescription || "")
        : (description || "");

    // Strip HTML and entities like &nbsp; if it's from the product to ensure a clean snippet
    if (useProdDesc && resolvedDescription) {
        resolvedDescription = resolvedDescription
            .replace(/<[^>]*>?/gm, ' ') // Replace tags with space to avoid smushing words
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .trim();
    }

    const resolvedCollectionTitle = (firstProduct && (!collectionTitle || collectionTitle === "AUTUMN COLLECTION"))
        ? (
            firstProduct.category && typeof firstProduct.category === 'object'
                ? `${firstProduct.category.name}${firstProduct.subcategory ? ` > ${firstProduct.subcategory}` : ''}`
                : collectionTitle
        )
        : collectionTitle;

    const resolvedCtaLink = (firstProduct && (!ctaLink || ctaLink === "/collections/autumn"))
        ? `/product/${firstProduct.handle || firstProduct._id}`
        : ctaLink;

    const effectiveAccentColor = useBrandColor ? 'var(--primary)' : accentColor;
    // const effectiveButtonTextColor = useBrandColor ? 'var(--primary-content)' : '#ffffff'; // Removed unused
    const effectiveBgColor = useThemeBg ? '#f9fafb' : bgColor;
    const isLightBg = useThemeBg || (bgColor && (bgColor.toLowerCase() === '#ffffff' || bgColor.toLowerCase() === '#f9fafb'));

    // Helper to get light version of custom hex color
    const getLightAccent = (hex) => {
        if (!hex || !hex.startsWith('#')) return 'rgba(0,0,0,0.1)';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.15)`;
    };

    // Use global CSS variable when using brand color, otherwise compute from custom accent
    const lightAccentColor = useBrandColor ? 'var(--primary-light)' : getLightAccent(accentColor);

    const galleryItems = products.length > 0
        ? products.slice(1, 12).map(product => ({
            id: product._id,
            image: resolveImageUrl(product.images && product.images.length > 0 ? product.images[0] : null, API_URL) || 'https://via.placeholder.com/300',
            title: product.name,
            subtitle: product.category && typeof product.category === 'object'
                ? `${product.category.name}${product.subcategory ? ` > ${product.subcategory}` : ''}`
                : '',
            link: `/product/${product.handle || product._id}`
        }))
        : [];

    const handleNavigate = (link) => {
        if (!link || link === '#') return;
        if (link.startsWith('http')) {
            window.open(link, '_blank');
        } else {
            navigate(link);
        }
    };

    const effectiveFeatures = (features && features.length > 0)
        ? features
        : [feature1, feature2, feature3, feature4].filter(f => f);

    const featuresWithIcons = effectiveFeatures.map((text, idx) => {
        const iconName = (content.featureIcons || [])[idx];

        const Icons = {
            leaf: <FaLeaf />, tshirt: <FaTshirt />, tint: <FaTint />, weight: <FaWeightHanging />,
            fire: <FaFire />, star: <FaStar />, heart: <FaHeart />, cart: <FaShoppingCart />,
            bolt: <FaBolt />, tag: <FaTag />, check: <FaCheck />, shield: <FaShieldAlt />,
            shipping: <FaShippingFast />, thumbs: <FaThumbsUp />, clock: <FaClock />,
            mobile: <FaMobile />, labtop: <FaLaptop />, home: <FaHome />, utensils: <FaUtensils />
        };

        // Fallback to the old cycle if no custom icon selected
        const defaultIcons = [<FaLeaf />, <FaTshirt />, <FaTint />, <FaWeightHanging />];
        const icon = Icons[iconName] || defaultIcons[idx % defaultIcons.length];

        return { icon, text };
    });

    if (isLoading) {
        return (
            <div className={styles.container} style={{ backgroundColor: effectiveBgColor, minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: isLightBg ? '#000' : '#fff', opacity: 1 }}>Loading...</div>
            </div>
        );
    }

    return (
        <section
            className={`${styles.container} ${isLightBg ? styles.lightTheme : ''}`}
            style={{ backgroundColor: effectiveBgColor }}
        >
            <div className={styles.heroContent}>
                <div className={styles.heroImageWrapper}>
                    <img
                        src={resolvedHeroImage}
                        alt={resolvedProductName}
                        className={styles.heroImage}
                    />

                    {heroProductImages.length > 1 && (
                        <div className={styles.thumbnailsContainer}>
                            {heroProductImages.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`${styles.thumbnailItem} ${activeImageIndex === idx ? styles.thumbnailItemActive : ''}`}
                                    onClick={() => setActiveImageIndex(idx)}
                                    style={activeImageIndex === idx ? { borderColor: effectiveAccentColor } : {}}
                                >
                                    <img
                                        src={resolveImageUrl(img, API_URL)}
                                        alt={`${resolvedProductName} thumbnail ${idx + 1}`}
                                        className={styles.thumbnailImage}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.textContent}>
                    {showCollectionTitle && (
                        <div className={styles.collectionTitleBox}>
                            <span
                                className={styles.collectionTitle}
                                style={{
                                    backgroundColor: isLightBg ? lightAccentColor : 'rgba(255,255,255,0.08)',
                                    color: isLightBg ? effectiveAccentColor : 'var(--primary-color)',
                                    borderColor: lightAccentColor
                                }}
                            >
                                {resolvedCollectionTitle}
                            </span>
                        </div>
                    )}
                    <h3 className={styles.productName} style={{ color: useBrandTextColor ? 'var(--primary-content)' : (customTextColor || (isLightBg ? 'var(--primary-content)' : '#ffffff')) }}>
                        {resolvedProductName}
                    </h3>

                    {showDescription && resolvedDescription && (
                        <div
                            className={styles.description}
                            style={{
                                color: isLightBg ? lightAccentColor : '#ffffff',
                                borderLeft: `3px solid ${lightAccentColor}`,
                                paddingLeft: '1.5rem'
                            }}
                        >
                            {resolvedDescription}
                        </div>
                    )}

                    {showFeatureList && (
                        <div className={styles.featureList}>
                            {featuresWithIcons.map((feature, index) => (
                                <div key={index} className={styles.featureItem} style={{ color: isLightBg ? effectiveAccentColor : 'var(--primary-color)' }}>
                                    <span className={styles.featureIcon} style={{ color: useBrandTextColor ? 'var(--primary-content)' : (customTextColor || (isLightBg ? 'var(--primary-content)' : '#ffffff')) }}>
                                        {feature.icon || <FaChevronRight size={12} />}
                                    </span>
                                    <span style={{ fontWeight: '500' }}>{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {showCta && (
                        <button
                            className={styles.ctaButton}
                            onClick={() => handleNavigate(resolvedCtaLink)}
                            style={{
                                backgroundColor: effectiveAccentColor,
                                color: useBrandTextColor ? 'var(--primary-content)' : (customTextColor || (isLightBg ? 'var(--primary-content)' : '#ffffff')),
                                '--hover-bg': isLightBg ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)',
                                '--hover-text': useBrandTextColor ? 'var(--primary-content)' : (customTextColor || (isLightBg ? 'var(--primary-color)' : '#ffffff'))
                            }}
                        >
                            {ctaText} <FaArrowRight />
                        </button>
                    )}
                </div>
            </div>

            {showGallery && galleryItems.length > 0 && (
                <div className={styles.gallerySection}>
                    {galleryTitle && (
                        <div
                            className={styles.galleryHeader}
                            style={{ color: isLightBg ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}
                        >
                            <span style={{ color: useBrandTextColor ? 'var(--primary-color)' : lightAccentColor, opacity: '1', fontWeight: '700' }}>{galleryTitle}</span>
                        </div>
                    )}

                    <div className={styles.sliderContainer}>
                        {/* Custom Navigation Buttons outside Swiper for clean clipping */}
                        <div className={`${styles.navBtn} ${styles.prevBtn} swiper-custom-prev`} style={{ color: effectiveAccentColor, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                            <FaChevronRight style={{ transform: 'rotate(180deg)' }} size={16} />
                        </div>
                        <div className={`${styles.navBtn} ${styles.nextBtn} swiper-custom-next`} style={{ color: effectiveAccentColor, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                            <FaChevronRight size={16} />
                        </div>

                        <Swiper
                            modules={[Navigation, Pagination, Autoplay]}
                            spaceBetween={24}
                            slidesPerView={1}
                            navigation={{
                                prevEl: '.swiper-custom-prev',
                                nextEl: '.swiper-custom-next',
                            }}
                            pagination={{ clickable: true }}
                            autoplay={{ delay: 4000, disableOnInteraction: false }}
                            loop={true}
                            breakpoints={{
                                640: { slidesPerView: 2 },
                                1024: { slidesPerView: 4 }
                            }}
                            className={styles.gallerySwiper}
                        >
                            {galleryItems.map((item, index) => (
                                <SwiperSlide key={item.id || index}>
                                    <div className={styles.galleryCard} onClick={() => handleNavigate(item.link)}>
                                        <div className={styles.cardImageWrapper}>
                                            <img src={item.image} alt={item.title} className={styles.cardImage} />
                                        </div>
                                        <div className={styles.cardContent}>
                                            <div className={styles.cardTitle} style={{ color: isLightBg ? effectiveAccentColor : 'var(--primary-color)' }}>{item.title}</div>
                                            <div className={styles.cardSubtitle} style={{ color: isLightBg ? lightAccentColor : 'var(--primary-light)' }}>{item.subtitle}

                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            )}
        </section>
    );
};

export default CollectionShowcase;
