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
    // Use state for activeThemeId so we can update it when client settings load
    const [activeThemeId, setActiveThemeId] = useState(activeTheme?.id || (typeof activeTheme === 'string' ? activeTheme : null) || localStorage.getItem('themeId') || 'nexus');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newPageTitle, setNewPageTitle] = useState('');
    const [newPageSlug, setNewPageSlug] = useState('');
    const [pages, setPages] = useState([]);
    const [client, setClient] = useState(null);

    // Delete Confirmation Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [pageToDelete, setPageToDelete] = useState(null);

    // Rename Modal State
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [pageToRename, setPageToRename] = useState(null);
    const [renameTitle, setRenameTitle] = useState('');
    const [renameSlug, setRenameSlug] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch current user and client info
                const userRes = await axios.get(`${API_URL}/auth/current_user`, { withCredentials: true });
                if (userRes.data && userRes.data.clientId) {
                    let clientData = null;
                    if (typeof userRes.data.clientId === 'object' && userRes.data.clientId.subdomain) {
                        clientData = userRes.data.clientId;
                    } else {
                        const clientRes = await axios.get(`${API_URL}/api/store-settings/my-store`, { withCredentials: true });
                        clientData = clientRes.data;
                    }

                    if (clientData) {
                        setClient(clientData);
                        // Update activeThemeId based on authoritative server settings
                        if (clientData.settings && clientData.settings.selectedThemeId) {
                            console.log('Syncing Pages theme filter to server setting:', clientData.settings.selectedThemeId);
                            setActiveThemeId(clientData.settings.selectedThemeId);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching client info for Pages:", error);
            }
        };
        fetchData();

        const fetchPages = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/client-pages`, { withCredentials: true });
                if (response.data && response.data.length > 0) {
                    setPages(response.data);
                    // Also sync to local storage for existing logic that uses it
                    localStorage.setItem('site_pages', JSON.stringify(response.data));
                } else {
                    const initialPages = [
                        { id: 1, title: 'Home', slug: '', status: 'Active', lastModified: new Date().toISOString().split('T')[0], type: 'Core', themeId: 'ecommerce' },
                        { id: 2, title: 'Checkout', slug: 'checkout', status: 'Active', lastModified: new Date().toISOString().split('T')[0], type: 'Core', themeId: 'ecommerce' },
                        { id: 3, title: 'Home', slug: '', status: 'Active', lastModified: new Date().toISOString().split('T')[0], type: 'Core', themeId: 'nexus' },
                        { id: 4, title: 'About Us', slug: 'about', status: 'Inactive', lastModified: new Date().toISOString().split('T')[0], type: 'Custom', themeId: 'nexus' },
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

    const filteredPages = pages.filter(page => {
        // Fallback for older pages: if no themeId, treat as 'nexus'
        const pageTheme = page.themeId || 'nexus';
        const matchesTheme = pageTheme === activeThemeId;
        const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.slug.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTheme && matchesSearch;
    });

    const handleAddPage = () => {
        setIsAddModalOpen(true);
    };

    const confirmAddPage = async () => {
        const title = newPageTitle.trim();
        if (!title) {
            toast.error('Please enter a page title');
            return;
        }

        // Use provided slug or auto-generate from title
        let slugToUse = (newPageSlug.trim() !== ''
            ? newPageSlug.toLowerCase().replace(/\s+/g, '-')
            : newPageTitle.toLowerCase().replace(/\s+/g, '-')).replace(/^\//, '');

        // Ensure home page logic is respected: if it's empty or /, save as empty string
        if (slugToUse === '' || slugToUse === '/') slugToUse = '';

        try {
            // Save to backend immediately
            const payload = {
                title: newPageTitle,
                slug: slugToUse,
                status: 'draft',
                type: 'Custom',
                themeId: activeThemeId,
                content: '[]' // Initialize with empty content
            };

            const response = await axios.post(`${API_URL}/api/client-pages`, payload, { withCredentials: true });

            if (response.data) {
                // The server returns the updated list of pages. Find the one we just added.
                // We match by slug and title to be safe.
                const allPages = response.data;
                const createdPage = allPages.find(p => p.slug === slugToUse && p.title === newPageTitle);

                if (createdPage) {
                    setPages(allPages);
                    localStorage.setItem('site_pages', JSON.stringify(allPages));

                    setIsAddModalOpen(false);
                    setNewPageTitle('');
                    setNewPageSlug('');

                    toast.success('Page created! Redirecting to builder...');
                    setTimeout(() => {
                        navigate(`/dashboard/page-builder/${createdPage._id}`);
                    }, 500);
                } else {
                    toast.error('Page created but could not be located. Refreshing...');
                    setTimeout(() => window.location.reload(), 1000);
                }
            }
        } catch (error) {
            console.error('Failed to create page:', error);
            const msg = error.response?.data?.msg || 'Failed to create page on server.';
            toast.error(msg);
        }
    };

    const handleEditPage = (id) => {
        navigate(`/dashboard/page-builder/${id}`);
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            // Find the page content to preserve it
            const pageToUpdate = pages.find(p => (p._id || p.id) === id);
            if (!pageToUpdate) return;

            // Update on server if it's a real page
            if (typeof id === 'string' || pageToUpdate._id) {
                const dbId = pageToUpdate._id || id;
                await axios.post(`${API_URL}/api/client-pages`, {
                    id: dbId,
                    title: pageToUpdate.title,
                    slug: pageToUpdate.slug,
                    status: newStatus === 'Active' ? 'published' : 'draft',
                    themeId: pageToUpdate.themeId
                }, { withCredentials: true });
            }

            const updatedPages = pages.map(p =>
                (p._id || p.id) === id ? { ...p, status: newStatus } : p
            );
            setPages(updatedPages);
            localStorage.setItem('site_pages', JSON.stringify(updatedPages));
            toast.success(`Page marked as ${newStatus}`);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update page status');
        }
    };

    const getSectionCount = (id) => {
        try {
            const sections = localStorage.getItem(`page_${id}_sections`);
            return sections ? JSON.parse(sections).length : 0;
        } catch (e) {
            return 0;
        }
    };

    const handleViewPage = (slug) => {
        if (!client) {
            window.open(slug ? `/${slug}` : '/', '_blank');
            return;
        }

        const { hostname, protocol, port } = window.location;
        const isLocalhost = hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname.endsWith('.localhost');

        // Use custom domain if available and NOT on localhost
        if (client.customDomain && !isLocalhost) {
            const baseUrl = client.customDomain.startsWith('http') ? client.customDomain : `https://${client.customDomain}`;
            window.open(`${baseUrl}${slug ? `/${slug}` : '/'}`, '_blank');
            return;
        }

        let targetUrl = '';
        if (isLocalhost) {
            const isUsingSubdomain = hostname !== 'localhost' && hostname !== '127.0.0.1';
            const targetPort = port ? `:${port}` : ':3000';
            if (isUsingSubdomain) {
                targetUrl = `${protocol}//${client.subdomain}.localhost${targetPort}${slug ? `/${slug}` : '/'}`;
            } else {
                targetUrl = `${protocol}//localhost${targetPort}${slug ? `/${slug}` : '/'}?tenant=${client.subdomain}`;
            }
        } else {
            targetUrl = `https://${client.subdomain}.nepostore.xyz${slug ? `/${slug}` : '/'}`;
        }

        window.open(targetUrl, '_blank');
    };

    const handleOpenDeleteModal = (page) => {
        const isPageHome = !page.slug || page.slug === '' || page.slug === '/' || page.slug === (page._id || page.id);
        const homeCount = pages.filter(p => (p.themeId || 'nexus') === activeThemeId && (!p.slug || p.slug === '' || p.slug === '/' || p.slug === (p._id || p.id))).length;

        if (isPageHome && homeCount <= 1) {
            toast.error('The Home page is a system requirement and cannot be deleted.');
            return;
        }
        setPageToDelete(page);
        setIsDeleteModalOpen(true);
    };

    const confirmDeletePage = async () => {
        if (!pageToDelete) return;

        try {
            // If it's a real page from DB, call API. If mock, just filter.
            if (typeof pageToDelete.id === 'string' || pageToDelete._id) {
                const id = pageToDelete._id || pageToDelete.id;
                await axios.delete(`${API_URL}/api/client-pages/${id}`, { withCredentials: true });
            }

            const updatedPages = pages.filter(p => (p._id || p.id) !== (pageToDelete._id || pageToDelete.id));
            setPages(updatedPages);
            localStorage.setItem('site_pages', JSON.stringify(updatedPages));
            toast.success('Page deleted successfully');
        } catch (error) {
            console.error('Error deleting page:', error);
            toast.error('Failed to delete page');
        } finally {
            setIsDeleteModalOpen(false);
            setPageToDelete(null);
        }
    };

    const handleOpenRenameModal = (page) => {
        setPageToRename(page);
        setRenameTitle(page.title);
        setRenameSlug(page.slug || '');
        setIsRenameModalOpen(true);
    };

    const confirmRenamePage = async () => {
        if (!renameTitle.trim()) {
            toast.error('Page title cannot be empty');
            return;
        }

        try {
            let slugToUse = renameSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/^\//, '');
            if (slugToUse === '') slugToUse = '/';

            // Validate slug if it's not the home page (home page must have empty slug/id match)
            if (pageToRename.slug === '' || pageToRename.slug === '/' || pageToRename.slug === (pageToRename._id || pageToRename.id)) {
                // Trying to rename home page title is fine, but slug must remain special usually.
                // For now, we allow slug edit unless it's strictly locked.
            }

            const payload = {
                id: pageToRename._id || pageToRename.id,
                title: renameTitle,
                slug: slugToUse === '/' ? '' : slugToUse, // Normalize home page to empty string for backend consistency
                // Preserve other fields
                status: pageToRename.status,
                themeId: pageToRename.themeId
            };

            await axios.post(`${API_URL}/api/client-pages`, payload, { withCredentials: true });

            // Update local state
            const updatedPages = pages.map(p =>
                (p._id || p.id) === (pageToRename._id || pageToRename.id)
                    ? { ...p, title: renameTitle, slug: payload.slug }
                    : p
            );
            setPages(updatedPages);
            localStorage.setItem('site_pages', JSON.stringify(updatedPages));
            toast.success('Page renamed successfully');
            setIsRenameModalOpen(false);
        } catch (error) {
            console.error('Error renaming page:', error);
            toast.error('Failed to rename page');
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
                            <th className="th-title">Title</th>
                            <th className="th-sections">Total sections</th>
                            <th className="th-status">Status</th>
                            <th className="th-date">Last Modified</th>
                            <th className="th-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPages.length > 0 ? (
                            filteredPages.map(page => (
                                <tr key={page._id || page.id} onClick={() => handleEditPage(page._id || page.id)} className="clickable-row">
                                    <td className="td-title">
                                        <div className="page-title-cell">
                                            <span className="page-title-text">
                                                {page.title}
                                                {(!page.slug || page.slug === '' || page.slug === '/' || page.slug === (page._id || page.id)) && <span className="home-badge">Home</span>}
                                            </span>
                                            <span className="page-url">
                                                {(page.slug && page.slug !== '/' && page.slug !== (page._id || page.id)) ? `/${page.slug}` : '/'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="td-sections">
                                        <div className="section-count-badge">
                                            {getSectionCount(page._id || page.id)} Sections
                                        </div>
                                    </td>
                                    <td className="td-status">
                                        {(!page.slug || page.slug === '') ? (
                                            <span className="status-badge default">Default</span>
                                        ) : (
                                            <select
                                                className={`status-select ${page.status.toLowerCase()}`}
                                                value={page.status}
                                                onChange={(e) => handleStatusChange(page._id || page.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="td-date">
                                        {(() => {
                                            const dateVal = page.lastModified || page.createdAt || page.updatedAt;
                                            if (!dateVal) return new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                                            return new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                                        })()}
                                    </td>
                                    <td className="td-actions" onClick={(e) => e.stopPropagation()}>
                                        <div className="actions-dropdown">
                                            <button className="action-dot-btn"><FaEllipsisV /></button>
                                            <div className="actions-menu">
                                                <button onClick={(e) => { e.stopPropagation(); handleEditPage(page._id || page.id); }}><FaEdit /> Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenRenameModal(page); }}><FaEdit /> Edit Name</button>
                                                <button onClick={(e) => { e.stopPropagation(); handleViewPage(page.slug); }}><FaEye /> View</button>
                                                <button onClick={(e) => e.stopPropagation()}><FaCopy /> Duplicate</button>
                                                {(!(page.slug === '' || page.slug === '/' || page.slug === (page._id || page.id)) ||
                                                    pages.filter(p => (p.themeId || 'nexus') === activeThemeId && (!p.slug || p.slug === '' || p.slug === '/' || p.slug === (page._id || page.id))).length > 1) && (
                                                        <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleOpenDeleteModal(page); }}><FaTrash /> Delete</button>
                                                    )}
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

                            <label style={{ marginTop: '15px', display: 'block' }}>URL Slug</label>
                            <div className="slug-input-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <span style={{
                                    padding: '12px 10px 12px 16px',
                                    background: '#f1f5f9',
                                    border: '1.5px solid #e2e8f0',
                                    borderRight: 'none',
                                    borderRadius: '10px 0 0 10px',
                                    color: '#64748b',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>/</span>
                                <input
                                    type="text"
                                    placeholder="page-url"
                                    value={newPageSlug}
                                    onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                    style={{
                                        borderRadius: '0 10px 10px 0',
                                        borderLeft: 'none',
                                        width: '100%'
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmAddPage()}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                            <button className="create-btn" onClick={confirmAddPage}>Create Page</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="delete-modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="delete-modal-icon">
                            <FaTrash />
                        </div>
                        <h3>Delete Page?</h3>
                        <p>
                            Are you sure you want to delete <strong>{pageToDelete?.title}</strong>?
                            This action cannot be undone and the page will be permanently removed.
                        </p>
                        <div className="delete-modal-actions">
                            <button
                                className="delete-cancel-btn"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="delete-confirm-btn"
                                onClick={confirmDeletePage}
                            >
                                Yes, Delete Page
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {isRenameModalOpen && (
                <div className="add-page-modal-overlay" onClick={() => setIsRenameModalOpen(false)}>
                    <div className="add-page-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Page Name</h3>
                            <button className="close-x" onClick={() => setIsRenameModalOpen(false)}><FaPlus style={{ transform: 'rotate(45deg)' }} /></button>
                        </div>
                        <div className="modal-body">
                            <label>Page Name</label>
                            <input
                                type="text"
                                placeholder="Enter page name"
                                value={renameTitle}
                                onChange={(e) => setRenameTitle(e.target.value)}
                                autoFocus
                            />

                            {/* Allow slug edit only if it's NOT the home page to prevent breaking the site root */}
                            {!(pageToRename?.slug === '' || pageToRename?.slug === '/' || pageToRename?.slug === (pageToRename?._id || pageToRename?.id)) && (
                                <>
                                    <label style={{ marginTop: '15px', display: 'block' }}>URL Slug</label>
                                    <div className="slug-input-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '12px 10px 12px 16px',
                                            background: '#f1f5f9',
                                            border: '1.5px solid #e2e8f0',
                                            borderRight: 'none',
                                            borderRadius: '10px 0 0 10px',
                                            color: '#64748b',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}>/</span>
                                        <input
                                            type="text"
                                            placeholder="page-url"
                                            value={renameSlug}
                                            onChange={(e) => setRenameSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                            style={{
                                                borderRadius: '0 10px 10px 0',
                                                borderLeft: 'none',
                                                width: '100%'
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setIsRenameModalOpen(false)}>Cancel</button>
                            <button className="create-btn" onClick={confirmRenamePage}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pages;
