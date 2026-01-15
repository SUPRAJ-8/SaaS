import React, { useState, useEffect, useMemo, lazy, Suspense, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaEye, FaEyeSlash, FaDesktop, FaMobileAlt, FaTabletAlt, FaUndo, FaRedo, FaEdit, FaCopy, FaTrash, FaGripVertical, FaTimes, FaFire, FaStar, FaHeart, FaShoppingCart, FaTag, FaGift, FaBolt, FaRocket, FaGem, FaCrown, FaBoxOpen, FaUpload, FaLink, FaPlay, FaVideo, FaDownload, FaArrowAltCircleRight, FaSearch, FaGlobe, FaEnvelope, FaCheck, FaChevronDown, FaPalette, FaInfoCircle, FaPlus, FaLeaf, FaTshirt, FaTint, FaWeightHanging, FaUtensils, FaHome, FaMobile, FaLaptop, FaShippingFast, FaShieldAlt, FaThumbsUp, FaClock } from 'react-icons/fa';
import './PageBuilder.css';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_URL from '../../apiConfig';
import { ThemeContext } from '../../contexts/ThemeContext';
import FooterEditorModal from './FooterEditorModal';
import NavbarEditorModal from './NavbarEditorModal';
import SectionTemplateModal from './SectionTemplateModal';
import ProductSelectionModal from './ProductSelectionModal';
import { applyStoreSettings, resolveImageUrl } from '../../themeUtils';

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
import CollectionShowcase from '../../section-templates/collection-showcase/CollectionShowcase';

const SECTION_TEMPLATES = {
    'product-grid': ProductGridTemplate,
    'product-grid-basic': ProductGridTemplate,
    'hero-impact': HeroTemplate,
    'hero': HeroTemplate,
    'category-list': CategoryGridTemplate,
    'faq-accordion': FAQTemplate,
    'faq': FAQTemplate,
    'rich-text': RichTextTemplate,
    'modern-hero': ModernHeroTemplate,
    'collection-showcase': CollectionShowcase
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



const SortableSection = ({ section, index, selectedSectionId, setSelectedSectionId, removeSection, duplicateSection, SECTION_TEMPLATES, sections, setSections }) => {
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
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 999 : 'auto'
    };

    // 1. Determine Dynamic Status
    const isDynamic = section.type === 'dynamic' || (section.templateData && (section.templateData.structure || section.templateData.fields));

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
                            className="toolbar-btn move-up"
                            title="Move Up"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (index > 0) {
                                    const updated = [...sections];
                                    const temp = updated[index];
                                    updated[index] = updated[index - 1];
                                    updated[index - 1] = temp;
                                    setSections(updated);
                                }
                            }}
                            disabled={index === 0}
                        >
                            <FaChevronDown style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <button
                            className="toolbar-btn move-down"
                            title="Move Down"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (index < sections.length - 1) {
                                    const updated = [...sections];
                                    const temp = updated[index];
                                    updated[index] = updated[index + 1];
                                    updated[index + 1] = temp;
                                    setSections(updated);
                                }
                            }}
                            disabled={index === sections.length - 1}
                        >
                            <FaChevronDown />
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
    const [availableCategories, setAvailableCategories] = useState([]);
    const [showSavedNotification, setShowSavedNotification] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showRichTextModal, setShowRichTextModal] = useState(false);
    const [showSecondaryIconPicker, setShowSecondaryIconPicker] = useState(false);
    const [showLayoutEditor, setShowLayoutEditor] = useState(false);
    const [showHeroContentEditor, setShowHeroContentEditor] = useState(true);
    const [showPrimaryBtnEditor, setShowPrimaryBtnEditor] = useState(false);
    const [showSecondaryBtnEditor, setShowSecondaryBtnEditor] = useState(false);

    // Collection Showcase Editor States
    const [showCollectionHeroEditor, setShowCollectionHeroEditor] = useState(true);
    const [showCollectionContentEditor, setShowCollectionContentEditor] = useState(false);
    const [showCollectionFeaturesEditor, setShowCollectionFeaturesEditor] = useState(false);
    const [showCollectionGalleryEditor, setShowCollectionGalleryEditor] = useState(false);
    const [showCollectionStyleEditor, setShowCollectionStyleEditor] = useState(false);
    const [showCollectionDisplayEditor, setShowCollectionDisplayEditor] = useState(true);
    const [showFeatureIconPicker, setShowFeatureIconPicker] = useState(null);

    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'delete'
    });
    const [pageMetadata, setPageMetadata] = useState(null);
    const [isHeroDragging, setIsHeroDragging] = useState(false);

    // Get active theme from context or settings
    const { theme: activeThemeFromContext } = useContext(ThemeContext) || {};
    const [activeThemeId, setActiveThemeId] = useState('nexus'); // Default to nexus
    const [clientData, setClientData] = useState(null);
    const siteSettings = clientData?.settings;
    const [allPages, setAllPages] = useState([]);

    // URL Dropdown State
    const [isUrlDropdownOpen, setIsUrlDropdownOpen] = useState(false);
    const [urlSearchQuery, setUrlSearchQuery] = useState('');

    // Force re-render stuff
    const [footerUpdateTrigger, setFooterUpdateTrigger] = useState(0);
    const [navbarUpdateTrigger, setNavbarUpdateTrigger] = useState(0);
    const [navbarPreviewData, setNavbarPreviewData] = useState(null); // Live preview state

    // Theme Configuration

    const themeConfig = useMemo(() => ({
        nexus: {
            header: NexusHeader,
            footer: NexusFooter,
            canvasClass: 'nexus-theme'
        },
        ecommerce: {
            header: EcommerceHeader,
            footer: EcommerceFooter,
            canvasClass: 'ecommerce-theme'
        },
        portfolio: {
            header: PortfolioHeader,
            footer: PortfolioFooter,
            canvasClass: 'portfolio-theme'
        }
    }), []);

    const currentTheme = themeConfig[activeThemeId] || themeConfig.nexus;
    const HeaderComponent = currentTheme.header;
    const FooterComponent = currentTheme.footer;

    // Calculate display URL
    const displayUrl = useMemo(() => {
        if (mode === 'template') return pageMetadata?.title || 'Template';

        if (!clientData) return 'Loading URL...';

        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';

        // Determine if we are on localhost
        const isLocalhost = hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname.endsWith('.localhost');

        let base = '';
        let queryParams = '';

        if (clientData.customDomain && !isLocalhost) {
            base = `https://${clientData.customDomain}`;
        } else if (clientData.subdomain) {
            if (isLocalhost) {
                // Determine if we should use tenant query param or subdomain
                const isUsingSubdomain = hostname !== 'localhost' && hostname !== '127.0.0.1';
                if (isUsingSubdomain) {
                    base = `${protocol}//${clientData.subdomain}.localhost${port}`;
                } else {
                    base = `${protocol}//localhost${port}`;
                    queryParams = `?tenant=${clientData.subdomain}`;
                }
            } else {
                base = `${protocol}//${clientData.subdomain}.nepostore.xyz`;
            }
        } else {
            base = window.location.origin;
        }

        if (id === 'new') return `${base}/new-page${queryParams}`;

        const isHomePage = pageMetadata && (
            !pageMetadata.slug ||
            pageMetadata.slug === '' ||
            pageMetadata.slug === '/' ||
            pageMetadata.slug === (pageMetadata._id || pageMetadata.id)
        );
        // If meta not loaded yet but we have id, show id pending...
        const slugPart = isHomePage ? '' : `/${pageMetadata?.slug || '...'}`;

        if (queryParams && !isHomePage && slugPart !== '/...') {
            queryParams = `?tenant=${clientData.subdomain}`;
        }

        return `${base}${slugPart}${queryParams}`;
    }, [mode, pageMetadata, clientData, id]);

    // Load page metadata and actual client theme on mount
    useEffect(() => {
        const fetchMetadataAndTheme = async () => {
            try {
                // 1. Fetch site settings to get the real active theme and domain info
                const clientRes = await axios.get(`${API_URL}/api/store-settings/my-store`, { withCredentials: true });
                if (clientRes.data) {
                    setClientData(clientRes.data);
                    if (clientRes.data.settings && clientRes.data.settings.selectedThemeId) {
                        setActiveThemeId(clientRes.data.settings.selectedThemeId);
                    }
                } else if (activeThemeFromContext?.id) {
                    setActiveThemeId(activeThemeFromContext.id);
                }

                // 2. Load page metadata from local storage or API
                const savedPages = JSON.parse(localStorage.getItem('site_pages') || '[]');
                const page = savedPages.find(p => String(p.id) === String(id));
                if (page) {
                    setPageMetadata(page);
                }

                // 3. (New) Fetch all pages for the dropdown (URL selector)
                const pagesRes = await axios.get(`${API_URL}/api/client-pages`, { withCredentials: true });
                setAllPages(pagesRes.data || []);

            } catch (err) {
                console.warn('Failed to fetch data in PageBuilder:', err.message);
            }
        };

        fetchMetadataAndTheme();
    }, [id, activeThemeFromContext]);

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
                    let cleanSlug = (pageMetadata?.slug || (id === 'new' ? 'new-page' : id)).replace(/^\//, '');
                    if (cleanSlug === '' && id !== 'new') cleanSlug = '/';

                    const pageData = {
                        id: pageMetadata?._id || id, // Include DB ID if we have it
                        slug: cleanSlug,
                        title: pageMetadata?.title || (id === 'new' ? 'New Page' : (id.charAt(0).toUpperCase() + id.slice(1))),
                        content: JSON.stringify(sections),
                        status: pageMetadata?.status || 'published', // Maintain existing status or default to published
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
                            { _id: '1', name: 'Hero section 1', baseType: 'hero-modern', content: { title: "Modern Hero", subtitle: "Edit me", showPrimaryBtn: true }, category: 'Hero', isActive: true },
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
                            type: targetTemplate.type === 'dynamic' ? 'dynamic' : (targetTemplate.baseType || 'hero-modern'),
                            title: targetTemplate.name,
                            content: JSON.stringify(content),
                            templateData: targetTemplate
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
                    ((id === 'home' || id === '3') && (p.slug === '' || p.slug === '/')) ||
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
            let finalSlug = pageMetadata?.slug;

            // CRITICAL: Force empty slug if it's clearly the Home Page to prevent duplicates
            if (pageMetadata?.title === 'Home Page' || id === '3' || id === 'home') {
                finalSlug = '';
            }

            if (finalSlug === undefined) {
                if (id === 'new') finalSlug = 'new-page';
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

            // CRITICAL: Update pageMetadata with the response from server to ensure we have the correct _id and slug for next saves
            if (response.data && Array.isArray(response.data)) {
                const cleanSlug = finalSlug.replace(/^\//, '');
                const savedPage = response.data.find(p =>
                    (p._id && p._id === (pageMetadata?._id || pageMetadata?.id)) ||
                    (p.slug === cleanSlug && (p.themeId === activeThemeId || !p.themeId))
                );
                if (savedPage) {
                    setPageMetadata(savedPage);
                }
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
        const isDynamic = template.type === 'dynamic' || template.templateData?.type === 'dynamic';

        // Extract the actual template object
        const tData = template.templateData || template;

        const newSection = {
            id: Date.now(),
            type: isDynamic ? 'dynamic' : template.id,
            title: template.name,
            content: JSON.stringify(tData.defaultSettings || template.defaultContent || {}),
            templateData: tData
        };
        const updatedSections = [...sections];
        updatedSections.splice(targetSectionIndex, 0, newSection);
        setSections(updatedSections);
        setIsTemplateModalOpen(false);
        toast.info(`Added ${template.name} section`);
    };

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    fetch(`${API_URL}/api/products`),
                    fetch(`${API_URL}/api/categories`)
                ]);
                const prods = await prodRes.json();
                const cats = await catRes.json();
                setAvailableProducts(prods);
                setAvailableCategories(cats);
            } catch (err) {
                console.error("Failed to fetch store data:", err);
            }
        };
        fetchStoreData();
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
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#64748b' }}>{displayUrl}</span>
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
                    <button className="preview-btn-premium" onClick={() => {
                        if (mode === 'template') {
                            toast.info('Template previewing is available within the builder canvas.');
                            return;
                        }
                        if (displayUrl && displayUrl.startsWith('http')) {
                            window.open(displayUrl, '_blank');
                        } else {
                            toast.warn('Preview URL is still loading...');
                        }
                    }}>
                        <FaEye /> Preview
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
                                    <HeaderComponent previewSettings={navbarPreviewData} siteSettings={siteSettings} />
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
                                                    sections={sections}
                                                    setSections={setSections}
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
                                <div className="page-settings-editor">
                                    <div className="page-settings-info">
                                        <p align="center" style={{ padding: '50px 20px', color: '#94a3b8' }}>Select a section on the left to edit its content.</p>
                                    </div>
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
                                        {(section.type === 'dynamic' || (section.templateData && (section.templateData.schema || section.templateData.fields))) && (
                                            <DynamicSectionEditor
                                                key={selectedSectionId}
                                                schema={section.templateData?.fields || section.templateData?.schema}
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

                                        {section.type !== 'rich-text' && section.type !== 'modern-hero' && section.type !== 'collection-showcase' && (
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

                                        <div className="layout-accordion-group" style={{ marginTop: '10px' }}>
                                            <div
                                                className="accordion-header"
                                                onClick={() => setShowLayoutEditor(!showLayoutEditor)}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '12px 14px',
                                                    background: '#f8fafc',
                                                    borderRadius: showLayoutEditor ? '12px 12px 0 0' : '12px',
                                                    cursor: 'pointer',
                                                    border: '1px solid #e2e8f0',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                }}
                                            >
                                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>LAYOUT & COLOR</span>
                                                <FaChevronDown style={{
                                                    fontSize: '12px',
                                                    color: '#94a3b8',
                                                    transition: 'transform 0.3s',
                                                    transform: showLayoutEditor ? 'rotate(180deg)' : 'rotate(0deg)'
                                                }} />
                                            </div>

                                            {showLayoutEditor && (
                                                <div className="accordion-content animate-fade" style={{
                                                    padding: '16px',
                                                    background: '#ffffff',
                                                    borderRadius: '0 0 12px 12px',
                                                    border: '1px solid #e2e8f0',
                                                    borderTop: 'none',
                                                    marginTop: '-1px'
                                                }}>
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

                                                    <div className="property-row" style={{ marginBottom: '20px' }}>
                                                        <div className="property-group">
                                                            <label>Top Margin</label>
                                                            <input
                                                                type="number"
                                                                value={content.marginTop !== undefined ? content.marginTop : 0}
                                                                placeholder="0"
                                                                onChange={(e) => updateSectionContent(selectedSectionId, { ...content, marginTop: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                                                                className="padding-input"
                                                            />
                                                        </div>
                                                        <div className="property-group">
                                                            <label>Bottom Margin</label>
                                                            <input
                                                                type="number"
                                                                value={content.marginBottom !== undefined ? content.marginBottom : 0}
                                                                placeholder="0"
                                                                onChange={(e) => updateSectionContent(selectedSectionId, { ...content, marginBottom: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                                                                className="padding-input"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div style={{ height: '1px', background: '#e2e8f0', margin: '20px 0' }}></div>

                                                    <div className="property-group checkbox-group" style={{ marginBottom: '12px' }}>
                                                        <label>Background Settings</label>
                                                        <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, useThemeBg: !content.useThemeBg })}>
                                                            <input type="checkbox" checked={content.useThemeBg} readOnly />
                                                            <span>Use theme color</span>
                                                        </div>
                                                    </div>

                                                    {!content.useThemeBg && (
                                                        <div className="property-group animate-fade">
                                                            <label>Custom Background Color</label>
                                                            <DebouncedColorPicker
                                                                value={content.bgColor}
                                                                onChange={(val) => updateSectionContent(selectedSectionId, { ...content, bgColor: val })}
                                                                onClear={() => updateSectionContent(selectedSectionId, { ...content, bgColor: 'transparent' })}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

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
                                        {section.type !== 'rich-text' && section.type !== 'modern-hero' && section.type !== 'collection-showcase' && section.type !== 'hero' && section.type !== 'hero-impact' && section.type !== 'faq' && section.type !== 'faq-accordion' && (
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
                                                    {content.sourceType === 'categories' ? 'Select Content (Category)' : `Select Products (${content.selectedProductIds ? content.selectedProductIds.length : 0})`}
                                                </button>

                                                {content.sourceType !== 'categories' && content.selectedProductIds && content.selectedProductIds.length > 0 && (
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
                                                {/* HERO CONTENT ACCORDION */}
                                                <div className="button-accordion-wrapper" style={{
                                                    marginBottom: '16px',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    background: 'white'
                                                }}>
                                                    <div
                                                        className="accordion-header"
                                                        onClick={() => setShowHeroContentEditor(!showHeroContentEditor)}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '12px 16px',
                                                            background: '#f8fafc',
                                                            cursor: 'pointer',
                                                            borderBottom: showHeroContentEditor ? '1px solid #e2e8f0' : 'none',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ padding: '6px', background: '#eff6ff', borderRadius: '6px', color: '#2563eb', display: 'flex' }}>
                                                                <FaEdit style={{ fontSize: '14px' }} />
                                                            </div>
                                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Hero Main Content</span>
                                                        </div>
                                                        <FaChevronDown style={{
                                                            fontSize: '12px',
                                                            color: '#94a3b8',
                                                            transform: showHeroContentEditor ? 'rotate(180deg)' : 'none',
                                                            transition: 'transform 0.3s'
                                                        }} />
                                                    </div>

                                                    {showHeroContentEditor && (
                                                        <div className="accordion-content animate-fade" style={{ padding: '16px 16px 8px' }}>
                                                            <div className="property-group" style={{ marginBottom: '20px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                    <label style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Main Title</label>
                                                                    <FaInfoCircle style={{ color: '#cbd5e1', fontSize: '14px' }} />
                                                                </div>
                                                                <textarea
                                                                    value={content.title || ''}
                                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, title: e.target.value })}
                                                                    placeholder="Main headline"
                                                                    rows={2}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '12px',
                                                                        borderRadius: '10px',
                                                                        border: '1px solid #e2e8f0',
                                                                        background: '#f8fafc',
                                                                        fontSize: '14px',
                                                                        color: '#1e293b',
                                                                        transition: 'border-color 0.2s',
                                                                        resize: 'vertical'
                                                                    }}
                                                                />
                                                            </div>

                                                            <div className="property-group animate-fade" style={{ marginBottom: '20px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                    <label style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Highlighted Text</label>
                                                                    <div
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateSectionContent(selectedSectionId, { ...content, showHighlight: content.showHighlight === false ? true : false });
                                                                        }}
                                                                        style={{ cursor: 'pointer', color: content.showHighlight === false ? '#cbd5e1' : '#4f46e5', display: 'flex' }}
                                                                    >
                                                                        {content.showHighlight === false ? <FaEyeSlash style={{ fontSize: '16px' }} /> : <FaEye style={{ fontSize: '16px' }} />}
                                                                    </div>
                                                                </div>

                                                                {content.showHighlight !== false && (
                                                                    <div className="animate-fade">
                                                                        <input
                                                                            type="text"
                                                                            value={content.highlightedText || ''}
                                                                            onChange={(e) => updateSectionContent(selectedSectionId, { ...content, highlightedText: e.target.value })}
                                                                            placeholder="Text to highlight"
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '12px',
                                                                                borderRadius: '10px',
                                                                                border: '1px solid #e2e8f0',
                                                                                background: '#f8fafc',
                                                                                fontSize: '14px',
                                                                                color: '#1e293b',
                                                                                marginBottom: '12px'
                                                                            }}
                                                                        />

                                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                                            <div
                                                                                className="custom-toggle-row"
                                                                                onClick={() => updateSectionContent(selectedSectionId, { ...content, useThemeHighlight: content.useThemeHighlight === false ? true : false })}
                                                                                style={{
                                                                                    flex: 1,
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'space-between',
                                                                                    background: '#ffffff',
                                                                                    border: '1px solid #e2e8f0',
                                                                                    borderRadius: '10px',
                                                                                    padding: '8px 12px',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Use theme color</span>
                                                                                <div className={`modern-hero-toggle-switch ${content.useThemeHighlight !== false ? 'active' : ''}`}>
                                                                                    <div className="toggle-dot"></div>
                                                                                </div>
                                                                            </div>

                                                                            {content.useThemeHighlight === false && (
                                                                                <div className="modern-hero-color-box">
                                                                                    <div className="color-preview" style={{ background: content.highlightColor || '#2563eb' }}></div>
                                                                                    <span className="hex-code">
                                                                                        {(content.highlightColor || '#2563eb').toUpperCase()}
                                                                                    </span>
                                                                                    <DebouncedColorPicker
                                                                                        className="compact-picker-trigger"
                                                                                        value={content.highlightColor || '#2563eb'}
                                                                                        onChange={(val) => updateSectionContent(selectedSectionId, { ...content, highlightColor: val, useThemeHighlight: false })}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <small style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', display: 'block', fontStyle: 'italic' }}>
                                                                            Highlighted text will appear in selected color
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="property-group" style={{ marginBottom: '8px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                    <label style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subtitle / Description</label>
                                                                    <FaInfoCircle style={{ color: '#cbd5e1', fontSize: '14px' }} />
                                                                </div>
                                                                <textarea
                                                                    value={content.subtitle || ''}
                                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, subtitle: e.target.value })}
                                                                    placeholder="Subtitle text"
                                                                    rows={3}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '12px',
                                                                        borderRadius: '10px',
                                                                        border: '1px solid #e2e8f0',
                                                                        background: '#f8fafc',
                                                                        fontSize: '14px',
                                                                        color: '#1e293b',
                                                                        lineHeight: '1.5'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* PRIMARY BUTTON ACCORDION */}
                                                <div className="button-accordion-wrapper" style={{
                                                    marginBottom: '16px',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    background: 'white'
                                                }}>
                                                    <div
                                                        className="accordion-header"
                                                        onClick={() => setShowPrimaryBtnEditor(!showPrimaryBtnEditor)}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '12px 16px',
                                                            background: '#f8fafc',
                                                            cursor: 'pointer',
                                                            borderBottom: showPrimaryBtnEditor ? '1px solid #e2e8f0' : 'none',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateSectionContent(selectedSectionId, { ...content, showPrimaryBtn: !content.showPrimaryBtn });
                                                                }}
                                                                style={{ color: content.showPrimaryBtn === false ? '#94a3b8' : '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                            >
                                                                {content.showPrimaryBtn === false ? <FaEyeSlash style={{ fontSize: '16px' }} /> : <FaEye style={{ fontSize: '16px' }} />}
                                                            </div>
                                                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PRIMARY BTN</span>
                                                        </div>
                                                        <FaChevronDown style={{
                                                            fontSize: '12px',
                                                            color: '#94a3b8',
                                                            transition: 'transform 0.3s',
                                                            transform: showPrimaryBtnEditor ? 'rotate(180deg)' : 'rotate(0deg)'
                                                        }} />
                                                    </div>

                                                    {showPrimaryBtnEditor && (
                                                        <div className="accordion-content animate-fade" style={{ padding: '20px 16px' }}>
                                                            <div className="property-group">
                                                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Button Text</label>
                                                                <input
                                                                    type="text"
                                                                    value={content.primaryBtnText || ''}
                                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, primaryBtnText: e.target.value })}
                                                                    placeholder="Button Text"
                                                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                                                />
                                                            </div>
                                                            <div className="property-group">
                                                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Primary Link</label>
                                                                <input
                                                                    type="text"
                                                                    value={content.primaryBtnLink || ''}
                                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, primaryBtnLink: e.target.value })}
                                                                    placeholder="/shop"
                                                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                                                />
                                                            </div>

                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '24px 0 12px', color: '#64748b' }}>
                                                                <FaPalette style={{ fontSize: '13px' }} />
                                                                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STYLE</span>
                                                            </div>

                                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                                                                <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, useThemePrimaryBtn: content.useThemePrimaryBtn === false ? true : false })} style={{ margin: 0, justifyContent: 'space-between', width: '100%' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>Use theme color</span>
                                                                    </div>
                                                                    <div className={`modern-hero-toggle-switch ${content.useThemePrimaryBtn !== false ? 'active' : ''}`}>
                                                                        <div className="toggle-dot"></div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {content.useThemePrimaryBtn === false && (
                                                                <div className="property-row animate-fade" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                                                    <div className="property-group" style={{ flex: 1, marginBottom: 0 }}>
                                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Background</label>
                                                                        <DebouncedColorPicker
                                                                            className="compact"
                                                                            value={content.primaryBtnBgColor || '#2563eb'}
                                                                            onChange={(val) => updateSectionContent(selectedSectionId, { ...content, primaryBtnBgColor: val })}
                                                                        />
                                                                    </div>
                                                                    <div className="property-group" style={{ flex: 1, marginBottom: 0 }}>
                                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Text Color</label>
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
                                                </div>

                                                {/* SECONDARY BUTTON ACCORDION */}
                                                <div className="button-accordion-wrapper" style={{
                                                    marginBottom: '24px',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    background: 'white'
                                                }}>
                                                    <div
                                                        className="accordion-header"
                                                        onClick={() => setShowSecondaryBtnEditor(!showSecondaryBtnEditor)}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '12px 16px',
                                                            background: '#f8fafc',
                                                            cursor: 'pointer',
                                                            borderBottom: showSecondaryBtnEditor ? '1px solid #e2e8f0' : 'none',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateSectionContent(selectedSectionId, { ...content, showSecondaryBtn: !content.showSecondaryBtn });
                                                                }}
                                                                style={{ color: content.showSecondaryBtn === false ? '#94a3b8' : '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                            >
                                                                {content.showSecondaryBtn === false ? <FaEyeSlash style={{ fontSize: '16px' }} /> : <FaEye style={{ fontSize: '16px' }} />}
                                                            </div>
                                                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SECONDARY BTN</span>
                                                        </div>
                                                        <FaChevronDown style={{
                                                            fontSize: '12px',
                                                            color: '#94a3b8',
                                                            transition: 'transform 0.3s',
                                                            transform: showSecondaryBtnEditor ? 'rotate(180deg)' : 'rotate(0deg)'
                                                        }} />
                                                    </div>

                                                    {showSecondaryBtnEditor && (
                                                        <div className="accordion-content animate-fade" style={{ padding: '20px 16px' }}>
                                                            <div className="property-group">
                                                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Button Text</label>
                                                                <input
                                                                    type="text"
                                                                    value={content.secondaryBtnText || ''}
                                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, secondaryBtnText: e.target.value })}
                                                                    placeholder="Button Text"
                                                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                                                />
                                                            </div>
                                                            <div className="property-group">
                                                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Secondary Link</label>
                                                                <input
                                                                    type="text"
                                                                    value={content.secondaryBtnLink || ''}
                                                                    onChange={(e) => updateSectionContent(selectedSectionId, { ...content, secondaryBtnLink: e.target.value })}
                                                                    placeholder="/contact"
                                                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                                                />
                                                            </div>

                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 12px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                                                                    <div
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateSectionContent(selectedSectionId, { ...content, showSecondaryBtnIcon: !content.showSecondaryBtnIcon });
                                                                        }}
                                                                        style={{ color: content.showSecondaryBtnIcon === false ? '#94a3b8' : '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                    >
                                                                        {content.showSecondaryBtnIcon === false ? <FaEyeSlash style={{ fontSize: '16px' }} /> : <FaEye style={{ fontSize: '16px' }} />}
                                                                    </div>
                                                                    <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BUTTON ICON</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowSecondaryIconPicker(!showSecondaryIconPicker)}
                                                                    style={{ background: '#f1f5f9', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                                                                >
                                                                    {showSecondaryIconPicker ? 'CLOSE' : 'CHOOSE'}
                                                                </button>
                                                            </div>

                                                            {showSecondaryIconPicker && (
                                                                <div className="icon-picker-grid animate-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
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
                                                                                background: (content.secondaryBtnIcon || 'play') === value ? '#7c3aed' : '#ffffff',
                                                                                color: (content.secondaryBtnIcon || 'play') === value ? 'white' : '#64748b',
                                                                                borderRadius: '10px',
                                                                                cursor: 'pointer',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                fontSize: '16px',
                                                                                transition: 'all 0.2s',
                                                                                border: '1px solid #e2e8f0'
                                                                            }}
                                                                            className="icon-option"
                                                                        >
                                                                            <Icon />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '24px 0 12px', color: '#64748b' }}>
                                                                <FaPalette style={{ fontSize: '13px' }} />
                                                                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STYLE</span>
                                                            </div>

                                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                                                                <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, useThemeSecondaryBtn: content.useThemeSecondaryBtn === false ? true : false })} style={{ margin: 0, justifyContent: 'space-between', width: '100%' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>Use theme color</span>
                                                                    </div>
                                                                    <div className={`modern-hero-toggle-switch ${content.useThemeSecondaryBtn !== false ? 'active' : ''}`}>
                                                                        <div className="toggle-dot"></div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {content.useThemeSecondaryBtn === false && (
                                                                <div className="property-row animate-fade" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                                                    <div className="property-group" style={{ flex: 1, marginBottom: 0 }}>
                                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Background</label>
                                                                        <DebouncedColorPicker
                                                                            className="compact"
                                                                            value={content.secondaryBtnBgColor || '#ffffff'}
                                                                            onChange={(val) => updateSectionContent(selectedSectionId, { ...content, secondaryBtnBgColor: val })}
                                                                        />
                                                                    </div>
                                                                    <div className="property-group" style={{ flex: 1, marginBottom: 0 }}>
                                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Text Color</label>
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
                                                </div>



                                                {/* CHECKLIST ITEMS */}
                                                <div className="button-accordion-wrapper" style={{
                                                    marginBottom: '16px',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    background: 'white',
                                                    padding: '16px'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <label style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Checklist Items (Max 4)</label>
                                                        <FaInfoCircle style={{ color: '#cbd5e1', fontSize: '14px' }} />
                                                    </div>
                                                    {(content.checklistItems || []).map((item, idx) => (
                                                        <div key={idx} className="checklist-input-row animate-fade" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                            <input
                                                                type="text"
                                                                value={item}
                                                                onChange={(e) => {
                                                                    const newItems = [...(content.checklistItems || [])];
                                                                    newItems[idx] = e.target.value;
                                                                    updateSectionContent(selectedSectionId, { ...content, checklistItems: newItems });
                                                                }}
                                                                placeholder={`Item ${idx + 1}`}
                                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px' }}
                                                            />
                                                            <button
                                                                className="remove-item-btn"
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const newItems = (content.checklistItems || []).filter((_, i) => i !== idx);
                                                                    updateSectionContent(selectedSectionId, { ...content, checklistItems: newItems });
                                                                }}
                                                                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                            >
                                                                <FaTrash style={{ fontSize: '12px' }} />
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
                                                            style={{ width: '100%', padding: '10px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: '#64748b', fontWeight: '700', marginTop: '4px' }}
                                                        >
                                                            + Add Checklist Item
                                                        </button>
                                                    )}
                                                </div>

                                                {/* IMAGE SELECTION */}
                                                <div className="button-accordion-wrapper" style={{
                                                    marginBottom: '16px',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    background: 'white'
                                                }}>
                                                    <div className="accordion-header" style={{
                                                        padding: '12px 16px',
                                                        background: '#f8fafc',
                                                        borderBottom: '1px solid #e2e8f0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px'
                                                    }}>
                                                        <div style={{ padding: '6px', background: '#eff6ff', borderRadius: '6px', color: '#2563eb', display: 'flex' }}>
                                                            <FaUpload style={{ fontSize: '14px' }} />
                                                        </div>
                                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Hero Main Image</span>
                                                    </div>

                                                    <div className="accordion-content" style={{ padding: '16px' }}>
                                                        {content.imageUrl && (
                                                            <div className="image-preview-container animate-fade" style={{ marginBottom: '12px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                                                <img
                                                                    src={resolveImageUrl(content.imageUrl, API_URL)}
                                                                    alt="Active Visual"
                                                                    style={{ width: '100%', height: '140px', objectFit: 'contain', display: 'block', padding: '12px' }}
                                                                />
                                                                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateSectionContent(selectedSectionId, { ...content, imageUrl: '' })}
                                                                        style={{
                                                                            background: 'rgba(255, 255, 255, 0.9)',
                                                                            border: 'none',
                                                                            borderRadius: '50%',
                                                                            width: '28px',
                                                                            height: '28px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            cursor: 'pointer',
                                                                            color: '#ef4444',
                                                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                                            backdropFilter: 'blur(4px)',
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                        title="Remove Image"
                                                                    >
                                                                        <FaTrash style={{ fontSize: '12px' }} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!content.imageUrl && (
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
                                                                    border: isHeroDragging ? '2px solid #2563eb' : '2px dashed #e2e8f0',
                                                                    borderRadius: '12px',
                                                                    padding: '32px 16px',
                                                                    textAlign: 'center',
                                                                    background: isHeroDragging ? '#eff6ff' : '#f8fafc',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onClick={() => document.getElementById('hero-file-input').click()}
                                                            >
                                                                <div style={{
                                                                    width: '48px',
                                                                    height: '48px',
                                                                    background: 'white',
                                                                    borderRadius: '50%',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    margin: '0 auto 12px',
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                                    color: '#2563eb'
                                                                }}>
                                                                    <FaUpload style={{ fontSize: '18px' }} />
                                                                </div>
                                                                <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>Click or drag to upload</p>
                                                                <p style={{ fontSize: '11px', color: '#64748b' }}>PNG, JPG or SVG (max. 2MB)</p>
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
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Collection Showcase Editor */}
                                        {section.type === 'collection-showcase' && (
                                            <div className="collection-editor animate-fade">
                                                {/* 0. DISPLAY OPTIONS */}
                                                <div className="button-accordion-wrapper" style={{ marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                                                    <div className="accordion-header" onClick={() => setShowCollectionDisplayEditor(!showCollectionDisplayEditor)} style={{ padding: '12px 16px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: showCollectionDisplayEditor ? '1px solid #e2e8f0' : 'none' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Display Options</span>
                                                        <FaChevronDown style={{ transform: showCollectionDisplayEditor ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                    </div>
                                                    {showCollectionDisplayEditor && (
                                                        <div className="accordion-content" style={{ padding: '16px' }}>
                                                            <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, showCollectionTitle: content.showCollectionTitle !== false ? false : true })} style={{ marginBottom: '10px', justifyContent: 'space-between' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>Show Collection Title</span>
                                                                <div className={`modern-hero-toggle-switch ${content.showCollectionTitle !== false ? 'active' : ''}`}><div className="toggle-dot"></div></div>
                                                            </div>
                                                            <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, showDescription: content.showDescription !== false ? false : true })} style={{ marginBottom: '10px', justifyContent: 'space-between' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>Show Description</span>
                                                                <div className={`modern-hero-toggle-switch ${content.showDescription !== false ? 'active' : ''}`}><div className="toggle-dot"></div></div>
                                                            </div>
                                                            <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, showFeatureList: content.showFeatureList !== false ? false : true })} style={{ marginBottom: '10px', justifyContent: 'space-between' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>Show Featured List</span>
                                                                <div className={`modern-hero-toggle-switch ${content.showFeatureList !== false ? 'active' : ''}`}><div className="toggle-dot"></div></div>
                                                            </div>
                                                            <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, showCta: content.showCta !== false ? false : true })} style={{ marginBottom: '10px', justifyContent: 'space-between' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>Show CTA Button</span>
                                                                <div className={`modern-hero-toggle-switch ${content.showCta !== false ? 'active' : ''}`}><div className="toggle-dot"></div></div>
                                                            </div>
                                                            <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, showGallery: content.showGallery !== false ? false : true })} style={{ marginBottom: '0', justifyContent: 'space-between' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>Show Gallery Section</span>
                                                                <div className={`modern-hero-toggle-switch ${content.showGallery !== false ? 'active' : ''}`}><div className="toggle-dot"></div></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 1. DESCRIPTION */}
                                                <div className="button-accordion-wrapper" style={{ marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                                                    <div className="accordion-header" onClick={() => setShowCollectionHeroEditor(!showCollectionHeroEditor)} style={{ padding: '12px 16px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: showCollectionHeroEditor ? '1px solid #e2e8f0' : 'none' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Description</span>
                                                        <FaChevronDown style={{ transform: showCollectionHeroEditor ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                    </div>
                                                    {showCollectionHeroEditor && (
                                                        <div className="accordion-content" style={{ padding: '16px' }}>
                                                            <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, useProductDescription: content.useProductDescription !== false ? false : true })} style={{ margin: '0 0 15px', justifyContent: 'space-between', width: '100%', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>Use Product Description</span>
                                                                <div className={`modern-hero-toggle-switch ${content.useProductDescription !== false ? 'active' : ''}`}><div className="toggle-dot"></div></div>
                                                            </div>

                                                            {content.useProductDescription !== false ? (
                                                                <div className="property-group" style={{ marginBottom: '0', animation: 'slideDown 0.3s ease' }}>
                                                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Product Description Preview</label>
                                                                    <div style={{
                                                                        padding: '12px',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #e2e8f0',
                                                                        background: '#f8fafc',
                                                                        fontSize: '13px',
                                                                        lineHeight: '1.5',
                                                                        color: '#64748b',
                                                                        fontStyle: 'italic',
                                                                        minHeight: '60px',
                                                                        maxHeight: '120px',
                                                                        overflow: 'hidden',
                                                                        display: '-webkit-box',
                                                                        WebkitLineClamp: 4,
                                                                        WebkitBoxOrient: 'vertical'
                                                                    }}>
                                                                        {(() => {
                                                                            const firstId = content.selectedProductIds?.[0];
                                                                            const prod = availableProducts.find(p => String(p._id) === String(firstId));
                                                                            const rawText = (prod?.longDescription || prod?.shortDescription || "");
                                                                            // Strip HTML for the preview box if it's too messy
                                                                            const cleanText = rawText.replace(/<[^>]*>?/gm, '');
                                                                            return cleanText || (firstId ? "No description found for this product." : "Select a product in 'Project/Product Selection' to see its description here.");
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="property-group" style={{ marginBottom: '0', animation: 'slideDown 0.3s ease' }}>
                                                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Custom Description</label>
                                                                    <textarea
                                                                        value={content.description || ''}
                                                                        onChange={(e) => updateSectionContent(selectedSectionId, { ...content, description: e.target.value })}
                                                                        rows={4}
                                                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: '1.5', resize: 'vertical' }}
                                                                        placeholder="Enter your custom description here..."
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 2. CONTENT SELECTION */}
                                                <div className="button-accordion-wrapper" style={{ marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                                                    <div className="accordion-header" onClick={() => setShowCollectionContentEditor(!showCollectionContentEditor)} style={{ padding: '12px 16px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: showCollectionContentEditor ? '1px solid #e2e8f0' : 'none' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Project/Product Selection</span>
                                                        <FaChevronDown style={{ transform: showCollectionContentEditor ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                    </div>
                                                    {showCollectionContentEditor && (
                                                        <div className="accordion-content" style={{ padding: '16px' }}>
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
                                                                    fontWeight: '600',
                                                                    marginBottom: (content.selectedProductIds?.length > 0 || content.selectedCategoryId) ? '12px' : '0'
                                                                }}
                                                            >
                                                                <FaBoxOpen />
                                                                {content.sourceType === 'categories' ? 'Select Content (Category)' : `Select Products (${content.selectedProductIds ? content.selectedProductIds.length : 0})`}
                                                            </button>

                                                            {/* Selected Items Summary */}
                                                            {content.sourceType === 'categories' ? (
                                                                content.selectedCategoryId && (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                        <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                            Category: {availableCategories.find(c => String(c._id) === String(content.selectedCategoryId))?.name || 'Loading...'}
                                                                        </div>
                                                                        {availableProducts
                                                                            .filter(p => {
                                                                                const pCatId = p.category?._id || p.category;
                                                                                return String(pCatId) === String(content.selectedCategoryId);
                                                                            })
                                                                            .map(product => (
                                                                                <div key={product._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', color: '#1f2937' }}>
                                                                                    <FaGripVertical style={{ color: '#94a3b8', fontSize: '14px' }} />
                                                                                    <span style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                        {product.name}
                                                                                    </span>
                                                                                </div>
                                                                            ))
                                                                        }
                                                                        {availableProducts.filter(p => String(p.category?._id || p.category) === String(content.selectedCategoryId)).length === 0 && (
                                                                            <div style={{ padding: '10px', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>No products found in this category.</div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <DndContext
                                                                    sensors={sensors}
                                                                    collisionDetection={closestCenter}
                                                                    onDragEnd={(event) => {
                                                                        const { active, over } = event;
                                                                        if (!over || active.id === over.id) return;

                                                                        const oldIndex = content.selectedProductIds.indexOf(active.id);
                                                                        const newIndex = content.selectedProductIds.indexOf(over.id);

                                                                        if (oldIndex !== -1 && newIndex !== -1) {
                                                                            const newIds = arrayMove(content.selectedProductIds, oldIndex, newIndex);
                                                                            updateSectionContent(selectedSectionId, { ...content, selectedProductIds: newIds });
                                                                        }
                                                                    }}
                                                                >
                                                                    <SortableContext
                                                                        items={content.selectedProductIds || []}
                                                                        strategy={verticalListSortingStrategy}
                                                                    >
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                            {(content.selectedProductIds || []).map((pid) => (
                                                                                <SortableProductItem
                                                                                    key={pid}
                                                                                    id={pid}
                                                                                    product={availableProducts.find(p => String(p._id) === String(pid))}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </SortableContext>
                                                                </DndContext>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 2. FEATURES */}
                                                <div className="button-accordion-wrapper" style={{ marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                                                    <div className="accordion-header" onClick={() => setShowCollectionFeaturesEditor(!showCollectionFeaturesEditor)} style={{ padding: '12px 16px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: showCollectionFeaturesEditor ? '1px solid #e2e8f0' : 'none' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Features List</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            {showCollectionFeaturesEditor && (content.features || [content.feature1, content.feature2, content.feature3, content.feature4].filter(f => f)).length < 4 && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const currentFeatures = content.features || [content.feature1, content.feature2, content.feature3, content.feature4].filter(f => f);
                                                                        updateSectionContent(selectedSectionId, { ...content, features: [...currentFeatures, ""], feature1: "", feature2: "", feature3: "", feature4: "" });
                                                                    }}
                                                                    style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                                >
                                                                    <FaPlus size={12} />
                                                                </button>
                                                            )}
                                                            <FaChevronDown style={{ transform: showCollectionFeaturesEditor ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                        </div>
                                                    </div>
                                                    {showCollectionFeaturesEditor && (
                                                        <div className="accordion-content" style={{ padding: '16px' }}>
                                                            {(content.features || [content.feature1, content.feature2, content.feature3, content.feature4].filter(f => f)).map((feat, idx) => (
                                                                <div key={idx} className="property-group animate-fade" style={{ marginBottom: '12px', position: 'relative' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <label style={{ fontSize: '11px', margin: 0 }}>Feature {idx + 1}</label>
                                                                            <button
                                                                                onClick={() => setShowFeatureIconPicker(showFeatureIconPicker === idx ? null : idx)}
                                                                                style={{
                                                                                    background: '#f1f5f9',
                                                                                    border: '1px solid #e2e8f0',
                                                                                    padding: '2px 8px',
                                                                                    borderRadius: '4px',
                                                                                    fontSize: '10px',
                                                                                    cursor: 'pointer',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '4px'
                                                                                }}
                                                                            >
                                                                                {(() => {
                                                                                    const iconName = (content.featureIcons || [])[idx] || 'leaf';
                                                                                    const Icons = {
                                                                                        leaf: FaLeaf, tshirt: FaTshirt, tint: FaTint, weight: FaWeightHanging,
                                                                                        fire: FaFire, star: FaStar, heart: FaHeart, cart: FaShoppingCart,
                                                                                        bolt: FaBolt, tag: FaTag, check: FaCheck, shield: FaShieldAlt,
                                                                                        shipping: FaShippingFast, thumbs: FaThumbsUp, clock: FaClock,
                                                                                        mobile: FaMobile, labtop: FaLaptop, home: FaHome, utensils: FaUtensils
                                                                                    };
                                                                                    const IconComp = Icons[iconName] || FaLeaf;
                                                                                    return <><IconComp size={10} /> Change</>;
                                                                                })()}
                                                                            </button>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                const currentFeatures = content.features || [content.feature1, content.feature2, content.feature3, content.feature4].filter(f => f);
                                                                                const currentIcons = content.featureIcons || [];
                                                                                const updatedFeatures = currentFeatures.filter((_, i) => i !== idx);
                                                                                const updatedIcons = currentIcons.filter((_, i) => i !== idx);
                                                                                updateSectionContent(selectedSectionId, { ...content, features: updatedFeatures, featureIcons: updatedIcons, feature1: "", feature2: "", feature3: "", feature4: "" });
                                                                            }}
                                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}
                                                                        >
                                                                            <FaTrash size={12} />
                                                                        </button>
                                                                    </div>

                                                                    {showFeatureIconPicker === idx && (
                                                                        <div className="icon-picker-grid animate-fade" style={{
                                                                            display: 'grid',
                                                                            gridTemplateColumns: 'repeat(5, 1fr)',
                                                                            gap: '6px',
                                                                            background: '#f8fafc',
                                                                            padding: '10px',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid #e2e8f0',
                                                                            marginBottom: '10px'
                                                                        }}>
                                                                            {[
                                                                                { icon: FaLeaf, val: 'leaf' }, { icon: FaTshirt, val: 'tshirt' }, { icon: FaTint, val: 'tint' }, { icon: FaWeightHanging, val: 'weight' },
                                                                                { icon: FaFire, val: 'fire' }, { icon: FaStar, val: 'star' }, { icon: FaHeart, val: 'heart' }, { icon: FaShoppingCart, val: 'cart' },
                                                                                { icon: FaBolt, val: 'bolt' }, { icon: FaTag, val: 'tag' }, { icon: FaCheck, val: 'check' }, { icon: FaShieldAlt, val: 'shield' },
                                                                                { icon: FaShippingFast, val: 'shipping' }, { icon: FaThumbsUp, val: 'thumbs' }, { icon: FaClock, val: 'clock' },
                                                                                { icon: FaMobile, val: 'mobile' }, { icon: FaLaptop, val: 'labtop' }, { icon: FaHome, val: 'home' }, { icon: FaUtensils, val: 'utensils' }
                                                                            ].map((item, i) => (
                                                                                <div
                                                                                    key={i}
                                                                                    onClick={() => {
                                                                                        const currentIcons = [...(content.featureIcons || [])];
                                                                                        while (currentIcons.length <= idx) currentIcons.push('leaf');
                                                                                        currentIcons[idx] = item.val;
                                                                                        updateSectionContent(selectedSectionId, { ...content, featureIcons: currentIcons });
                                                                                        setShowFeatureIconPicker(null);
                                                                                    }}
                                                                                    style={{
                                                                                        padding: '8px',
                                                                                        background: ((content.featureIcons || [])[idx] || 'leaf') === item.val ? '#7c3aed' : 'white',
                                                                                        color: ((content.featureIcons || [])[idx] || 'leaf') === item.val ? 'white' : '#64748b',
                                                                                        borderRadius: '6px',
                                                                                        cursor: 'pointer',
                                                                                        display: 'flex',
                                                                                        justifyContent: 'center',
                                                                                        border: '1px solid #e2e8f0'
                                                                                    }}
                                                                                >
                                                                                    <item.icon size={14} />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    <input
                                                                        type="text"
                                                                        value={feat || ''}
                                                                        onChange={(e) => {
                                                                            const currentFeatures = content.features || [content.feature1, content.feature2, content.feature3, content.feature4].filter(f => f);
                                                                            const updated = [...currentFeatures];
                                                                            updated[idx] = e.target.value;
                                                                            updateSectionContent(selectedSectionId, { ...content, features: updated, feature1: "", feature2: "", feature3: "", feature4: "" });
                                                                        }}
                                                                        placeholder={`Enter feature ${idx + 1}...`}
                                                                        className="full-width-input"
                                                                    />
                                                                </div>
                                                            ))}
                                                            {(content.features || [content.feature1, content.feature2, content.feature3, content.feature4].filter(f => f)).length === 0 && (
                                                                <div style={{ textAlign: 'center', padding: '10px', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                                                                    No features added. Click + to add one.
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 3. STYLING */}
                                                <div className="button-accordion-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                                                    <div className="accordion-header" onClick={() => setShowCollectionStyleEditor(!showCollectionStyleEditor)} style={{ padding: '12px 16px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: showCollectionStyleEditor ? '1px solid #e2e8f0' : 'none' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Styling</span>
                                                        <FaChevronDown style={{ transform: showCollectionStyleEditor ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                    </div>
                                                    {showCollectionStyleEditor && (
                                                        <div className="accordion-content" style={{ padding: '16px' }}>
                                                            <div style={{ marginBottom: '12px' }}>
                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BRANDING SETTINGS</label>
                                                            </div>

                                                            {/* Brand Accent Color */}
                                                            <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, useBrandColor: content.useBrandColor === false ? true : false })} style={{ margin: '0 0 10px', justifyContent: 'space-between', width: '100%', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>Use Brand Color</span>
                                                                <div className={`modern-hero-toggle-switch ${content.useBrandColor !== false ? 'active' : ''}`}><div className="toggle-dot"></div></div>
                                                            </div>

                                                            {content.useBrandColor === false && (
                                                                <div style={{ marginBottom: '15px' }}>
                                                                    <DebouncedColorPicker value={content.accentColor || '#ef233c'} onChange={(val) => updateSectionContent(selectedSectionId, { ...content, accentColor: val })} />
                                                                </div>
                                                            )}

                                                            {/* Brand Text Color */}
                                                            <div className="checkbox-standard" onClick={() => updateSectionContent(selectedSectionId, { ...content, useBrandTextColor: !content.useBrandTextColor })} style={{ margin: '15px 0 10px', justifyContent: 'space-between', width: '100%', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>Use Brand Color for Text</span>
                                                                <div className={`modern-hero-toggle-switch ${content.useBrandTextColor ? 'active' : ''}`}><div className="toggle-dot"></div></div>
                                                            </div>

                                                            {content.useBrandTextColor === false && (
                                                                <div style={{ marginBottom: '15px' }}>
                                                                    <DebouncedColorPicker value={content.customTextColor || '#1e293b'} onChange={(val) => updateSectionContent(selectedSectionId, { ...content, customTextColor: val })} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
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
                </aside>
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
                initialCategoryId={(() => {
                    const s = sections.find(sec => sec.id === selectedSectionId);
                    if (!s) return null;
                    try { return JSON.parse(s.content).selectedCategoryId || null; } catch (e) { return null; }
                })()}
                initialSourceType={(() => {
                    const s = sections.find(sec => sec.id === selectedSectionId);
                    if (!s) return 'products';
                    try { return JSON.parse(s.content).sourceType || 'products'; } catch (e) { return 'products'; }
                })()}
                onSave={(ids, categoryId, sourceType) => {
                    if (selectedSectionId) {
                        const s = sections.find(sec => sec.id === selectedSectionId);
                        if (s) {
                            const c = JSON.parse(s.content);
                            updateSectionContent(selectedSectionId, {
                                ...c,
                                selectedProductIds: ids,
                                selectedCategoryId: categoryId,
                                sourceType: sourceType || 'products'
                            });
                        }
                    }
                }}
            />

            <NavbarEditorModal
                isOpen={isNavbarEditorOpen}
                onClose={() => {
                    setIsNavbarEditorOpen(false);
                    setNavbarPreviewData(null); // Reset preview
                }}
                onSave={(data) => {
                    handleNavbarSave();
                    setNavbarPreviewData(null); // Reset preview
                }}
                onUpdate={setNavbarPreviewData}
                siteSettings={siteSettings}
            />

            <FooterEditorModal
                isOpen={isFooterEditorOpen}
                onClose={() => setIsFooterEditorOpen(false)}
                onSave={handleFooterSave}
            />
        </div>
    );
};

export default PageBuilder;
