import React, { useState, useEffect } from 'react';
import { FaTrashAlt, FaEdit, FaChevronLeft, FaChevronRight, FaInbox, FaFileExport, FaPlus, FaFilter, FaSearch, FaPrint } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Customers.css'; // Reusing customer styles for now
import { ProductModal } from './ProductModal.js';
import DeleteConfirmModal from './DeleteConfirmModal';
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

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
      const allProductIds = products.map(p => p._id);
      setSelectedProducts(allProductIds);
    } else {
      setSelectedProducts([]);
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
    if (!productToDelete) return;

    try {
      const response = await fetch(`${API_URL}/api/products/${productToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      setProducts(products.filter(p => p._id !== productToDelete._id));
      toast.success('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product.');
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
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
    setIsBulkDeleteModalOpen(false);
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

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
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
    <div className="customers-page">
      <ToastContainer />
      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={productToEdit}
        onSave={handleSaveProduct}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={productToDelete ? productToDelete.name : ''}
      />
      <DeleteConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        itemName={`${selectedProducts.length} products`}
      />
      {/* Top Header: Title & Actions */}
      <div className="customers-page-header">
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
          <button className="btn btn-primary add-customer-btn" onClick={handleAddClick}>
            <FaPlus /> Add Product
          </button>
        </div>
      </div>

      {/* Toolbar: Tabs & Search */}
      <div className="customers-toolbar">
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
            <input type="text" placeholder="Search product name" className="search-input-compact" />
          </div>
        </div>
      </div>

      {/* Conditional Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bulk-actions-bar" style={{ marginTop: 0, marginBottom: '20px' }}>
          <span className="bulk-count" style={{ color: 'white', marginRight: '1rem', fontWeight: 'bold' }}>{selectedProducts.length} selected</span>
          <button className="btn btn-danger" onClick={handleBulkDelete} style={{ marginRight: '8px' }}>Delete</button>
          <button className="btn btn-warning" onClick={() => handleBulkUpdateStatus('Draft')} style={{ marginRight: '8px' }}>Move to Draft</button>
          <button className="btn btn-success" onClick={() => handleBulkUpdateStatus('Archived')}>Move to Archive</button>
        </div>
      )}
      <div className="customers-table-container">
        <table className="customers-table">
          <thead>
            <tr>
              <th className="checkbox-cell"><input type="checkbox" onChange={handleSelectAll} checked={selectedProducts.length === products.length && products.length > 0} /></th>
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
            ) : products.length > 0 ? (
              products.filter(p => statusFilter === 'All' || p.status === statusFilter).map((product, index) => (
                <tr key={product._id} onClick={() => handleEditClick(product)} className={selectedProducts.includes(product._id) ? 'row-selected' : ''} style={{ cursor: 'pointer' }}>
                  <td className="checkbox-cell"><input type="checkbox" checked={selectedProducts.includes(product._id)} onChange={(e) => handleSelectOne(e, product._id)} onClick={(e) => e.stopPropagation()} /></td>
                  <td>{index + 1}</td>
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
                    <button className="action-btn edit-btn" onClick={() => handleEditClick(product)}><FaEdit /></button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteClick(product)}><FaTrashAlt /></button>
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
        <div className="table-footer">
          <div className="showing-results">
            Showing <span className="text-bold">1</span> to <span className="text-bold">{products.length > 3 ? 3 : products.length}</span> of <span className="text-bold">{products.length}</span> results
          </div>
          <div className="pagination-controls">
            <button className="pagination-btn disabled">
              <FaChevronLeft />
            </button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">3</button>
            <button className="pagination-btn">
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
