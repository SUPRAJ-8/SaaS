import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGlobe, FaLink, FaExclamationCircle, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import API_URL from '../../apiConfig';
import './SuperAdminDomains.css';

const SuperAdminDomains = () => {
    const [domains, setDomains] = useState([]);
    const [stats, setStats] = useState({
        totalDomains: 0,
        connectedDomains: 0,
        needsAttention: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchDomains = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/super-admin/domains`, { withCredentials: true });
            // Filter to only show clients with actual custom domains as per image
            const customDomainsOnly = res.data.filter(client => client.customDomain);
            setDomains(customDomainsOnly);
        } catch (error) {
            console.error('Error fetching domains:', error);
            toast.error('Failed to load domains');
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/super-admin/domains/stats`, { withCredentials: true });
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching domain stats:', error);
        }
    };

    useEffect(() => {
        const loadPageData = async () => {
            setLoading(true);
            await Promise.all([fetchDomains(), fetchStats()]);
            setLoading(false);
        };
        loadPageData();
    }, []);

    const handleDelete = async (clientId) => {
        if (!window.confirm('Are you sure you want to remove this custom domain configuration?')) return;

        try {
            await axios.patch(`${API_URL}/api/super-admin/clients/${clientId}`,
                { customDomain: null, customDomainStatus: 'none' },
                { withCredentials: true }
            );
            toast.success('Domain removed successfully');
            fetchDomains();
            fetchStats();
        } catch (error) {
            console.error('Error removing domain:', error);
            toast.error('Failed to remove domain');
        }
    };

    if (loading) return <div className="loader">Loading Domains...</div>;

    return (
        <div className="domains-container">
            <div className="domains-header">
                <h1>Domain Management</h1>
                <p>Monitor your connected store domains and their health status.</p>
            </div>

            <div className="domains-stats-row">
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">TOTAL DOMAINS</span>
                        <span className="stat-number">{stats.totalDomains}</span>
                    </div>
                    <div className="stat-icon-wrapper">
                        <FaGlobe className="icon-blue" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">CONNECTED</span>
                        <span className="stat-number">{stats.connectedDomains}</span>
                    </div>
                    <div className="stat-icon-wrapper">
                        <FaLink className="icon-green" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">NEEDS ATTENTION</span>
                        <span className="stat-number">{stats.needsAttention}</span>
                    </div>
                    <div className="stat-icon-wrapper">
                        <FaExclamationCircle className="icon-orange" />
                    </div>
                </div>
            </div>

            <div className="domains-table-card">
                <table className="domains-table">
                    <thead>
                        <tr>
                            <th>DOMAIN NAME</th>
                            <th>STORE NAME</th>
                            <th>STATUS</th>
                            <th>CREATED DATE</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {domains.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="empty-row">No custom domains configured</td>
                            </tr>
                        ) : (
                            domains.map((domain) => (
                                <tr key={domain._id}>
                                    <td className="col-domain">{domain.customDomain}</td>
                                    <td className="col-store">{domain.name}</td>
                                    <td className="col-status">
                                        <span className={`status-pill pill-${domain.customDomainStatus || 'pending'}`}>
                                            {domain.customDomainStatus === 'verified' ? 'CONNECTED' :
                                                domain.customDomainStatus === 'error' ? 'ERROR' : 'PENDING'}
                                        </span>
                                    </td>
                                    <td className="col-date">
                                        {new Date(domain.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="col-action">
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(domain._id)}
                                            title="Remove Domain"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SuperAdminDomains;
