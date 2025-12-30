import React, { useState, useEffect } from 'react';
import { FaSearch, FaShoppingCart, FaChevronDown, FaBars, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartProvider';
import CartSlidePanel from '../CartSlidePanel';
import './NexusLayout.css';

const NexusHeader = () => {
    const navigate = useNavigate();
    const [storeName, setStoreName] = useState('WHCH');
    const [storeLogo, setStoreLogo] = useState(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [navbarStyle, setNavbarStyle] = useState('basic');
    const [categories, setCategories] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { items: cartItems } = useCart();
    const cartCount = cartItems?.reduce((total, item) => total + (Number(item.quantity) || 0), 0) || 0;

    const loadSettings = () => {
        const settingsStr = localStorage.getItem('storeSettings');
        const navbarSettingsStr = localStorage.getItem('nexus_navbarSettings') || localStorage.getItem('navbarSettings');

        let logo = null;
        let name = 'WHCH';
        let style = 'basic';

        if (settingsStr) {
            const parsed = JSON.parse(settingsStr);
            if (parsed.logo) logo = parsed.logo;
            if (parsed.brandName || parsed.storeName) {
                name = parsed.brandName || parsed.storeName;
            }
        }

        if (navbarSettingsStr) {
            const parsedNavbar = JSON.parse(navbarSettingsStr);
            if (parsedNavbar.logo) logo = parsedNavbar.logo;
            if (parsedNavbar.brandName) name = parsedNavbar.brandName;
            if (parsedNavbar.navbarStyle) style = parsedNavbar.navbarStyle;
        }

        setStoreLogo(logo);
        setStoreName(name);
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
        loadSettings();
        fetchCategories();

        const handleStorageChange = (e) => {
            if (e.key === 'storeSettings' || e.key === 'navbarSettings') {
                loadSettings();
            }
        };

        const handleCustomUpdate = () => loadSettings();

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('storeSettingsUpdated', handleCustomUpdate);
        window.addEventListener('navbarSettingsUpdated', handleCustomUpdate);
        window.addEventListener('nexus_navbarSettingsUpdated', handleCustomUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('storeSettingsUpdated', handleCustomUpdate);
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
            navigate(`/shop?search=${searchQuery}`);
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
                                href="/shop"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate('/shop');
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                Home
                            </a>
                            <a
                                href="/shop/products"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate('/shop/products');
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                Products
                            </a>
                            <div className="nexus-mobile-categories">
                                <h3>Categories</h3>
                                {categories.map(cat => (
                                    <a
                                        key={cat._id}
                                        href={`/shop/category/${cat._id}`}
                                        onClick={() => {
                                            navigate(`/shop/category/${cat._id}`);
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

                <div className="nexus-logo" onClick={() => navigate('/shop')} style={{ cursor: 'pointer' }}>
                    {storeLogo ? (
                        <img src={storeLogo} alt={storeName} style={{ height: '50px', objectFit: 'contain' }} />
                    ) : (
                        storeName
                    )}
                </div>

                {/* Middle Group for with-category style */}
                {navbarStyle === 'with-category' && (
                    <nav className="nexus-nav-middle">
                        <a href="/shop" className="nexus-nav-link">Home</a>
                        <a href="/shop/products" className="nexus-nav-link">Products</a>
                        <span className="nexus-separator">|</span>
                        {categories.length > 0 ? (
                            categories.map(cat => (
                                <a
                                    key={cat._id}
                                    href={`/shop/category/${cat._id}`}
                                    className="nexus-nav-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate(`/shop/category/${cat._id}`);
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
                            <a href="/shop" className="nexus-nav-link">Home</a>
                            <a href="/shop/products" className="nexus-nav-link">Products</a>
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
