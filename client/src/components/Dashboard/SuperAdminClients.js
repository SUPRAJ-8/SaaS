import React, { useState, useEffect } from 'react';
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
    FaCheckCircle,
    FaFilter,
    FaArrowUp,
    FaEdit
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import API_URL from '../../apiConfig';
import ConfirmationModal from './ConfirmationModal';
import './SuperAdminDashboard.css';

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

    // Helper function to get API URL with fallback
    const getApiUrl = (endpoint) => {
        if (API_URL) {
            return `${API_URL}${endpoint}`;
        }
        return endpoint;
    };

    // Helper function to handle API calls with fallback
    const apiCall = async (method, endpoint, data = null, config = {}) => {
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
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        console.log('API_URL value:', API_URL);
        console.log('Current hostname:', window.location.hostname);
        try {
            const response = await apiCall('get', '/api/super-admin/clients');
            console.log('✅ Successfully fetched clients:', response.data?.length || 0, 'clients');
            // Ensure response.data is always an array
            const clientsData = Array.isArray(response.data) ? response.data : [];
            setClients(clientsData);
            setLoading(false);
        } catch (error) {
            console.error('❌ Error fetching clients:', error);
            toast.error('Failed to fetch tenants');
            setClients([]); // Set to empty array on error
            setLoading(false);
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
        setItemToDelete(id);
        setIsDeletingFromModal(isFromModal);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await apiCall('delete', `/api/super-admin/clients/${itemToDelete}`);
            toast.success('Tenant deleted successfully');

            if (isDeletingFromModal) {
                // Update user stores list if delete happened inside modal
                setUserStores(prev => prev.filter(s => s._id !== itemToDelete));
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
        <div className="saas-admin-container">
            {/* Sidebar */}
            <aside className="saas-sidebar">
                <div className="saas-logo">
                    <div className="logo-box">W</div>
                    SaaS Admin
                </div>

                <div className="sidebar-group">
                    <div className="sidebar-label">Main Menu</div>
                    <div className="sidebar-item">
                        <FaChartLine className="sidebar-icon" /> Dashboard
                    </div>
                    <div className="sidebar-item active">
                        <FaUsers className="sidebar-icon" /> Tenants
                    </div>
                    <div className="sidebar-item">
                        <FaCreditCard className="sidebar-icon" /> Plans & Billing
                    </div>
                    <div className="sidebar-item">
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
                <header className="top-nav">
                    <div className="page-title-section">
                        <h2>Tenant Management</h2>
                        <p>Overview and controls for all SaaS stores</p>
                    </div>
                    <div className="top-actions">
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

                    <table className="tenants-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input type="checkbox" className="saas-checkbox" onClick={(e) => e.stopPropagation()} />
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
                                <tr key={client._id} className="tenant-row" onClick={() => fetchUserStores(client.ownerEmail, client.ownerName)}>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" className="saas-checkbox" />
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
                                            className="plan-pill"
                                        >
                                            <option value="free">Free</option>
                                            <option value="basic">Basic</option>
                                            <option value="pro">Pro</option>
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
            </main>

            {/* Store Details Modal */}
            {isModalOpen && (
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
                                                            <div className="btn-square btn-blue" title="Visit Store" onClick={() => window.open(`https://${store.subdomain}.nepostore.xyz`, '_blank')}>
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
            )}

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
            >
                Are you sure you want to delete this tenant? This action is irreversible and will remove all associated data.
            </ConfirmationModal>
        </div>
    );
};

export default SuperAdminClients;
