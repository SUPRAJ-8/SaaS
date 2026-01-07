import React, { useState, useEffect } from 'react';
import { FaTrashAlt, FaEdit, FaChevronLeft, FaChevronRight, FaInbox, FaFileExport, FaPlus, FaFilter, FaSearch, FaPrint, FaArchive, FaCheck, FaTimes, FaFileAlt } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Products.css';
import { ProductModal } from './ProductModal.js';
import ConfirmationModal from './ConfirmationModal.js';
import { getProducts } from '../../services/productService';
import API_URL from '../../apiConfig';
import { resolveImageUrl } from '../../themeUtils';

const Products = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: 'single', product: null });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts(); // Fetch all products
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Handle error appropriately
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddClick = () => {
    setProductToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentIds = currentItems.map(p => p._id);
      setSelectedProducts(prev => {
        const newSelected = [...prev];
        currentIds.forEach(id => {
          if (!newSelected.includes(id)) newSelected.push(id);
        });
        return newSelected;
      });
    } else {
      const currentIds = currentItems.map(p => p._id);
      setSelectedProducts(prev => prev.filter(id => !currentIds.includes(id)));
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedProducts(prev => [...prev, id]);
    } else {
      setSelectedProducts(prev => prev.filter(pid => pid !== id));
    }
  };

  // Filter and Paginate
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [products, statusFilter, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentItems = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEditClick = (product) => {
    setProductToEdit(product);
    setIsEditModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.type === 'single') {
      const product = deleteModal.product;
      if (!product) return;

      try {
        const response = await fetch(`${API_URL}/api/products/${product._id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete product');
        }

        setProducts(products.filter(p => p._id !== product._id));
        toast.success('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product.');
      }
    } else if (deleteModal.type === 'bulk') {
      try {
        const response = await fetch(`${API_URL}/api/products/bulk-delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: selectedProducts }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete products');
        }

        setProducts(products.filter(p => !selectedProducts.includes(p._id)));
        setSelectedProducts([]);
        toast.success(`${selectedProducts.length} products deleted successfully!`);
      } catch (error) {
        console.error('Error deleting products:', error);
        toast.error('Failed to delete products.');
      }
    }
    setDeleteModal({ isOpen: false, type: 'single', product: null });
  };

  const handleBulkDelete = () => {
    setDeleteModal({ isOpen: true, type: 'bulk', product: null });
  };

  const handleDeleteClick = (product) => {
    setDeleteModal({ isOpen: true, type: 'single', product });
  };

  const handleBulkUpdateStatus = async (status) => {
    try {
      const response = await fetch(`${API_URL}/api/products/bulk-update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedProducts, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || errorData.error || 'Failed to update products');
      }

      const updatedProducts = await response.json();
      const updatedProductsMap = new Map(updatedProducts.map(p => [p._id, p]));

      setProducts(products.map(p => updatedProductsMap.get(p._id) || p));
      setSelectedProducts([]);
      toast.success(`Selected products moved to ${status}!`);
    } catch (error) {
      console.error('Error updating products:', error);
      toast.error(error.message || 'Failed to update products.');
    }
  };

  const handleProductUpdate = async (productId, field, value) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [field]: value }),
        });

      if (!response.ok) {
        throw new Error('Failed to update product status');
      }

      const updatedProduct = await response.json();
      setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
      toast.success('Product status updated!');
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status.');
    }
  };
  const calculateInventory = (product) => {
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      return product.variants.reduce((total, variant) => total + (variant.quantity || 0), 0);
    } else {
      return product.quantity || 0;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  const handleSaveProduct = async (productData) => {
    const isUpdating = !!productData._id;
    const url = isUpdating ? `${API_URL}/api/products/${productData._id}` : `${API_URL}/api/products`;
    const method = isUpdating ? 'PUT' : 'POST';

    const formData = new FormData();

    // Append other product data (IMPORTANT: Do this before images for some multer versions)
    for (const key in productData) {
      if (key !== 'images' && key !== '_id') {
        const value = productData[key];
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      }
    }

    // Append images (only File objects, not existing image URLs)
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image) => {
        if (image instanceof File) {
          formData.append('images', image);
        }
      });
    }

    // Ensure required fields are present
    if (!formData.has('name') || !formData.get('name')) {
      alert('Product name is required');
      return;
    }

    try {
      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.error || 'Failed to save product');
      }

      const savedProduct = data;

      if (isUpdating) {
        setProducts(products.map(p => p._id === savedProduct._id ? savedProduct : p));
        toast.success('Product updated successfully!');
      } else {
        setProducts(prevProducts => [...prevProducts, savedProduct]);
        toast.success('Product added successfully!');
      }

      setIsEditModalOpen(false);
      setProductToEdit(null);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product. Please try again.');
    }
  };

  return (
    <div className="products-page">
      <ToastContainer />
      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={productToEdit}
        onSave={handleSaveProduct}
      />
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={deleteModal.type === 'bulk' ? 'Bulk Delete Products' : 'Delete Product'}
        confirmText="Yes, Delete"
        cancelText="Cancel"
      >
        {deleteModal.type === 'bulk' ? (
          <>Are you sure you want to delete <strong>{selectedProducts.length}</strong> products? This action cannot be undone.</>
        ) : (
          <>Are you sure you want to delete <strong>{deleteModal.product?.name}</strong>? This action cannot be undone.</>
        )}
      </ConfirmationModal>
      {/* Top Header: Title & Actions */}
      <div className="products-page-header">
        <div className="header-title-section">
          <h2 className="page-title">Products</h2>
          <p className="page-description">Manage your product catalog, inventory, and pricing.</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline-white icon-text-btn" title="Print">
            <FaPrint /> Print
          </button>
          <button className="btn-outline-white icon-text-btn">
            <FaFileExport /> Export
          </button>
          <button className="btn btn-primary add-product-btn" onClick={handleAddClick}>
            <FaPlus /> Add Product
          </button>
        </div>
      </div>

      {/* Toolbar: Tabs & Search */}
      <div className="products-toolbar">
        {/* Left Side: Pill Tabs */}
        <div className="status-filters-pills">
          {['All', 'Active', 'Draft', 'Archived'].map(status => (
            <button
              key={status}
              className={`pill-tab ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
              style={{ textTransform: 'capitalize' }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Right Side: Search & Filter */}
        <div className="toolbar-right-section">
          <div className="search-wrapper-compact">
            <FaSearch className="search-icon-grey" />
            <input
              type="text"
              placeholder="Search product name"
              className="search-input-compact"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conditional Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-left">
            <span className="bulk-count">{selectedProducts.length} selected</span>
            <button className="deselect-all-btn" onClick={() => setSelectedProducts([])}>Deselect All</button>
          </div>
          <div className="bulk-actions-right">
            <button className="bulk-action-btn" onClick={() => handleBulkUpdateStatus('Draft')}>
              <FaFileAlt /> Draft
            </button>
            <button className="bulk-action-btn" onClick={() => handleBulkUpdateStatus('Archived')}>
              <FaArchive /> Archive
            </button>
            <div className="bulk-divider"></div>
            <button className="bulk-action-btn delete-btn" onClick={handleBulkDelete}>
              <FaTrashAlt /> Delete
            </button>
          </div>
        </div>
      )}
      <div className="products-table-container">
        <div className="products-table-scrollable">
          <table className="products-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={currentItems.length > 0 && currentItems.every(p => selectedProducts.includes(p._id))}
                  />
                </th>
                <th>#</th>
                <th>Image</th>
                <th>Name</th>
                <th>Inventory</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center' }}>Loading...</td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((product, index) => (
                  <tr key={product._id} onClick={() => handleEditClick(product)} className={selectedProducts.includes(product._id) ? 'row-selected' : ''} style={{ cursor: 'pointer' }}>
                    <td className="checkbox-cell"><input type="checkbox" checked={selectedProducts.includes(product._id)} onChange={(e) => handleSelectOne(e, product._id)} onClick={(e) => e.stopPropagation()} /></td>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>
                      <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                        <img
                          src={resolveImageUrl(product.images && product.images.length > 0 ? product.images[0] : null, API_URL)}
                          alt={product.name}
                          style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                        />
                        {product.images && product.images.length > 1 && (
                          <span style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            fontSize: '10px',
                            padding: '1px 4px',
                            borderRadius: '10px',
                            border: '1px solid white'
                          }}>
                            +{product.images.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="product-name">{product.name}</td>
                    <td style={{ color: calculateInventory(product) > 0 ? 'green' : 'red' }}>
                      {calculateInventory(product)}
                    </td>
                    <td>NPR {Number(product.sellingPrice || 0).toFixed(0)}</td>
                    <td>
                      <select
                        value={product.status}
                        onChange={(e) => handleProductUpdate(product._id, 'status', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={`status-select status-${product.status.toLowerCase()}`}>
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </td>
                    <td>{formatDate(product.createdAt)}</td>
                    <td>{formatDate(product.updatedAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="actions-wrapper">
                        <button className="action-btn edit-btn" onClick={() => handleEditClick(product)} title="Edit product"><FaEdit /></button>
                        <button className="action-btn delete-btn" onClick={() => handleDeleteClick(product)} title="Delete product"><FaTrashAlt /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-data-cell">
                    <div className="no-data-content">
                      <FaInbox className="no-data-icon" />
                      <span>No products found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <div className="showing-results">
            Showing <span className="text-bold">{filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="text-bold">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="text-bold">{filteredProducts.length}</span> results
          </div>
          <div className="pagination-controls">
            <button
              className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <FaChevronLeft />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}

            <button
              className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
