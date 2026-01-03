import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaSearch, FaChevronDown, FaBars, FaTimes, FaRegHeart, FaStore, FaThLarge } from 'react-icons/fa';
import './EcommerceLayout.css';
import { useCart } from '../CartProvider';
import CartSlidePanel from '../CartSlidePanel';
import { getShopPath } from '../../../themeUtils';

const EcommerceHeader = () => {
    const navigate = useNavigate();
    const [storeLogo, setStoreLogo] = useState(null);
    const [storeName, setStoreName] = useState('Ecommerce');
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
        const navbarSettingsStr = localStorage.getItem('navbarSettings');

        let logo = null;
        let name = 'Ecommerce';
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
        window.addEventListener('navbarSettingsUpdated', handleCustomUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('navbarSettingsUpdated', handleCustomUpdate);
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
        <header className={`ecommerce-header ${navbarStyle}`}>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                <nav className="mobile-nav" onClick={e => e.stopPropagation()}>
                    <div className="mobile-nav-header">
                        <h2>Menu</h2>
                        <button className="close-mobile-menu" onClick={() => setIsMobileMenuOpen(false)}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className="mobile-nav-links">
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
                        <div className="mobile-categories">
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

            {/* Premium / Custom Navbar Layout - Based on User Request */}
            {navbarStyle === 'custom' ? (
                <div className="premium-header-content">
                    {/* Logo */}
                    <div className="logo-container" onClick={() => navigate(getShopPath('/'))} style={{ cursor: 'pointer' }}>
                        {storeLogo ? (
                            <img src={storeLogo} alt={storeName} className="store-logo-img" />
                        ) : (
                            <div className="baakas-logo-placeholder">
                                <div className="logo-square">B</div>
                                <h1>{storeName}</h1>
                            </div>
                        )}
                    </div>

                    {/* Wide Search Bar */}
                    <div className="search-category-group">
                        <div className="search-container">
                            <FaSearch className="search-icon-premium" />
                            <input
                                type="text"
                                placeholder="Search products, brands, categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchSubmit}
                            />
                        </div>
                    </div>

                    {/* Right Group Actions */}
                    <div className="premium-actions">
                        <div className="action-item categories-dropdown-trigger">
                            <FaThLarge className="action-icon" />
                            <span>Categories</span>
                            <FaChevronDown className="arrow-icon" />
                            {/* Dropdown would go here */}
                        </div>

                        <div className="action-item" onClick={() => navigate(getShopPath('/stores'))}>
                            <FaStore className="action-icon" />
                            <span>Stores</span>
                        </div>

                        <button className="premium-action-btn cart-btn" onClick={() => setIsCartOpen(true)}>
                            <div className="icon-wrapper">
                                <FaShoppingCart />
                                {cartCount > 0 && <span className="badge red">{cartCount}</span>}
                            </div>
                        </button>

                        <button className="premium-action-btn wishlist-btn" onClick={() => navigate(getShopPath('/wishlist'))}>
                            <div className="icon-wrapper">
                                <FaRegHeart />
                                <span className="badge red">2</span> {/* Mock value as requested in image */}
                            </div>
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Logo */}
                    <div className="logo-container" onClick={() => navigate(getShopPath('/'))} style={{ cursor: 'pointer' }}>
                        {storeLogo ? (
                            <img src={storeLogo} alt={storeName} className="store-logo-img" />
                        ) : (
                            <>
                                <FaShoppingCart className="logo-icon" />
                                <h1>{storeName}</h1>
                            </>
                        )}
                    </div>

                    {/* Middle Group for with-category style */}
                    {navbarStyle === 'with-category' && (
                        <nav className="header-nav-middle">
                            <a href={getShopPath('/')} className="nav-link" onClick={() => navigate(getShopPath('/'))}>Home</a>
                            <a href={getShopPath('/products')} className="nav-link" onClick={() => navigate(getShopPath('/products'))}>Products</a>
                            <a href={getShopPath('/track-order')} className="nav-link" onClick={() => navigate(getShopPath('/track-order'))}>Track Order</a>
                            <span className="nav-separator">|</span>
                            {categories.length > 0 ? (
                                categories.map(cat => (
                                    <a
                                        key={cat._id}
                                        href={getShopPath(`/category/${cat._id}`)}
                                        className="nav-link category-link"
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

                    <div className={navbarStyle === 'with-category' ? 'header-actions' : 'header-right-group'}>
                        {navbarStyle !== 'with-category' && (
                            <nav className="header-nav">
                                <a href={getShopPath('/')} className="nav-link" onClick={() => navigate(getShopPath('/'))}>Home</a>
                                <a href={getShopPath('/products')} className="nav-link" onClick={() => navigate(getShopPath('/products'))}>Products</a>
                                <a href={getShopPath('/track-order')} className="nav-link" onClick={() => navigate(getShopPath('/track-order'))}>Track Order</a>
                            </nav>
                        )}

                        <div className={navbarStyle === 'with-category' ? 'header-actions-inline' : 'header-actions'}>
                            <div className={`search-wrapper ${isSearchOpen ? 'open' : ''}`}>
                                {isSearchOpen && (
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleSearchSubmit}
                                        autoFocus={isSearchOpen}
                                        onBlur={() => {
                                            if (!searchQuery) setIsSearchOpen(false);
                                        }}
                                    />
                                )}
                                <button className="action-btn search-btn" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                                    <FaSearch />
                                </button>
                            </div>

                            <button className="action-btn cart-btn" onClick={() => setIsCartOpen(true)}>
                                <FaShoppingCart />
                                <span className="cart-badge">{cartCount}</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Hamburger for Mobile - Moved to Right */}
            <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>

            {/* Cart Slide Panel */}
            <CartSlidePanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </header>
    );
};

export default EcommerceHeader;
