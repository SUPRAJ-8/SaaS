import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaCheck } from 'react-icons/fa';
import './ProductSelectionModal.css';
import API_URL from '../../apiConfig';
import { resolveImageUrl } from '../../themeUtils';

const ProductSelectionModal = ({ isOpen, onClose, onSave, initialSelection = [] }) => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedIds, setSelectedIds] = useState(initialSelection);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            setSelectedIds(initialSelection || []);
            setSearchTerm('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!products.length) return;

        if (searchTerm.trim() === '') {
            setFilteredProducts(products);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(lowerTerm) ||
                (p.category && p.category.name && p.category.name.toLowerCase().includes(lowerTerm))
            );
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/products`);
            const data = await response.json();
            setProducts(data);
            setFilteredProducts(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            setLoading(false);
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(pid => pid !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleSave = () => {
        onSave(selectedIds);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="product-selection-modal-overlay" onClick={onClose}>
            <div className="product-selection-modal-content" onClick={e => e.stopPropagation()}>
                <div className="product-selection-header">
                    <h3>Select Products</h3>
                    <div className="header-search-wrapper">
                        <FaSearch className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="close-btn" onClick={onClose}><FaTimes size={20} /></button>
                </div>

                <div className="products-list-container table-layout">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>
                                    <div className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p._id))}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const newIds = [...new Set([...selectedIds, ...filteredProducts.map(p => p._id)])];
                                                    setSelectedIds(newIds);
                                                } else {
                                                    const pIds = filteredProducts.map(p => p._id);
                                                    setSelectedIds(prev => prev.filter(id => !pIds.includes(id)));
                                                }
                                            }}
                                        />
                                    </div>
                                </th>
                                <th style={{ width: '50px' }}>#</th>
                                <th style={{ width: '100px' }}>IMAGE</th>
                                <th>NAME</th>
                                <th style={{ width: '100px' }}>INVENTORY</th>
                                <th style={{ width: '100px' }}>PRICE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="loading-state">Loading products...</td>
                                </tr>
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((product, index) => (
                                    <tr
                                        key={product._id}
                                        onClick={() => toggleSelection(product._id)}
                                        className={selectedIds.includes(product._id) ? 'selected-row' : ''}
                                    >
                                        <td>
                                            <div className="checkbox-wrapper">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(product._id)}
                                                    readOnly
                                                />
                                            </div>
                                        </td>
                                        <td>{index + 1}</td>
                                        <td>
                                            <div className="product-table-thumb">
                                                <img
                                                    src={resolveImageUrl(product.images && product.images.length > 0 ? product.images[0] : null, API_URL)}
                                                    alt={product.name}
                                                />
                                            </div>
                                        </td>
                                        <td className="product-name-cell">{product.name}</td>
                                        <td className="inventory-cell">{product.quantity || 0}</td>
                                        <td className="price-cell">NPR {product.sellingPrice || 0}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="empty-state">No products found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="modal-footer">
                    <div className="selection-count">
                        {selectedIds.length} product{selectedIds.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className="action-buttons">
                        <button className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button className="btn-save" onClick={handleSave}>Save Selection</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductSelectionModal;
