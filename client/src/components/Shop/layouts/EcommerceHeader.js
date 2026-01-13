import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaSearch, FaChevronDown, FaBars, FaTimes, FaRegHeart, FaStore, FaThLarge } from 'react-icons/fa';
import './EcommerceLayout.css';
import { useCart } from '../CartProvider';
import CartSlidePanel from '../CartSlidePanel';
import { getShopPath } from '../../../themeUtils';

const NavItem = ({ item, navigate, getShopPath }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!item.children || item.children.length === 0) {
        return (
            <a
                href={getShopPath(item.link)}
                className="nav-link"
                onClick={(e) => {
                    e.preventDefault();
                    navigate(getShopPath(item.link));
                }}
            >
                {item.label}
            </a>
        );
    }

    return (
        <div
            className="nav-link-dropdown-wrapper"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <span className="nav-link dropdown-trigger">
                {item.label} <FaChevronDown className={`dropdown-icon ${isOpen ? 'rotate' : ''}`} />
            </span>
            {isOpen && (
                <div className="nav-item-dropdown-menu">
                    {item.children.map(child => (
                        <a
                            key={child.id}
                            href={getShopPath(child.link)}
                            className="nav-dropdown-item"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate(getShopPath(child.link));
                                setIsOpen(false);
                            }}
                        >
                            {child.label}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

const EcommerceHeader = ({ previewSettings, siteSettings }) => {
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
    const [wishlistCount, setWishlistCount] = useState(0);
    const [menuItems, setMenuItems] = useState([]);
    const [showSearch, setShowSearch] = useState(true);
    const [longSearch, setLongSearch] = useState(false);
    const [showLogo, setShowLogo] = useState(true);
    const [showStoreName, setShowStoreName] = useState(true);
    const [showIcons, setShowIcons] = useState(true);

    const loadSettings = () => {
        // 1. Priority: Preview Settings from Page Builder
        if (previewSettings) {
            if (previewSettings.layout) setNavbarStyle(previewSettings.layout);
            if (previewSettings.menuItems) setMenuItems(previewSettings.menuItems);
            if (previewSettings.showSearch !== undefined) setShowSearch(previewSettings.showSearch);
            if (previewSettings.longSearch !== undefined) setLongSearch(previewSettings.longSearch);
            if (previewSettings.showLogo !== undefined) setShowLogo(previewSettings.showLogo);
            if (previewSettings.showStoreName !== undefined) setShowStoreName(previewSettings.showStoreName);
            if (previewSettings.showIcons !== undefined) setShowIcons(previewSettings.showIcons);

            // Site settings fallback for preview
            if (siteSettings) {
                if (siteSettings.logo) setStoreLogo(siteSettings.logo);
                if (siteSettings.storeName || siteSettings.brandName) {
                    setStoreName(siteSettings.storeName || siteSettings.brandName);
                }
            }
            return;
        }

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
            if (parsed.navbar) {
                if (parsed.navbar.layout) style = parsed.navbar.layout;
                if (parsed.navbar.menuItems) setMenuItems(parsed.navbar.menuItems);
                if (parsed.navbar.showSearch !== undefined) setShowSearch(parsed.navbar.showSearch);
                if (parsed.navbar.longSearch !== undefined) setLongSearch(parsed.navbar.longSearch);
                if (parsed.navbar.showLogo !== undefined) setShowLogo(parsed.navbar.showLogo);
                if (parsed.navbar.showStoreName !== undefined) setShowStoreName(parsed.navbar.showStoreName);
                if (parsed.navbar.showIcons !== undefined) setShowIcons(parsed.navbar.showIcons);
            }
        }

        if (navbarSettingsStr) {
            const parsedNavbar = JSON.parse(navbarSettingsStr);
            if (parsedNavbar.layout) style = parsedNavbar.layout;
            if (parsedNavbar.menuItems) setMenuItems(parsedNavbar.menuItems);
            if (parsedNavbar.showSearch !== undefined) setShowSearch(parsedNavbar.showSearch);
            if (parsedNavbar.longSearch !== undefined) setLongSearch(parsedNavbar.longSearch);
            if (parsedNavbar.showLogo !== undefined) setShowLogo(parsedNavbar.showLogo);
            if (parsedNavbar.showStoreName !== undefined) setShowStoreName(parsedNavbar.showStoreName);
            if (parsedNavbar.showIcons !== undefined) setShowIcons(parsedNavbar.showIcons);
        }

        setStoreLogo(logo || null);
        setStoreName(name || 'Ecommerce');
        setNavbarStyle(style || 'basic');
    };

    const defaultNavItems = [
        { id: 'd1', label: 'Home', link: '/' },
        { id: 'd2', label: 'Products', link: '/products' },
        { id: 'd3', label: 'Track Order', link: '/track-order' }
    ];
    const navItems = menuItems && menuItems.length > 0 ? menuItems : defaultNavItems;

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
    }, [previewSettings, siteSettings]);

    // Listen for cart open requests
    useEffect(() => {
        const handleCartOpenRequest = () => setIsCartOpen(true);
        window.addEventListener('requestCartOpen', handleCartOpenRequest);
        return () => window.removeEventListener('requestCartOpen', handleCartOpenRequest);
    }, []);

    // Track wishlist count
    useEffect(() => {
        const updateWishlistCount = () => {
            const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            setWishlistCount(wishlist.length);
        };

        updateWishlistCount();

        const handleWishlistUpdate = () => updateWishlistCount();
        const handleStorageChange = (e) => {
            if (e.key === 'wishlist') updateWishlistCount();
        };

        window.addEventListener('wishlistUpdated', handleWishlistUpdate);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
            window.removeEventListener('storage', handleStorageChange);
        };
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
            <div className="ecommerce-header-container">

                {/* Mobile Menu Overlay */}
                <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                    <nav className="mobile-nav" onClick={e => e.stopPropagation()}>
                        <div className="mobile-nav-header">
                            <h2>Menu</h2>
                            <button className="close-mobile-menu" onClick={() => setIsMobileMenuOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        {/* Mobile Search - Full Width Box */}
                        {showSearch && (
                            <div className="mobile-search-container">
                                <div className="mobile-search-box">
                                    <FaSearch className="mobile-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search for products..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearchSubmit(e);
                                                setIsMobileMenuOpen(false);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mobile-nav-links">
                            {navItems.map((item, idx) => (
                                <React.Fragment key={item.id || idx}>
                                    <a
                                        href={getShopPath(item.link)}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate(getShopPath(item.link));
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        {item.label}
                                    </a>
                                    {item.children && item.children.map(child => (
                                        <a
                                            key={child.id}
                                            className="mobile-sub-link"
                                            href={getShopPath(child.link)}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigate(getShopPath(child.link));
                                                setIsMobileMenuOpen(false);
                                            }}
                                            style={{ paddingLeft: '20px', fontSize: '0.9rem', opacity: 0.8 }}
                                        >
                                            — {child.label}
                                        </a>
                                    ))}
                                </React.Fragment>
                            ))}

                            <div className="mobile-categories">
                                <h3>Categories</h3>
                                {categories.map(cat => (
                                    <a key={cat._id} href={getShopPath(`/category/${cat._id}`)} onClick={(e) => { e.preventDefault(); navigate(getShopPath(`/category/${cat._id}`)); setIsMobileMenuOpen(false); }}>{cat.name}</a>
                                ))}
                            </div>
                        </div>
                    </nav>
                </div>

                {/* New Mobile Wrapper - Logo Left, Icons/Toggle Right */}
                <div className="ecommerce-header-mobile-wrapper">
                    <div className="mobile-logo-section" onClick={() => navigate(getShopPath('/'))}>
                        {showLogo && (
                            storeLogo ? (
                                <img src={storeLogo} alt={storeName} className="store-logo-img" />
                            ) : (
                                <div className="baakas-logo-placeholder-mobile">
                                    <div className="logo-square-small">B</div>
                                </div>
                            )
                        )}
                        {showStoreName && <h1 className="mobile-store-name">{storeName}</h1>}
                    </div>

                    <div className="mobile-actions-section">
                        {showIcons && (
                            <>
                                <button className="mobile-action-btn" onClick={() => navigate(getShopPath('/wishlist'))}>
                                    <div className="icon-wrapper">
                                        <FaRegHeart />
                                        {wishlistCount > 0 && <span className="badge-small">{wishlistCount}</span>}
                                    </div>
                                </button>
                                <button className="mobile-action-btn" onClick={() => setIsCartOpen(true)}>
                                    <div className="icon-wrapper">
                                        <FaShoppingCart />
                                        {cartCount > 0 && <span className="badge-small">{cartCount}</span>}
                                    </div>
                                </button>
                            </>
                        )}
                        <button className="mobile-menu-toggle-btn" onClick={toggleMobileMenu}>
                            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                        </button>
                    </div>
                </div>

                {/* Desktop Logo */}
                <div className="logo-container" onClick={() => navigate(getShopPath('/'))}>
                    {navbarStyle === 'custom' ? (
                        <>
                            {showLogo && (
                                storeLogo ? (
                                    <img src={storeLogo} alt={storeName} className="store-logo-img" />
                                ) : (
                                    <div className="baakas-logo-placeholder">
                                        <div className="logo-square">B</div>
                                    </div>
                                )
                            )}
                            {showStoreName && <h1>{storeName}</h1>}
                        </>
                    ) : (
                        <>
                            {showLogo && (
                                storeLogo ? (
                                    <img src={storeLogo} alt={storeName} className="store-logo-img" />
                                ) : (
                                    <>
                                        <FaShoppingCart className="logo-icon" />
                                        {showStoreName && <h1>{storeName}</h1>}
                                    </>
                                )
                            )}
                            {!showLogo && showStoreName && <h1>{storeName}</h1>}
                        </>
                    )}
                </div>

                {/* Middle Group (Navigation / Search) */}
                <div className="header-middle">
                    {navbarStyle === 'custom' ? (
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
                    ) : navbarStyle === 'with-category' ? (
                        <nav className="header-nav-middle">
                            {navItems.map((item, idx) => (
                                <NavItem key={item.id || idx} item={item} navigate={navigate} getShopPath={getShopPath} />
                            ))}
                            <span className="nav-separator">|</span>
                            {categories.length > 0 && categories.slice(0, 4).map(cat => (
                                <a key={cat._id} href={getShopPath(`/category/${cat._id}`)} className="nav-link category-link" onClick={(e) => { e.preventDefault(); navigate(getShopPath(`/category/${cat._id}`)); }}>{cat.name}</a>
                            ))}
                        </nav>
                    ) : navbarStyle === 'basic' ? (
                        <nav className="header-nav">
                            {navItems.map((item, idx) => (
                                <NavItem key={item.id || idx} item={item} navigate={navigate} getShopPath={getShopPath} />
                            ))}
                        </nav>
                    ) : null}
                </div>

                {/* Right Group Actions */}
                <div className="header-right-group">
                    {navbarStyle === 'custom' ? (
                        <div className="premium-actions">
                            <div className="custom-nav-items">
                                {navItems.map((item, idx) => (
                                    <NavItem key={item.id || idx} item={item} navigate={navigate} getShopPath={getShopPath} />
                                ))}
                            </div>
                            <div className="nav-divider"></div>
                            <div className="action-item categories-dropdown-trigger">
                                <FaThLarge className="action-icon" />
                                <span>Categories</span>
                                <FaChevronDown className="arrow-icon" />
                            </div>
                            <div className="action-item" onClick={() => navigate(getShopPath('/stores'))}>
                                <FaStore className="action-icon" />
                                <span>Stores</span>
                            </div>
                            {showIcons && (
                                <div className="premium-action-btns">
                                    <button className="premium-action-btn cart-btn" onClick={() => setIsCartOpen(true)}>
                                        <div className="icon-wrapper">
                                            <FaShoppingCart />
                                            {cartCount > 0 && <span className="badge red">{cartCount}</span>}
                                        </div>
                                    </button>
                                    <button className="premium-action-btn wishlist-btn" onClick={() => navigate(getShopPath('/wishlist'))}>
                                        <div className="icon-wrapper">
                                            <FaRegHeart />
                                            {wishlistCount > 0 && <span className="badge red">{wishlistCount}</span>}
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="header-actions">
                            {showSearch && !longSearch && (
                                <div className={`search-wrapper ${isSearchOpen ? 'open' : ''}`}>
                                    {isSearchOpen && (
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={handleSearchSubmit}
                                            autoFocus={isSearchOpen}
                                            onBlur={() => { if (!searchQuery) setIsSearchOpen(false); }}
                                        />
                                    )}
                                    <button className="action-btn search-btn" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                                        <FaSearch />
                                    </button>
                                </div>
                            )}

                            {longSearch && (
                                <div className="header-search-bar-long">
                                    <div className="search-bar-wrapper">
                                        <FaSearch className="search-icon" />
                                        <input
                                            type="text"
                                            placeholder="Search for products..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={handleSearchSubmit}
                                        />
                                    </div>
                                </div>
                            )}

                            {showIcons && (
                                <>
                                    <button className="action-btn wishlist-btn-header" onClick={() => navigate(getShopPath('/wishlist'))}>
                                        <FaRegHeart />
                                        {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
                                    </button>
                                    <button className="action-btn cart-btn" onClick={() => setIsCartOpen(true)}>
                                        <FaShoppingCart />
                                        <span className="cart-badge">{cartCount}</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Cart Slide Panel */}
            <CartSlidePanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </header>
    );
};

export default EcommerceHeader;
