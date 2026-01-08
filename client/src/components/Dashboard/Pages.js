import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaEllipsisV, FaEdit, FaTrash, FaEye, FaCopy } from 'react-icons/fa';
import './Pages.css';
import { toast } from 'react-toastify';
import { ThemeContext } from '../../contexts/ThemeContext';

import axios from 'axios';
import API_URL from '../../apiConfig';

const Pages = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const { theme: activeTheme } = useContext(ThemeContext) || {};
    const activeThemeId = activeTheme?.id || localStorage.getItem('themeId') || 'ecommerce';

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newPageTitle, setNewPageTitle] = useState('');

    const [pages, setPages] = useState([]);

    useEffect(() => {
        const fetchPages = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/client-pages`, { withCredentials: true });
                if (response.data && response.data.length > 0) {
                    setPages(response.data);
                    // Also sync to local storage for existing logic that uses it
                    localStorage.setItem('site_pages', JSON.stringify(response.data));
                } else {
                    const initialPages = [
                        { id: 1, title: 'Home Page', slug: '', status: 'Active', lastModified: '2025-12-20', type: 'Core', themeId: 'ecommerce' },
                        { id: 2, title: 'Checkout Page', slug: 'checkout', status: 'Active', lastModified: '2025-12-19', type: 'Core', themeId: 'ecommerce' },
                        { id: 3, title: 'Nexus Home', slug: '', status: 'Active', lastModified: '2025-12-21', type: 'Core', themeId: 'nexus' },
                        { id: 4, title: 'Product Landing', slug: 'landing', status: 'Inactive', lastModified: '2025-12-21', type: 'Custom', themeId: 'nexus' },
                    ];
                    setPages(initialPages);
                    localStorage.setItem('site_pages', JSON.stringify(initialPages));
                }
            } catch (error) {
                console.error("Failed to fetch pages:", error);
                const savedPages = localStorage.getItem('site_pages');
                if (savedPages) {
                    setPages(JSON.parse(savedPages));
                }
            }
        };

        fetchPages();
    }, []);

    const filteredPages = pages.filter(page =>
        page.themeId === activeThemeId &&
        (page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.slug.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleAddPage = () => {
        setIsAddModalOpen(true);
    };

    const confirmAddPage = () => {
        const title = newPageTitle.trim();
        if (!title) {
            toast.error('Please enter a page title');
            return;
        }

        const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
        const newId = Date.now();
        const newPage = {
            id: newId,
            title: title,
            slug: slug,
            status: 'Inactive',
            lastModified: new Date().toISOString().split('T')[0],
            type: 'Custom',
            themeId: activeThemeId
        };

        const updatedPages = [...pages, newPage];
        setPages(updatedPages);
        localStorage.setItem('site_pages', JSON.stringify(updatedPages));

        setIsAddModalOpen(false);
        setNewPageTitle('');

        toast.success('Page created! Redirecting to builder...');
        setTimeout(() => {
            navigate(`/dashboard/page-builder/${newId}`);
        }, 1000);
    };

    const handleEditPage = (id) => {
        navigate(`/dashboard/page-builder/${id}`);
    };

    const handleStatusChange = (id, newStatus) => {
        const updatedPages = pages.map(p =>
            p.id === id ? { ...p, status: newStatus } : p
        );
        setPages(updatedPages);
        localStorage.setItem('site_pages', JSON.stringify(updatedPages));
        toast.success(`Page marked as ${newStatus}`);
    };

    const getSectionCount = (id) => {
        try {
            const sections = localStorage.getItem(`page_${id}_sections`);
            return sections ? JSON.parse(sections).length : 0;
        } catch (e) {
            return 0;
        }
    };

    const handleDeletePage = (id) => {
        if (window.confirm('Are you sure you want to delete this page?')) {
            const updatedPages = pages.filter(p => p.id !== id);
            setPages(updatedPages);
            localStorage.setItem('site_pages', JSON.stringify(updatedPages));
            toast.success('Page deleted successfully');
        }
    };

    return (
        <div className="pages-management">

            <div className="page-header">
                <div className="page-header-top">
                    <h2 className="page-title">Pages</h2>
                    <button className="add-page-btn" onClick={handleAddPage}>
                        <FaPlus /> Add Page
                    </button>
                </div>
            </div>

            <div className="pages-controls">
                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search pages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="pages-list-container">
                <table className="pages-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Total sections</th>
                            <th>Status</th>
                            <th>Last Modified</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPages.length > 0 ? (
                            filteredPages.map(page => (
                                <tr key={page.id} onClick={() => handleEditPage(page.id)} className="clickable-row">
                                    <td>
                                        <div className="page-title-cell">
                                            <span className="page-title-text">{page.title}</span>
                                            <span className="page-url">/shop{page.slug ? `/${page.slug}` : ''}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="section-count-badge">
                                            {getSectionCount(page.id)} Sections
                                        </div>
                                    </td>
                                    <td>
                                        <select
                                            className={`status-select ${page.status.toLowerCase()}`}
                                            value={page.status}
                                            onChange={(e) => handleStatusChange(page.id, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </td>
                                    <td>{page.lastModified}</td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="actions-dropdown">
                                            <button className="action-dot-btn"><FaEllipsisV /></button>
                                            <div className="actions-menu">
                                                <button onClick={() => handleEditPage(page.id)}><FaEdit /> Edit</button>
                                                <button onClick={() => window.open(`/shop/${page.slug}`, '_blank')}><FaEye /> View</button>
                                                <button><FaCopy /> Duplicate</button>
                                                <button className="delete-btn" onClick={() => handleDeletePage(page.id)}><FaTrash /> Delete</button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="no-pages-found">
                                    No pages found. Click "Add Page" to create your first page.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Page Modal */}
            {isAddModalOpen && (
                <div className="add-page-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div className="add-page-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Page</h3>
                            <button className="close-x" onClick={() => setIsAddModalOpen(false)}><FaPlus style={{ transform: 'rotate(45deg)' }} /></button>
                        </div>
                        <div className="modal-body">
                            <label>Page Name</label>
                            <input
                                type="text"
                                placeholder="Enter page name"
                                value={newPageTitle}
                                onChange={(e) => setNewPageTitle(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && confirmAddPage()}
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                            <button className="create-btn" onClick={confirmAddPage}>Create Page</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pages;
