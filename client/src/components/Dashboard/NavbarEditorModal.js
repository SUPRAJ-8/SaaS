import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './NavbarEditorModal.css';
import axios from 'axios';

const NavbarEditorModal = ({ isOpen, onClose, onSave, activeThemeId }) => {
    const [navbarStyle, setNavbarStyle] = useState('basic');
    const storageKey = activeThemeId ? `${activeThemeId}_navbarSettings` : 'navbarSettings';
    const eventName = activeThemeId ? `${activeThemeId}_navbarSettingsUpdated` : 'navbarSettingsUpdated';

    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setNavbarStyle(parsed.navbarStyle || 'basic');
                } catch (e) {
                    console.error("Error parsing navbar settings", e);
                }
            }
        }
    }, [isOpen]);

    const handleSave = async () => {
        try {
            const settings = { navbarStyle: navbarStyle };

            // 1. Update theme-specific storage (if activeThemeId provided)
            localStorage.setItem(storageKey, JSON.stringify(settings));

            // 2. Update GLOBAL navbar storage for the Shop Layouts
            localStorage.setItem('navbarSettings', JSON.stringify(settings));

            // 3. Update main storeSettings object to stay in sync
            const existingStoreSettings = JSON.parse(localStorage.getItem('storeSettings') || '{}');
            const updatedStoreLocal = { ...existingStoreSettings, navbarStyle: navbarStyle };
            localStorage.setItem('storeSettings', JSON.stringify(updatedStoreLocal));

            // Dispatch events for immediate UI updates in Builder and Shop preview
            window.dispatchEvent(new Event(eventName));
            window.dispatchEvent(new Event('navbarSettingsUpdated'));
            window.dispatchEvent(new Event('storage'));

            // 4. Save to backend for persistent storage (Shop / Live Site)
            const res = await axios.get('/api/store-settings');
            const currentStoreSettings = res.data || {};

            const updatedStoreSettings = {
                ...currentStoreSettings,
                navbarStyle: navbarStyle
            };

            await axios.put('/api/store-settings', updatedStoreSettings);
            toast.success("Navbar layout updated successfully");
            onSave();
        } catch (error) {
            console.error("Failed to save navbar settings to server", error);
            toast.warning("Saved locally. Background sync failed.");
            onSave();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="navbar-editor-overlay">
            <div className="navbar-editor-modal">
                <div className="navbar-modal-header">
                    <h2>Select Navbar</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="navbar-modal-body">
                    <div className="navbar-style-options">
                        <section className="style-section">
                            <label className="section-label">Choose Layout</label>
                            <div className="style-grid">
                                <div
                                    className={`style-card ${navbarStyle === 'basic' ? 'active' : ''}`}
                                    onClick={() => setNavbarStyle('basic')}
                                >
                                    <div className="preview-mini basic-nav">
                                        <div className="dot"></div>
                                        <div className="lines">
                                            <div className="line"></div>
                                            <div className="line"></div>
                                        </div>
                                    </div>
                                    <span>Basic Navbar</span>
                                </div>

                                <div
                                    className={`style-card ${navbarStyle === 'with-category' ? 'active' : ''}`}
                                    onClick={() => setNavbarStyle('with-category')}
                                >
                                    <div className="preview-mini cat-nav">
                                        <div className="dot"></div>
                                        <div className="cat-box">Category</div>
                                        <div className="lines">
                                            <div className="line"></div>
                                        </div>
                                    </div>
                                    <span>With Categories</span>
                                </div>

                                <div
                                    className={`style-card ${navbarStyle === 'custom' ? 'active' : ''}`}
                                    onClick={() => setNavbarStyle('custom')}
                                >
                                    <div className="preview-mini custom-nav">
                                        <div className="dot"></div>
                                        <div className="search-bar"></div>
                                        <div className="dot"></div>
                                    </div>
                                    <span>Custom Navbar</span>
                                </div>
                            </div>
                        </section>

                        {navbarStyle === 'basic' && (
                            <div className="style-configuration animate-fade">
                                <label className="section-label">Basic Settings</label>
                                <div className="config-group">
                                    <p className="info-text">Simple clean layout with Logo and Navigation links.</p>
                                </div>
                            </div>
                        )}

                        {navbarStyle === 'with-category' && (
                            <div className="style-configuration animate-fade">
                                <label className="section-label">Category Dropdown Settings</label>
                                <div className="config-group">
                                    <p className="info-text">Displays a "Categories" dropdown next to the logo. Best for stores with many departments.</p>
                                </div>
                            </div>
                        )}

                        {navbarStyle === 'custom' && (
                            <div className="style-configuration animate-fade">
                                <label className="section-label">Customization</label>
                                <div className="config-group">
                                    <div className="prop-row">
                                        <span>Show Search Preview</span>
                                        <input type="checkbox" defaultChecked />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="navbar-modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="save-btn" onClick={handleSave}>Save Navbar</button>
                </div>
            </div>
        </div>
    );
};

export default NavbarEditorModal;
