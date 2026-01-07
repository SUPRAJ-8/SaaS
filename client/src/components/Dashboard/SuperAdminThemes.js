import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaCheckCircle,
    FaTimes,
    FaCode,
    FaShapes,
    FaCloudUploadAlt,
    FaMinusCircle
} from 'react-icons/fa';
import API_URL from '../../apiConfig';
import ConfirmationModal from './ConfirmationModal';
import './SuperAdminThemes.css';

const SuperAdminThemes = () => {
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All Themes');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeThemeId, setActiveThemeId] = useState(null);

    // Theme form state
    const [formData, setFormData] = useState({
        name: '',
        id: '',
        description: '',
        thumbnail: '',
        version: '1.0.0',
        category: 'Ecommerce',
        features: {
            ecommerce: true,
            checkout: true,
            categories: true,
            wishlist: true
        },
        blueprint: '',
        customCss: ''
    });

    const [editingTheme, setEditingTheme] = useState(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [themeToDelete, setThemeToDelete] = useState(null);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

    const THEME_RULES = [
        { title: "Standard Brand Variables", rule: "Always use CSS variables for colors and fonts (e.g., var(--primary), var(--font-main)). Hardcoded HEX/RGB values are restricted to ensure tenant branding works." },
        { title: "Valid Blueprint JSON", rule: "The blueprint must be a valid JSON array of section objects. Each section must have a 'type' and 'content' schema recognized by the Page Builder." },
        { title: "Unique ID Policy", rule: "The technical 'ID' must be unique and lowercase-hyphenated (e.g. 'nexus-dark'). Once created, the ID cannot be changed." },
        { title: "Feature Toggles", rule: "Correctly set feature flags (Ecommerce, Checkout, etc.). If 'ecommerce' is false, the theme will automatically hide shop-related elements." },
        { title: "Image Standards", rule: "Thumbnails should be high-quality 1200x800px images. Use external storage URLs or the platform's upload service." },
        { title: "Semantic Sections", rule: "Use meaningful IDs for blueprint sections (e.g. 'hero-main' vs 'section-1') to aid in post-activation editing." }
    ];

    const fileInputRef = useRef(null);

    const fetchThemes = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/themes/admin`, { withCredentials: true });
            setThemes(response.data);
            if (response.data.length > 0) {
                // Find first active theme for UI highlight
                const active = response.data.find(t => t.isActive);
                if (active) setActiveThemeId(active._id);
            }
        } catch (error) {
            console.error('Error fetching themes:', error);
            toast.error('Failed to load themes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThemes();
    }, []);

    const handleOpenModal = (theme = null) => {
        if (theme) {
            setEditingTheme(theme);
            setFormData({
                ...theme,
                blueprint: typeof theme.blueprint === 'object' ? JSON.stringify(theme.blueprint, null, 2) : theme.blueprint
            });
        } else {
            setEditingTheme(null);
            setFormData({
                name: '',
                id: '',
                description: '',
                thumbnail: '',
                version: '1.0.0',
                category: 'Ecommerce',
                features: {
                    ecommerce: true,
                    checkout: true,
                    categories: true,
                    wishlist: true
                },
                blueprint: '',
                customCss: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFeatureToggle = (feature) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [feature]: !prev.features[feature]
            }
        }));
    };

    const handleSaveTheme = async (e) => {
        e.preventDefault();

        try {
            JSON.parse(formData.blueprint);
        } catch (e) {
            toast.error('Invalid Blueprint JSON format');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                blueprint: JSON.parse(formData.blueprint)
            };

            if (editingTheme) {
                await axios.put(`${API_URL}/api/themes/${editingTheme._id}`, payload, { withCredentials: true });
                toast.success('Theme updated successfully');
            } else {
                await axios.post(`${API_URL}/api/themes`, payload, { withCredentials: true });
                toast.success('Theme created successfully');
            }
            setIsModalOpen(false);
            fetchThemes();
        } catch (error) {
            console.error('Error saving theme:', error);
            toast.error(error.response?.data?.msg || 'Failed to save theme');
        } finally {
            setIsSaving(false);
        }
    };

    const handleZipUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('themeZip', file);

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/themes/upload-zip`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.success(res.data.msg);
            fetchThemes();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || 'Error uploading ZIP package');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteClick = (e, theme) => {
        e.stopPropagation();
        setThemeToDelete(theme);
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`${API_URL}/api/themes/${themeToDelete._id}`, { withCredentials: true });
            toast.success('Theme deleted successfully');
            setIsConfirmDeleteOpen(false);
            fetchThemes();
        } catch (error) {
            console.error('Error deleting theme:', error);
            toast.error('Failed to delete theme');
        }
    };

    const filteredThemes = themes.filter(theme => {
        const matchesSearch = theme.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (filter === 'Active') return matchesSearch && theme.isActive;
        if (filter === 'Inactive') return matchesSearch && !theme.isActive;
        return matchesSearch;
    });

    const activeTheme = themes.find(t => t.isActive) || themes[0];
    const otherThemes = filteredThemes.filter(t => t._id !== activeTheme?._id);

    if (loading) return <div className="themes-sa-loader">Processing themes...</div>;

    return (
        <div className="themes-manager-wrapper">
            {/* Header */}
            <header className="tm-header">
                <div className="tm-header-left">
                    <h1>Themes</h1>
                    <p>Manage and customize the look of your workspace.</p>
                </div>
                <div className="tm-header-right">
                    <button className="tm-btn-rule" onClick={() => setIsRulesModalOpen(true)}>
                        <FaCode /> Theme Rule
                    </button>
                </div>
            </header>

            {/* Upload New Theme Bar */}
            <div className="tm-upload-promo-bar">
                <div className="tm-upload-promo-content">
                    <div className="tm-upload-icon-circle">
                        <FaCloudUploadAlt />
                    </div>
                    <div className="tm-upload-promo-text">
                        <h4>Upload Custom package</h4>
                        <p>Have a theme file prepared? Upload your .zip package directly.</p>
                    </div>
                </div>
                <div className="tm-upload-actions-group">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleZipUpload}
                        style={{ display: 'none' }}
                        accept=".zip"
                    />
                    <button className="tm-btn-upload-action secondary" onClick={() => handleOpenModal()}>
                        <FaPlus /> Manual Entry
                    </button>
                    <button className="tm-btn-upload-action" onClick={() => fileInputRef.current.click()}>
                        <FaCloudUploadAlt /> Upload ZIP
                    </button>
                </div>
            </div>


            {/* Search & Filter Bar */}
            <div className="tm-filter-bar">
                <div className="tm-search-container">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search themes by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="tm-filter-tabs">
                    {['All Themes', 'Active', 'Inactive'].map(tab => (
                        <button
                            key={tab}
                            className={`tm-tab ${filter === tab ? 'active' : ''}`}
                            onClick={() => setFilter(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Theme Grid */}
            <div className="tm-themes-grid">
                {activeTheme && filter === 'All Themes' && !searchTerm && (
                    <div className="tm-theme-card active-card">
                        <div className="tm-card-preview">
                            <img src={activeTheme.thumbnail || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"} alt={activeTheme.name} />
                            <div className="tm-status-badge">
                                <span className="dot"></span> Active
                            </div>
                        </div>
                        <div className="tm-card-info">
                            <div className="tm-card-header">
                                <h3>{activeTheme.name}</h3>
                                <span className="tm-version">v{activeTheme.version}</span>
                            </div>
                            <p className="tm-description">{activeTheme.description}</p>
                            <div className="tm-card-actions">
                                <button className="tm-btn-customize" onClick={() => handleOpenModal(activeTheme)}>
                                    <FaEdit /> Customize
                                </button>
                                <button className="tm-btn-icon-secondary" onClick={(e) => handleDeleteClick(e, activeTheme)}>
                                    <FaMinusCircle />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {otherThemes.map(theme => (
                    <div key={theme._id} className={`tm-theme-card ${theme.isActive ? 'active-card' : ''}`}>
                        <div className="tm-card-preview">
                            <img src={theme.thumbnail || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3"} alt={theme.name} />
                            {theme.isActive && (
                                <div className="tm-status-badge">
                                    <span className="dot"></span> Active
                                </div>
                            )}
                        </div>
                        <div className="tm-card-info">
                            <div className="tm-card-header">
                                <h3>{theme.name}</h3>
                                <span className="tm-version">v{theme.version}</span>
                            </div>
                            <p className="tm-description">{theme.description}</p>
                            <div className="tm-card-actions">
                                {theme.isActive ? (
                                    <button className="tm-btn-customize" onClick={() => handleOpenModal(theme)}>
                                        <FaEdit /> Customize
                                    </button>
                                ) : (
                                    <button className="tm-btn-activate">
                                        Activate
                                    </button>
                                )}
                                <button className="tm-btn-icon-secondary" onClick={(e) => handleDeleteClick(e, theme)}>
                                    {theme.isActive ? <FaMinusCircle /> : <FaTrash />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {/* Create New Theme card removed as requested */}
            </div>

            {/* Edit Modal (Keeping functionality but making it premium) */}
            {isModalOpen && (
                <div className="sa-modal-overlay">
                    <div className="sa-modal-content edit-theme-modal">
                        <button className="tm-modal-close-corner" onClick={() => setIsModalOpen(false)}>
                            <FaTimes />
                        </button>
                        <div className="modal-header">
                            <h2>{editingTheme ? 'Edit Theme Configuration' : 'Add Theme Template'}</h2>
                        </div>
                        <form onSubmit={handleSaveTheme}>
                            <div className="modal-sections">
                                <div className="m-section">
                                    <div className="form-group-sa">
                                        <label>Theme Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                                    </div>
                                    <div className="form-group-sa">
                                        <label>Description</label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={3} />
                                    </div>
                                    <div className="form-group-sa">
                                        <label>Thumbnail URL</label>
                                        <input type="text" name="thumbnail" value={formData.thumbnail} onChange={handleInputChange} required />
                                    </div>

                                    <div className="features-toggle-sa">
                                        <label>Module Features</label>
                                        <div className="features-grid-sa">
                                            {Object.keys(formData.features).map(feature => (
                                                <div key={feature} className={`feature-pill ${formData.features[feature] ? 'active' : ''}`} onClick={() => handleFeatureToggle(feature)}>
                                                    <FaCheckCircle /> {feature.charAt(0).toUpperCase() + feature.slice(1)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="m-section">
                                    <div className="form-group-sa high">
                                        <label><FaCode /> Blueprint JSON</label>
                                        <textarea
                                            name="blueprint"
                                            value={formData.blueprint}
                                            onChange={handleInputChange}
                                            required
                                            className="code-editor-sa"
                                        />
                                    </div>
                                    <div className="form-group-sa high">
                                        <label><FaCode /> Custom CSS</label>
                                        <textarea
                                            name="customCss"
                                            value={formData.customCss}
                                            onChange={handleInputChange}
                                            className="code-editor-sa"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer-sa">
                                <button type="button" className="btn-sa-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className={`btn-sa-primary ${isSaving ? 'btn-loading' : ''}`} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Update Theme'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Theme"
                message={`Are you sure you want to delete ${themeToDelete?.name}?`}
                danger
            />

            {/* Theme Rules Modal */}
            {isRulesModalOpen && (
                <div className="sa-modal-overlay">
                    <div className="sa-modal-content rules-modal">
                        <button className="tm-modal-close-corner" onClick={() => setIsRulesModalOpen(false)}>
                            <FaTimes />
                        </button>
                        <div className="modal-header rules-header-centered">
                            <div className="title-with-icon-centered">
                                <div className="header-accent-icon-circle">
                                    <FaCode />
                                </div>
                                <h2>Theme Development Rules</h2>
                                <p>Follow these standards to ensure cross-tenant compatibility.</p>
                            </div>
                        </div>
                        <div className="rules-scroll-area">
                            <div className="rules-grid">
                                {THEME_RULES.map((rule, idx) => (
                                    <div key={idx} className="rule-item-card">
                                        <div className="rule-number">{idx + 1}</div>
                                        <div className="rule-content">
                                            <h4>{rule.title}</h4>
                                            <p>{rule.rule}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="rules-tip-box">
                                <FaShapes />
                                <p><strong>Pro Tip:</strong> Test your blueprints in a stage environment before pushing to the main theme library.</p>
                            </div>
                        </div>
                        <div className="modal-footer-sa">
                            <button className="btn-sa-primary full-width" onClick={() => setIsRulesModalOpen(false)}>I Understand, Let's Build</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminThemes;
