import React, { useState, useEffect, useMemo, lazy, Suspense, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaEye, FaEyeSlash, FaDesktop, FaMobileAlt, FaTabletAlt, FaUndo, FaRedo, FaEdit, FaCopy, FaTrash, FaGripVertical, FaTimes, FaFire, FaStar, FaHeart, FaShoppingCart, FaTag, FaGift, FaBolt, FaRocket, FaGem, FaCrown, FaBoxOpen, FaUpload, FaLink, FaPlay, FaVideo, FaDownload, FaArrowAltCircleRight, FaSearch, FaGlobe, FaEnvelope } from 'react-icons/fa';
import './PageBuilder.css';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_URL from '../../apiConfig';
import { ThemeContext } from '../../contexts/ThemeContext';
import FooterEditorModal from './FooterEditorModal';
import NavbarEditorModal from './NavbarEditorModal';
import SectionTemplateModal from './SectionTemplateModal';
import ProductSelectionModal from './ProductSelectionModal';
import { applyStoreSettings } from '../../themeUtils';

import DynamicSection from './DynamicSection';
import DynamicSectionEditor from './DynamicSectionEditor';
import DebouncedColorPicker from './DebouncedColorPicker';

// Template Registry
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import ProductGridTemplate from './templates/ProductGridTemplate';
import HeroTemplate from './templates/HeroTemplate';
import CategoryGridTemplate from './templates/CategoryGridTemplate';
import FAQTemplate from './templates/FAQTemplate';
import RichTextTemplate from './templates/RichTextTemplate';
import RichTextEditor from './RichTextEditor';
import ModernHeroTemplate from './templates/ModernHeroTemplate';

const SECTION_TEMPLATES = {
    'product-grid': ProductGridTemplate,
    'product-grid-basic': ProductGridTemplate,
    'hero-impact': HeroTemplate,
    'hero': HeroTemplate,
    'category-list': CategoryGridTemplate,
    'faq-accordion': FAQTemplate,
    'faq': FAQTemplate,
    'rich-text': RichTextTemplate,
    'modern-hero': ModernHeroTemplate
};

// Lazy load theme components to ensure only active theme CSS is built/loaded
const EcommerceHeader = lazy(() => import('../Shop/layouts/EcommerceHeader'));
const EcommerceFooter = lazy(() => import('../Shop/layouts/EcommerceFooter'));
const NexusHeader = lazy(() => import('../Shop/layouts/NexusHeader'));
const NexusFooter = lazy(() => import('../Shop/layouts/NexusFooter'));
const PortfolioHeader = lazy(() => import('../Shop/layouts/PortfolioLayout').then(m => ({ default: m.PortfolioHeader })));
const PortfolioFooter = lazy(() => import('../Shop/layouts/PortfolioLayout').then(m => ({ default: m.PortfolioFooter })));
const HeroSection = lazy(() => import('../Shop/layouts/HeroSection'));

const SortableProductItem = ({ id, product }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '8px',
        fontSize: '12px',
        color: '#1f2937',
        touchAction: 'none' // Important for drag on mobile/touch
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {/* Grip handle gets the listeners to restrict drag to icon */}
            <div {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                <FaGripVertical style={{ color: '#000', fontSize: '14px', flexShrink: 0 }} />
            </div>
            <span style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {product ? product.name : 'Unknown Product'}
            </span>
        </div>
    );
};



const SortableSection = ({ section, index, selectedSectionId, setSelectedSectionId, removeSection, duplicateSection, SECTION_TEMPLATES }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : 1,
        position: 'relative'
    };

    // 1. Determine Dynamic Status
    const isDynamic = section.type === 'dynamic' || (section.templateData && section.templateData.structure);

    // 2. Parse Content Safely
    let content = {};
    try {
        content = typeof section.content === 'string' ? JSON.parse(section.content || '{}') : (section.content || {});
    } catch (e) {
        content = {};
    }

    return (
        <React.Fragment>
            <div
                ref={setNodeRef}
                style={style}
                className={`builder-section ${selectedSectionId === section.id ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSectionId(section.id);
                }}
            >
                <div className="section-toolbar" onClick={(e) => e.stopPropagation()}>
                    <span className="section-number">#{index + 1}</span>
                    <span className="section-type-tag">{section.type.toUpperCase()}</span>
                    <div className="toolbar-icons">
                        <button className="toolbar-btn drag" title="Drag to reorder" {...attributes} {...listeners}>
                            <FaGripVertical />
                        </button>
                        <button
                            className="toolbar-btn edit"
                            title="Edit Section"
                            onClick={() => setSelectedSectionId(section.id)}
                        >
                            <FaEdit />
                        </button>
                        <button
                            className="toolbar-btn duplicate"
                            title="Duplicate Section"
                            onClick={() => duplicateSection(section.id)}
                        >
                            <FaCopy />
                        </button>
                        <button
                            className="toolbar-btn delete"
                            title="Delete Section"
                            onClick={() => removeSection(section.id)}
                        >
                            <FaTrash />
                        </button>
                    </div>
                </div>
                <div className="section-content-editor">
                    <div className="template-canvas-rendering">
                        {isDynamic ? (
                            <DynamicSection
                                structure={section.templateData?.structure}
                                styles={section.templateData?.styles}
                                content={content}
                            />
                        ) : (
                            SECTION_TEMPLATES[section.type] ? (
                                React.createElement(SECTION_TEMPLATES[section.type], {
                                    content: content
                                })
                            ) : (
                                <div className="section-placeholder-box">
                                    <h2 className="section-title-preview">{section.title}</h2>
                                    <p>Section configured with template data.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type }) => {
    if (!isOpen) return null;

    return (
        <div className="confirmation-modal-overlay animate-fade">
            <div className="confirmation-modal-content animate-slide-up">
                <div className={`confirmation-modal-icon ${type}`}>
                    {type === 'delete' ? <FaTrash /> : <FaCopy />}
                </div>
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="confirmation-modal-actions">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button
                        className={`confirm-btn ${type}`}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {type === 'delete' ? 'Delete' : 'Duplicate'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PageBuilder = ({ mode = 'page' }) => {
    // Apply settings on mount
    useEffect(() => {
        if (mode === 'page') {
            applyStoreSettings();
        }
    }, [mode]);

    const { id } = useParams();
    const navigate = useNavigate();
    const [device, setDevice] = useState('desktop');
    const [sections, setSections] = useState([]); // Empty by default for new pages
    const [isFooterEditorOpen, setIsFooterEditorOpen] = useState(false);
    const [isNavbarEditorOpen, setIsNavbarEditorOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [targetSectionIndex, setTargetSectionIndex] = useState(0);
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [showSavedNotification, setShowSavedNotification] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showRichTextModal, setShowRichTextModal] = useState(false);
    const [showSecondaryIconPicker, setShowSecondaryIconPicker] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'delete'
    });
    const [pageMetadata, setPageMetadata] = useState(null);
    const [isHeroDragging, setIsHeroDragging] = useState(false);

    // Get active theme from context
    const { theme: activeTheme } = useContext(ThemeContext) || {};
    const activeThemeId = 'nexus';

    // Force re-render stuff
    const [footerUpdateTrigger, setFooterUpdateTrigger] = useState(0);
    const [navbarUpdateTrigger, setNavbarUpdateTrigger] = useState(0);

    // Theme Configuration
    const themeConfig = useMemo(() => ({
        nexus: {
            header: NexusHeader,
            footer: NexusFooter,
            canvasClass: 'nexus-theme'
        }
    }), []);

    const currentTheme = themeConfig.nexus;
    const HeaderComponent = currentTheme.header;
    const FooterComponent = currentTheme.footer;

    // Load page metadata (slug, title) on mount
    useEffect(() => {
        const savedPages = JSON.parse(localStorage.getItem('site_pages') || '[]');
        const page = savedPages.find(p => String(p.id) === String(id));
        if (page) {
            setPageMetadata(page);
        }
    }, [id]);

    // 1. Immediate Local Save (Redundancy)
    useEffect(() => {
        if (sections.length > 0 && id !== 'new') {
            const pageKey = `page_${id}_sections`;
            localStorage.setItem(pageKey, JSON.stringify(sections));
        }
    }, [sections, id]);

    // 2. Debounced Backend Auto-Save
    useEffect(() => {
        if (sections.length === 0) return;

        const debouncedSave = setTimeout(async () => {
            try {
                if (mode === 'template') {
                    const section = sections[0];
                    if (!section) return;
                    const contentData = JSON.parse(section.content);
                    await axios.put(`${API_URL}/api/templates/${id}`, {
                        content: contentData
                    }, { withCredentials: true });
                    console.log('✅ Template auto-saved');
                } else {
                    const pageData = {
                        id: pageMetadata?._id, // Include DB ID if we have it
                        slug: pageMetadata?.slug || (id === 'new' ? 'new-page' : id),
                        title: pageMetadata?.title || (id === 'new' ? 'New Page' : (id.charAt(0).toUpperCase() + id.slice(1))),
                        content: JSON.stringify(sections),
                        status: 'draft', // Auto-save as draft? Or published?
                        themeId: activeThemeId
                    };

                    const response = await axios.post(`${API_URL}/api/client-pages`, pageData, { withCredentials: true });

                    // If we were on 'new', we might want to update our local state with the assigned ID/slug
                    if (id === 'new' && response.data) {
                        const savedPage = response.data.find(p => p.slug === pageData.slug);
                        if (savedPage && !pageMetadata) {
                            setPageMetadata(savedPage);
                        }
                    }
                }

                // Show subtle notification
                setShowSavedNotification(true);
                setTimeout(() => setShowSavedNotification(false), 2000);
            } catch (err) {
                console.warn('Auto-save failed:', err.message);
            }
        }, 5000); // 5 second debounce for auto-save

        return () => clearTimeout(debouncedSave);
    }, [sections, id, mode, activeThemeId, pageMetadata]);

    // Load sections from localStorage on mount
    // Load sections from API on mount
    useEffect(() => {
        const fetchPageData = async () => {
            if (id === 'new') return;

            // Template Mode Fetch logic
            if (mode === 'template') {
                try {
                    const response = await axios.get(`${API_URL}/api/templates/admin`, { withCredentials: true });
                    const templates = response.data;
                    const template = templates.find(t => t._id === id);

                    // Mock data fallback if template not found in API response list (or separate endpoint logic)
                    // If API returns list, we filter. If endpoint /api/templates/:id exists, better.
                    // For now, assume list is reliable or fallback to manual mock for this demo.
                    let targetTemplate = template;
                    if (!targetTemplate) {
                        // Check mocks
                        const mocks = [
                            { _id: '1', name: 'Hero Section Modern', baseType: 'hero-modern', content: { title: "Modern Hero", subtitle: "Edit me", showPrimaryBtn: true }, category: 'Hero', isActive: true },
                            { _id: '2', name: 'Feature Grid', baseType: 'product-grid-basic', content: { title: "Features" }, category: 'Features', isActive: true },
                            { _id: '3', name: 'Rich Text Block', baseType: 'rich-text', content: { html: "<p>Start writing...</p>" }, category: 'General', isActive: true }
                        ];
                        targetTemplate = mocks.find(t => t._id === id);
                    }

                    if (targetTemplate) {
                        const content = typeof targetTemplate.content === 'string' ? JSON.parse(targetTemplate.content || '{}') : (targetTemplate.content || {});

                        // Wrap in section structure
                        const sectionWrapper = [{
                            id: 'template_edit_section',
                            type: targetTemplate.baseType || 'hero-modern',
                            title: targetTemplate.name,
                            content: JSON.stringify(content)
                        }];
                        setSections(sectionWrapper);
                        // Select it immediately
                        setSelectedSectionId('template_edit_section');
                        setPageMetadata({ title: targetTemplate.name, slug: targetTemplate.id });
                    }
                } catch (error) {
                    console.error('Error fetching template:', error);
                    toast.error('Could not load template data');
                }
                return;
            }

            // Normal Page Mode logic

            try {
                // We fetch all pages and find the one matching the slug/id or Mongo _id
                const response = await axios.get(`${API_URL}/api/client-pages`, { withCredentials: true });
                const pages = response.data;
                const page = pages.find(p =>
                    p._id === id ||
                    p.slug === id ||
                    (pageMetadata && p.slug === pageMetadata.slug) ||
                    (pageMetadata && p._id === pageMetadata._id)
                );

                if (page && page.content) {
                    setPageMetadata(page); // Update metadata with full record from server
                    try {
                        setSections(JSON.parse(page.content));
                        return;
                    } catch (err) {
                        console.error('Error parsing page content:', err);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch page from server:', error);
            }

            // Fallback to LocalStorage
            const pageKey = `page_${id}_sections`;
            const savedSections = localStorage.getItem(pageKey);
            if (savedSections) {
                try {
                    setSections(JSON.parse(savedSections));
                } catch (e) {
                    console.error('Failed to load saved sections:', e);
                }
            }
        };

        fetchPageData();
    }, [id, mode]);

    const handleSave = async () => {
        if (mode === 'template') {
            try {
                // Extract content from the single section
                const section = sections[0];
                if (!section) return;

                const contentData = JSON.parse(section.content);

                // We need to update the template via API
                // Assuming we have the original template object or just sending content
                // We need to PUT /api/templates/:id
                // We'll trust the existing templates API structure

                await axios.put(`${API_URL}/api/templates/${id}`, {
                    content: contentData
                }, { withCredentials: true });

                toast.success('Template updated successfully!');
                setShowSavedNotification(true);
                setTimeout(() => setShowSavedNotification(false), 2000);
            } catch (error) {
                console.error('Failed to save template:', error);
                // Mock success for demo
                toast.success('Template saved (Mock)');
                setShowSavedNotification(true);
            }
            return;
        }

        try {
            // Determine the correct slug. 
            // If it's the static 'Nexus Home' id (3), it should be an empty slug.
            let finalSlug = pageMetadata?.slug;
            if (finalSlug === undefined) {
                if (id === '3') finalSlug = '';
                else if (id === 'new') finalSlug = 'new-page';
                else if (id === 'home') finalSlug = '';
                else finalSlug = id;
            }

            const pageData = {
                id: pageMetadata?._id,
                slug: finalSlug,
                title: pageMetadata?.title || (finalSlug === '' ? 'Home' : (finalSlug.charAt(0).toUpperCase() + finalSlug.slice(1))),
                content: JSON.stringify(sections),
                status: 'published',
                themeId: activeThemeId
            };

            const response = await axios.post(`${API_URL}/api/client-pages`, pageData, { withCredentials: true });

            if (id === 'new' && response.data) {
                const savedPage = response.data.find(p => p.slug === pageData.slug);
                if (savedPage) setPageMetadata(savedPage);
            }

            // ALSO Save to LocalStorage for immediate local preview (app.localhost usage)
            const pageKey = `page_${id}_sections`;
            localStorage.setItem(pageKey, JSON.stringify(sections));

            toast.success('Page published successfully!');
            setShowSavedNotification(true);
            setTimeout(() => setShowSavedNotification(false), 2000);
        } catch (error) {
            console.error('Failed to save page:', error.response?.data || error.message);
            const errorMsg = error.response?.data?.msg || error.response?.data?.message || 'Failed to save page to server.';
            toast.error(`${errorMsg} Saved locally only.`);

            // Fallback to local storage
            const pageKey = `page_${id}_sections`;
            localStorage.setItem(pageKey, JSON.stringify(sections));
        }
    };

    const handleFooterSave = () => {
        setIsFooterEditorOpen(false);
        setFooterUpdateTrigger(prev => prev + 1); // Trigger re-render of footer
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const activeId = active.id;
            const overId = over.id;

            // Check if we are dragging a section
            const isActiveSection = sections.some(s => s.id === activeId);

            if (isActiveSection) {
                setSections((items) => {
                    const oldIndex = items.findIndex(s => s.id === activeId);
                    const newIndex = items.findIndex(s => s.id === overId);
                    return arrayMove(items, oldIndex, newIndex);
                });
            } else if (selectedSectionId) {
                // If not a section, must be a product within current section
                const section = sections.find(s => s.id === selectedSectionId);
                if (section) {
                    const content = JSON.parse(section.content);
                    if (content.selectedProductIds) {
                        const oldIndex = content.selectedProductIds.indexOf(activeId);
                        const newIndex = content.selectedProductIds.indexOf(overId);
                        if (oldIndex !== -1 && newIndex !== -1) {
                            const newIds = arrayMove(content.selectedProductIds, oldIndex, newIndex);
                            updateSectionContent(selectedSectionId, { ...content, selectedProductIds: newIds });
                        }
                    }
                }
            }
        }
    };

    const handleNavbarSave = () => {
        setIsNavbarEditorOpen(false);
        setNavbarUpdateTrigger(prev => prev + 1); // Trigger re-render of navbar
    };

    const addSection = (index) => {
        setTargetSectionIndex(index);
        setIsTemplateModalOpen(true);
    };

    const handleTemplateSelect = (template) => {
        const newSection = {
            id: Date.now(),
            type: template.id,
            title: template.name,
            content: JSON.stringify(template.defaultContent) // Store as string for flexibility
        };
        const updatedSections = [...sections];
        updatedSections.splice(targetSectionIndex, 0, newSection);
        setSections(updatedSections);
        setIsTemplateModalOpen(false);
        toast.info(`Added ${template.name} section`);
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${API_URL}/api/products`);
                const data = await response.json();
                setAvailableProducts(data);
            } catch (err) {
                console.error("Failed to fetch products:", err);
            }
        };
        fetchProducts();
    }, []);

    // Close icon picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showIconPicker && !event.target.closest('.icon-picker-grid') && !event.target.closest('.change-icon-btn')) {
                setShowIconPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showIconPicker]);

    const updateSectionContent = (id, newContent) => {
        const newContentString = JSON.stringify(newContent);
        setSections(prev => {
            const index = prev.findIndex(s => s.id === id);
            if (index === -1) return prev;
            if (prev[index].content === newContentString) return prev;

            const newSections = [...prev];
            newSections[index] = { ...prev[index], content: newContentString };
            return newSections;
        });
    };

    const removeSection = (id) => {
        const section = sections.find(s => s.id === id);
        setConfirmationModal({
            isOpen: true,
            title: 'Delete Section',
            message: `Are you sure you want to delete the ${section?.type.toUpperCase()} section? This action cannot be undone.`,
            type: 'delete',
            onConfirm: () => {
                setSections(prev => prev.filter(s => s.id !== id));
                if (selectedSectionId === id) setSelectedSectionId(null);
                toast.info('Section removed');
            }
        });
    };

    const duplicateSection = (id) => {
        const sectionToDuplicate = sections.find(s => s.id === id);
        if (!sectionToDuplicate) return;

        setConfirmationModal({
            isOpen: true,
            title: 'Duplicate Section',
            message: `Do you want to create a copy of the ${sectionToDuplicate.type.toUpperCase()} section?`,
            type: 'duplicate',
            onConfirm: () => {
                const newSection = {
                    ...sectionToDuplicate,
                    id: Date.now() + Math.random(), // Unique ID
                };
                const index = sections.findIndex(s => s.id === id);
                const updatedSections = [...sections];
                updatedSections.splice(index + 1, 0, newSection);
                setSections(updatedSections);
                toast.success(`Duplicated ${sectionToDuplicate.title}`);
            }
        });
    };

    // Nexus is now the only supported theme, so no restriction needed here.

    // RESTRICTION: Specific System Pages in Nexus Theme cannot be edited
    // "product details ,check outs page add to cart page wishlist page category page all product page cannot be change from page buikder"
    const RESTRICTED_NEXUS_PAGES = ['checkout', 'cart', 'wishlist', 'products', 'shop', 'category', 'product', 'product-details'];
    if (mode !== 'template' && activeThemeId === 'nexus' && RESTRICTED_NEXUS_PAGES.some(slug => id.toLowerCase() === slug || id.toLowerCase().startsWith('product-') || id.toLowerCase().startsWith('category-'))) {
        return (
            <div className="page-builder-container">
                <div className="builder-restricted-overlay">
                    <div className="restricted-content animate-fade">
                        <div className="restricted-icon">🚫</div>
                        <h1>System Page Restricted</h1>
                        <p>
                            The <strong>{id}</strong> page is a core system page (Product Details, Checkout, Category, etc.)
                            and cannot be edited using the Page Builder in the <strong>Nexus Theme</strong>.
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '10px' }}>
                            These pages use fixed layouts to ensure functionality (Cart, Checkout, etc.).
                        </p>
                        <div className="restricted-actions">
                            <button className="back-btn-restricted" onClick={() => navigate('/dashboard/pages')}>
                                Back to Pages
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-builder-container">
            <NavbarEditorModal
                isOpen={isNavbarEditorOpen}
                onClose={() => setIsNavbarEditorOpen(false)}
                onSave={handleNavbarSave}
                activeThemeId={activeThemeId}
            />
            <FooterEditorModal
                isOpen={isFooterEditorOpen}
                onClose={() => setIsFooterEditorOpen(false)}
                onSave={handleFooterSave}
                activeThemeId={activeThemeId}
            />
            <SectionTemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onSelect={handleTemplateSelect}
            />
            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
                message={confirmationModal.message}
                type={confirmationModal.type}
            />

            <header className="builder-header">
                <div className="builder-header-left">
                    <button className="back-btn" onClick={() => navigate(mode === 'template' ? '/dashboard/templates' : '/dashboard/pages')}>
                        <FaArrowLeft />
                    </button>
                    <div className="page-info">
                        <h2>{mode === 'template' ? 'Editing Template' : (id === 'new' ? 'Create New Page' : 'Editing Page')}</h2>
                        <span>{mode === 'template' ? (pageMetadata?.title || 'Template') : `/shop/${id === 'new' ? 'page-slug' : id}`}</span>
                    </div>
                </div>

                <div className="builder-device-selector">
                    <button
                        className={device === 'desktop' ? 'active' : ''}
                        onClick={() => setDevice('desktop')}
                    >
                        <FaDesktop />
                    </button>
                    <button
                        className={device === 'tablet' ? 'active' : ''}
                        onClick={() => setDevice('tablet')}
                    >
                        <FaTabletAlt />
                    </button>
                    <button
                        className={device === 'mobile' ? 'active' : ''}
                        onClick={() => setDevice('mobile')}
                    >
                        <FaMobileAlt />
                    </button>
                </div>

                <div className="builder-header-actions">
                    <span className={`status-saved ${showSavedNotification ? 'show' : ''}`}>
                        ✓ Changes Saved
                    </span>
                    <button className="preview-btn-premium" onClick={() => window.open('/shop', '_blank')}>
                        Preview
                    </button>
                    <button className="save-btn-ghost" onClick={handleSave}>
                        <FaSave />
                    </button>
                </div>
            </header>

            <main className="builder-workspace">

                <section className={`builder-canvas-container ${device}`}>
                    <div className={`builder-canvas ${currentTheme.canvasClass}`}>
                        <div
                            className="builder-navbar-wrapper"
                            onClick={() => activeThemeId === 'nexus' && setIsNavbarEditorOpen(true)}
                            style={{ cursor: activeThemeId === 'nexus' ? 'pointer' : 'default', position: 'relative' }}
                        >
                            {activeThemeId === 'nexus' && (
                                <div className="edit-navbar-overlay-btn">
                                    <FaEdit /> Edit Navbar
                                </div>
                            )}
                            <div key={navbarUpdateTrigger}>
                                <Suspense fallback={<div className="p-4 text-center">Loading Navbar...</div>}>
                                    <HeaderComponent />
                                </Suspense>
                            </div>
                        </div>

                        <div className="builder-page-content">
                            {activeThemeId === 'ecommerce' && (
                                <Suspense fallback={null}>
                                    <HeroSection />
                                </Suspense>
                            )}
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                {mode !== 'template' && (
                                    <div className="add-section-zone top">
                                        <button className="add-section-btn" onClick={() => addSection(0)}>
                                            ADD SECTION
                                        </button>
                                    </div>
                                )}

                                {sections.length > 0 ? (
                                    <SortableContext
                                        items={sections.map(s => s.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {sections.map((section, index) => (
                                            <React.Fragment key={section.id}>
                                                <SortableSection
                                                    section={section}
                                                    index={index}
                                                    selectedSectionId={selectedSectionId}
                                                    setSelectedSectionId={setSelectedSectionId}
                                                    removeSection={mode === 'template' ? () => toast.info('Cannot remove base section in template mode') : removeSection}
                                                    duplicateSection={mode === 'template' ? () => toast.info('Cannot duplicate in template mode') : duplicateSection}
                                                    SECTION_TEMPLATES={SECTION_TEMPLATES}
                                                />
                                                {mode !== 'template' && (
                                                    <div className="add-section-zone">
                                                        <button className="add-section-btn" onClick={() => addSection(index + 1)}>
                                                            ADD SECTION
                                                        </button>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </SortableContext>
                                ) : (
                                    <div className="canvas-empty-state">
                                        <div className="canvas-placeholder">
                                            <h3>Editing Page Content</h3>
                                            <p>Your dynamic page sections will appear here.</p>
                                            <div className="editing-zone-indicator">
                                                CONTENT AREA
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </DndContext>
                        </div>

                        <div
                            className="builder-footer-wrapper"
                            onClick={() => activeThemeId === 'nexus' && setIsFooterEditorOpen(true)}
                            style={{ cursor: activeThemeId === 'nexus' ? 'pointer' : 'default', position: 'relative' }}
                        >
                            {activeThemeId === 'nexus' && (
                                <div className="edit-footer-overlay-btn">
                                    <FaEdit /> Edit Footer
                                </div>
                            )}
                            <div key={footerUpdateTrigger}>
                                <Suspense fallback={<div className="p-4 text-center">Loading Footer...</div>}>
                                    <FooterComponent />
                                </Suspense>
                            </div>
                        </div>
                    </div>
                </section>

                <aside className={`builder-properties ${isFooterEditorOpen || isNavbarEditorOpen || isTemplateModalOpen || showProductModal ? 'hidden' : ''}`}>
                    <div className="properties-header">
                        <h3>SECTION EDITOR</h3>
                        {selectedSectionId && (
                            <span className="selected-index">Selected #{sections.findIndex(s => s.id === selectedSectionId) + 1}</span>
                        )}
                    </div>

                    {!selectedSectionId ? (
                        <div className="no-section-selected">
                            <div className="page-settings-editor">
                                <h3>Page Settings</h3>
                                <div className="property-group">
                                    <label>Page Title</label>
                                    <input
                                        type="text"
                                        value={pageMetadata?.title || ''}
                                        onChange={(e) => setPageMetadata(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Enter page title"
                                    />
                                </div>
                                <div className="property-group">
                                    <label>URL Slug</label>
                                    <div className="slug-input-wrapper">
                                        <span className="slug-prefix">/shop/</span>
                                        <input
                                            type="text"
                                            value={pageMetadata?.slug || ''}
                                            onChange={(e) => setPageMetadata(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                            placeholder="page-url"
                                        />
                                    </div>
                                    <small className="field-hint">The path where this page will be accessible.</small>
                                </div>
                                <div className="page-settings-info">
                                    <p>Select a section on the left to edit its specific content and styling.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="section-properties">
                            {(() => {
                                const section = sections.find(s => s.id === selectedSectionId);
                                if (!section) return null;

                                // Parse content directly (stable reference issue was actually in DynamicSectionEditor onChange)
                                let content = {};
                                try {
                                    content = JSON.parse(section.content || '{}');
                                } catch (e) {
                                    content = {};
                                }

                                return (
                                    <>
                                        {/* Dynamic Schema-Based Editor */}
                                        {(section.type === 'dynamic' || (section.templateData && section.templateData.schema)) && (
                                            <DynamicSectionEditor
                                                key={selectedSectionId}
                                                schema={section.templateData?.schema}
                                                content={content}
                                                onChange={(newContent) => updateSectionContent(selectedSectionId, newContent)}
                                            />
                                        )}

                                        {/* General Section Settings - Only show if NOT dynamic (or as supplement) */}
                                        {section.type !== 'rich-text' && section.type !== 'modern-hero' && section.type !== 'dynamic' && !section.templateData && (
                                            <>
                                                <div className="property-group">
                                                    <label>Title</label>
                                                    <input
                                                        type="text"
                                                        value={content.title || ''}
                                                        onChange={(e) => updateSectionContent(selectedSectionId, { ...content, title: e.target.value })}
                                                        placeholder="Add title"
                                                    />
                                                </div>

                                                {(section.type === 'hero' || section.type === 'hero-impact') && (
                                                    <>
                                                        <div className="property-group animate-fade">
                                                            <label>Subtitle</label>
                                                            <textarea
                                                                value={content.subtitle || ''}
                                                                onChange={(e) => updateSectionContent(selectedSectionId, { ...content, subtitle: e.target.value })}
                                                                placeholder="Hero subtitle"
                                                                rows={2}
                                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                            />
                                                        </div>

                                                        <div className="property-row" style={{ display: 'flex', gap: '12px' }}>
                                                            <div className="property-group animate-fade" style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: content.showPrimaryBtn === false ? '0' : '8px' }}>
                                                                    <label style={{ margin: 0, cursor: 'default' }}>Primary Button</label>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateSectionContent(selectedSectionId, { ...content, showPrimaryBtn: content.showPrimaryBtn === false ? true : false });
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: content.showPrimaryBtn === false ? '#94a3b8' : '#7c3aed', padding: '0' }}
                                                                        title={content.showPrimaryBtn === false ? "Show Button" : "Hide Button"}
                                                                    >
                                                                        {content.showPrimaryBtn === false ? <FaEyeSlash /> : <FaEye />}
                                                                    </button>
                                                                </div>
                                                                {content.showPrimaryBtn !== false && (
                                                                    <div className="animate-fade">
                                                                        <input
                                                                            type="text"
                                                                            value={content.button1 || ''}
                                                                            onChange={(e) => updateSectionContent(selectedSectionId, { ...content, button1: e.target.value })}
                                                                            placeholder="Button Text"
                                                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="property-group animate-fade" style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: content.showSecondaryBtn === false ? '0' : '8px' }}>
                                                                    <label style={{ margin: 0, cursor: 'default' }}>Secondary Button</label>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateSectionContent(selectedSectionId, { ...content, showSecondaryBtn: content.showSecondaryBtn === false ? true : false });
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: content.showSecondaryBtn === false ? '#94a3b8' : '#7c3aed', padding: '0' }}
                                                                        title={content.showSecondaryBtn === false ? "Show Button" : "Hide Button"}
                                                                    >
                                                                        {content.showSecondaryBtn === false ? <FaEyeSlash /> : <FaEye />}
                                                                    </button>
                                                                </div>
                                                                {content.showSecondaryBtn !== false && (
                                                                    <div className="animate-fade">
                                                                        <input
                                                                            type="text"
                                                                            value={content.button2 || ''}
                                                                            onChange={(e) => updateSectionContent(selectedSectionId, { ...content, button2: e.target.value })}
                                                                            placeholder="Button Text"
                                                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="property-row" style={{ display: 'flex', gap: '12px' }}>
                                                            {content.showPrimaryBtn !== false && (
                                                                <div className="property-group animate-fade" style={{ flex: 1 }}>
                                                                    <label>Primary Link</label>
                                                                    <input
                                                                        type="text"
                                                                        value={content.button1Link || ''}
                                                                        onChange={(e) => updateSectionContent(selectedSectionId, { ...content, button1Link: e.target.value })}
                                                                        placeholder="/shop or https://..."
                                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                                                    />
                                                                </div>
                                                            )}
                                                            {content.showSecondaryBtn !== false && (
                                                                <div className="property-group animate-fade" style={{ flex: 1 }}>
                                                                    <label>Secondary Link</label>
                                                                    <input
                                                                        type="text"
                                                                        value={content.button2Link || ''}
                                                                        onChange={(e) => updateSectionContent(selectedSectionId, { ...content, button2Link: e.target.value })}
                                                                        placeholder="/shop or https://..."
                                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="property-group animate-fade">
                                                            <label>Background Image URL</label>
                                                            <input
                                                                type="text"
                                                                value={content.bgImage || ''}
                                                                onChange={(e) => updateSectionContent(selectedSectionId, { ...content, bgImage: e.target.value })}
                                                                placeholder="https://images.unsplash.com/..."
                                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                <div className="property-group checkbox-group">
                                                    <label>Section Icon</label>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                        <div className="checkbox-wrapper" onClick={() => updateSectionContent(selectedSectionId, { ...content, showIcon: !content.showIcon })} style={{ flex: 1 }}>
                                                            <div className={`checkbox-custom-box ${content.showIcon !== false ? 'checked' : ''}`}>
                                                                {content.showIcon !== false && '✓'}
                                                            </div>
                                                            <span>Show icon ({(() => {
                                                                const iconNames = {
                                                                    fire: 'Fire',
                                                                    star: 'Star',
                                                                    heart: 'Heart',
                                                                    cart: 'Cart',
                                                                    tag: 'Tag',
                                                                    gift: 'Gift',
                                                                    bolt: 'Bolt',
                                                                    rocket: 'Rocket',
                                                                    gem: 'Gem',
                                                                    crown: 'Crown'
                                                                };
                                                                return iconNames[content.iconType || 'fire'] || 'Fire';
                                                            })()})</span>
                                                        </div>
                                                        {content.showIcon !== false && (
                                                            <button
                                                                className="change-icon-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowIconPicker(!showIconPicker);
                                                                }}
                                                                style={{
                                                                    background: 'none',
                                                                    border: '1px solid #e2e8f0',
                                                                    padding: '4px 12px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    color: '#64748b',
                                                                    marginLeft: '10px'
                                                                }}
                                                            >
                                                                Change
                                                            </button>
                                                        )}
                                                    </div>
                                                    {showIconPicker && content.showIcon !== false && (
                                                        <div className="icon-picker-grid" style={{
                                                            marginTop: '10px',
                                                            padding: '12px',
                                                            background: '#f8fafc',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e2e8f0',
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(4, 1fr)',
                                                            gap: '8px'
                                                        }}>
                                                            {[
                                                                { name: 'Fire', icon: FaFire, value: 'fire' },
                                                                { name: 'Star', icon: FaStar, value: 'star' },
                                                                { name: 'Heart', icon: FaHeart, value: 'heart' },
                                                                { name: 'Cart', icon: FaShoppingCart, value: 'cart' },
                                                                { name: 'Tag', icon: FaTag, value: 'tag' },
                                                                { name: 'Gift', icon: FaGift, value: 'gift' },
                                                                { name: 'Bolt', icon: FaBolt, value: 'bolt' },
                                                                { name: 'Rocket', icon: FaRocket, value: 'rocket' },
                                                                { name: 'Gem', icon: FaGem, value: 'gem' },
                                                                { name: 'Crown', icon: FaCrown, value: 'crown' }
                                                            ].map(({ name, icon: Icon, value }) => (
                                                                <div
                                                                    key={value}
                                                                    onClick={() => {
                                                                        updateSectionContent(selectedSectionId, { ...content, iconType: value });
                                                                        setShowIconPicker(false);
                                                                    }}
                                                                    style={{
                                                                        padding: '8px',
                                                                        background: content.iconType === value ? '#7c3aed' : 'white',
                                                                        color: content.iconType === value ? 'white' : '#64748b',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        border: content.iconType === value ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    <Icon style={{ fontSize: '18px' }} />
                                                                    <span style={{ fontSize: '10px', fontWeight: '600' }}>{name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {content.showIcon !== false && (
                                                    <>
                                                        <div className="property-group checkbox-group">
                                                            <label>Icon Background</label>
                                                            <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, useThemeIconBg: (content.useThemeIconBg === undefined || content.useThemeIconBg === true) ? false : true })}>
                                                                <input type="checkbox" checked={content.useThemeIconBg !== false} readOnly />
                                                                <span>Use theme color for icon background</span>
                                                            </div>
                                                        </div>

                                                        {content.useThemeIconBg === false && (
                                                            <>
                                                                <div className="property-group animate-fade">
                                                                    <label>Custom Icon Background Color</label>
                                                                    <DebouncedColorPicker
                                                                        value={content.iconBgColor || '#ffffff'}
                                                                        onChange={(val) => updateSectionContent(selectedSectionId, { ...content, iconBgColor: val })}
                                                                        onClear={() => updateSectionContent(selectedSectionId, { ...content, iconBgColor: 'transparent' })}
                                                                    />
                                                                </div>

                                                                <div className="property-group animate-fade">
                                                                    <label>Custom Icon Color</label>
                                                                    <DebouncedColorPicker
                                                                        value={content.iconColor || '#ffffff'}
                                                                        onChange={(val) => updateSectionContent(selectedSectionId, { ...content, iconColor: val })}
                                                                        onClear={null}
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                            </>
                                        )}

                                        {section.type !== 'rich-text' && section.type !== 'modern-hero' && (
                                            <>
                                                <div className="property-row">
                                                    <div className="property-group flex-1">
                                                        <label>Title Alignment</label>
                                                        <select
                                                            value={content.align || 'left'}
                                                            onChange={(e) => updateSectionContent(selectedSectionId, { ...content, align: e.target.value })}
                                                        >
                                                            <option value="left">Left</option>
                                                            <option value="center">Center</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="property-group checkbox-group">
                                                    <label>Explore More Button</label>
                                                    <div className="checkbox-wrapper" onClick={() => {
                                                        const currentValue = content.showExploreMore !== false; // Defaults to true
                                                        updateSectionContent(selectedSectionId, { ...content, showExploreMore: !currentValue });
                                                    }}>
                                                        <div className={`checkbox-custom-box ${content.showExploreMore !== false ? 'checked' : ''}`}>
                                                            {content.showExploreMore !== false && '✓'}
                                                        </div>
                                                        <span>Show Explore More button</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="property-row">
                                            <div className="property-group">
                                                <label>Top Padding</label>
                                                <input
                                                    type="number"
                                                    value={content.paddingTop !== undefined ? content.paddingTop : 0}
                                                    placeholder="0"
                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, paddingTop: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                                                    className="padding-input"
                                                />
                                            </div>
                                            <div className="property-group">
                                                <label>Bottom Padding</label>
                                                <input
                                                    type="number"
                                                    value={content.paddingBottom !== undefined ? content.paddingBottom : 0}
                                                    placeholder="0"
                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, paddingBottom: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                                                    className="padding-input"
                                                />
                                            </div>
                                        </div>

                                        <div className="property-row">
                                            <div className="property-group">
                                                <label>Top Margin</label>
                                                <input
                                                    type="number"
                                                    value={content.marginTop !== undefined ? content.marginTop : 5}
                                                    placeholder="5"
                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, marginTop: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                                                    className="padding-input"
                                                />
                                            </div>
                                            <div className="property-group">
                                                <label>Bottom Margin</label>
                                                <input
                                                    type="number"
                                                    value={content.marginBottom !== undefined ? content.marginBottom : 5}
                                                    placeholder="5"
                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, marginBottom: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                                                    className="padding-input"
                                                />
                                            </div>
                                        </div>

                                        <div className="property-group checkbox-group">
                                            <label>Background</label>
                                            <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, useThemeBg: !content.useThemeBg })}>
                                                <input type="checkbox" checked={content.useThemeBg} readOnly />
                                                <span>Use theme color as background</span>
                                            </div>
                                        </div>

                                        {!content.useThemeBg && (
                                            <div className="property-group animate-fade">
                                                <DebouncedColorPicker
                                                    value={content.bgColor}
                                                    onChange={(val) => updateSectionContent(selectedSectionId, { ...content, bgColor: val })}
                                                    onClear={() => updateSectionContent(selectedSectionId, { ...content, bgColor: 'transparent' })}
                                                />
                                            </div>

                                        )}

                                        {section.type === 'rich-text' && (
                                            <div className="property-group">
                                                <label>Rich Text Content</label>
                                                <button
                                                    className="btn-primary"
                                                    onClick={() => setShowRichTextModal(true)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        background: '#7c3aed',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    <FaEdit /> Edit Rich Text Content
                                                </button>
                                                {showRichTextModal && (
                                                    <div className="rich-text-modal-overlay">
                                                        <div className="rich-text-modal-content">
                                                            <div className="rich-text-modal-header">
                                                                <h3>Edit Content</h3>
                                                                <button onClick={() => setShowRichTextModal(false)}><FaTimes /></button>
                                                            </div>
                                                            <div className="rich-text-editor-container">
                                                                <RichTextEditor
                                                                    value={content.html || ''}
                                                                    onChange={(html) => updateSectionContent(selectedSectionId, { ...content, html })}
                                                                    style={{ height: '100%' }}
                                                                />
                                                            </div>
                                                            <div className="rich-text-modal-footer">
                                                                <button className="save-btn" onClick={() => setShowRichTextModal(false)}>Done</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Show Product Selection only for relevant sections */}
                                        {section.type !== 'rich-text' && section.type !== 'modern-hero' && section.type !== 'hero' && section.type !== 'hero-impact' && section.type !== 'faq' && section.type !== 'faq-accordion' && (
                                            <div className="property-group">
                                                <label>Content</label>
                                                <button
                                                    className="btn-primary"
                                                    onClick={() => setShowProductModal(true)}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '10px',
                                                        padding: '10px',
                                                        background: '#7c3aed',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    <FaBoxOpen />
                                                    Select Products ({content.selectedProductIds ? content.selectedProductIds.length : 0})
                                                </button>

                                                {content.selectedProductIds && content.selectedProductIds.length > 0 && (
                                                    <div className="selected-products-summary" style={{ marginTop: '12px' }}>
                                                        <DndContext
                                                            sensors={sensors}
                                                            collisionDetection={closestCenter}
                                                            onDragEnd={handleDragEnd}
                                                        >
                                                            <SortableContext
                                                                items={content.selectedProductIds}
                                                                strategy={verticalListSortingStrategy}
                                                            >
                                                                {content.selectedProductIds.map(id => {
                                                                    const p = availableProducts.find(prod => prod._id === id);
                                                                    return <SortableProductItem key={id} id={id} product={p} />;
                                                                })}
                                                            </SortableContext>
                                                        </DndContext>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Modern Hero Specific */}
                                        {section.type === 'modern-hero' && (
                                            <div className="modern-hero-editor-fields animate-fade">
                                                <div className="section-divider" style={{
                                                    fontSize: '10px',
                                                    fontWeight: '800',
                                                    color: '#94a3b8',
                                                    margin: '20px 0 15px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}>
                                                    <span style={{ height: '1px', background: '#e2e8f0', flex: 1 }}></span>
                                                    HERO CONTENT
                                                    <span style={{ height: '1px', background: '#e2e8f0', flex: 1 }}></span>
                                                </div>

                                                <div className="property-group">
                                                    <label>Main Title</label>
                                                    <textarea
                                                        value={content.title || ''}
                                                        onChange={(e) => updateSectionContent(selectedSectionId, { ...content, title: e.target.value })}
                                                        placeholder="Main headline"
                                                        rows={2}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                    />
                                                </div>

                                                <div className="property-group animate-fade">
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: content.showHighlight === false ? '0' : '8px' }}>
                                                        <label style={{ margin: 0, cursor: 'default' }}>Highlighted Text (Rewrite From Main Title)</label>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateSectionContent(selectedSectionId, { ...content, showHighlight: content.showHighlight === false ? true : false });
                                                            }}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: content.showHighlight === false ? '#94a3b8' : '#7c3aed', padding: '0' }}
                                                            title={content.showHighlight === false ? "Show Highlight" : "Hide Highlight"}
                                                        >
                                                            {content.showHighlight === false ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                    {content.showHighlight !== false && (
                                                        <>
                                                            <input
                                                                type="text"
                                                                value={content.highlightedText || ''}
                                                                onChange={(e) => updateSectionContent(selectedSectionId, { ...content, highlightedText: e.target.value })}
                                                                placeholder="Text to highlight"
                                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                            />

                                                            <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, useThemeHighlight: content.useThemeHighlight === false ? true : false })} style={{ margin: '12px 0 8px' }}>
                                                                <input type="checkbox" checked={content.useThemeHighlight !== false} readOnly />
                                                                <span>Use theme color</span>
                                                            </div>

                                                            {content.useThemeHighlight === false && (
                                                                <DebouncedColorPicker
                                                                    value={content.highlightColor || '#2563eb'}
                                                                    onChange={(val) => updateSectionContent(selectedSectionId, { ...content, highlightColor: val })}
                                                                    style={{ marginBottom: '8px' }}
                                                                />
                                                            )}

                                                            <small className="field-hint" style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>Highlighted text will appear in selected color</small>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="property-group">
                                                    <label>Subtitle / Description</label>
                                                    <textarea
                                                        value={content.subtitle || ''}
                                                        onChange={(e) => updateSectionContent(selectedSectionId, { ...content, subtitle: e.target.value })}
                                                        placeholder="Subtitle text"
                                                        rows={3}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                    />
                                                </div>


                                                {/* PRIMARY BUTTON CONTAINER */}
                                                {content.showPrimaryBtn !== false && (
                                                    <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                        {/* Row 1: Button Text + Link */}
                                                        <div className="property-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                                            <div className="property-group" style={{ flex: 1, marginBottom: 0 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                    <label style={{ margin: 0, cursor: 'default' }}>Primary Button</label>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateSectionContent(selectedSectionId, { ...content, showPrimaryBtn: false });
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: '0' }}
                                                                        title="Hide Button"
                                                                    >
                                                                        <FaEye />
                                                                    </button>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={content.primaryBtnText || ''}
                                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, primaryBtnText: e.target.value })}
                                                                    placeholder="Button Text"
                                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                                />
                                                            </div>
                                                            <div className="property-group" style={{ flex: 1, marginBottom: 0 }}>
                                                                <label>Primary Link</label>
                                                                <input
                                                                    type="text"
                                                                    value={content.primaryBtnLink || ''}
                                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, primaryBtnLink: e.target.value })}
                                                                    placeholder="/shop or https://..."
                                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Primary Button Label */}
                                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '8px', display: 'block' }}>Primary Button</label>

                                                        {/* Row 3: Use Theme Color Checkbox */}
                                                        <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, useThemePrimaryBtn: content.useThemePrimaryBtn === false ? true : false })} style={{ margin: '0 0 12px' }}>
                                                            <input type="checkbox" checked={content.useThemePrimaryBtn !== false} readOnly />
                                                            <span>Use theme color</span>
                                                        </div>

                                                        {/* Row 4: Background + Text Color */}
                                                        {content.useThemePrimaryBtn === false && (
                                                            <div className="property-row" style={{ display: 'flex', gap: '12px' }}>
                                                                <div className="property-group" style={{ flex: 1, marginBottom: 0 }}>
                                                                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Background</label>
                                                                    <DebouncedColorPicker
                                                                        className="compact"
                                                                        value={content.primaryBtnBgColor || '#2563eb'}
                                                                        onChange={(val) => updateSectionContent(selectedSectionId, { ...content, primaryBtnBgColor: val })}
                                                                    />
                                                                </div>
                                                                <div className="property-group" style={{ flex: 1, marginBottom: 0 }}>
                                                                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Text Color</label>
                                                                    <DebouncedColorPicker
                                                                        className="compact"
                                                                        value={content.primaryBtnTextColor || '#ffffff'}
                                                                        onChange={(val) => updateSectionContent(selectedSectionId, { ...content, primaryBtnTextColor: val })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Show Primary Button if hidden */}
                                                {content.showPrimaryBtn === false && (
                                                    <div style={{ marginBottom: '16px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateSectionContent(selectedSectionId, { ...content, showPrimaryBtn: true })}
                                                            style={{
                                                                width: '100%',
                                                                padding: '10px',
                                                                background: '#f8fafc',
                                                                border: '1px dashed #cbd5e1',
                                                                borderRadius: '8px',
                                                                color: '#64748b',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px'
                                                            }}
                                                        >
                                                            <FaEyeSlash /> Show Primary Button
                                                        </button>
                                                    </div>
                                                )}

                                                {/* SECONDARY BUTTON CONTAINER */}
                                                {content.showSecondaryBtn !== false && (
                                                    <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                        {/* Row 1: Button Text + Link */}
                                                        <div className="property-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                                            <div className="property-group" style={{ flex: 1, marginBottom: 0 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                    <label style={{ margin: 0, cursor: 'default' }}>Secondary Button</label>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateSectionContent(selectedSectionId, { ...content, showSecondaryBtn: false });
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: '0' }}
                                                                        title="Hide Button"
                                                                    >
                                                                        <FaEye />
                                                                    </button>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={content.secondaryBtnText || ''}
                                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, secondaryBtnText: e.target.value })}
                                                                    placeholder="Button Text"
                                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                                />
                                                            </div>
                                                            <div className="property-group" style={{ flex: 1, marginBottom: 0 }}>
                                                                <label>Secondary Link</label>
                                                                <input
                                                                    type="text"
                                                                    value={content.secondaryBtnLink || ''}
                                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, secondaryBtnLink: e.target.value })}
                                                                    placeholder="/shop or https://..."
                                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Secondary Button Label & Icon Clicker */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Secondary Button Icon</label>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateSectionContent(selectedSectionId, { ...content, showSecondaryBtnIcon: content.showSecondaryBtnIcon === false ? true : false });
                                                                    }}
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: content.showSecondaryBtnIcon === false ? '#94a3b8' : '#7c3aed', padding: '0', display: 'flex', alignItems: 'center' }}
                                                                    title={content.showSecondaryBtnIcon === false ? "Show Icon" : "Hide Icon"}
                                                                >
                                                                    {content.showSecondaryBtnIcon === false ? <FaEyeSlash /> : <FaEye />}
                                                                </button>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowSecondaryIconPicker(!showSecondaryIconPicker)}
                                                                style={{
                                                                    background: '#ffffff',
                                                                    border: '1px solid #e2e8f0',
                                                                    padding: '4px 12px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '11px',
                                                                    color: '#64748b',
                                                                    fontWeight: '600'
                                                                }}
                                                            >
                                                                {showSecondaryIconPicker ? 'Close' : 'Change'}
                                                            </button>
                                                        </div>

                                                        {showSecondaryIconPicker && (
                                                            <div className="icon-picker-grid animate-fade" style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: 'repeat(5, 1fr)',
                                                                gap: '8px',
                                                                background: '#ffffff',
                                                                padding: '12px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e2e8f0',
                                                                marginBottom: '16px'
                                                            }}>
                                                                {[
                                                                    { icon: FaPlay, value: 'play' },
                                                                    { icon: FaVideo, value: 'video' },
                                                                    { icon: FaDownload, value: 'download' },
                                                                    { icon: FaArrowAltCircleRight, value: 'arrow' },
                                                                    { icon: FaSearch, value: 'search' },
                                                                    { icon: FaBolt, value: 'bolt' },
                                                                    { icon: FaStar, value: 'star' },
                                                                    { icon: FaGlobe, value: 'globe' },
                                                                    { icon: FaEnvelope, value: 'envelope' }
                                                                ].map(({ icon: Icon, value }) => (
                                                                    <div
                                                                        key={value}
                                                                        onClick={() => {
                                                                            updateSectionContent(selectedSectionId, { ...content, secondaryBtnIcon: value });
                                                                            setShowSecondaryIconPicker(false);
                                                                        }}
                                                                        style={{
                                                                            padding: '10px',
                                                                            background: (content.secondaryBtnIcon || 'play') === value ? '#7c3aed' : '#f8fafc',
                                                                            color: (content.secondaryBtnIcon || 'play') === value ? 'white' : '#64748b',
                                                                            borderRadius: '8px',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontSize: '16px',
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                        className="icon-option"
                                                                    >
                                                                        <Icon />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Row 3: Use Theme Color Checkbox */}
                                                        <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, useThemeSecondaryBtn: content.useThemeSecondaryBtn === false ? true : false })} style={{ margin: '0 0 12px' }}>
                                                            <input type="checkbox" checked={content.useThemeSecondaryBtn !== false} readOnly />
                                                            <span>Use theme color</span>
                                                        </div>

                                                        {/* Row 4: Background + Text Color */}
                                                        {content.useThemeSecondaryBtn === false && (
                                                            <div className="property-row" style={{ display: 'flex', gap: '12px' }}>
                                                                <div className="property-group" style={{ flex: 1, marginBottom: 0 }}>
                                                                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Background</label>
                                                                    <DebouncedColorPicker
                                                                        className="compact"
                                                                        value={content.secondaryBtnBgColor || '#ffffff'}
                                                                        onChange={(val) => updateSectionContent(selectedSectionId, { ...content, secondaryBtnBgColor: val })}
                                                                    />
                                                                </div>
                                                                <div className="property-group" style={{ flex: 1, marginBottom: 0 }}>
                                                                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Text Color</label>
                                                                    <DebouncedColorPicker
                                                                        className="compact"
                                                                        value={content.secondaryBtnTextColor || '#0f172a'}
                                                                        onChange={(val) => updateSectionContent(selectedSectionId, { ...content, secondaryBtnTextColor: val })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Show Secondary Button if hidden */}
                                                {content.showSecondaryBtn === false && (
                                                    <div style={{ marginBottom: '16px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateSectionContent(selectedSectionId, { ...content, showSecondaryBtn: true })}
                                                            style={{
                                                                width: '100%',
                                                                padding: '10px',
                                                                background: '#f8fafc',
                                                                border: '1px dashed #cbd5e1',
                                                                borderRadius: '8px',
                                                                color: '#64748b',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px'
                                                            }}
                                                        >
                                                            <FaEyeSlash /> Show Secondary Button
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="property-group">
                                                    <label>Checklist Items (Max 4)</label>
                                                    {(content.checklistItems || []).map((item, idx) => (
                                                        <div key={idx} className="checklist-input-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                            <input
                                                                type="text"
                                                                value={item}
                                                                onChange={(e) => {
                                                                    const newItems = [...(content.checklistItems || [])];
                                                                    newItems[idx] = e.target.value;
                                                                    updateSectionContent(selectedSectionId, { ...content, checklistItems: newItems });
                                                                }}
                                                                placeholder={`Item ${idx + 1}`}
                                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                                            />
                                                            <button
                                                                className="remove-item-btn"
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const newItems = (content.checklistItems || []).filter((_, i) => i !== idx);
                                                                    updateSectionContent(selectedSectionId, { ...content, checklistItems: newItems });
                                                                }}
                                                                style={{ padding: '0 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {(content.checklistItems || []).length < 4 && (
                                                        <button
                                                            className="add-item-btn"
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const newItems = [...(content.checklistItems || []), "New Feature"];
                                                                updateSectionContent(selectedSectionId, { ...content, checklistItems: newItems });
                                                            }}
                                                            style={{ width: '100%', padding: '10px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: '#64748b', fontWeight: '600' }}
                                                        >
                                                            + Add Checklist Item
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="property-group">
                                                    <label>Visual Image</label>
                                                    <div
                                                        className={`hero-image-dropzone ${isHeroDragging ? 'dragging' : ''}`}
                                                        onDragOver={(e) => { e.preventDefault(); setIsHeroDragging(true); }}
                                                        onDragLeave={() => setIsHeroDragging(false)}
                                                        onDrop={async (e) => {
                                                            e.preventDefault();
                                                            setIsHeroDragging(false);
                                                            const file = e.dataTransfer.files[0];
                                                            if (file && file.type.startsWith('image/')) {
                                                                const formData = new FormData();
                                                                formData.append('image', file);
                                                                try {
                                                                    const res = await fetch('/api/upload', {
                                                                        method: 'POST',
                                                                        body: formData
                                                                    });
                                                                    const data = await res.json();
                                                                    if (data.url) {
                                                                        updateSectionContent(selectedSectionId, { ...content, imageUrl: data.url });
                                                                    }
                                                                } catch (err) {
                                                                    console.error("Upload failed", err);
                                                                }
                                                            }
                                                        }}
                                                        style={{
                                                            border: isHeroDragging ? '2px solid #7c3aed' : '2px dashed #e2e8f0',
                                                            borderRadius: '12px',
                                                            padding: '24px',
                                                            textAlign: 'center',
                                                            background: isHeroDragging ? 'rgba(124, 58, 237, 0.05)' : '#f8fafc',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onClick={() => document.getElementById('hero-file-input').click()}
                                                    >
                                                        <FaUpload style={{ display: 'block', margin: '0 auto 8px', color: '#94a3b8', fontSize: '24px' }} />
                                                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Drag image or <span>click to upload</span></p>
                                                        <input
                                                            id="hero-file-input"
                                                            type="file"
                                                            hidden
                                                            onChange={async (e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const formData = new FormData();
                                                                    formData.append('image', file);
                                                                    try {
                                                                        const res = await fetch('/api/upload', {
                                                                            method: 'POST',
                                                                            body: formData
                                                                        });
                                                                        const data = await res.json();
                                                                        if (data.url) {
                                                                            updateSectionContent(selectedSectionId, { ...content, imageUrl: data.url });
                                                                        }
                                                                    } catch (err) {
                                                                        console.error("Upload failed", err);
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ marginTop: '12px' }}>
                                                        <label style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <FaLink /> Or use Image URL
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={content.imageUrl || ''}
                                                            onChange={(e) => updateSectionContent(selectedSectionId, { ...content, imageUrl: e.target.value })}
                                                            placeholder="https://..."
                                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </>
                                );
                            })()}

                            <button className="clear-selection-btn" onClick={() => setSelectedSectionId(null)}>
                                Back to Page Settings
                            </button>
                        </div >
                    )
                    }
                </aside >
            </main>

            <SectionTemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onSelect={handleTemplateSelect}
            />

            <ProductSelectionModal
                isOpen={showProductModal}
                onClose={() => setShowProductModal(false)}
                initialSelection={(() => {
                    const s = sections.find(sec => sec.id === selectedSectionId);
                    if (!s) return [];
                    try {
                        const c = JSON.parse(s.content);
                        return c.selectedProductIds || [];
                    } catch (e) {
                        return [];
                    }
                })()}
                onSave={(ids) => {
                    if (selectedSectionId) {
                        const s = sections.find(sec => sec.id === selectedSectionId);
                        if (s) {
                            const c = JSON.parse(s.content);
                            updateSectionContent(selectedSectionId, { ...c, selectedProductIds: ids });
                        }
                    }
                }}
            />

            <NavbarEditorModal
                isOpen={isNavbarEditorOpen}
                onClose={() => setIsNavbarEditorOpen(false)}
                onSave={handleNavbarSave}
            />

            <FooterEditorModal
                isOpen={isFooterEditorOpen}
                onClose={() => setIsFooterEditorOpen(false)}
                onSave={handleFooterSave}
            />
        </div >
    );
};

export default PageBuilder;
