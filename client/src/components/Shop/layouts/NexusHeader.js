import React, { useState, useEffect, useContext } from 'react';
import { FaSearch, FaShoppingCart, FaChevronDown, FaBars, FaTimes, FaRegHeart, FaHeart } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../CartProvider';
import { SiteSettingsContext } from '../../../contexts/SiteSettingsContext';
import { getShopPath } from '../../../themeUtils';
import CartSlidePanel from '../CartSlidePanel';
import axios from 'axios';
import API_URL from '../../../apiConfig';
import './NexusLayout.css';

const NexusHeader = ({ previewSettings, siteSettings: propSiteSettings }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { siteSettings: contextSiteSettings } = useContext(SiteSettingsContext);

    // Prioritize props (from builder) -> context (from shop) -> local fallback
    const siteSettings = propSiteSettings || contextSiteSettings;

    const [menuItems, setMenuItems] = useState([]);
    const [headerSettings, setHeaderSettings] = useState({
        showSearch: true,
        showIcons: true,
        showLogo: true,
        showStoreName: true,
        longSearch: false,
        menuAlignment: 'center'
    });

    // Restored State Variables
    const [navbarStyle, setNavbarStyle] = useState('basic');

    // Derived state for rendering: Use preview props if available, otherwise local state
    const effectiveNavbarStyle = previewSettings?.layout || previewSettings?.navbarStyle || navbarStyle;
    const effectiveMenuItems = previewSettings?.menuItems || menuItems;
    // Consolidate settings from preview or fetched state
    const effectiveSettings = previewSettings ? {
        showSearch: previewSettings.showSearch ?? previewSettings.settings?.showSearch ?? headerSettings.showSearch,
        showIcons: previewSettings.showIcons ?? previewSettings.settings?.showIcons ?? headerSettings.showIcons,
        showLogo: previewSettings.showLogo ?? previewSettings.settings?.showLogo ?? headerSettings.showLogo,
        showStoreName: previewSettings.showStoreName ?? previewSettings.settings?.showStoreName ?? headerSettings.showStoreName,
        longSearch: previewSettings.longSearch ?? previewSettings.settings?.longSearch ?? headerSettings.longSearch,
        menuAlignment: previewSettings.menuAlignment || previewSettings.settings?.menuAlignment || headerSettings.menuAlignment,
    } : headerSettings;

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { items: cartItems } = useCart();
    const cartCount = cartItems?.reduce((total, item) => total + (Number(item.quantity) || 0), 0) || 0;
    const [wishlistCount, setWishlistCount] = useState(0);

    // Use trim() to avoid empty spaces being treated as valid names
    const rawBrand = siteSettings?.brandName?.trim();
    const rawStore = siteSettings?.storeName?.trim();

    const slugify = (text) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

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
        let items = [];
        let settings = {
            showSearch: true,
            showIcons: true,
            showLogo: true,
            showStoreName: true,
            longSearch: false,
            menuAlignment: 'center'
        };

        if (navbarSettingsStr) {
            try {
                const parsedNavbar = JSON.parse(navbarSettingsStr);
                style = parsedNavbar.layout || parsedNavbar.navbarStyle || style;
                if (parsedNavbar.menuItems) items = parsedNavbar.menuItems;

                // Merge top-level and nested settings
                const nested = parsedNavbar.settings || {};
                settings = {
                    showSearch: parsedNavbar.showSearch ?? nested.showSearch ?? true,
                    showIcons: parsedNavbar.showIcons ?? nested.showIcons ?? true,
                    showLogo: parsedNavbar.showLogo ?? nested.showLogo ?? true,
                    showStoreName: parsedNavbar.showStoreName ?? nested.showStoreName ?? true,
                    longSearch: parsedNavbar.longSearch ?? nested.longSearch ?? false,
                    menuAlignment: parsedNavbar.menuAlignment || nested.menuAlignment || 'center'
                };
            } catch (e) {
                console.error("Error parsing local navbar settings:", e);
            }
        }
        setNavbarStyle(style);
        setMenuItems(items);
        setHeaderSettings(settings);
    };

    const fetchNavbarSettings = async () => {
        try {
            const hostname = window.location.hostname;
            let subdomain = null;
            if (hostname.endsWith('.localhost')) {
                subdomain = hostname.split('.')[0];
            } else if (hostname.endsWith('.nepostore.xyz') && hostname !== 'nepostore.xyz' && hostname !== 'www.nepostore.xyz') {
                subdomain = hostname.split('.')[0];
            }

            // Skip API call if we're in the PageBuilder (app subdomain) - rely on localStorage and previewSettings instead
            if (subdomain === 'app' || hostname === 'localhost' || hostname === '127.0.0.1') {
                console.log('📍 NexusHeader: Skipping API fetch in PageBuilder context, using localStorage');
                return;
            }

            const config = { withCredentials: true };
            let endpoint = `${API_URL}/api/store-settings/navbar`;

            if (subdomain && subdomain !== 'www') {
                endpoint = `${API_URL}/api/store-settings/navbar/public/${subdomain}`;
            }

            const res = await axios.get(endpoint, config);
            if (res.data) {
                const newStyle = res.data.layout || res.data.navbarStyle || 'basic';
                const newItems = res.data.menuItems || [];
                const nested = res.data.settings || {};

                const newSettings = {
                    showSearch: res.data.showSearch ?? nested.showSearch ?? true,
                    showIcons: res.data.showIcons ?? nested.showIcons ?? true,
                    showLogo: res.data.showLogo ?? nested.showLogo ?? true,
                    showStoreName: res.data.showStoreName ?? nested.showStoreName ?? true,
                    longSearch: res.data.longSearch ?? nested.longSearch ?? false,
                    menuAlignment: res.data.menuAlignment || nested.menuAlignment || 'center'
                };

                setNavbarStyle(newStyle);
                setMenuItems(newItems);
                setHeaderSettings(newSettings);

                // Update local storage to keep it fresh
                localStorage.setItem('nexus_navbarSettings', JSON.stringify(res.data));
            }
        } catch (err) {
            console.error('Error fetching navbar settings from API:', err);
        }
    };

    const fetchCategories = async () => {
        try {
            const hostname = window.location.hostname;
            let subdomain = null;
            if (hostname.endsWith('.localhost')) {
                subdomain = hostname.split('.')[0];
            } else if (hostname.endsWith('.nepostore.xyz') && hostname !== 'nepostore.xyz' && hostname !== 'www.nepostore.xyz') {
                subdomain = hostname.split('.')[0];
            }

            const config = {
                withCredentials: true
            };

            if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'localhost') {
                config.headers = { 'x-subdomain': subdomain };
            }

            const response = await axios.get(`${API_URL}/api/categories`, config);
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // Initial load and event listeners
    useEffect(() => {
        loadNavbarSettings();
        fetchNavbarSettings(); // Fetch fresh data from API
        fetchCategories();

        const handleCustomUpdate = () => loadNavbarSettings();
        const handleStorageChange = (e) => {
            if (e.key === 'nexus_navbarSettings' || e.key === 'navbarSettings') {
                loadNavbarSettings();
            }
        };

        window.addEventListener('navbarSettingsUpdated', handleCustomUpdate);
        window.addEventListener('nexus_navbarSettingsUpdated', handleCustomUpdate);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('navbarSettingsUpdated', handleCustomUpdate);
            window.removeEventListener('nexus_navbarSettingsUpdated', handleCustomUpdate);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Handle Page Builder live updates separately to keep dep arrays stable
    useEffect(() => {
        if (previewSettings || propSiteSettings) {
            loadNavbarSettings();
        }
    }, [previewSettings, propSiteSettings]);

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

        // Initial load
        updateWishlistCount();

        // Listen for changes
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

    // Helper to render menu items recursively
    const renderMenuItems = (items) => {
        return items.map(item => (
            <div key={item.id} className="nexus-nav-item-wrapper">
                <a
                    href={getShopPath(item.link)}
                    className="nexus-nav-link"
                    onClick={(e) => {
                        // e.preventDefault(); // Optional: depend on if it's internal route
                        if (item.link.startsWith('/')) {
                            e.preventDefault();
                            navigate(getShopPath(item.link));
                        }
                    }}
                >
                    {item.label}
                    {item.children && item.children.length > 0 && <FaChevronDown className="nexus-submenu-icon" />}
                </a>
                {item.children && item.children.length > 0 && (
                    <div className="nexus-submenu">
                        {item.children.map(child => (
                            <div key={child.id} className="nexus-submenu-item-wrapper">
                                <a
                                    href={getShopPath(child.link)}
                                    className="nexus-submenu-link"
                                    onClick={(e) => {
                                        if (child.link.startsWith('/')) {
                                            e.preventDefault();
                                            navigate(getShopPath(child.link));
                                        }
                                    }}
                                >
                                    {child.label}
                                    {child.children && child.children.length > 0 && <FaChevronDown className="nexus-submenu-icon right" />}
                                </a>
                                {child.children && child.children.length > 0 && (
                                    <div className="nexus-submenu sub-level">
                                        {child.children.map(grandChild => (
                                            <a
                                                key={grandChild.id}
                                                href={getShopPath(grandChild.link)}
                                                className="nexus-submenu-link"
                                                onClick={(e) => {
                                                    if (grandChild.link.startsWith('/')) {
                                                        e.preventDefault();
                                                        navigate(getShopPath(grandChild.link));
                                                    }
                                                }}
                                            >
                                                {grandChild.label}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ));
    };

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(getShopPath(`/products?search=${searchQuery}`));
            setIsSearchOpen(false);
        }
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <header className={`nexus-header ${effectiveNavbarStyle}`}>
            <div className="nexus-header-container">

                <div className={`nexus-mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                    <nav className="nexus-mobile-nav" onClick={e => e.stopPropagation()}>
                        <div className="nexus-mobile-nav-header">
                            <h2>Menu</h2>
                            <button className="nexus-close-mobile" onClick={() => setIsMobileMenuOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        {/* Mobile Search Box */}
                        {effectiveSettings.showSearch && (
                            <div className="nexus-mobile-search-container">
                                <div className="nexus-mobile-search-box">
                                    <FaSearch className="nexus-mobile-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
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

                        <div className="nexus-mobile-links">
                            {effectiveNavbarStyle === 'custom' && effectiveMenuItems.length > 0 ? (
                                effectiveMenuItems.map(item => (
                                    <React.Fragment key={item.id}>
                                        <a href={getShopPath(item.link)} onClick={(e) => { if (item.link.startsWith('/')) { e.preventDefault(); navigate(getShopPath(item.link)); } setIsMobileMenuOpen(false); }}>{item.label}</a>
                                        {item.children && item.children.map(child => (
                                            <a key={child.id} className="mobile-sub-link" href={getShopPath(child.link)} onClick={(e) => { if (child.link.startsWith('/')) { e.preventDefault(); navigate(getShopPath(child.link)); } setIsMobileMenuOpen(false); }}>— {child.label}</a>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                <>
                                    <a href={getShopPath('/')} onClick={(e) => { e.preventDefault(); navigate(getShopPath('/')); setIsMobileMenuOpen(false); }}>Home</a>
                                    <a href={getShopPath('/products')} onClick={(e) => { e.preventDefault(); navigate(getShopPath('/products')); setIsMobileMenuOpen(false); }}>Products</a>
                                    <div className="nexus-mobile-categories">
                                        <h3>Categories</h3>
                                        {categories.map(cat => (
                                            <React.Fragment key={cat._id}>
                                                <a href={getShopPath(`/category/${cat.slug || slugify(cat.name)}`)} onClick={(e) => { e.preventDefault(); navigate(getShopPath(`/category/${cat.slug || slugify(cat.name)}`)); setIsMobileMenuOpen(false); }}>{cat.name}</a>
                                                {cat.subcategories && cat.subcategories.length > 0 && cat.subcategories.map(sub => (
                                                    <a key={sub._id || sub.name} className="mobile-sub-link" href={getShopPath(`/category/${cat.slug || slugify(cat.name)}?sub=${sub.name}`)} onClick={(e) => { e.preventDefault(); navigate(getShopPath(`/category/${cat.slug || slugify(cat.name)}?sub=${sub.name}`)); setIsMobileMenuOpen(false); }}>— {sub.name}</a>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </nav>
                </div>

                {/* Desktop Logo */}
                <div className="nexus-logo" onClick={() => navigate(getShopPath('/'))}>
                    {effectiveSettings.showLogo && storeLogo && (
                        <img src={storeLogo} alt={storeName} className="nexus-logo-img" />
                    )}
                    {effectiveSettings.showStoreName && (
                        <span className="nexus-store-name">{storeName}</span>
                    )}
                </div>

                <div className="nexus-header-mobile-wrapper">
                    {/* LEFT: Logo & Name */}
                    <div className="nexus-logo" onClick={() => navigate(getShopPath('/'))}>
                        {effectiveSettings.showLogo && storeLogo && (
                            <img src={storeLogo} alt={storeName} className="nexus-logo-img" />
                        )}
                        {effectiveSettings.showStoreName && (
                            <span className="nexus-store-name">{storeName}</span>
                        )}
                    </div>

                    {/* RIGHT: Actions & Menu */}
                    <div className="nexus-mobile-actions">
                        {effectiveSettings.showIcons && (
                            <>
                                <button className="nexus-icon-btn nexus-wishlist-btn" onClick={() => navigate(getShopPath('/wishlist'))}>
                                    {wishlistCount > 0 ? <FaHeart style={{ color: '#ef4444' }} /> : <FaRegHeart />}
                                    {wishlistCount > 0 && <span className="nexus-cart-badge">{wishlistCount}</span>}
                                </button>
                                <button className="nexus-icon-btn nexus-cart-btn" onClick={() => setIsCartOpen(true)}>
                                    <FaShoppingCart />
                                    {cartCount > 0 && <span className="nexus-cart-badge">{cartCount}</span>}
                                </button>
                            </>
                        )}
                        {/* Hide hamburger if cart is open or on checkout page */}
                        {!isCartOpen && !location.pathname.includes('/checkout') && (
                            <button className="nexus-mobile-toggle" onClick={toggleMobileMenu}>
                                {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Unified Nav Area for all layouts (Middle) */}
                {(effectiveNavbarStyle === 'basic' || effectiveNavbarStyle === 'with-category' || effectiveNavbarStyle === 'custom') && (
                    <nav className={`nexus-nav-middle alignment-${effectiveSettings.menuAlignment}`}>
                        {effectiveNavbarStyle === 'custom' && effectiveMenuItems.length > 0 ? (
                            renderMenuItems(effectiveMenuItems)
                        ) : effectiveNavbarStyle === 'with-category' ? (
                            <>
                                <a href={getShopPath('/')} className="nexus-nav-link" onClick={(e) => { e.preventDefault(); navigate(getShopPath('/')); }}>Home</a>
                                <a href={getShopPath('/products')} className="nexus-nav-link" onClick={(e) => { e.preventDefault(); navigate(getShopPath('/products')); }}>Products</a>
                                <span className="nexus-separator">|</span>
                                {categories.slice(0, 5).map(cat => (
                                    <div key={cat._id} className="nexus-nav-item-wrapper">
                                        <a
                                            href={getShopPath(`/category/${cat.slug || slugify(cat.name)}`)}
                                            className="nexus-nav-link"
                                            onClick={(e) => { e.preventDefault(); navigate(getShopPath(`/category/${cat.slug || slugify(cat.name)}`)); }}
                                        >
                                            {cat.name}
                                            {cat.subcategories && cat.subcategories.length > 0 && <FaChevronDown className="nexus-submenu-icon" />}
                                        </a>
                                        {cat.subcategories && cat.subcategories.length > 0 && (
                                            <div className="nexus-submenu">
                                                {cat.subcategories.map(sub => (
                                                    <div key={sub._id || sub.name} className="nexus-submenu-item-wrapper">
                                                        <a
                                                            href={getShopPath(`/category/${cat.slug || slugify(cat.name)}?sub=${sub.name}`)}
                                                            className="nexus-submenu-link"
                                                            onClick={(e) => { e.preventDefault(); navigate(getShopPath(`/category/${cat.slug || slugify(cat.name)}?sub=${sub.name}`)); }}
                                                        >
                                                            {sub.name}
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </>
                        ) : (
                            // Basic fallback
                            <>
                                <a href={getShopPath('/')} className="nexus-nav-link" onClick={(e) => { e.preventDefault(); navigate(getShopPath('/')); }}>Home</a>
                                <a href={getShopPath('/products')} className="nexus-nav-link" onClick={(e) => { e.preventDefault(); navigate(getShopPath('/products')); }}>Products</a>
                                <a href={getShopPath('/track-order')} className="nexus-nav-link" onClick={(e) => { e.preventDefault(); navigate(getShopPath('/track-order')); }}>Track Order</a>
                            </>
                        )}
                    </nav>
                )}

                {/* Desktop Right Group */}
                <div className="nexus-right-group">
                    {(effectiveSettings.showSearch || effectiveSettings.longSearch) && (
                        <div className={`nexus-search-wrapper ${effectiveSettings.longSearch ? 'long-search' : 'compact-search'} ${isSearchOpen ? 'expanded' : ''}`}>
                            {/* Standard Icon-Only Mode (Collapsed) */}
                            {!effectiveSettings.longSearch && !isSearchOpen && (
                                <button className="nexus-search-toggle-btn" onClick={() => setIsSearchOpen(true)}>
                                    <FaSearch />
                                </button>
                            )}

                            {/* Input Mode (Expanded or Full Width) */}
                            {(effectiveSettings.longSearch || isSearchOpen) && (
                                <div className="nexus-search-box">
                                    {effectiveSettings.longSearch && <FaSearch className="search-icon-static" />}
                                    <input
                                        type="text"
                                        className="nexus-search-input"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus={!effectiveSettings.longSearch} // Auto focus when expanding
                                        onFocus={() => setIsSearchOpen(true)}
                                        onBlur={() => setTimeout(() => {
                                            if (!searchQuery) setIsSearchOpen(false);
                                        }, 200)}
                                        onKeyDown={handleSearchSubmit}
                                    />
                                    {!effectiveSettings.longSearch && (
                                        <button className="nexus-search-btn" onClick={(e) => handleSearchSubmit({ key: 'Enter' })}>
                                            <FaSearch />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {effectiveSettings.showIcons && (
                        <div className="nexus-actions-group">
                            <button className="nexus-icon-btn nexus-wishlist-btn" onClick={() => navigate(getShopPath('/wishlist'))}>
                                {wishlistCount > 0 ? <FaHeart style={{ color: '#ef4444' }} /> : <FaRegHeart />}
                                {wishlistCount > 0 && <span className="nexus-cart-badge">{wishlistCount}</span>}
                            </button>
                            <button className="nexus-icon-btn nexus-cart-btn" onClick={() => setIsCartOpen(true)}>
                                <FaShoppingCart />
                                {cartCount > 0 && <span className="nexus-cart-badge">{cartCount}</span>}
                            </button>
                        </div>
                    )}
                </div>

            </div>
            <CartSlidePanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </header>
    );
};

export default NexusHeader;
