import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaCheck } from 'react-icons/fa';
import './ProductSelectionModal.css';
import API_URL from '../../apiConfig';
import { resolveImageUrl } from '../../themeUtils';

const ProductSelectionModal = ({ isOpen, onClose, onSave, initialSelection = [], initialCategoryId = null, initialSourceType = 'products' }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);

    // Selection States
    const [selectedIds, setSelectedIds] = useState(initialSelection || []);
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
    const [activeTab, setActiveTab] = useState(initialSourceType); // 'products' or 'categories'

    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Initialize from props
    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            fetchCategories();
            setSelectedIds(initialSelection || []);
            setSelectedCategoryId(initialCategoryId);
            setActiveTab(initialSourceType || 'products');
            setSearchTerm('');
        }
    }, [isOpen, initialSelection, initialCategoryId, initialSourceType]);

    // Handle initial category/type if passed (We'll expect parent to pass these as separate props down the line, but for now we default or use what's available)
    // To support parent passing these, we should add them to props:
    // const { initialSelection, initialCategoryId, initialSourceType } = props; 
    // But we are editing the existing component. Let's add them to the destructuring in the signature below.

    useEffect(() => {
        // Filter Products
        if (activeTab === 'products' && products.length) {
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
        }
        // Filter Categories
        else if (activeTab === 'categories' && categories.length) {
            if (searchTerm.trim() === '') {
                setFilteredCategories(categories);
            } else {
                const lowerTerm = searchTerm.toLowerCase();
                const filtered = categories.filter(c =>
                    c.name.toLowerCase().includes(lowerTerm)
                );
                setFilteredCategories(filtered);
            }
        }
    }, [searchTerm, products, categories, activeTab]);

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

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/api/categories`);
            const data = await response.json();
            setCategories(data);
            setFilteredCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const toggleSelection = (id) => {
        if (activeTab === 'products') {
            setSelectedIds(prev => {
                if (prev.includes(id)) {
                    return prev.filter(pid => pid !== id);
                } else {
                    return [...prev, id];
                }
            });
        } else {
            // Category: Single selection usually, or multiple? 
            // User asked "choose category or products". Usually category grid means "Show products from Category X".
            // So single selection is safer for now.
            setSelectedCategoryId(prev => prev === id ? null : id);
        }
    };

    const handleSave = () => {
        // We pass back (productIds, categoryId, sourceType)
        // If tab is products, we prioritize productIds. If category, categoryId.
        onSave(selectedIds, selectedCategoryId, activeTab);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="product-selection-modal-overlay" onClick={onClose}>
            <div className="product-selection-modal-content" onClick={e => e.stopPropagation()}>
                <div className="product-selection-header">
                    <h3>Select Content</h3>
                    <div className="header-search-wrapper">
                        <FaSearch className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder={activeTab === 'products' ? "Search products..." : "Search categories..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="close-btn" onClick={onClose}><FaTimes size={20} /></button>
                </div>

                {/* Tabs */}
                <div className="modal-tabs" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
                    <div
                        onClick={() => { setActiveTab('products'); setSearchTerm(''); }}
                        style={{
                            padding: '12px 24px',
                            cursor: 'pointer',
                            borderBottom: activeTab === 'products' ? '2px solid #7c3aed' : 'none',
                            color: activeTab === 'products' ? '#7c3aed' : '#64748b',
                            fontWeight: '600'
                        }}
                    >
                        Products
                    </div>
                    <div
                        onClick={() => { setActiveTab('categories'); setSearchTerm(''); }}
                        style={{
                            padding: '12px 24px',
                            cursor: 'pointer',
                            borderBottom: activeTab === 'categories' ? '2px solid #7c3aed' : 'none',
                            color: activeTab === 'categories' ? '#7c3aed' : '#64748b',
                            fontWeight: '600'
                        }}
                    >
                        Category
                    </div>
                </div>

                <div className="products-list-container table-layout" style={{ height: '400px', overflowY: 'auto' }}>

                    {/* PRODUCT LIST */}
                    {activeTab === 'products' && (
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
                    )}

                    {/* CATEGORY LIST */}
                    {activeTab === 'categories' && (
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}></th>
                                    <th style={{ width: '100px' }}>IMAGE</th>
                                    <th>CATEGORY NAME</th>
                                    <th>PRODUCT COUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map((cat, index) => (
                                        <tr
                                            key={cat._id}
                                            onClick={() => toggleSelection(cat._id)}
                                            className={selectedCategoryId === cat._id ? 'selected-row' : ''}
                                        >
                                            <td>
                                                <div className="checkbox-wrapper" style={{ borderRadius: '50%' }}>
                                                    <input
                                                        type="radio"
                                                        name="categorySelect"
                                                        checked={selectedCategoryId === cat._id}
                                                        readOnly
                                                        style={{ accentColor: '#7c3aed' }}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="product-table-thumb">
                                                    <img
                                                        src={resolveImageUrl(cat.image, API_URL) || 'https://via.placeholder.com/50'}
                                                        alt={cat.name}
                                                    />
                                                </div>
                                            </td>
                                            <td className="product-name-cell" style={{ fontWeight: '600' }}>{cat.name}</td>
                                            <td className="inventory-cell">{cat.productsCount || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="empty-state">No categories found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                </div>

                <div className="modal-footer">
                    <div className="selection-count">
                        {activeTab === 'products'
                            ? `${selectedIds.length} product${selectedIds.length !== 1 ? 's' : ''} selected`
                            : `${selectedCategoryId ? '1' : '0'} category selected`
                        }
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
