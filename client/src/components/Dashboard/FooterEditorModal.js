import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import NexusFooter from '../Shop/layouts/NexusFooter';
import './FooterEditorModal.css';

const FooterEditorModal = ({ isOpen, onClose, onSave, activeThemeId }) => {
    const storageKey = activeThemeId ? `${activeThemeId}_footerSettings` : 'footerSettings';
    const eventName = activeThemeId ? `${activeThemeId}_footerSettingsUpdated` : 'footerSettingsUpdated';

    const [settings, setSettings] = useState({
        tagline: 'Digital transformation that really works.',
        col1Title: 'Company',
        col1Links: [
            { text: 'About Us', url: '/about' },
            { text: 'Services', url: '/services' },
            { text: 'Testimonials', url: '/testimonials' },
            { text: 'Contact', url: '/contact' }
        ],
        col2Title: 'Navigation',
        col2Links: [
            { text: 'Key Benefits', url: '/benefits' },
            { text: 'Our Services', url: '/shop' },
            { text: 'Why Us', url: '/why-us' },
            { text: 'Testimonials', url: '/testimonials' }
        ],
        footerStyle: 'style1',
        textColor: '#ffffff',
        backgroundColor: '#000000',
        useThemeColor: false
    });

    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    setSettings(JSON.parse(saved));
                } catch (e) {
                    console.error("Error parsing footer settings", e);
                }
            }
        }
    }, [isOpen]);

    const handleInputChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleLinkChange = (col, index, field, value) => {
        setSettings(prev => {
            const newLinks = [...prev[col]];
            newLinks[index] = { ...newLinks[index], [field]: value };
            return { ...prev, [col]: newLinks };
        });
    };

    const addLink = (col) => {
        setSettings(prev => ({
            ...prev,
            [col]: [...prev[col], { text: 'New Link', url: '#' }]
        }));
    };

    const removeLink = (col, index) => {
        setSettings(prev => ({
            ...prev,
            [col]: prev[col].filter((_, i) => i !== index)
        }));
    };

    const handleSave = () => {
        localStorage.setItem(storageKey, JSON.stringify(settings));
        window.dispatchEvent(new Event(eventName));
        window.dispatchEvent(new Event('footerSettingsUpdated'));
        onSave();
        toast.success("Footer settings saved.");
    };

    if (!isOpen) return null;

    return (
        <div className="footer-editor-overlay">
            <div className="footer-editor-modal">
                <div className="modal-header">
                    <h2>Edit Footer Content</h2>
                </div>
                <div className="modal-body">
                    <div className="footer-preview-container" style={{ marginBottom: '2rem', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                        <div className="nexus-theme">
                            <NexusFooter previewConfig={settings} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Tagline</label>
                        <input
                            type="text"
                            value={settings.tagline}
                            onChange={(e) => handleInputChange('tagline', e.target.value)}
                        />
                    </div>

                    <div className="appearance-section form-group">
                        <label>Appearance</label>
                        <div className="appearance-controls">
                            <div className="control-item">
                                <label>Footer Style</label>
                                <select
                                    value={settings.footerStyle || 'style1'}
                                    onChange={(e) => handleInputChange('footerStyle', e.target.value)}
                                >
                                    <option value="style1">Style 1 (Standard)</option>
                                    <option value="style2">Style 2 (Centered)</option>
                                    <option value="style3">Style 3 (Minimal)</option>
                                </select>
                            </div>
                            <div className="control-item">
                                <label>Text Color</label>
                                <div className="color-picker-composite">
                                    <input
                                        type="color"
                                        className="color-input-hidden"
                                        id="textColor"
                                        value={settings.textColor || '#ffffff'}
                                        onChange={(e) => handleInputChange('textColor', e.target.value)}
                                    />
                                    <label htmlFor="textColor" className="color-preview-circle" style={{ backgroundColor: settings.textColor || '#ffffff' }}></label>
                                    <input
                                        type="text"
                                        className="color-text-input"
                                        value={settings.textColor || '#ffffff'}
                                        onChange={(e) => handleInputChange('textColor', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="control-item">
                                <label>Background</label>
                                <div className="bg-controls">
                                    <div className="color-picker-composite" style={{ opacity: settings.useThemeColor ? 0.5 : 1 }}>
                                        <input
                                            type="color"
                                            className="color-input-hidden"
                                            id="bgColor"
                                            value={settings.backgroundColor || '#000000'}
                                            disabled={settings.useThemeColor}
                                            onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                                        />
                                        <label htmlFor="bgColor" className="color-preview-circle" style={{ backgroundColor: settings.backgroundColor || '#000000' }}></label>
                                        <input
                                            type="text"
                                            className="color-text-input"
                                            value={settings.backgroundColor || '#000000'}
                                            disabled={settings.useThemeColor}
                                            onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                                        />
                                    </div>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={settings.useThemeColor || false}
                                            onChange={(e) => handleInputChange('useThemeColor', e.target.checked)}
                                        />
                                        Use Theme Color
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="columns-row">
                        <div className="column-editor">
                            <h3>Column 1</h3>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={settings.col1Title}
                                    onChange={(e) => handleInputChange('col1Title', e.target.value)}
                                />
                            </div>
                            <label>Goto</label>
                            <div className="links-list">
                                {settings.col1Links.map((link, idx) => (
                                    <div key={idx} className="link-row">
                                        <input
                                            placeholder="Text"
                                            value={link.text}
                                            onChange={(e) => handleLinkChange('col1Links', idx, 'text', e.target.value)}
                                        />
                                        <input
                                            placeholder="URL"
                                            value={link.url}
                                            onChange={(e) => handleLinkChange('col1Links', idx, 'url', e.target.value)}
                                        />
                                        <button className="delete-link-btn" onClick={() => removeLink('col1Links', idx)}><FaTrash /></button>
                                    </div>
                                ))}
                                <button className="add-link-btn" onClick={() => addLink('col1Links')}><FaPlus /> Add Goto</button>
                            </div>
                        </div>

                        <div className="column-editor">
                            <h3>Column 2</h3>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={settings.col2Title}
                                    onChange={(e) => handleInputChange('col2Title', e.target.value)}
                                />
                            </div>
                            <label>Goto</label>
                            <div className="links-list">
                                {settings.col2Links.map((link, idx) => (
                                    <div key={idx} className="link-row">
                                        <input
                                            placeholder="Text"
                                            value={link.text}
                                            onChange={(e) => handleLinkChange('col2Links', idx, 'text', e.target.value)}
                                        />
                                        <input
                                            placeholder="URL"
                                            value={link.url}
                                            onChange={(e) => handleLinkChange('col2Links', idx, 'url', e.target.value)}
                                        />
                                        <button className="delete-link-btn" onClick={() => removeLink('col2Links', idx)}><FaTrash /></button>
                                    </div>
                                ))}
                                <button className="add-link-btn" onClick={() => addLink('col2Links')}><FaPlus /> Add Goto</button>
                            </div>
                        </div>

                        <div className="column-editor">
                            <h3>Contact Info</h3>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="text"
                                    value={settings.contactEmail || ''}
                                    placeholder="eg: example@nepostore.com"
                                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    value={settings.contactPhone || ''}
                                    placeholder="eg: +9779888888888"
                                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <input
                                    type="text"
                                    value={settings.contactAddress || ''}
                                    placeholder="eg: Kathmandu, Nepal"
                                    onChange={(e) => handleInputChange('contactAddress', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="save-btn" onClick={handleSave}>Save Footer</button>
                </div>
            </div>
        </div>
    );
};

export default FooterEditorModal;
