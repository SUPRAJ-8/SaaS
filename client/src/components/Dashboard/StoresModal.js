import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaTimes, FaStore, FaPlus, FaExternalLinkAlt } from 'react-icons/fa';
import API_URL from '../../apiConfig';
import './StoresModal.css';

const StoresModal = ({ isOpen, onClose }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newStore, setNewStore] = useState({ name: '' });

  // Generate subdomain preview from store name
  const getSubdomainPreview = (storeName) => {
    if (!storeName || !storeName.trim()) return '';
    
    const hostname = window.location.hostname;
    let baseDomain = 'localhost';
    let port = window.location.port ? `:${window.location.port}` : '';
    
    if (hostname.includes('nepostore.xyz')) {
      baseDomain = 'nepostore.xyz';
      port = '';
    }
    
    const subdomain = storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'store';
    
    return `${subdomain}.${baseDomain}${port}`;
  };
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      fetchStores();
    }
  }, [isOpen]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/auth/my-stores`, {
        withCredentials: true
      });
      setStores(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to load stores');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      setShowCreateForm(false);
      setNewStore({ name: '' });
    }, 300);
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!newStore.name.trim()) {
      toast.error('Store name is required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/create-store`,
        {
          storeName: newStore.name.trim()
        },
        { withCredentials: true }
      );
      
      toast.success('Store created successfully!');
      setShowCreateForm(false);
      setNewStore({ name: '' });
      fetchStores(); // Refresh the list
    } catch (error) {
      console.error('Error creating store:', error);
      toast.error(error.response?.data?.msg || error.response?.data?.message || 'Failed to create store');
    } finally {
      setIsCreating(false);
    }
  };

  const getStoreUrl = (store) => {
    if (!store || !store.subdomain) {
      return null;
    }
    
    const hostname = window.location.hostname;
    let protocol = window.location.protocol;
    let port = window.location.port ? `:${window.location.port}` : '';
    let baseDomain = 'localhost';
    
    // Determine base domain and protocol based on environment
    if (hostname.includes('nepostore.xyz')) {
      // Production
      baseDomain = 'nepostore.xyz';
      protocol = 'https:';
      port = ''; // No port in production
    } else if (hostname.endsWith('.localhost') || hostname === 'localhost') {
      // Development
      baseDomain = 'localhost';
      protocol = 'http:';
    }
    
    return `${protocol}//${store.subdomain}.${baseDomain}${port}`;
  };

  const handleStoreClick = (store) => {
    const storeUrl = getStoreUrl(store);
    if (storeUrl) {
      window.open(storeUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Store URL not available');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`stores-modal-overlay ${isVisible ? 'open' : ''}`} onClick={handleClose}>
      <div className="stores-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="stores-modal-header">
          <h2>My Stores</h2>
          <button onClick={handleClose} className="stores-close-btn">
            <FaTimes />
          </button>
        </div>

        <div className="stores-modal-body">
          {!showCreateForm ? (
            <>
              <div className="stores-list-container">
                {loading ? (
                  <div className="stores-loading">Loading stores...</div>
                ) : stores.length === 0 ? (
                  <div className="stores-empty">
                    <FaStore size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                    <p>No stores yet</p>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                      Create your first store to get started
                    </p>
                  </div>
                ) : (
                  <div className="stores-list">
                    {stores.map((store) => (
                      <div
                        key={store._id}
                        className="store-item"
                      >
                        <div className="store-icon">
                          <FaStore />
                        </div>
                        <div className="store-info">
                          <div className="store-name">{store.name}</div>
                          {store.subdomain && (
                            <div className="store-url">{store.subdomain}.nepostore.xyz</div>
                          )}
                        </div>
                        {store.subdomain && (
                          <button
                            className="visit-store-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStoreClick(store);
                            }}
                            title="Visit Store"
                          >
                            <FaExternalLinkAlt />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="stores-modal-footer">
                <button
                  className="create-store-btn"
                  onClick={() => setShowCreateForm(true)}
                >
                  <FaPlus /> Create Store
                </button>
              </div>
            </>
          ) : (
            <div className="create-store-form">
              <h3>Create New Store</h3>
              <form onSubmit={handleCreateStore}>
                <div className="form-group">
                  <label htmlFor="storeName">Store Name</label>
                  <input
                    type="text"
                    id="storeName"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    placeholder="Enter store name (e.g., abc)"
                    required
                    autoFocus
                  />
                  {newStore.name.trim() && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.75rem', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#64748b'
                    }}>
                      <strong>Your store will be available at:</strong><br />
                      <span style={{ color: '#5866f2', fontWeight: '600' }}>
                        {getSubdomainPreview(newStore.name)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="create-store-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewStore({ name: '' });
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Store'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoresModal;


