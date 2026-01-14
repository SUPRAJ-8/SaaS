import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaGripVertical, FaTrash, FaChevronDown, FaChevronRight, FaSearch } from 'react-icons/fa';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import API_URL from '../../apiConfig';
import { toast } from 'react-toastify';
import {
    FaShoppingCart, FaRegHeart, FaThLarge,
    FaEye, FaList, FaImage, FaFont, FaShoppingBag, FaSearchPlus,
    FaAlignLeft, FaAlignCenter, FaAlignRight,
    FaGlobe, FaCheck
} from 'react-icons/fa';
import './NavbarEditorModal.css';

const AVAILABLE_PAGES = [
    { label: 'Home Page', path: '/' },
    { label: 'Products Page', path: '/products' },
    { label: 'Search Page', path: '/search' },
    { label: 'Checkout Page', path: '/checkout' },
    { label: 'Brands Page', path: '/brands' },
    { label: 'About Page', path: '/about' },
    { label: 'FAQs Page', path: '/faqs' },
    { label: 'Contact Page', path: '/contact' },
    { label: 'Track Order', path: '/track-order' }
];

const NavbarLivePreview = ({ layout, menuItems, settings, storeName, storeLogo, categories }) => {
    return (
        <div className={`nve-live-navbar-preview ${layout}`}>
            <div className="nve-preview-header-mockup">
                {/* Logo Area */}
                <div className="nve-mockup-logo">
                    {settings.showLogo && (
                        storeLogo ? (
                            <img src={storeLogo} alt="Logo" className="nve-mockup-logo-img" />
                        ) : (
                            <div className="nve-logo-symbol">
                                {storeName ? storeName.charAt(0).toUpperCase() : 'B'}
                            </div>
                        )
                    )}
                    {settings.showStoreName && <span className="nve-logo-text">{storeName || 'My Store'}</span>}
                </div>

                {/* Navigation Area */}
                {(layout === 'with-category' || layout === 'basic' || layout === 'custom') && (
                    <div className="nve-mockup-nav-middle" style={{
                        justifyContent: settings.menuAlignment === 'left' ? 'flex-start' : settings.menuAlignment === 'right' ? 'flex-end' : 'center'
                    }}>
                        {layout === 'with-category' ? (
                            <>
                                <div className="nve-mockup-links">
                                    <span>Home</span>
                                    <span>Products</span>
                                    <span>Track Order</span>
                                </div>
                                <div className="nve-mockup-separator">|</div>
                                <div className="nve-mockup-categories">
                                    {categories && categories.length > 0 ? (
                                        categories.slice(0, 3).map(cat => (
                                            <span key={cat._id}>{cat.name}</span>
                                        ))
                                    ) : (
                                        <>
                                            <span>Men</span>
                                            <span>Women</span>
                                            <span>Sale</span>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : layout === 'basic' ? (
                            <div className="nve-mockup-links">
                                <span>Home</span>
                                <span>Products</span>
                                <span>Track Order</span>
                            </div>
                        ) : (
                            <div className="nve-mockup-links">
                                {menuItems.slice(0, 4).map(item => (
                                    <span key={item.id}>{item.label}</span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="nve-mockup-actions">
                    {/* Search Logic */}
                    {settings.showSearch && !settings.longSearch && <FaSearch />}
                    {settings.longSearch && (
                        <div className="nve-mockup-search-full">
                            <FaSearch className="nve-search-icon" />
                            <span>Search...</span>
                        </div>
                    )}
                    {settings.showIcons && (
                        <>
                            <FaRegHeart />
                            <div className="nve-mockup-cart">
                                <FaShoppingCart />
                                <span className="nve-mockup-badge">0</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const SortableMenuItem = ({ item, depth, onUpdate, onDelete, onAddSub, categories }) => {
    const dropdownRef = React.useRef(null);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id });

    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [customUrl, setCustomUrl] = useState('');
    const [urlDropdownTab, setUrlDropdownTab] = useState('pages');
    const [isCollapsed, setIsCollapsed] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: `${depth * 20}px`,
        position: 'relative',
        zIndex: transform ? 9999 : 'auto'
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        if (showSuggestions) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showSuggestions]);

    const filteredPages = AVAILABLE_PAGES.filter(page =>
        page.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.path.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectPage = (path) => {
        onUpdate(item.id, { link: path });
        setShowSuggestions(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`nve-menu-item-wrapper ${depth > 0 ? 'nve-sub-item' : ''}`}
            data-depth={depth}
        >
            <div
                className={`nve-menu-item-content ${showSuggestions ? 'has-dropdown' : ''}`}
                {...attributes}
                {...listeners}
            >
                <div className="nve-drag-handle">
                    <FaGripVertical />
                </div>
                <div className="nve-item-inputs">
                    <input
                        type="text"
                        value={item.label}
                        onChange={(e) => onUpdate(item.id, { label: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        placeholder="Item Label"
                    />
                    <div className="nve-url-input-wrapper" ref={dropdownRef}>
                        <input
                            type="text"
                            value={item.link}
                            onChange={(e) => {
                                onUpdate(item.id, { link: e.target.value });
                                setSearchQuery(e.target.value);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowSuggestions(true);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            placeholder="/link"
                        />
                        {showSuggestions && (
                            <div className="nve-url-dropdown" onMouseDown={(e) => e.stopPropagation()}>
                                <div className="nve-dropdown-search">
                                    <FaSearch />
                                    <input
                                        type="text"
                                        placeholder="Search URLs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        autoFocus
                                    />
                                </div>

                                <div className="nve-dropdown-custom-url">
                                    <span className="nve-section-label">CUSTOM LINK</span>
                                    <div className="nve-custom-input-group">
                                        <input
                                            type="text"
                                            placeholder="https://example.com"
                                            value={customUrl}
                                            onChange={(e) => setCustomUrl(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (customUrl) {
                                                        const finalUrl = customUrl.startsWith('http') ? customUrl : `https://${customUrl}`;
                                                        handleSelectPage(finalUrl);
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="nve-dropdown-tabs">
                                    <button
                                        type="button"
                                        className={`nve-dropdown-tab ${urlDropdownTab === 'pages' ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setUrlDropdownTab('pages');
                                            setSearchQuery(''); // Clear search when switching tabs
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                    >
                                        Pages
                                    </button>
                                    <button
                                        type="button"
                                        className={`nve-dropdown-tab ${urlDropdownTab === 'categories' ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setUrlDropdownTab('categories');
                                            setSearchQuery(''); // Clear search when switching tabs
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                    >
                                        Categories
                                    </button>
                                </div>

                                <div className="nve-dropdown-list">
                                    {/* Pages Tab Content */}
                                    {urlDropdownTab === 'pages' && (
                                        <>
                                            {filteredPages.map((page, index) => (
                                                <div
                                                    key={index}
                                                    className={`nve-dropdown-item ${item.link === page.path ? 'active' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectPage(page.path);
                                                    }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                >
                                                    <div className="nve-item-icon">
                                                        <FaGlobe />
                                                    </div>
                                                    <div className="nve-item-info">
                                                        <span className="nve-page-label">{page.label}</span>
                                                        <span className="nve-page-path">{page.path}</span>
                                                    </div>
                                                    {item.link === page.path && <FaCheck className="nve-check-icon" />}
                                                </div>
                                            ))}
                                            {filteredPages.length === 0 && (
                                                <div className="nve-no-results">No pages found</div>
                                            )}
                                        </>
                                    )}

                                    {/* Categories Tab Content */}
                                    {urlDropdownTab === 'categories' && (
                                        <>
                                            {categories && categories.length > 0 ? (
                                                categories
                                                    .filter(cat =>
                                                        cat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        cat.slug?.toLowerCase().includes(searchQuery.toLowerCase())
                                                    )
                                                    .map((cat) => {
                                                        const catPath = `/category/${cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-')}`;
                                                        return (
                                                            <div
                                                                key={cat._id}
                                                                className={`nve-dropdown-item ${item.link === catPath ? 'active' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelectPage(catPath);
                                                                }}
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                            >
                                                                <div className="nve-item-icon">
                                                                    <FaThLarge />
                                                                </div>
                                                                <div className="nve-item-info">
                                                                    <span className="nve-page-label">{cat.name}</span>
                                                                    <span className="nve-page-path">{catPath}</span>
                                                                </div>
                                                                {item.link === catPath && <FaCheck className="nve-check-icon" />}
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                <div className="nve-no-results">No categories found</div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="nve-dropdown-footer">
                                    <button
                                        type="button"
                                        className="nve-cancel-btn"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowSuggestions(false);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="nve-select-btn"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowSuggestions(false);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                    >
                                        Select Link
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="nve-item-actions">
                    {item.children && item.children.length > 0 && (
                        <button
                            className="nve-fold-btn"
                            onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            title={isCollapsed ? "Expand" : "Collapse"}
                        >
                            {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
                        </button>
                    )}
                    {depth < 2 && (
                        <button
                            className="nve-add-sub-btn"
                            onClick={(e) => { e.stopPropagation(); onAddSub(item.id); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="Add Sub-item"
                        >
                            <FaPlus />
                        </button>
                    )}
                    <button
                        className="nve-delete-item-btn"
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="Delete Item"
                    >
                        <FaTrash />
                    </button>
                </div>
            </div>
            {item.children && item.children.length > 0 && !isCollapsed && (
                <div className="nve-sub-menu">
                    {item.children.map(child => (
                        <SortableMenuItem
                            key={child.id}
                            item={child}
                            depth={depth + 1}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onAddSub={onAddSub}
                            categories={categories}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const NavbarEditorModal = ({ isOpen, onClose, onSave, onUpdate, siteSettings }) => {
    const [activeLayout, setActiveLayout] = useState('basic');
    const [settings, setSettings] = useState({
        showSearch: true,
        longSearch: false,
        sticky: false,
        showLogo: true,
        showStoreName: true,
        showIcons: true,
        menuAlignment: 'center',
    });
    const [menuItems, setMenuItems] = useState([
        { id: '1', label: 'Home', link: '/' },
        { id: '2', label: 'Products', link: '/products' },
        { id: '3', label: 'Track Order', link: '/track-order' }
    ]);
    const [activeTab, setActiveTab] = useState('display');
    const [storeInfo, setStoreInfo] = useState({ name: 'My Store', logo: null });
    const [categories, setCategories] = useState([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchCategories = React.useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/categories`, { withCredentials: true });
            if (Array.isArray(res.data)) {
                setCategories(res.data);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    }, []);

    const loadStoreInfo = React.useCallback(() => {
        if (siteSettings) {
            let logo = siteSettings.logo;
            if (logo && !logo.startsWith('http') && !logo.startsWith('data:')) {
                logo = `${API_URL}${logo.startsWith('/') ? '' : '/'}${logo}`;
            }
            setStoreInfo({
                name: siteSettings.brandName || siteSettings.storeName || 'My Store',
                logo: logo
            });
            return;
        }

        const settingsStr = localStorage.getItem('storeSettings');
        if (settingsStr) {
            try {
                const parsed = JSON.parse(settingsStr);
                let logo = parsed.logo;
                if (logo && !logo.startsWith('http') && !logo.startsWith('data:')) {
                    logo = `${API_URL}${logo.startsWith('/') ? '' : '/'}${logo}`;
                }
                setStoreInfo({
                    name: parsed.brandName || parsed.storeName || 'My Store',
                    logo: logo
                });
            } catch (err) {
                console.error('Error parsing store settings:', err);
            }
        }
    }, [siteSettings]);

    const fetchNavbarSettings = React.useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/store-settings/navbar`, { withCredentials: true });
            if (res.data) {
                setActiveLayout(res.data.layout || res.data.navbarStyle || 'basic');
                // Use a combination of nested settings and flattened fields for maximum compatibility
                const savedSettings = res.data.settings || {};
                setSettings({
                    showSearch: res.data.showSearch ?? savedSettings.showSearch ?? true,
                    longSearch: res.data.longSearch ?? savedSettings.longSearch ?? false,
                    sticky: res.data.sticky ?? savedSettings.sticky ?? false,
                    showLogo: res.data.showLogo ?? savedSettings.showLogo ?? true,
                    showStoreName: res.data.showStoreName ?? savedSettings.showStoreName ?? true,
                    showIcons: res.data.showIcons ?? savedSettings.showIcons ?? true,
                    menuAlignment: res.data.menuAlignment || savedSettings.menuAlignment || 'center',
                });
                if (res.data.menuItems) {
                    setMenuItems(res.data.menuItems);
                }
            }
        } catch (err) {
            console.error('Error fetching navbar settings:', err);
        }
    }, []);

    useEffect(() => {
        const canvasContainer = document.querySelector('.builder-canvas-container');

        if (isOpen) {
            fetchNavbarSettings();
            loadStoreInfo();
            fetchCategories();
            document.body.style.overflow = 'hidden';
            if (canvasContainer) {
                canvasContainer.style.overflow = 'hidden';
            }
        } else {
            document.body.style.overflow = 'unset';
            if (canvasContainer) {
                canvasContainer.style.overflow = 'auto';
            }
        }

        return () => {
            document.body.style.overflow = 'unset';
            if (canvasContainer) {
                canvasContainer.style.overflow = 'auto';
            }
        };
    }, [isOpen, fetchNavbarSettings, loadStoreInfo, fetchCategories]);

    useEffect(() => {
        if (activeLayout !== 'custom' && activeTab !== 'display') {
            setActiveTab('display');
        }
    }, [activeLayout, activeTab]);

    // Live Preview Update to Parent
    useEffect(() => {
        if (onUpdate && isOpen) {
            onUpdate({
                layout: activeLayout,
                navbarStyle: activeLayout,
                settings: settings,
                menuItems: menuItems
            });
        }
    }, [activeLayout, settings, menuItems, isOpen]);



    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setMenuItems((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const updateMenuItem = (id, updates) => {
        const updateRecursive = (items) => {
            return items.map(item => {
                if (item.id === id) return { ...item, ...updates };
                if (item.children) return { ...item, children: updateRecursive(item.children) };
                return item;
            });
        };
        setMenuItems(updateRecursive(menuItems));
    };

    const deleteMenuItem = (id) => {
        const deleteRecursive = (items) => {
            return items.filter(item => {
                if (item.id === id) return false;
                if (item.children) item.children = deleteRecursive(item.children);
                return true;
            });
        };
        setMenuItems(deleteRecursive(menuItems));
    };

    const addMenuItem = () => {
        const newItem = {
            id: Date.now().toString(),
            label: 'New Item',
            link: '/',
        };
        setMenuItems([...menuItems, newItem]);
    };

    const addSubItem = (parentId) => {
        const addRecursive = (items) => {
            return items.map(item => {
                if (item.id === parentId) {
                    const children = item.children || [];
                    return {
                        ...item,
                        children: [...children, { id: Date.now().toString(), label: 'New Sub-item', link: '/' }]
                    };
                }
                if (item.children) return { ...item, children: addRecursive(item.children) };
                return item;
            });
        };
        setMenuItems(addRecursive(menuItems));
    };

    const handleSave = async () => {
        const navbarData = {
            layout: activeLayout,
            navbarStyle: activeLayout, // Ensure compatibility with NexusHeader checks
            settings: settings, // Explicitly nest settings
            menuItems,
            ...settings // Flatten for old compatibility if needed
        };
        try {
            await axios.post(`${API_URL}/api/store-settings/navbar`, navbarData, { withCredentials: true });

            // Force update local storage for immediate reflection in PageBuilder
            localStorage.setItem('nexus_navbarSettings', JSON.stringify(navbarData));
            window.dispatchEvent(new Event('nexus_navbarSettingsUpdated'));

            toast.success('Navbar updated successfully');
            if (onSave) onSave(navbarData);
            onClose();
        } catch (err) {
            console.error('Error saving navbar:', err);
            toast.error('Failed to save navbar settings');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="nve-navbar-modal-overlay">
            <div className="nve-navbar-modal-container">
                <header className="nve-navbar-modal-header">
                    <div className="nve-header-titles">
                        <h2>Navbar Customization</h2>
                        <p>Design your store's navigation experience</p>
                    </div>
                    <button className="nve-close-btn" onClick={onClose}><FaTimes /></button>
                </header>

                <div className="nve-navbar-modal-content">
                    {/* Sidebar Layout Chooser */}
                    <aside className="nve-layout-sidebar">
                        <h3>CHOOSE LAYOUT</h3>
                        <div className="nve-layout-options">
                            <div
                                className={`nve-layout-option ${activeLayout === 'basic' ? 'active' : ''}`}
                                onClick={() => setActiveLayout('basic')}
                            >
                                <div className="nve-layout-preview nve-basic">
                                    <div className="nve-preview-logo"></div>
                                    <div className="nve-preview-links">
                                        <span></span><span></span>
                                    </div>
                                    {activeLayout === 'basic' && <div className="nve-active-check">✓</div>}
                                </div>
                                <span className="nve-layout-label">Basic navbar</span>
                            </div>

                            <div
                                className={`nve-layout-option ${activeLayout === 'with-category' ? 'active' : ''}`}
                                onClick={() => setActiveLayout('with-category')}
                            >
                                <div className="nve-layout-preview nve-with-cat">
                                    <div className="nve-preview-logo"></div>
                                    <div className="nve-preview-links nve-center">
                                        <span></span><span></span><span></span>
                                    </div>
                                    {activeLayout === 'with-category' && <div className="nve-active-check">✓</div>}
                                </div>
                                <span className="nve-layout-label">Nav with category</span>
                            </div>

                            <div
                                className={`nve-layout-option ${activeLayout === 'custom' ? 'active' : ''}`}
                                onClick={() => setActiveLayout('custom')}
                            >
                                <div className="nve-layout-preview nve-customized">
                                    <div className="nve-preview-logo"></div>
                                    <div className="nve-search-pill"></div>
                                    <div className="nve-preview-icons">
                                        <span></span><span></span>
                                    </div>
                                    {activeLayout === 'custom' && <div className="nve-active-check">✓</div>}
                                </div>
                                <span className="nve-layout-label">Customized nav bar</span>
                            </div>
                        </div>
                    </aside>

                    {/* Main Settings Area */}
                    <main className="nve-settings-main">
                        {/* Live Preview Container (Always at Top) */}
                        <section className="nve-settings-section nve-live-preview-section">
                            <header className="nve-section-header nve-centered">
                                <span className="nve-section-icon nve-small">✨</span>
                                <h3>LIVE PREVIEW</h3>
                            </header>

                            <NavbarLivePreview
                                layout={activeLayout}
                                menuItems={menuItems}
                                settings={settings}
                                storeName={storeInfo.name}
                                storeLogo={storeInfo.logo}
                                categories={categories}
                            />
                        </section>

                        {/* Tabs Navigation */}
                        <div className="nve-settings-tabs-nav">
                            <button
                                className={`nve-tab-btn ${activeTab === 'display' ? 'active' : ''}`}
                                onClick={() => setActiveTab('display')}
                            >
                                <FaEye /> Display
                            </button>
                            {activeLayout === 'custom' && (
                                <button
                                    className={`nve-tab-btn ${activeTab === 'navigation' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('navigation')}
                                >
                                    <FaList /> Navigation
                                </button>
                            )}

                            {/* Alignment Controls in Tab Bar */}
                            {activeTab === 'display' && (
                                <div className="nve-alignment-toggle-group compact" style={{ marginLeft: 'auto', marginBottom: '8px' }}>
                                    <button
                                        className={`nve-alignment-btn ${settings.menuAlignment === 'left' ? 'active' : ''}`}
                                        onClick={() => setSettings({ ...settings, menuAlignment: 'left' })}
                                        title="Left Align"
                                    >
                                        <FaAlignLeft />
                                    </button>
                                    <button
                                        className={`nve-alignment-btn ${settings.menuAlignment === 'center' ? 'active' : ''}`}
                                        onClick={() => setSettings({ ...settings, menuAlignment: 'center' })}
                                        title="Center Align"
                                    >
                                        <FaAlignCenter />
                                    </button>
                                    <button
                                        className={`nve-alignment-btn ${settings.menuAlignment === 'right' ? 'active' : ''}`}
                                        onClick={() => setSettings({ ...settings, menuAlignment: 'right' })}
                                        title="Right Align"
                                    >
                                        <FaAlignRight />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Tab Content: Display */}
                        {activeTab === 'display' && (
                            <section className="nve-settings-section nve-tab-content">

                                <div className="nve-settings-cards-grid">
                                    <div className="nve-setting-card">
                                        <div className="nve-card-icon-box nve-purple">
                                            <FaImage />
                                        </div>
                                        <div className="nve-card-info">
                                            <h4>Enable Store Logo</h4>
                                            <p>Show your brand's unique logo</p>
                                        </div>
                                        <label className="nve-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.showLogo}
                                                onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                                            />
                                            <span className="nve-slider nve-round"></span>
                                        </label>
                                    </div>

                                    <div className="nve-setting-card">
                                        <div className="nve-card-icon-box nve-blue">
                                            <FaFont />
                                        </div>
                                        <div className="nve-card-info">
                                            <h4>Show Store Name</h4>
                                            <p>Display store name text</p>
                                        </div>
                                        <label className="nve-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.showStoreName}
                                                onChange={(e) => setSettings({ ...settings, showStoreName: e.target.checked })}
                                            />
                                            <span className="nve-slider nve-round"></span>
                                        </label>
                                    </div>

                                    <div className="nve-setting-card">
                                        <div className="nve-card-icon-box nve-orange">
                                            <FaShoppingBag />
                                        </div>
                                        <div className="nve-card-info">
                                            <h4>Enable Header Icons</h4>
                                            <p>Search, Wishlist, and Cart</p>
                                        </div>
                                        <label className="nve-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.showIcons}
                                                onChange={(e) => setSettings({ ...settings, showIcons: e.target.checked })}
                                            />
                                            <span className="nve-slider nve-round"></span>
                                        </label>
                                    </div>

                                    <div className="nve-setting-card">
                                        <div className="nve-card-icon-box nve-pink">
                                            <FaSearchPlus />
                                        </div>
                                        <div className="nve-card-info">
                                            <h4>Show Search Preview</h4>
                                            <p>Quick results while typing</p>
                                        </div>
                                        <label className="nve-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.showSearch}
                                                onChange={(e) => setSettings({ ...settings, showSearch: e.target.checked, longSearch: e.target.checked ? false : settings.longSearch })}
                                            />
                                            <span className="nve-slider nve-round"></span>
                                        </label>
                                    </div>

                                    {/* Additional Sticky Setting */}
                                    <div className="nve-setting-card">
                                        <div className="nve-card-icon-box nve-teal">
                                            <FaThLarge />
                                        </div>
                                        <div className="nve-card-info">
                                            <h4>Sticky Navigation</h4>
                                            <p>Keep navbar at top on scroll</p>
                                        </div>
                                        <label className="nve-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.sticky}
                                                onChange={(e) => setSettings({ ...settings, sticky: e.target.checked })}
                                            />
                                            <span className="nve-slider nve-round"></span>
                                        </label>
                                    </div>

                                    <div className="nve-setting-card">
                                        <div className="nve-card-icon-box nve-indigo">
                                            <FaSearch />
                                        </div>
                                        <div className="nve-card-info">
                                            <h4>Full Width Search Bar</h4>
                                            <p>Expand search to right side</p>
                                        </div>
                                        <label className="nve-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.longSearch}
                                                onChange={(e) => setSettings({ ...settings, longSearch: e.target.checked, showSearch: e.target.checked ? false : settings.showSearch })}
                                            />
                                            <span className="nve-slider nve-round"></span>
                                        </label>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Tab Content: Navigation */}
                        {activeTab === 'navigation' && activeLayout === 'custom' && (
                            <section className="nve-settings-section nve-tab-content">
                                <div className="nve-menu-management-header">
                                    <header className="nve-section-header">
                                        <span className="nve-section-icon">🔗</span>
                                        <h3>MANAGE MENU ITEMS</h3>

                                        <div className="nve-header-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {/* Alignment Controls Restored */}
                                            <div className="nve-alignment-toggle-group compact">
                                                <button
                                                    className={`nve-alignment-btn ${settings.menuAlignment === 'left' ? 'active' : ''}`}
                                                    onClick={() => setSettings({ ...settings, menuAlignment: 'left' })}
                                                    title="Left Align"
                                                >
                                                    <FaAlignLeft />
                                                </button>
                                                <button
                                                    className={`nve-alignment-btn ${settings.menuAlignment === 'center' ? 'active' : ''}`}
                                                    onClick={() => setSettings({ ...settings, menuAlignment: 'center' })}
                                                    title="Center Align"
                                                >
                                                    <FaAlignCenter />
                                                </button>
                                                <button
                                                    className={`nve-alignment-btn ${settings.menuAlignment === 'right' ? 'active' : ''}`}
                                                    onClick={() => setSettings({ ...settings, menuAlignment: 'right' })}
                                                    title="Right Align"
                                                >
                                                    <FaAlignRight />
                                                </button>
                                            </div>

                                            <button className="nve-add-item-btn-top" onClick={addMenuItem}>
                                                <FaPlus /> Add Item
                                            </button>
                                        </div>
                                    </header>
                                </div>

                                <div className="nve-menu-items-list">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={menuItems.map(i => i.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {menuItems.map((item) => (
                                                <SortableMenuItem
                                                    key={item.id}
                                                    item={item}
                                                    depth={0}
                                                    onUpdate={updateMenuItem}
                                                    onDelete={deleteMenuItem}
                                                    onAddSub={addSubItem}
                                                    categories={categories}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </section>
                        )}

                    </main>
                </div>

                <footer className="nve-navbar-modal-footer">
                    <p className="nve-footer-hint">💡 Drag items to reorder and nest them.</p>
                    <div className="nve-footer-btns">
                        <button className="nve-cancel-btn" onClick={onClose}>Cancel</button>
                        <button className="nve-save-btn" onClick={handleSave}>Save Navbar</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default NavbarEditorModal;
