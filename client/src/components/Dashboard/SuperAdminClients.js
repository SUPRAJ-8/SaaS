import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    FaUsers,
    FaStore,
    FaCreditCard,
    FaCog,
    FaSearch,
    FaEye,
    FaTrash,
    FaChartLine,
    FaDollarSign,
    FaShoppingBag,
    FaBell,
    FaPlus,
    FaLayerGroup,
    FaBullhorn,
    FaWrench,
    FaEdit,
    FaComments,
    FaCheckCircle,
    FaFilter,
    FaArrowUp,
    FaSun,
    FaMoon,
    FaFileAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import API_URL from '../../apiConfig';
import ConfirmationModal from './ConfirmationModal';
import SuperAdminThemes from './SuperAdminThemes';
import SuperAdminTemplates from './SuperAdminTemplates';
import './SuperAdminDashboard.css';

// Helper function to get API URL with fallback - defined outside to prevent reference changes
const getApiUrl = (endpoint) => {
    if (API_URL) {
        return `${API_URL}${endpoint}`;
    }
    return endpoint;
};

const SuperAdminClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userStores, setUserStores] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    // Delete confirmation state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeletingFromModal, setIsDeletingFromModal] = useState(false);
    const [deleteType, setDeleteType] = useState('single'); // 'single' or 'bulk'

    const [selectedClients, setSelectedClients] = useState([]);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({
        totalStores: 0,
        activeSubscriptions: 0,
        totalUsers: 0,
        platformRevenue: 0,
        recentStores: [],
        planDistribution: [],
        monthlySignups: []
    });
    const [statsLoading, setStatsLoading] = useState(true);

    // Live Chat & WhatsApp state
    const [tawkId, setTawkId] = useState('');
    const [whatsAppNum, setWhatsAppNum] = useState('');
    const [isSavingChat, setIsSavingChat] = useState(false);

    // Theme State
    const [theme, setTheme] = useState(localStorage.getItem('saas-theme') || 'dark');

    useEffect(() => {
        localStorage.setItem('saas-theme', theme);
    }, [theme]);

    // Helper function to handle API calls with fallback
    const apiCall = useCallback(async (method, endpoint, data = null, config = {}) => {
        const url = getApiUrl(endpoint);
        const axiosConfig = { ...config, withCredentials: true };

        try {
            let response;
            if (method === 'get') {
                response = await axios.get(url, axiosConfig);
            } else if (method === 'post') {
                response = await axios.post(url, data, axiosConfig);
            } else if (method === 'patch') {
                response = await axios.patch(url, data, axiosConfig);
            } else if (method === 'delete') {
                response = await axios.delete(url, axiosConfig);
            }
            return response;
        } catch (error) {
            // If 404 and no API_URL (using proxy), try direct backend
            if (error.response?.status === 404 && !API_URL) {
                console.log('🔄 Proxy failed, trying direct backend URL...');
                const fallbackUrl = `http://localhost:5002${endpoint}`;
                try {
                    let fallbackResponse;
                    if (method === 'get') {
                        fallbackResponse = await axios.get(fallbackUrl, axiosConfig);
                    } else if (method === 'post') {
                        fallbackResponse = await axios.post(fallbackUrl, data, axiosConfig);
                    } else if (method === 'patch') {
                        fallbackResponse = await axios.patch(fallbackUrl, data, axiosConfig);
                    } else if (method === 'delete') {
                        fallbackResponse = await axios.delete(fallbackUrl, axiosConfig);
                    }
                    console.log('✅ Fallback successful');
                    return fallbackResponse;
                } catch (fallbackError) {
                    console.error('❌ Fallback also failed:', fallbackError);
                    throw fallbackError;
                }
            }
            throw error;
        }
    }, []);

    const fetchSiteSettings = useCallback(async () => {
        try {
            const response = await apiCall('get', '/api/super-admin/site-settings');
            if (response.data) {
                setTawkId(response.data.tawkToId || '');
                setWhatsAppNum(response.data.whatsAppNumber || '');
            }
        } catch (error) {
            console.error('Error fetching site settings:', error);
        }
    }, [apiCall]);

    const fetchClients = useCallback(async () => {
        try {
            const response = await apiCall('get', '/api/super-admin/clients');
            const clientsData = Array.isArray(response.data) ? response.data : [];
            setClients(clientsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching clients:', error);
            toast.error('Failed to fetch tenants');
            setClients([]);
            setLoading(false);
        }
    }, [apiCall]);

    const fetchDashboardStats = useCallback(async () => {
        try {
            const response = await apiCall('get', '/api/super-admin/dashboard-stats');
            if (response.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, [apiCall]);

    useEffect(() => {
        fetchClients();
        fetchSiteSettings();
        fetchDashboardStats();
    }, [fetchClients, fetchSiteSettings, fetchDashboardStats]);

    const saveSiteSettings = async () => {
        if (!tawkId) {
            toast.warning('Please enter a tawk.to ID');
            return;
        }

        // Handle full URL if pasted: https://tawk.to/chat/677.../1ig...
        let cleanedId = tawkId.trim();
        if (cleanedId.includes('tawk.to/chat/')) {
            const parts = cleanedId.split('tawk.to/chat/')[1].split('/');
            if (parts.length >= 2) {
                cleanedId = `${parts[0]}/${parts[1]}`;
            }
        } else if (cleanedId.includes('embed.tawk.to/')) {
            const parts = cleanedId.split('embed.tawk.to/')[1].split('/');
            if (parts.length >= 2) {
                cleanedId = `${parts[0]}/${parts[1]}`;
            }
        }

        setIsSavingChat(true);
        try {
            await apiCall('post', '/api/super-admin/site-settings', {
                tawkToId: cleanedId,
                whatsAppNumber: whatsAppNum
            });
            setTawkId(cleanedId); // Update state to show cleaned version
            toast.success('Plugin settings saved successfully');
        } catch (error) {
            console.error('Error saving site settings:', error);
            const errorMsg = error.response?.data?.msg || error.message || 'Failed to save settings';
            toast.error(`Failed to save: ${errorMsg}`);
        } finally {
            setIsSavingChat(false);
        }
    };

    const updateStatus = async (id, field, value) => {
        try {
            await apiCall('patch', `/api/super-admin/clients/${id}`, { [field]: value });
            toast.success('Updated successfully');
            fetchClients();
        } catch (error) {
            console.error('Error updating client:', error);
            toast.error('Failed to update');
        }
    };

    const fetchUserStores = async (email, ownerName) => {
        console.log('Fetching stores for:', email);
        setModalLoading(true);
        setSelectedUser({ name: ownerName, email });
        setIsModalOpen(true);
        try {
            const response = await apiCall('get', `/api/super-admin/user-stores/${encodeURIComponent(email)}`);
            console.log('Fetched stores:', response.data);
            setUserStores(response.data);
        } catch (error) {
            console.error('Error fetching user stores:', error);
            toast.error('Failed to fetch details');
        } finally {
            setModalLoading(false);
        }
    };

    const deleteClient = (id, isFromModal = false) => {
        setDeleteType('single');
        setItemToDelete(id);
        setIsDeletingFromModal(isFromModal);
        setIsConfirmOpen(true);
    };

    const handleBulkDelete = () => {
        setDeleteType('bulk');
        setIsConfirmOpen(true);
    };

    const handleBulkUpdatePlan = async (plan) => {
        if (!selectedClients.length) {
            toast.warning('No tenants selected');
            return;
        }

        console.log(`Bulk updating ${selectedClients.length} tenants to plan: ${plan}`);
        try {
            const res = await apiCall('post', '/api/super-admin/bulk-plan', { ids: selectedClients, plan });
            console.log('Bulk plan update response:', res.data);
            toast.success(`Successfully updated ${selectedClients.length} tenants to ${plan}`);
            setSelectedClients([]);
            fetchClients();
        } catch (error) {
            console.error('Error bulk updating plans:', error);
            const msg = error.response?.data?.msg || 'Failed to update plans';
            toast.error(msg);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filteredClients.map(c => c._id);
            setSelectedClients(allIds);
        } else {
            setSelectedClients([]);
        }
    };

    const handleSelectOne = (e, id) => {
        e.stopPropagation();
        if (e.target.checked) {
            setSelectedClients(prev => [...prev, id]);
        } else {
            setSelectedClients(prev => prev.filter(clientId => clientId !== id));
        }
    };

    const handleConfirmDelete = async () => {
        try {
            if (deleteType === 'single') {
                if (!itemToDelete) return;
                await apiCall('delete', `/api/super-admin/clients/${itemToDelete}`);
                toast.success('Tenant deleted successfully');
                if (isDeletingFromModal) {
                    setUserStores(prev => prev.filter(s => s._id !== itemToDelete));
                }
            } else {
                await apiCall('post', '/api/super-admin/bulk-delete', { ids: selectedClients });
                toast.success(`${selectedClients.length} tenants deleted successfully`);
                setSelectedClients([]);
            }

            // Always refresh main list
            fetchClients();
            setIsConfirmOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Error deleting client:', error);
            toast.error('Failed to delete tenant');
        }
    };

    const filteredClients = Array.isArray(clients) ? clients.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client._id?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    if (loading) return (
        <div style={{ background: '#0b0e14', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <div className="loader">Loading Super Admin...</div>
        </div>
    );

    return (
        <div className={`saas-admin-container ${theme === 'light' ? 'light-mode' : ''}`}>
            {/* Sidebar */}
            <aside className="saas-sidebar">
                <div className="saas-logo">
                    <div className="logo-box">W</div>
                    SaaS Admin
                </div>

                <div className="sidebar-group">
                    <div className="sidebar-label">Main Menu</div>
                    <div className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <FaChartLine className="sidebar-icon" /> Dashboard
                    </div>
                    <div className={`sidebar-item ${activeTab === 'tenants' ? 'active' : ''}`} onClick={() => setActiveTab('tenants')}>
                        <FaUsers className="sidebar-icon" /> Tenants
                    </div>
                    <div className={`sidebar-item ${activeTab === 'livechat' ? 'active' : ''}`} onClick={() => setActiveTab('livechat')}>
                        <FaComments className="sidebar-icon" /> Live Chat
                    </div>
                    <div className={`sidebar-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
                        <FaCreditCard className="sidebar-icon" /> Plans & Billing
                    </div>
                    <div className={`sidebar-item ${activeTab === 'themes' ? 'active' : ''}`} onClick={() => setActiveTab('themes')}>
                        <FaLayerGroup className="sidebar-icon" /> Themes Manager
                    </div>
                    <div className={`sidebar-item ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
                        <FaFileAlt className="sidebar-icon" /> Templates Manager
                    </div>
                    <div className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                        <FaCog className="sidebar-icon" /> Settings
                    </div>
                </div>

                <div className="sidebar-footer">
                    <div className="admin-avatar">
                        <img src="https://ui-avatars.com/api/?name=Admin+User&background=3b82f6&color=fff" alt="Admin" />
                    </div>
                    <div className="admin-info">
                        <h4>Admin User</h4>
                        <p>super@saas.com</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="saas-main">
                {activeTab === 'dashboard' ? (
                    <>
                        <header className="top-nav">
                            <div className="page-title-section">
                                <h2>Super Admin Dashboard</h2>
                                <p>Platform overview and business performance</p>
                            </div>
                            <div className="top-actions">
                                <button className="theme-toggle-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
                                    {theme === 'dark' ? <FaSun /> : <FaMoon style={{ color: '#3b82f6' }} />}
                                </button>
                                <div className="notification-btn">
                                    <FaBell />
                                </div>
                                <button className="btn-add-tenant" onClick={() => toast.info('Deployment controls coming soon')}>
                                    <FaWrench /> System Health
                                </button>
                            </div>
                        </header>

                        {/* Stat Cards */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-card-header">
                                    Total Platform Revenue
                                    <div className="stat-icon-bg"><FaDollarSign /></div>
                                </div>
                                <div className="stat-card-value">
                                    ${stats.platformRevenue.toLocaleString()} <span className="stat-trend"><FaArrowUp /> 12%</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-header">
                                    Total Tenants
                                    <div className="stat-icon-bg"><FaStore /></div>
                                </div>
                                <div className="stat-card-value">
                                    {stats.totalStores} <span className="stat-trend"><FaArrowUp /> {Math.round((stats.totalStores / 10) * 100) || 0}%</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-header">
                                    Total Platform Users
                                    <div className="stat-icon-bg"><FaUsers /></div>
                                </div>
                                <div className="stat-card-value">
                                    {stats.totalUsers} <span className="stat-trend"><FaArrowUp /> 8%</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-header">
                                    Active Subscriptions
                                    <div className="stat-icon-bg"><FaCheckCircle /></div>
                                </div>
                                <div className="stat-card-value">
                                    {stats.activeSubscriptions} <span className="stat-trend"><FaArrowUp /> 5%</span>
                                </div>
                            </div>
                        </div>

                        <div className="secondary-section" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: '32px' }}>
                            <div className="tenants-section" style={{ marginBottom: 0 }}>
                                <div className="section-header">
                                    <h3>Recently Joined Stores</h3>
                                    <button className="btn-page active" onClick={() => setActiveTab('tenants')}>View All</button>
                                </div>
                                <table className="tenants-table">
                                    <thead>
                                        <tr>
                                            <th>Store Name</th>
                                            <th>Owner</th>
                                            <th>Plan</th>
                                            <th>Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recentStores.map(store => (
                                            <tr key={store._id}>
                                                <td>
                                                    <div className="modal-store-name-wrapper">
                                                        <div className="modal-store-logo">{store.name.charAt(0).toUpperCase()}</div>
                                                        <div className="modal-store-name">
                                                            <strong>{store.name}</strong>
                                                            <span>{store.subdomain}.nepostore.xyz</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{store.ownerEmail}</td>
                                                <td><span className={`plan-pill plan-${store.subscriptionPlan}`}>{store.subscriptionPlan}</span></td>
                                                <td>{new Date(store.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="inner-panel">
                                <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>Plan Distribution</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {stats.planDistribution.map(plan => (
                                        <div key={plan._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                                            <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{plan._id || 'Free'}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '100px', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${(plan.count / stats.totalStores) * 100}%`, height: '100%', background: 'var(--brand-blue)' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{plan.count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="secondary-section">
                            <div className="inner-panel">
                                <div className="panel-title"><FaChartLine className="icon" /> Growth Analytics</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monthly signup trends and user acquisition data.</p>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '150px', marginTop: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                                    {stats.monthlySignups.map((data, i) => (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: `${(data.count / (Math.max(...stats.monthlySignups.map(d => d.count)) || 1)) * 100}px`,
                                                    background: 'var(--brand-blue)',
                                                    borderRadius: '4px 4px 0 0',
                                                    opacity: 0.7 + (i * 0.05)
                                                }}
                                            />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>M{data._id.month}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="inner-panel">
                                <div className="panel-title"><FaBullhorn className="icon" /> Platform Announcements</div>
                                <div className="inner-item-row" style={{ marginBottom: '12px' }}>
                                    <span>System Maintenance - Jan 15</span>
                                    <FaEdit style={{ cursor: 'pointer', color: 'var(--brand-blue)' }} onClick={() => toast.info('Announcement editor coming soon')} />
                                </div>
                                <div className="inner-item-row">
                                    <span>New Feature: AI Logo Generator</span>
                                    <FaEdit style={{ cursor: 'pointer', color: 'var(--brand-blue)' }} />
                                </div>
                                <button className="btn-add-tenant" style={{ width: '100%', marginTop: '20px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}>
                                    <FaPlus /> Create Announcement
                                </button>
                            </div>
                        </div>
                    </>
                ) : activeTab === 'tenants' ? (
                    <>
                        <header className="top-nav">
                            <div className="page-title-section">
                                <h2>Tenant Management</h2>
                                <p>Overview and controls for all SaaS stores</p>
                            </div>
                            <div className="top-actions">
                                <button className="theme-toggle-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
                                    {theme === 'dark' ? <FaSun /> : <FaMoon style={{ color: '#3b82f6' }} />}
                                </button>
                                <div className="notification-btn">
                                    <FaBell />
                                </div>
                                <button className="btn-add-tenant">
                                    <FaPlus /> Add New Tenant
                                </button>
                            </div>
                        </header>

                        {/* Stat Cards */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-card-header">
                                    Total Stores
                                    <div className="stat-icon-bg"><FaStore /></div>
                                </div>
                                <div className="stat-card-value">
                                    {Array.isArray(clients) ? clients.length.toLocaleString() : 0} <span className="stat-trend"><FaArrowUp /> 5%</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-header">
                                    Active Subscriptions
                                    <div className="stat-icon-bg"><FaCheckCircle /></div>
                                </div>
                                <div className="stat-card-value">
                                    {Array.isArray(clients) ? clients.filter(c => c.subscriptionStatus === 'active').length : 0} <span className="stat-trend"><FaArrowUp /> 21%</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-header">
                                    MRR
                                    <div className="stat-icon-bg"><FaDollarSign /></div>
                                </div>
                                <div className="stat-card-value">
                                    $45.2k <span className="stat-trend"><FaArrowUp /> 10%</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-header">
                                    Platform GMV
                                    <div className="stat-icon-bg"><FaShoppingBag /></div>
                                </div>
                                <div className="stat-card-value">
                                    $1.2M <span className="stat-trend"><FaArrowUp /> 15%</span>
                                </div>
                            </div>
                        </div>

                        {/* All Tenants Table Card */}
                        <div className="tenants-section">
                            <div className="section-header">
                                <h3>All Tenants <span className="count-badge">({clients.length})</span></h3>
                                <div className="search-controls">
                                    <div className="search-wrapper">
                                        <FaSearch className="search-icon" />
                                        <input
                                            type="text"
                                            placeholder="Search tenants..."
                                            className="search-input"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <button className="filter-btn"><FaFilter /></button>
                                </div>
                            </div>

                            {/* Bulk Actions Bar - Top Positioned */}
                            {selectedClients.length > 0 && (
                                <div className="orders-bulk-actions-bar top-bar active">
                                    <div className="bulk-actions-content">
                                        <div className="bulk-selection-info">
                                            <span className="selection-count">{selectedClients.length} tenants selected</span>
                                            <button className="clear-selection-btn" onClick={() => setSelectedClients([])}>Deselect All</button>
                                        </div>
                                        <div className="bulk-action-groups">
                                            <div className="bulk-action-group">
                                                <span className="group-label">Update Plan:</span>
                                                <select
                                                    className="bulk-select plan-dropdown"
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleBulkUpdatePlan(e.target.value);
                                                            e.target.value = ''; // Reset after use
                                                        }
                                                    }}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Choose Plan...</option>
                                                    <option value="free">Free</option>
                                                    <option value="basic">Basic</option>
                                                    <option value="pro">Pro</option>
                                                    <option value="platinum">Platinum</option>
                                                    <option value="enterprise">Enterprise</option>
                                                </select>
                                            </div>
                                            <div className="bulk-divider"></div>
                                            <button className="orders-bulk-delete-btn" onClick={handleBulkDelete}>
                                                <FaTrash /> Bulk Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <table className="tenants-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                className="saas-checkbox"
                                                onChange={handleSelectAll}
                                                checked={filteredClients.length > 0 && filteredClients.every(c => selectedClients.includes(c._id))}
                                            />
                                        </th>
                                        <th style={{ width: '80px' }}>#</th>
                                        <th>Store Owner</th>
                                        <th>Contact</th>
                                        <th>Joined</th>
                                        <th>Plan</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map(client => (
                                        <tr
                                            key={client._id}
                                            className={`tenant-row ${selectedClients.includes(client._id) ? 'row-selected' : ''}`}
                                            onClick={() => fetchUserStores(client.ownerEmail, client.ownerName)}
                                        >
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="saas-checkbox"
                                                    checked={selectedClients.includes(client._id)}
                                                    onChange={(e) => handleSelectOne(e, client._id)}
                                                />
                                            </td>
                                            <td>
                                                <div className="id-badge">ID: #{client._id.slice(-4).toUpperCase()}</div>
                                            </td>
                                            <td>
                                                <div className="store-info-wrapper">
                                                    <div className="store-name-box">
                                                        <h4>{client.ownerName}</h4>
                                                        <p>{client.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="contact-cell">
                                                    <div className="email-link">{client.ownerEmail}</div>
                                                    <div className="phone-num">{client.ownerPhone}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="join-date">
                                                    {new Date(client.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td>
                                                <select
                                                    value={client.subscriptionPlan}
                                                    onChange={(e) => updateStatus(client._id, 'subscriptionPlan', e.target.value)}
                                                    onClick={(e) => e.stopPropagation()} // Prevent modal when choosing plan
                                                    className={`plan-pill plan-${client.subscriptionPlan}`}
                                                >
                                                    <option value="free">Free</option>
                                                    <option value="basic">Basic</option>
                                                    <option value="pro">Pro</option>
                                                    <option value="platinum">Platinum</option>
                                                    <option value="enterprise">Enterprise</option>
                                                </select>
                                            </td>
                                            <td>
                                                <div className="action-btns" onClick={(e) => e.stopPropagation()}>
                                                    <div className="btn-square btn-blue" onClick={() => fetchUserStores(client.ownerEmail, client.ownerName)} title="View Stores"><FaEye /></div>
                                                    <div className="btn-square btn-orange" onClick={() => toast.info('Edit mode coming soon')} title="Edit Owner"><FaEdit /></div>
                                                    <div className="btn-square btn-red" onClick={() => deleteClient(client._id)} title="Delete Store"><FaTrash /></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="pagination-row">
                                <div className="pagination-info">
                                    Showing 1-{filteredClients.length} of {Array.isArray(clients) ? clients.length : 0} tenants
                                </div>
                                <div className="pagination-btns">
                                    <button className="btn-page">Prev</button>
                                    <button className="btn-page active">1</button>
                                    <button className="btn-page">2</button>
                                    <button className="btn-page">3</button>
                                    <button className="btn-page">Next</button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Panels */}
                        <div className="secondary-section">
                            <div>
                                <div className="panel-title"><FaLayerGroup className="icon" /> Revenue & Subscriptions</div>
                                <div className="inner-panel">
                                    <div className="inner-item-row">
                                        <span>Plan Overrides</span>
                                        <FaPlus style={{ cursor: 'pointer' }} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="panel-title"><FaWrench className="icon" /> Platform Maintenance</div>
                                <div className="inner-panel">
                                    <div className="inner-item-row">
                                        <span><FaBullhorn style={{ marginRight: '8px' }} /> Broadcast Message</span>
                                        <FaPlus style={{ cursor: 'pointer' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : activeTab === 'livechat' ? (
                    <div className="live-chat-settings">
                        <header className="top-nav">
                            <div className="page-title-section">
                                <h2>Plugin Configuration</h2>
                                <p>Manage tawk.to and WhatsApp integration for the platform</p>
                            </div>
                            <div className="top-actions">
                                <button className="theme-toggle-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
                                    {theme === 'dark' ? <FaSun /> : <FaMoon style={{ color: '#3b82f6' }} />}
                                </button>
                            </div>
                        </header>

                        <div className="tenants-section" style={{ maxWidth: '600px', margin: '2rem 0' }}>
                            <div className="section-header">
                                <h3>Global Plugins</h3>
                            </div>
                            <div className="settings-form" style={{ padding: '1.5rem' }}>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        tawk.to Property ID / Widget Key
                                    </label>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="e.g. 64b73.../1igob96l7"
                                        style={{ width: '100%', padding: '0.8rem' }}
                                        value={tawkId}
                                        onChange={(e) => setTawkId(e.target.value)}
                                    />
                                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                        Paste the <strong>Widget Key</strong> (e.g., 677.../1ig...). Found in tawk.to Admin {'>'} Chat Widget {'>'} Direct Chat Link section.
                                    </p>
                                </div>

                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        WhatsApp Business Number
                                    </label>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="e.g. +9779840007310"
                                        style={{ width: '100%', padding: '0.8rem' }}
                                        value={whatsAppNum}
                                        onChange={(e) => setWhatsAppNum(e.target.value)}
                                    />
                                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                        Enter your WhatsApp number with country code (e.g., +9779840007310).
                                    </p>
                                </div>

                                <button
                                    className="btn-add-tenant"
                                    style={{ width: '100%' }}
                                    onClick={saveSiteSettings}
                                    disabled={isSavingChat}
                                >
                                    {isSavingChat ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </div>

                        <div className="secondary-section">
                            <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '1.5rem', borderRadius: '12px' }}>
                                <h4 style={{ color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                                    <FaComments style={{ marginRight: '10px', color: '#3b82f6' }} /> About Platform Plugins
                                </h4>
                                <ul style={{ color: '#94a3b8', fontSize: '0.9rem', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                                    <li>These settings apply to the main landing page and platform-wide pages.</li>
                                    <li><strong>tawk.to:</strong> 100% Free live chat software.</li>
                                    <li><strong>WhatsApp:</strong> Direct chat link for quick customer support.</li>
                                    <li>Tenants can configure their own plugins in their own dashboard.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'themes' ? (
                    <SuperAdminThemes />
                ) : activeTab === 'templates' ? (
                    <SuperAdminTemplates />
                ) : (
                    <div className="other-tab-placeholder">
                        <header className="top-nav">
                            <div className="page-title-section">
                                <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                                <p>Section coming soon</p>
                            </div>
                            <div className="top-actions">
                                <button className="theme-toggle-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
                                    {theme === 'dark' ? <FaSun /> : <FaMoon style={{ color: '#3b82f6' }} />}
                                </button>
                            </div>
                        </header>
                    </div>
                )
                }
            </main >

            {/* Store Details Modal */}
            {
                isModalOpen && (
                    <div className="saas-modal-overlay" onClick={() => setIsModalOpen(false)}>
                        <div className="saas-modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="owner-profile-summary">
                                    <img src={`https://ui-avatars.com/api/?name=${selectedUser?.name}&background=3b82f6&color=fff`} alt="" />
                                    <div>
                                        <h3>{selectedUser?.name}</h3>
                                        <p>{selectedUser?.email}</p>
                                    </div>
                                </div>
                                <button className="close-modal" onClick={() => setIsModalOpen(false)}>&times;</button>
                            </div>

                            <div className="modal-body">
                                {modalLoading ? (
                                    <div className="modal-loader">Loading store details...</div>
                                ) : (
                                    <div className="modal-stores-table-container">
                                        <table className="modal-stores-table">
                                            <thead>
                                                <tr>
                                                    <th>Store Name</th>
                                                    <th>Products</th>
                                                    <th>Orders</th>
                                                    <th>Joined</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userStores.map(store => (
                                                    <tr key={store._id}>
                                                        <td>
                                                            <div className="modal-store-name-wrapper">
                                                                <div className="modal-store-logo">
                                                                    {store.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="modal-store-name">
                                                                    <strong>{store.name}</strong>
                                                                    <span>sku: {store.subdomain}.nepostore.xyz</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{store.productCount?.toLocaleString() || 0}</td>
                                                        <td>{store.orderCount?.toLocaleString() || 0}</td>
                                                        <td>
                                                            {new Date(store.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: '2-digit',
                                                                year: 'numeric'
                                                            })}
                                                        </td>
                                                        <td>
                                                            <div className="action-btns">
                                                                <div className="btn-square btn-blue" title="Visit Store" onClick={() => {
                                                                    const isLocal = window.location.hostname.includes('localhost');
                                                                    const host = isLocal ? 'localhost:3000' : 'nepostore.xyz';
                                                                    const proto = isLocal ? 'http' : 'https';
                                                                    // If using local custom domains via hosts file, respect that too
                                                                    const currentHost = window.location.hostname;
                                                                    const port = window.location.port ? `:${window.location.port}` : '';

                                                                    let url;
                                                                    if (currentHost.includes('nepostore.xyz') && (window.location.protocol === 'http:' || port)) {
                                                                        // Local testing with specific domain
                                                                        url = `http://${store.subdomain}.nepostore.xyz${port}`;
                                                                    } else if (isLocal) {
                                                                        url = `http://${store.subdomain}.localhost:3000`;
                                                                    } else {
                                                                        url = `https://${store.subdomain}.nepostore.xyz`;
                                                                    }
                                                                    window.open(url, '_blank');
                                                                }}>
                                                                    <FaEye />
                                                                </div>
                                                                <div className="btn-square btn-orange" title="Edit Store" onClick={() => toast.info('Edit mode coming soon')}>
                                                                    <FaEdit />
                                                                </div>
                                                                <div className="btn-square btn-red" onClick={() => deleteClient(store._id, true)} title="Delete Store">
                                                                    <FaTrash />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title={deleteType === 'single' ? "Delete Tenant?" : "Delete Multiple Tenants?"}
                confirmText="Yes, Delete"
                cancelText="No, Keep"
            >
                {deleteType === 'single'
                    ? "Are you sure you want to delete this tenant and all their associated data? This action cannot be undone."
                    : `Are you sure you want to delete ${selectedClients.length} selected tenants and all their data? This action is permanent.`}
            </ConfirmationModal>
        </div>
    );
};

export default SuperAdminClients;
