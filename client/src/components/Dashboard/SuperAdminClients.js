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
    FaArrowUp
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import API_URL from '../../apiConfig';
import './SuperAdminDashboard.css';

const SuperAdminClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/super-admin/clients`);
            // Ensure response.data is always an array
            setClients(Array.isArray(response.data) ? response.data : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching clients:', error);
            toast.error('Failed to fetch tenants');
            setClients([]); // Set to empty array on error
            setLoading(false);
        }
    };

    const updateStatus = async (id, field, value) => {
        try {
            await axios.patch(`/api/super-admin/clients/${id}`, { [field]: value });
            toast.success('Updated successfully');
            fetchClients();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const deleteClient = async (id) => {
        if (window.confirm('Are you sure you want to delete this tenant? This action is irreversible.')) {
            try {
                await axios.delete(`/api/super-admin/clients/${id}`);
                toast.success('Tenant deleted successfully');
                fetchClients();
            } catch (error) {
                toast.error('Failed to delete tenant');
            }
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
                        <h3>All Tenants</h3>
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
                                <th>Store Name</th>
                                <th>Owner</th>
                                <th>Contact</th>
                                <th>Products</th>
                                <th>Orders</th>
                                <th>Plan</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map(client => (
                                <tr key={client._id}>
                                    <td>
                                        <div className="store-info-wrapper">
                                            <div className="id-badge">ID: #{client._id.slice(-4).toUpperCase()}</div>
                                            <div className="store-name-box">
                                                <h4>{client.name}</h4>
                                                <p>ID: #{client._id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>Admin User</td> {/* Standard owner placeholder or client.ownerName if available */}
                                    <td>{client.ownerEmail}</td>
                                    <td>450</td>
                                    <td>12,000</td>
                                    <td>
                                        <select
                                            value={client.subscriptionPlan}
                                            onChange={(e) => updateStatus(client._id, 'subscriptionPlan', e.target.value)}
                                            className="plan-pill"
                                        >
                                            <option value="free">Free</option>
                                            <option value="basic">Basic</option>
                                            <option value="pro">Pro</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <div className="btn-square btn-blue"><FaEye /></div>
                                            <div className="btn-square btn-red" onClick={() => deleteClient(client._id)}><FaTrash /></div>
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
        </div>
    );
};

export default SuperAdminClients;
