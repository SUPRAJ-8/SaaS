import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaTimes, FaStore, FaPlus, FaExternalLinkAlt, FaEdit, FaCheckCircle, FaRocket, FaChevronRight, FaTrash } from 'react-icons/fa';
import API_URL from '../../apiConfig';
import './StoresModal.css';

const StoresModal = ({ isOpen, onClose }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newStore, setNewStore] = useState({ name: '' });
  const [currentClientId, setCurrentClientId] = useState(null);

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
      fetchCurrentClient();
    }
  }, [isOpen]);

  const fetchCurrentClient = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/current_user`, { withCredentials: true });
      if (response.data && response.data.clientId) {
        setCurrentClientId(response.data.clientId);
      }
    } catch (error) {
      console.error('Error fetching current client for modal:', error);
    }
  };

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

  const handleDeleteStore = async (e, storeId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this store? All products and data associated with it will be permanently removed.')) {
      try {
        await axios.delete(`${API_URL}/api/auth/delete-store/${storeId}`, {
          withCredentials: true
        });
        toast.success('Store deleted successfully');
        fetchStores(); // Refresh list
      } catch (error) {
        console.error('Error deleting store:', error);
        toast.error('Failed to delete store');
      }
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

  const handleStoreClick = async (store) => {
    // If the store is already active, just close the modal
    if (store._id === currentClientId) {
      handleClose();
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/auth/switch-store/${store._id}`, {}, {
        withCredentials: true
      });

      toast.success(`Switched to ${store.name}`);

      // Reload the page to refresh all dashboard data with the new clientId context
      window.location.reload();
    } catch (error) {
      console.error('Error switching store:', error);
      toast.error('Failed to switch store');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`stores-modal-overlay ${isVisible ? 'open' : ''}`} onClick={handleClose}>
      <div className="stores-modal-content" onClick={(e) => e.stopPropagation()}>
        {!showCreateForm ? (
          <>
            <div className="premium-stores-header">
              <div>
                <h2>My Stores</h2>
                <p>Manage your existing stores or create a new one.</p>
              </div>
              <button onClick={handleClose} className="premium-close-btn">
                <FaTimes />
              </button>
            </div>

            <div className="premium-stores-body">
              {loading ? (
                <div className="stores-loading">Loading stores...</div>
              ) : stores.length === 0 ? (
                <div className="stores-empty">
                  <div className="empty-icon-box">
                    <FaStore />
                  </div>
                  <p>No stores yet</p>
                  <p className="empty-subtitle">Create your first store to get started</p>
                </div>
              ) : (
                <div className="premium-stores-list">
                  {stores.map((store) => (
                    <div
                      key={store._id}
                      className={`premium-store-item ${currentClientId === store._id ? 'active' : ''}`}
                      onClick={() => handleStoreClick(store)}
                    >
                      <div className="premium-store-icon-box">
                        <FaStore />
                      </div>
                      <div className="premium-store-info">
                        <div className="store-name-row">
                          <h4>{store.name}</h4>
                          {currentClientId === store._id && (
                            <span className="current-active-badge">Active</span>
                          )}
                        </div>
                        <span>{store.subdomain}.nepostore.xyz</span>
                      </div>
                      <div className="premium-store-actions">
                        <button
                          className="premium-delete-btn"
                          onClick={(e) => handleDeleteStore(e, store._id)}
                          title="Delete Store"
                        >
                          <FaTrash />
                        </button>
                        <FaChevronRight className="chevron-right" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="premium-stores-footer">
              <button
                className="premium-large-create-btn"
                onClick={() => setShowCreateForm(true)}
              >
                <FaPlus className="circle-plus" /> Create New Store
              </button>
            </div>
          </>
        ) : (
          <div className="create-store-form">
            <div className="premium-modal-header">
              <div className="header-icon-box">
                <FaStore />
              </div>
              <div className="header-text">
                <h3>Create New Store</h3>
                <p>Set up your new storefront details.</p>
              </div>
              <button onClick={() => setShowCreateForm(false)} className="premium-close-btn">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="premium-form-body">
              <div className="form-group premium-group">
                <label htmlFor="storeName">Store Name</label>
                <div className="premium-input-wrapper">
                  <input
                    type="text"
                    id="storeName"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    placeholder="e.g. Acme Clothing Co."
                    required
                    autoFocus
                  />
                </div>
                <small className="field-hint">This will be the public name displayed to your customers.</small>
              </div>

              <div className="form-group premium-group">
                <label htmlFor="storeUrl">Store URL</label>
                <div className="url-input-container">
                  <div className="url-prefix">https://</div>
                  <input
                    type="text"
                    id="storeUrl"
                    value={newStore.name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')}
                    readOnly
                    placeholder="your-store"
                  />
                  <div className="url-suffix">.nepostore.xyz</div>
                </div>
                {newStore.name.trim() && (
                  <div className="url-status-badge">
                    <FaCheckCircle className="status-icon" />
                    <span>URL is available</span>
                  </div>
                )}
              </div>

              <div className="premium-modal-footer">
                <button
                  type="button"
                  className="premium-cancel-btn"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewStore({ name: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="premium-submit-btn" disabled={isCreating}>
                  <FaRocket />
                  {isCreating ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoresModal;


