import React, { useState, useEffect, useContext } from 'react';
import { FaSearch, FaShoppingCart, FaChevronDown, FaBars, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartProvider';
import { SiteSettingsContext } from '../../../contexts/SiteSettingsContext';
import { getShopPath } from '../../../themeUtils';
import CartSlidePanel from '../CartSlidePanel';
import './NexusLayout.css';

const NexusHeader = () => {
    const navigate = useNavigate();
    const { siteSettings } = useContext(SiteSettingsContext);
    const [navbarStyle, setNavbarStyle] = useState('basic');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { items: cartItems } = useCart();
    const cartCount = cartItems?.reduce((total, item) => total + (Number(item.quantity) || 0), 0) || 0;

    // Use trim() to avoid empty spaces being treated as valid names
    const rawBrand = siteSettings?.brandName?.trim();
    const rawStore = siteSettings?.storeName?.trim();

    let storeName = rawBrand || rawStore || '';
    let storeLogo = siteSettings?.logo;

    // Fallback to localStorage if context is empty (e.g. direct preview)
    if (!storeName) {
        const savedSettings = localStorage.getItem('storeSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                const localBrand = parsed.brandName?.trim();
                const localStore = parsed.storeName?.trim();
                storeName = localBrand || localStore || '';
                storeLogo = parsed.logo || storeLogo;
            } catch (e) {
                // Ignore parse errors
            }
        }
    }

    const loadNavbarSettings = () => {
        const navbarSettingsStr = localStorage.getItem('nexus_navbarSettings') || localStorage.getItem('navbarSettings');
        let style = 'basic';

        if (navbarSettingsStr) {
            const parsedNavbar = JSON.parse(navbarSettingsStr);
            if (parsedNavbar.navbarStyle) style = parsedNavbar.navbarStyle;
        }
        setNavbarStyle(style);
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        loadNavbarSettings();
        fetchCategories();

        const handleCustomUpdate = () => loadNavbarSettings();

        window.addEventListener('navbarSettingsUpdated', handleCustomUpdate);
        window.addEventListener('nexus_navbarSettingsUpdated', handleCustomUpdate);

        return () => {
            window.removeEventListener('navbarSettingsUpdated', handleCustomUpdate);
            window.removeEventListener('nexus_navbarSettingsUpdated', handleCustomUpdate);
        };
    }, []);

    // Listen for cart open requests
    useEffect(() => {
        const handleCartOpenRequest = () => setIsCartOpen(true);
        window.addEventListener('requestCartOpen', handleCartOpenRequest);
        return () => window.removeEventListener('requestCartOpen', handleCartOpenRequest);
    }, []);

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(getShopPath(`/products?search=${searchQuery}`));
            setIsSearchOpen(false);
        }
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <header className={`nexus-header ${navbarStyle}`}>
            <div className="nexus-header-container">

                {/* Mobile Menu Overlay */}
                <div className={`nexus-mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                    <nav className="nexus-mobile-nav" onClick={e => e.stopPropagation()}>
                        <div className="nexus-mobile-nav-header">
                            <h2>Menu</h2>
                            <button className="nexus-close-mobile" onClick={() => setIsMobileMenuOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="nexus-mobile-links">
                            <a
                                href={getShopPath('/')}
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate(getShopPath('/'));
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                Home
                            </a>
                            <a
                                href={getShopPath('/products')}
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate(getShopPath('/products'));
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                Products
                            </a>
                            <a
                                href={getShopPath('/track-order')}
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate(getShopPath('/track-order'));
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                Track Order
                            </a>
                            <div className="nexus-mobile-categories">
                                <h3>Categories</h3>
                                {categories.map(cat => (
                                    <a
                                        key={cat._id}
                                        href={getShopPath(`/category/${cat._id}`)}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate(getShopPath(`/category/${cat._id}`));
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        {cat.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </nav>
                </div>

                <div className="nexus-logo" onClick={() => navigate(getShopPath('/'))} style={{ cursor: 'pointer' }}>
                    {storeLogo ? (
                        <img src={storeLogo} alt={storeName} style={{ height: '50px', objectFit: 'contain' }} />
                    ) : (
                        storeName
                    )}
                </div>

                {/* Middle Group for with-category style */}
                {navbarStyle === 'with-category' && (
                    <nav className="nexus-nav-middle">
                        <a href={getShopPath('/')} className="nexus-nav-link" onClick={(e) => { e.preventDefault(); navigate(getShopPath('/')); }}>Home</a>
                        <a href={getShopPath('/products')} className="nexus-nav-link" onClick={(e) => { e.preventDefault(); navigate(getShopPath('/products')); }}>Products</a>
                        <a href={getShopPath('/track-order')} className="nexus-nav-link" onClick={(e) => { e.preventDefault(); navigate(getShopPath('/track-order')); }}>Track Order</a>
                        <span className="nexus-separator">|</span>
                        {categories.length > 0 ? (
                            categories.map(cat => (
                                <a
                                    key={cat._id}
                                    href={getShopPath(`/category/${cat._id}`)}
                                    className="nexus-nav-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate(getShopPath(`/category/${cat._id}`));
                                    }}
                                >
                                    {cat.name}
                                </a>
                            ))
                        ) : null}
                    </nav>
                )}

                <div className="nexus-right-group">
                    {navbarStyle !== 'with-category' && (
                        <nav className="nexus-nav">
                            <a href={getShopPath('/')} className="nexus-nav-link" onClick={(e) => { e.preventDefault(); navigate(getShopPath('/')); }}>Home</a>
                            <a href={getShopPath('/products')} className="nexus-nav-link" onClick={(e) => { e.preventDefault(); navigate(getShopPath('/products')); }}>Products</a>
                            <a href={getShopPath('/track-order')} className="nexus-nav-link" onClick={(e) => { e.preventDefault(); navigate(getShopPath('/track-order')); }}>Track Order</a>
                        </nav>
                    )}

                    <div className="nexus-actions">
                        <div className={`nexus-search-wrapper ${isSearchOpen ? 'open' : ''}`}>
                            {isSearchOpen && (
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="nexus-search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchSubmit}
                                    autoFocus
                                    onBlur={() => {
                                        if (!searchQuery) setIsSearchOpen(false);
                                    }}
                                />
                            )}
                            <button className="nexus-icon-btn" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                                <FaSearch />
                            </button>
                        </div>
                        <button className="nexus-icon-btn nexus-cart-btn" onClick={() => setIsCartOpen(true)}>
                            <FaShoppingCart />
                            <span className="nexus-cart-badge">{cartCount}</span>
                        </button>
                    </div>
                </div>

                {/* Hamburger for Mobile - Moved to Right */}
                <button className="nexus-mobile-toggle" onClick={toggleMobileMenu}>
                    {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            {/* Cart Slide Panel */}
            <CartSlidePanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </header>
    );
};

export default NexusHeader;
