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
    FaMinusCircle,
    FaFileAlt,
    FaMagic,
    FaExternalLinkAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../apiConfig';
import ConfirmationModal from './ConfirmationModal';
import './SuperAdminThemes.css'; // Reusing the CSS for consistent layout

const SuperAdminTemplates = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All Templates');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Template form state
    const [formData, setFormData] = useState({
        name: '',
        id: '',
        description: '',
        thumbnail: '',
        category: 'General',
        type: 'section', // section or page
        baseType: 'hero-modern', // The component key from SECTION_TEMPLATES
        content: '', // The JSON content
    });

    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

    const TEMPLATE_RULES = [
        { title: "Standard JSON Structure", rule: "Ensure the content is valid JSON structure compatible with the Page Builder components." },
        { title: "Unique IDs", rule: "Use unique identifiers for elements within the template to avoid conflicts." },
        { title: "Responsive Design", rule: "Templates should be designed to work on Mobile, Tablet, and Desktop views." },
        { title: "Asset Optimization", rule: "Images referenced in templates should be optimized and hosted on reliable CDNs." },
    ];

    const fileInputRef = useRef(null);

    const fetchTemplates = async () => {
        try {
            // Using a new endpoint for templates
            const response = await axios.get(`${API_URL}/api/templates/admin`, { withCredentials: true });
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            // toast.error('Failed to load templates'); 
            // Mocking data for now if endpoint fails
            setTemplates([
                {
                    _id: '1',
                    name: 'Hero Section Modern',
                    id: 'hero-modern',
                    description: 'A modern hero section with large title and cta.',
                    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426',
                    version: '1.0.0',
                    category: 'Hero',
                    baseType: 'hero-modern',
                    isActive: true
                },
                {
                    _id: '2',
                    name: 'Feature Grid',
                    id: 'feature-grid',
                    description: '3-column feature grid with icons.',
                    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2426',
                    version: '1.1.0',
                    category: 'Features',
                    baseType: 'product-grid-basic', // Assume this key exists
                    isActive: true
                },
                {
                    _id: '3',
                    name: 'Rich Text Block',
                    id: 'rich-text',
                    description: 'Flexible text editor block for long-form content, blogs, or descriptions.',
                    thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=2340',
                    version: '1.0.0',
                    category: 'General',
                    baseType: 'rich-text',
                    isActive: true
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleOpenModal = (template = null) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                ...template,
                content: typeof template.content === 'object' ? JSON.stringify(template.content, null, 2) : template.content
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                name: '',
                id: '',
                description: '',
                thumbnail: '',
                version: '1.0.0',
                category: 'General',
                type: 'section',
                baseType: 'hero-modern',
                content: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveTemplate = async (e) => {
        e.preventDefault();

        try {
            if (formData.content) JSON.parse(formData.content);
        } catch (e) {
            toast.error('Invalid JSON content format');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                content: formData.content ? JSON.parse(formData.content) : {}
            };

            if (editingTemplate) {
                await axios.put(`${API_URL}/api/templates/${editingTemplate._id}`, payload, { withCredentials: true });
                toast.success('Template updated successfully');
            } else {
                await axios.post(`${API_URL}/api/templates`, payload, { withCredentials: true });
                toast.success('Template created successfully');
            }
            setIsModalOpen(false);
            fetchTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            // toast.error(error.response?.data?.msg || 'Failed to save template');
            // Mock success
            toast.success('Template saved (Mock)');
            setIsModalOpen(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simplify for now - assume JSON upload or ZIP
        const uploadData = new FormData();
        uploadData.append('templateFile', file);

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/templates/upload`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.success(res.data.msg);
            fetchTemplates();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || 'Error uploading template');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteClick = (e, template) => {
        e.stopPropagation();
        setTemplateToDelete(template);
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`${API_URL}/api/templates/${templateToDelete._id}`, { withCredentials: true });
            toast.success('Template deleted successfully');
            setIsConfirmDeleteOpen(false);
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            // toast.error('Failed to delete template');
            toast.success('Template deleted (Mock)');
            setIsConfirmDeleteOpen(false);
        }
    };

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (filter === 'Active') return matchesSearch && template.isActive;
        if (filter === 'Inactive') return matchesSearch && !template.isActive;
        return matchesSearch;
    });

    if (loading) return <div className="themes-sa-loader">Processing templates...</div>;

    return (
        <div className="themes-manager-wrapper">
            {/* Header */}
            <header className="tm-header">
                <div className="tm-header-left">
                    <h1>Templates Manager</h1>
                    <p>Manage section and page templates for the Page Builder.</p>
                </div>
                <div className="tm-header-right">
                    <button className="tm-btn-rule" onClick={() => setIsRulesModalOpen(true)}>
                        <FaCode /> Template Rules
                    </button>
                </div>
            </header>

            {/* Upload New Template Bar */}
            <div className="tm-upload-promo-bar">
                <div className="tm-upload-promo-content">
                    <div className="tm-upload-icon-circle">
                        <FaCloudUploadAlt />
                    </div>
                    <div className="tm-upload-promo-text">
                        <h4>Upload Template Package</h4>
                        <p>Upload a .json or .zip file containing the template structure.</p>
                    </div>
                </div>
                <div className="tm-upload-actions-group">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept=".json,.zip"
                    />
                    <button className="tm-btn-upload-action secondary" onClick={() => handleOpenModal()}>
                        <FaPlus /> Manual Entry
                    </button>
                    <button className="tm-btn-upload-action" onClick={() => fileInputRef.current.click()}>
                        <FaCloudUploadAlt /> Upload File
                    </button>
                </div>
            </div>


            {/* Search & Filter Bar */}
            <div className="tm-filter-bar">
                <div className="tm-search-container">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="tm-filter-tabs">
                    {['All Templates', 'Active', 'Inactive'].map(tab => (
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

            {/* Template Grid */}
            <div className="tm-themes-grid">
                {filteredTemplates.map(template => (
                    <div key={template._id} className={`tm-theme-card ${template.isActive ? 'active-card' : ''}`}>
                        <div className="tm-card-preview">
                            <img src={template.thumbnail || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2426"} alt={template.name} />
                            {template.isActive && (
                                <div className="tm-status-badge">
                                    <span className="dot"></span> Active
                                </div>
                            )}
                        </div>
                        <div className="tm-card-info">
                            <div className="tm-card-header">
                                <h3>{template.name}</h3>
                                <span className="tm-version">{template.category || 'Section'}</span>
                            </div>
                            <p className="tm-description">{template.description}</p>
                            <div className="tm-card-actions">
                                <button className="tm-btn-customize" onClick={() => handleOpenModal(template)}>
                                    <FaEdit /> Edit
                                </button>
                                <button className="tm-btn-customize" onClick={() => navigate(`/dashboard/template-builder/${template._id}`)} title="Open in Page Builder">
                                    <FaMagic /> Builder
                                </button>
                                <button className="tm-btn-icon-secondary" onClick={(e) => handleDeleteClick(e, template)}>
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="sa-modal-overlay">
                    <div className="sa-modal-content edit-theme-modal">
                        <button className="tm-modal-close-corner" onClick={() => setIsModalOpen(false)}>
                            <FaTimes />
                        </button>
                        <div className="modal-header">
                            <h2>{editingTemplate ? 'Edit Template' : 'Add New Template'}</h2>
                        </div>
                        <form onSubmit={handleSaveTemplate}>
                            <div className="modal-sections">
                                <div className="m-section">
                                    <div className="form-group-sa">
                                        <label>Template Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                                    </div>
                                    <div className="form-group-sa">
                                        <label>ID (Slug)</label>
                                        <input type="text" name="id" value={formData.id} onChange={handleInputChange} required />
                                    </div>
                                    <div className="form-group-sa">
                                        <label>Description</label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={3} />
                                    </div>
                                    <div className="form-group-sa">
                                        <label>Thumbnail URL</label>
                                        <input type="text" name="thumbnail" value={formData.thumbnail} onChange={handleInputChange} required />
                                    </div>
                                    <div className="form-group-sa">
                                        <label>Category</label>
                                        <select name="category" value={formData.category} onChange={handleInputChange} className="form-select-sa" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                            <option value="General">General</option>
                                            <option value="Hero">Hero</option>
                                            <option value="Features">Features</option>
                                            <option value="Pricing">Pricing</option>
                                            <option value="Testimonials">Testimonials</option>
                                        </select>
                                    </div>
                                    <div className="form-group-sa">
                                        <label>Base Component Type</label>
                                        <select name="baseType" value={formData.baseType} onChange={handleInputChange} className="form-select-sa" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                            <option value="hero-modern">Modern Hero</option>
                                            <option value="hero">Standard Hero</option>
                                            <option value="product-grid">Product Grid</option>
                                            <option value="category-list">Category List</option>
                                            <option value="faq-accordion">FAQ Accordion</option>
                                            <option value="rich-text">Rich Text</option>
                                        </select>
                                        <small style={{ color: '#6b7280' }}>This determines which React component renders the content.</small>
                                    </div>
                                </div>

                                <div className="m-section">
                                    <div className="form-group-sa high">
                                        <label><FaCode /> Template JSON Content</label>
                                        <textarea
                                            name="content"
                                            value={formData.content}
                                            onChange={handleInputChange}
                                            required
                                            className="code-editor-sa"
                                            placeholder='{"type": "section", "style": {...}}'
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer-sa">
                                <button type="button" className="btn-sa-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className={`btn-sa-primary ${isSaving ? 'btn-loading' : ''}`} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Template'}
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
                title="Delete Template"
                message={`Are you sure you want to delete ${templateToDelete?.name}?`}
                danger
            />

            {/* Template Rules Modal */}
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
                                <h2>Template Development Rules</h2>
                                <p>Follow these standards to ensure compatibility.</p>
                            </div>
                        </div>
                        <div className="rules-scroll-area">
                            <div className="rules-grid">
                                {TEMPLATE_RULES.map((rule, idx) => (
                                    <div key={idx} className="rule-item-card">
                                        <div className="rule-number">{idx + 1}</div>
                                        <div className="rule-content">
                                            <h4>{rule.title}</h4>
                                            <p>{rule.rule}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer-sa">
                            <button className="btn-sa-primary full-width" onClick={() => setIsRulesModalOpen(false)}>I Understand</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminTemplates;
