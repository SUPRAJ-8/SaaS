import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaImage, FaSearch, FaTrash, FaCopy, FaDownload, FaExternalLinkAlt, FaSync, FaThLarge, FaList } from 'react-icons/fa';
import { toast } from 'react-toastify';
import API_URL from '../../apiConfig';
import './Media.css';

const Media = () => {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedImage, setSelectedImage] = useState(null);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/media`, { withCredentials: true });
            setMedia(res.data || []);
        } catch (err) {
            console.error('Error fetching media:', err);
            toast.error('Failed to load media');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, []);

    const filteredMedia = media.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCopyUrl = (url) => {
        const fullUrl = url.startsWith('http') ? url : `${window.location.protocol}//${window.location.host}${url}`;
        navigator.clipboard.writeText(fullUrl);
        toast.success('URL copied to clipboard');
    };

    const handleDownload = (url, name) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="media-container fade-in">
            <header className="media-header">
                <div className="header-info">
                    <h1>Media Library</h1>
                    <p>Manage all your shop's images and assets in one place.</p>
                </div>
                <div className="header-actions">
                    <button className="refresh-btn" onClick={fetchMedia} title="Refresh Gallery">
                        <FaSync className={loading ? 'spinning' : ''} />
                    </button>
                    <div className="view-toggle">
                        <button
                            className={viewMode === 'grid' ? 'active' : ''}
                            onClick={() => setViewMode('grid')}
                        >
                            <FaThLarge />
                        </button>
                        <button
                            className={viewMode === 'list' ? 'active' : ''}
                            onClick={() => setViewMode('list')}
                        >
                            <FaList />
                        </button>
                    </div>
                </div>
            </header>

            <div className="media-toolbar">
                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search media by name or URL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="media-stats">
                    <span>Showing {filteredMedia.length} assets</span>
                </div>
            </div>

            {loading ? (
                <div className="media-loading">
                    <div className="loader"></div>
                    <p>Scanning store assets...</p>
                </div>
            ) : filteredMedia.length === 0 ? (
                <div className="empty-media">
                    <FaImage className="empty-icon" />
                    <h3>No Media Found</h3>
                    <p>Upload images in product, category or page editor to see them here.</p>
                </div>
            ) : (
                <div className={`media-display ${viewMode}`}>
                    {filteredMedia.map((m, index) => (
                        <div key={index} className="media-card" onClick={() => setSelectedImage(m)}>
                            <div className="media-preview">
                                <img src={m.url} alt={m.name} loading="lazy" />
                                <div className="media-overlay">
                                    <div className="overlay-actions">
                                        <button onClick={(e) => { e.stopPropagation(); handleCopyUrl(m.url); }} title="Copy URL">
                                            <FaCopy />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDownload(m.url, m.name); }} title="Download">
                                            <FaDownload />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); window.open(m.url, '_blank'); }} title="Open Original">
                                            <FaExternalLinkAlt />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="media-info">
                                <span className="media-name">{m.name}</span>
                                <span className="media-type">{m.url.split('.').pop().toUpperCase()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedImage && (
                <div className="media-modal-overlay" onClick={() => setSelectedImage(null)}>
                    <div className="media-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setSelectedImage(null)}>&times;</button>
                        <div className="modal-body">
                            <div className="modal-preview">
                                <img src={selectedImage.url} alt={selectedImage.name} />
                            </div>
                            <div className="modal-details">
                                <h3>Asset Details</h3>
                                <div className="detail-item">
                                    <label>File Name</label>
                                    <p>{selectedImage.name}</p>
                                </div>
                                <div className="detail-item">
                                    <label>Public URL</label>
                                    <div className="url-copy-box">
                                        <input readOnly value={selectedImage.url} />
                                        <button onClick={() => handleCopyUrl(selectedImage.url)}>Copy</button>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn-primary" onClick={() => window.open(selectedImage.url, '_blank')}>View Original</button>
                                    <button className="btn-secondary" onClick={() => handleDownload(selectedImage.url, selectedImage.name)}>Download Asset</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Media;
