import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    FaSearch,
    FaPlus,
    FaWhatsapp,
    FaComments,
    FaGoogle,
    FaFacebook,
    FaEnvelope,
    FaCreditCard,
    FaCode,
    FaCheckCircle,
    FaCog,
    FaExternalLinkAlt,
    FaTimes,
    FaLink,
    FaTrash,
    FaInfoCircle
} from 'react-icons/fa';
import API_URL from '../../apiConfig';
import ConfirmationModal from './ConfirmationModal';
import './Plugins.css';

const Plugins = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlugin, setSelectedPlugin] = useState(null);
    const [configValue, setConfigValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [countryCode, setCountryCode] = useState('+977'); // Default to Nepal
    const [isRemoving, setIsRemoving] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const fetchPluginData = async () => {
        try {
            const userRes = await axios.get(`${API_URL}/auth/current_user`, { withCredentials: true });
            if (userRes.data && userRes.data.clientId) {
                // Use populated data if available or fetch from safe endpoint
                let clientData;
                if (typeof userRes.data.clientId === 'object' && userRes.data.clientId.subdomain) {
                    clientData = userRes.data.clientId;
                } else {
                    const clientRes = await axios.get(`${API_URL}/api/store-settings/my-store`, { withCredentials: true });
                    clientData = clientRes.data;
                }

                setClient(clientData);

                // If a plugin is already selected (e.g. after refresh), update its value
                if (selectedPlugin) {
                    const value = clientData.settings?.[selectedPlugin.configKey] || '';

                    // For WhatsApp, split country code and number
                    if (selectedPlugin.id === 'whatsapp' && value) {
                        // Extract country code (assumes format like +977...)
                        const match = value.match(/^(\+\d{1,4})(.*)$/);
                        if (match) {
                            setCountryCode(match[1]);
                            setConfigValue(match[2]);
                        } else {
                            setConfigValue(value);
                        }
                    } else {
                        setConfigValue(value);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching plugin data:', error);
            toast.error('Failed to load plugin data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPluginData();
    }, [selectedPlugin]);

    const handleConnect = (plugin) => {
        setSelectedPlugin(plugin);
        const value = client?.settings?.[plugin.configKey] || '';

        // For WhatsApp, split country code and number
        if (plugin.id === 'whatsapp' && value) {
            const match = value.match(/^(\+\d{1,4})(.*)$/);
            if (match) {
                setCountryCode(match[1]);
                setConfigValue(match[2]);
            } else {
                setConfigValue(value);
            }
        } else {
            setConfigValue(value);
        }

        setIsModalOpen(true);
    };

    const handleSave = async () => {
        // Validation for WhatsApp
        if (selectedPlugin.id === 'whatsapp') {
            const cleanNumber = configValue.replace(/\s/g, '');
            if (cleanNumber.length !== 10) {
                toast.error('Please enter a valid 10-digit phone number');
                return;
            }
            if (!/^\d+$/.test(cleanNumber)) {
                toast.error('Please enter only numbers');
                return;
            }
        }

        setIsSaving(true);
        try {
            // For WhatsApp, combine country code with number
            const finalValue = selectedPlugin.id === 'whatsapp'
                ? countryCode + configValue.replace(/\s/g, '') // Remove spaces from number
                : configValue;

            const updatedSettings = {
                ...client.settings,
                [selectedPlugin.configKey]: finalValue
            };

            await axios.put(`${API_URL}/api/store-settings`, updatedSettings, {
                withCredentials: true
            });

            toast.success(`${selectedPlugin.name} configured successfully!`);
            setIsModalOpen(false);
            fetchPluginData();
        } catch (error) {
            console.error('Error saving plugin config:', error);
            toast.error('Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = () => {
        setIsConfirmOpen(true);
    };

    const handleConfirmRemove = async () => {
        setIsConfirmOpen(false);
        setIsRemoving(true);
        try {
            const updatedSettings = {
                ...client.settings,
                [selectedPlugin.configKey]: '' // Clear the value
            };

            await axios.put(`${API_URL}/api/store-settings`, updatedSettings, {
                withCredentials: true
            });

            toast.success(`${selectedPlugin.name} removed successfully!`);
            setIsModalOpen(false);
            fetchPluginData();
        } catch (error) {
            console.error('Error removing plugin:', error);
            toast.error('Failed to remove plugin');
        } finally {
            setIsRemoving(false);
        }
    };

    const allPlugins = [
        {
            id: 'whatsapp',
            name: 'WhatsApp Business',
            description: 'Direct chat with customers via WhatsApp floating button. Enhance customer support and engagement effortlessly.',
            icon: <FaWhatsapp style={{ color: '#25D366' }} />,
            category: 'SUPPORT',
            status: client?.settings?.whatsappNumber ? 'Connected' : 'Available',
            configKey: 'whatsappNumber'
        },
        {
            id: 'tawkto',
            name: 'Tawk.to Live Chat',
            description: 'Free live chat software to monitor and chat with visitors. Provide instant answers and boost sales.',
            icon: <FaComments style={{ color: '#03A84E' }} />,
            category: 'SUPPORT',
            status: client?.settings?.tawkToId ? 'Connected' : 'Available',
            configKey: 'tawkToId'
        },
        {
            id: 'google_analytics',
            name: 'Google Analytics',
            description: 'Track and report website traffic with Google Analytics 4. Gain deep insights into your audience behavior.',
            icon: <FaGoogle style={{ color: '#4285F4' }} />,
            category: 'ANALYTICS',
            status: client?.settings?.googleAnalyticsId ? 'Connected' : 'Available',
            configKey: 'googleAnalyticsId'
        },
        {
            id: 'facebook_pixel',
            name: 'Facebook Pixel',
            description: 'Measure, optimize and build audiences for your ad campaigns. Retarget website visitors effectively.',
            icon: <FaFacebook style={{ color: '#1877F2' }} />,
            category: 'MARKETING',
            status: client?.settings?.facebookPixelId ? 'Connected' : 'Available',
            configKey: 'facebookPixelId'
        },
        {
            id: 'mailchimp',
            name: 'Mailchimp',
            description: 'Sync customers and automate email marketing campaigns. Build your audience and grow your brand.',
            icon: <FaEnvelope style={{ color: '#FFE01B' }} />,
            category: 'MARKETING',
            status: client?.settings?.mailchimpApiKey ? 'Connected' : 'Available',
            configKey: 'mailchimpApiKey'
        },
        {
            id: 'stripe',
            name: 'Stripe Payments',
            description: 'Accept credit cards and local payment methods globally. Secure and fast payment processing.',
            icon: <FaCreditCard style={{ color: '#635BFF' }} />,
            category: 'PAYMENTS',
            status: client?.settings?.stripePublicKey ? 'Connected' : 'Available',
            configKey: 'stripePublicKey'
        },
        {
            id: 'custom_script',
            name: 'Custom Scripts',
            description: 'Add custom HTML/JS to your header or footer sections. Perfect for advanced trackings and widgets.',
            icon: <FaCode style={{ color: '#8b5cf6' }} />,
            category: 'DEVELOPER',
            status: client?.settings?.customHeadScript ? 'Connected' : 'Available',
            configKey: 'customHeadScript'
        }
    ];

    const filteredPlugins = allPlugins.filter(plugin =>
        plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activePlugins = filteredPlugins.filter(p => p.status === 'Connected');
    const availablePlugins = filteredPlugins.filter(p => p.status === 'Available');

    if (loading) return <div className="plugins-loading">Loading Plugins...</div>;

    return (
        <div className="customers-page plugins-container-full">
            <div className="page-header">
                <div className="page-header-top">
                    <div>
                        <h1 className="page-title">Plugins & Integrations</h1>
                        <p className="page-subtitle">Connect your favorite tools to enhance your store's functionality. Manage all your third-party applications in one place.</p>
                    </div>
                    <button className="request-integration-btn">
                        <FaPlus /> Request Integration
                    </button>
                </div>
            </div>

            <div className="plugins-search-wrapper">
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search apps like WhatsApp, Google, Mailchimp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {activePlugins.length > 0 && (
                <div className="plugins-list-section">
                    <h3 className="section-label">
                        ACTIVE PLUGINS <span className="label-count">{activePlugins.length}</span>
                    </h3>
                    <div className="available-plugins-grid">
                        {activePlugins.map(plugin => (
                            <div key={plugin.id} className="available-plugin-card active-border">
                                <div className="card-header">
                                    <div className="plugin-icon-box">
                                        {plugin.icon}
                                    </div>
                                    <button className="settings-btn" onClick={() => handleConnect(plugin)}>
                                        <FaCog /> Configure
                                    </button>
                                </div>
                                <div className="card-body">
                                    <h3>{plugin.name}</h3>
                                    <p>{plugin.description}</p>
                                </div>
                                <div className="card-footer">
                                    <div className="connection-status-mini">
                                        <span className="dot-active"></span> Connected
                                    </div>
                                    <FaExternalLinkAlt className="info-icon" onClick={() => handleConnect(plugin)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="plugins-list-section">
                <h3 className="section-label">
                    AVAILABLE PLUGINS <span className="label-count">{availablePlugins.length}</span>
                </h3>
                <div className="available-plugins-grid">
                    {availablePlugins.map(plugin => (
                        <div key={plugin.id} className="available-plugin-card">
                            <div className="card-header">
                                <div className="plugin-icon-box">
                                    {plugin.icon}
                                </div>
                                <button className="connect-link-btn" onClick={() => handleConnect(plugin)}>
                                    <FaLink /> Connect
                                </button>
                            </div>
                            <div className="card-body">
                                <h3>{plugin.name}</h3>
                                <p>{plugin.description}</p>
                            </div>
                            <div className="card-footer">
                                <span className="type-tag">{plugin.category}</span>
                                <FaExternalLinkAlt className="info-icon" onClick={() => handleConnect(plugin)} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Plugin Configuration Modal */}
            {isModalOpen && selectedPlugin && (
                <div className="plugin-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="plugin-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-top">
                            <div className="plugin-header-info">
                                <div className="modal-plugin-icon">
                                    {selectedPlugin.icon}
                                </div>
                                <div>
                                    <h2>Configure {selectedPlugin.name}</h2>
                                    <p>{selectedPlugin.category} integration</p>
                                </div>
                            </div>
                            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="integration-hint">
                                {selectedPlugin.description}
                            </p>

                            <div className="config-form-group">
                                <label>
                                    {selectedPlugin.id === 'whatsapp' ? 'WhatsApp Business Number' :
                                        selectedPlugin.name + ' ' + (selectedPlugin.configKey.includes('Id') ? 'ID' : selectedPlugin.configKey.includes('Key') ? 'API Key' : 'Value')}
                                </label>

                                {selectedPlugin.id === 'whatsapp' ? (
                                    <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                                        <select
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            style={{
                                                width: '140px',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #e0e0e0',
                                                fontSize: '14px',
                                                backgroundColor: '#fff',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="+977">🇳🇵 +977 (Nepal)</option>
                                            <option value="+91">🇮🇳 +91 (India)</option>
                                            <option value="+1">🇺🇸 +1 (USA)</option>
                                            <option value="+44">🇬🇧 +44 (UK)</option>
                                            <option value="+86">🇨🇳 +86 (China)</option>
                                            <option value="+81">🇯🇵 +81 (Japan)</option>
                                            <option value="+82">🇰🇷 +82 (S. Korea)</option>
                                            <option value="+61">🇦🇺 +61 (Australia)</option>
                                            <option value="+971">🇦🇪 +971 (UAE)</option>
                                            <option value="+966">🇸🇦 +966 (Saudi)</option>
                                            <option value="+92">🇵🇰 +92 (Pakistan)</option>
                                            <option value="+880">🇧🇩 +880 (Bangladesh)</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="9888888888"
                                            value={configValue}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, ''); // Numbers only
                                                if (val.length <= 10) setConfigValue(val);
                                            }}
                                            style={{ flex: 1 }}
                                            autoFocus
                                            maxLength={10}
                                        />
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder={
                                            selectedPlugin.id === 'tawkto' ? 'Enter your tawk.to Widget Key' :
                                                `Enter your ${selectedPlugin.name} credentials...`
                                        }
                                        value={configValue}
                                        onChange={(e) => setConfigValue(e.target.value)}
                                        autoFocus
                                    />
                                )}

                                <div className="input-info">
                                    <FaInfoCircle />
                                    <span>
                                        {selectedPlugin.id === 'whatsapp' && "Enter your phone number without country code (e.g., 9888888888)"}
                                        {selectedPlugin.id === 'tawkto' && "Enter your tawk.to Widget Key from your tawk.to dashboard."}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <div className="footer-left">
                                {client?.settings?.[selectedPlugin.configKey] && (
                                    <button
                                        className="remove-plugin-btn"
                                        onClick={handleRemove}
                                        disabled={isRemoving || isSaving}
                                        title="Remove Integration"
                                    >
                                        <FaTrash /> Remove Plugin
                                    </button>
                                )}
                            </div>
                            <div className="footer-right">
                                <button className="cancel-pill-btn" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button className={`save-pill-btn ${isSaving ? 'btn-loading' : ''}`} onClick={handleSave} disabled={isSaving || isRemoving}>
                                    {isSaving ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="plugins-pagination-footer">
                <p>Showing {filteredPlugins.length} integrations</p>
                <div className="page-controls">
                    <button className="page-nav-btn" disabled>&lt;</button>
                    <button className="page-nav-btn" disabled>&gt;</button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmRemove}
                title={`Remove ${selectedPlugin?.name}`}
                confirmText="Yes, Remove"
                cancelText="Keep Plugin"
            >
                Are you sure you want to remove the <strong>{selectedPlugin?.name}</strong> integration? This will clear all configuration settings and disable the feature on your site.
            </ConfirmationModal>
        </div>
    );
};

export default Plugins;
