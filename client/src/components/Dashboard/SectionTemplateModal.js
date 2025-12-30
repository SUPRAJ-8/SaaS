import React, { useState, useMemo } from 'react';
import { FaTimes, FaSearch, FaChevronDown, FaImage, FaThLarge, FaStar, FaQuestionCircle, FaEnvelope, FaBullhorn, FaObjectGroup, FaLayerGroup } from 'react-icons/fa';
import './SectionTemplateModal.css';

const CATEGORIES = [
    { id: 'all', name: 'All Templates', icon: <FaLayerGroup />, count: 45 },
    { id: 'general', name: 'General Content', icon: <FaObjectGroup />, count: 6 },
    { id: 'premium', name: 'Premium Sections', icon: <FaStar />, count: 22, hasSub: true },
    { id: 'product', name: 'Product Displays', icon: <FaThLarge />, count: 9 },
    { id: 'category', name: 'Category Grids', icon: <FaImage />, count: 6 },
    { id: 'content', name: 'Media & Text', icon: <FaObjectGroup />, count: 5 },
    { id: 'slider', name: 'Carousels', icon: <FaLayerGroup />, count: 3 },
    { id: 'banner', name: 'Banners', icon: <FaBullhorn />, count: 1 },
    { id: 'faq', name: 'Q&A / Help', icon: <FaQuestionCircle />, count: 1 }
];

const TEMPLATES = [
    {
        id: 'modern-hero',
        name: 'MODERN TECH HERO',
        category: 'premium',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80',
        description: 'Premium tech-style hero with dashboard preview and highlights',
        defaultContent: {
            title: "Automate Your Workflow with Intelligent Analytics",
            highlightedText: "Intelligent Analytics",
            subtitle: "Stop guessing. Hover over the dashboard to see how our AI uncovers hidden revenue opportunities in real-time.",
            primaryBtnText: "Start Exploring Now",
            secondaryBtnText: "Watch Video",
            checklistItems: ["No credit card required", "14-day free trial"],
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
            paddingTop: 80,
            paddingBottom: 80
        }
    },
    {
        id: 'hero-impact',
        name: 'MAKE AN IMPACT',
        category: 'content',
        image: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=500&q=80',
        description: 'Large impact headline with description and CTAs',
        defaultContent: { title: 'Make an impact with your headline', subtitle: 'Loram ipsum dolor sit amet, consectetur adipiscing elit.', button1: 'Shop Now', button2: 'Learn More', marginTop: 5, marginBottom: 5 }
    },
    {
        id: 'full-image',
        name: 'FULL IMAGE',
        category: 'banner',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80',
        description: 'Full width background image section',
        defaultContent: { imageUrl: '', marginTop: 5, marginBottom: 5 }
    },
    {
        id: 'infinite-slider',
        name: 'INFINITE IMAGE SLIDER',
        category: 'slider',
        image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&q=80',
        description: 'Smooth scrolling image carousel',
        defaultContent: { items: [], marginTop: 5, marginBottom: 5 }
    },
    {
        id: 'rich-text',
        name: 'WELCOME TO RICH TEXT',
        category: 'general',
        image: '/templets/rich-text.png',
        description: 'Rich text editor content area',
        defaultContent: { html: '<h1>Welcome to rich text editor</h1>', marginTop: 5, marginBottom: 5 }
    },
    {
        id: 'product-grid',
        name: 'PRODUCT GRID',
        category: 'product',
        image: '/templets/product-grid.png',
        description: 'Standard product display grid',
        defaultContent: { title: 'Add title', limit: 8, selectedProductIds: [], marginTop: 5, marginBottom: 5 }
    },
    {
        id: 'category-list',
        name: 'CATEGORIES',
        category: 'category',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
        description: 'Discover by category',
        defaultContent: { title: 'Shop by Category', marginTop: 5, marginBottom: 5 }
    },
    {
        id: 'faq-accordion',
        name: 'FAQ',
        category: 'faq',
        image: 'https://images.unsplash.com/photo-1544717297-fa154da0979a?w=500&q=80',
        description: 'Collapsible questions',
        defaultContent: { title: 'FAQ', marginTop: 5, marginBottom: 5 }
    }
];

const SectionTemplateModal = ({ isOpen, onClose, onSelect }) => {
    const [activeCat, setActiveCat] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTemplates = useMemo(() => {
        return TEMPLATES.filter(t => {
            const matchesCat = activeCat === 'all' || t.category === activeCat;
            const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [activeCat, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="template-modal-overlay" onClick={onClose}>
            <div className="template-modal-content premium-layout" onClick={e => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={onClose}>
                    <FaTimes />
                </button>

                {/* Sidebar */}
                <aside className="template-sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-branding">
                            <div className="branding-icon-wrapper">
                                <FaLayerGroup />
                            </div>
                            <h2>SECTION GALLERY</h2>
                        </div>
                    </div>
                    <div className="sidebar-section-label">CATEGORIES</div>
                    <nav className="sidebar-nav">
                        {CATEGORIES.map(cat => (
                            <div
                                key={cat.id}
                                className={`sidebar-item ${activeCat === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCat(cat.id)}
                            >
                                <div className="side-item-main">
                                    <span className="cat-icon">{cat.icon}</span>
                                    <span className="cat-name">{cat.name}</span>
                                </div>
                                <span className="cat-badge">{cat.count}</span>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="template-main">
                    <div className="template-top-bar">
                        <div className="search-wrapper">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search sections"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="template-results-grid">
                        {filteredTemplates.length > 0 ? (
                            filteredTemplates.map(template => (
                                <div
                                    key={template.id}
                                    className="premium-template-card"
                                    onClick={() => onSelect(template)}
                                >
                                    <div className="card-preview">
                                        <img src={template.image} alt={template.name} />
                                        <div className="card-overlay">
                                            <button className="add-btn-inner">Add Section</button>
                                        </div>
                                    </div>
                                    <div className="card-name">{template.name}</div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">
                                <FaLayerGroup />
                                <p>No sections found matching your search.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SectionTemplateModal;
