import React, { useState, useEffect } from 'react';
import {
  FaTrashAlt, FaEdit, FaInbox, FaChevronLeft, FaChevronRight,
  FaShapes, FaLayerGroup, FaBoxOpen, FaPlus, FaSearch, FaFilter, FaCog, FaTimes,
  FaSort, FaSortUp, FaSortDown
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Categories.css';
import { CategoryModal } from './CategoryModal.js';
import { SubCategoryModal } from './SubCategoryModal.js';
import ConfirmationModal from './ConfirmationModal.js';
import API_URL from '../../apiConfig';
// import { resolveImageUrl } from '../../themeUtils'; // If needed for images

const Categories = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]); // For checkboxes
  const [loading, setLoading] = useState(true);
  const [selectedCategoryPanel, setSelectedCategoryPanel] = useState(null); // For Right Panel
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subcategoryToEdit, setSubcategoryToEdit] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, data: null });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort style={{ marginLeft: '4px', opacity: 0.3 }} />;
    return sortConfig.direction === 'asc' ?
      <FaSortUp style={{ marginLeft: '4px', color: '#4f46e5' }} /> :
      <FaSortDown style={{ marginLeft: '4px', color: '#4f46e5' }} />;
  };

  const sortedCategories = React.useMemo(() => {
    let sortableItems = [...categories];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal, bVal;
        if (sortConfig.key === 'items') {
          aVal = a.subcategories?.reduce((acc, sub) => acc + (sub.itemCount || 0), 0) || 0;
          bVal = b.subcategories?.reduce((acc, sub) => acc + (sub.itemCount || 0), 0) || 0;
        } else {
          aVal = a[sortConfig.key];
          bVal = b[sortConfig.key];
        }
        if (aVal === undefined) aVal = '';
        if (bVal === undefined) bVal = '';
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [categories, sortConfig]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories`);
        const data = await response.json();
        setCategories(data);
        // Default select first one if available
        if (data.length > 0) setSelectedCategoryPanel(data[0]);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Sync selectedCategoryPanel with the latest data from categories list
  useEffect(() => {
    if (selectedCategoryPanel) {
      const updated = categories.find(c => c._id === selectedCategoryPanel._id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedCategoryPanel)) {
        setSelectedCategoryPanel(updated);
      }
    }
  }, [categories, selectedCategoryPanel]);

  const handleAddClick = () => {
    setCategoryToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allCategoryIds = categories.map(c => c._id);
      setSelectedCategories(allCategoryIds);
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectOne = (e, id) => {
    e.stopPropagation(); // Prevent row click
    if (e.target.checked) {
      setSelectedCategories(prev => [...prev, id]);
    } else {
      setSelectedCategories(prev => prev.filter(cid => cid !== id));
    }
  };

  const handleEditClick = (category) => {
    setCategoryToEdit(category);
    setIsEditModalOpen(true);
  };

  const handleRowClick = (category) => {
    setSelectedCategoryPanel(category);
  };

  const handleSaveCategory = async (categoryData) => {
    // ... existing save logic ...
    // Simplified for brevity in this replace, I will call the original logic if possible or re-implement nicely.
    // I'll re-implement standard save logic briefly.
    const isUpdating = !!categoryData._id;
    const url = isUpdating ? `${API_URL}/api/categories/${categoryData._id}` : `${API_URL}/api/categories`;
    const method = isUpdating ? 'PUT' : 'POST';

    const formData = new FormData();
    formData.append('name', categoryData.name);
    formData.append('description', categoryData.description);
    formData.append('status', categoryData.status);
    if (categoryData.image && categoryData.image instanceof File) {
      formData.append('image', categoryData.image);
    }

    try {
      const response = await fetch(url, { method, body: formData });
      const data = await response.json();

      if (!response.ok) throw new Error(data.msg || data.error || 'Failed to save category');

      if (isUpdating) {
        setCategories(categories.map(c => (c._id === data._id ? data : c)));
        toast.success('Category updated successfully!');
      } else {
        setCategories(prev => [...prev, data]);
        toast.success('Category added successfully!');
      }
      setIsEditModalOpen(false);
      setCategoryToEdit(null);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.message);
    }
  };

  const handleDeleteCategory = (category) => {
    setDeleteModal({ isOpen: true, type: 'category', data: category });
  };

  const handleConfirmDelete = async () => {
    const { type, data } = deleteModal;
    if (!data) return;

    try {
      if (type === 'category') {
        const response = await fetch(`${API_URL}/api/categories/${data._id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete category');

        setCategories(categories.filter(c => c._id !== data._id));
        if (selectedCategoryPanel?._id === data._id) setSelectedCategoryPanel(null);
        toast.success('Category deleted successfully');
      } else if (type === 'subcategory') {
        if (!selectedCategoryPanel) return;
        const updatedSubcategories = selectedCategoryPanel.subcategories.filter(s => s._id !== data._id);

        const response = await fetch(`${API_URL}/api/categories/${selectedCategoryPanel._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subcategories: updatedSubcategories }),
        });

        const resData = await response.json();
        if (!response.ok) throw new Error(resData.msg || 'Failed to delete sub-category');

        setCategories(categories.map(c => (c._id === resData._id ? resData : c)));
        setSelectedCategoryPanel(resData);
        toast.success('Sub-category deleted!');
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(error.message);
    } finally {
      setDeleteModal({ isOpen: false, type: null, data: null });
    }
  };

  const handleSaveSubCategory = async (subData) => {
    if (!selectedCategoryPanel) return;

    try {
      let updatedSubcategories;
      if (subcategoryToEdit) {
        // Edit existing
        updatedSubcategories = selectedCategoryPanel.subcategories.map(s =>
          s._id === subcategoryToEdit._id ? { ...s, ...subData } : s
        );
      } else {
        // Add new
        updatedSubcategories = [...(selectedCategoryPanel.subcategories || []), { ...subData, itemCount: 0 }];
      }

      const response = await fetch(`${API_URL}/api/categories/${selectedCategoryPanel._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subcategories: updatedSubcategories }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to save sub-category');

      setCategories(categories.map(c => (c._id === data._id ? data : c)));
      setSelectedCategoryPanel(data);
      setIsSubModalOpen(false);
      setSubcategoryToEdit(null);
      toast.success(subcategoryToEdit ? 'Sub-category updated!' : 'Sub-category added!');
    } catch (error) {
      console.error('Error saving sub-category:', error);
      toast.error(error.message);
    }
  };

  const handleDeleteSubCategory = (sub) => {
    setDeleteModal({ isOpen: true, type: 'subcategory', data: sub });
  };

  const handleEditSubClick = (sub) => {
    setSubcategoryToEdit(sub);
    setIsSubModalOpen(true);
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  // Calculate metrics
  const totalSubcategories = categories.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0);
  const totalItems = categories.reduce((acc, cat) => {
    const subSum = cat.subcategories?.reduce((sAcc, sub) => sAcc + (sub.itemCount || 0), 0) || 0;
    return acc + subSum;
  }, 0);

  return (
    <div className="categories-page">
      <ToastContainer />
      <CategoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={categoryToEdit}
        onSave={handleSaveCategory}
      />

      {/* Header */}
      <div className="categories-header">
        <div className="header-left">
          <h2>Categories</h2>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="category-stats-row">
        <div className="category-stat-card">
          <div className="category-stat-content">
            <h3>TOTAL CATEGORIES</h3>
            <p className="category-stat-value">{categories.length}</p>
          </div>
          <div className="category-stat-icon-wrapper blue">
            <FaShapes />
          </div>
        </div>
        <div className="category-stat-card">
          <div className="category-stat-content">
            <h3>SUB-CATEGORIES</h3>
            <p className="category-stat-value">{totalSubcategories}</p>
          </div>
          <div className="category-stat-icon-wrapper purple">
            <FaLayerGroup />
          </div>
        </div>
        <div className="category-stat-card">
          <div className="category-stat-content">
            <h3>ACTIVE ITEMS</h3>
            <p className="category-stat-value">{totalItems || '---'}</p>
          </div>
          <div className="category-stat-icon-wrapper green">
            <FaBoxOpen />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="categories-content-grid">
        {/* Left Column: Category List */}
        <div className="categories-list-section">

          {/* Toolbar */}
          <div className="categories-toolbar">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon-category" />
              <input type="text" placeholder="Search categories..." className="search-input-category" />
            </div>
            <button className="add-category-btn" onClick={handleAddClick}>
              <FaPlus /> Add Category
            </button>
          </div>

          {/* List Card */}
          <div className="categories-list-card">
            <div className="category-list-header">
              <div><input type="checkbox" onChange={handleSelectAll} checked={categories.length > 0 && selectedCategories.length === categories.length} /></div>
              <div>#</div>
              <div onClick={() => requestSort('name')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                CATEGORY DETAILS {getSortIcon('name')}
              </div>
              <div onClick={() => requestSort('items')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                ITEMS {getSortIcon('items')}
              </div>
              <div onClick={() => requestSort('status')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                STATUS {getSortIcon('status')}
              </div>
              <div onClick={() => requestSort('date')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                LAST UPDATED {getSortIcon('date')}
              </div>
              <div style={{ textAlign: 'right', paddingRight: '4px' }}>ACTIONS</div>
            </div>

            <div className="category-list-body">
              {sortedCategories.map((category, index) => (
                <div
                  key={category._id}
                  className={`category-list-item ${selectedCategoryPanel?._id === category._id ? 'selected' : ''}`}
                  onClick={() => handleRowClick(category)}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedCategories.includes(category._id)} onChange={(e) => handleSelectOne(e, category._id)} />
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{index + 1}</div>
                  <div className="category-info">
                    <div className="category-icon">
                      {category.image ? <img src={`${API_URL}${category.image}`} alt={category.name} /> : <FaShapes />}
                    </div>
                    <div className="category-details">
                      <h4>{category.name}</h4>
                    </div>
                  </div>
                  <div className="items-count">
                    <span className="badge-items">
                      {category.subcategories?.reduce((acc, sub) => acc + (sub.itemCount || 0), 0) || 0}
                    </span>
                  </div>
                  <div>
                    <span className={`cat-status-badge ${category.status === 'Active' ? 'active' : 'draft'}`}>
                      {category.status || 'Active'}
                    </span>
                  </div>
                  <div className="last-updated">
                    {formatDate(category.date)}
                  </div>
                  <div className="action-icons">
                    <FaEdit
                      className="action-icon edit"
                      onClick={(e) => { e.stopPropagation(); handleEditClick(category); }}
                      title="Edit Category"
                    />
                    <FaTrashAlt
                      className="action-icon delete"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category); }}
                      title="Delete Category"
                    />
                  </div>
                </div>
              ))}
              {categories.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>No categories found.</div>}
            </div>

            {/* Footer Pagination */}
            <div className="table-footer" style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}>
              <div className="showing-results">
                Showing <span className="text-bold">1-{categories.length > 4 ? 4 : categories.length}</span> of <span className="text-bold">{categories.length}</span>
              </div>
              <div className="pagination-controls">
                <button className="pagination-btn disabled"><FaChevronLeft /></button>
                <button className="pagination-btn active">Page 1</button>
                <button className="pagination-btn"><FaChevronRight /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sub-categories Panel */}
        <div className="subcategories-panel">
          {selectedCategoryPanel ? (
            <>
              <div className="panel-header">
                <h3>SUB-CATEGORIES</h3>
                <div className="panel-actions">
                  <FaTimes style={{ cursor: 'pointer' }} onClick={() => setSelectedCategoryPanel(null)} />
                </div>
              </div>

              <div className="selected-cat-header">
                <div className="selected-cat-info">
                  <div className="category-icon" style={{ width: 32, height: 32, backgroundColor: '#eff6ff', color: '#3b82f6', overflow: 'hidden' }}>
                    {selectedCategoryPanel.image ? (
                      <img
                        src={`${API_URL}${selectedCategoryPanel.image}`}
                        alt={selectedCategoryPanel.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <FaLayerGroup />
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{selectedCategoryPanel.name}</h2>
                </div>
              </div>

              <div className="subcategory-search-row">
                <div style={{ position: 'relative', flex: 1 }}>
                  <FaSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.8rem' }} />
                  <input type="text" placeholder="Find sub-category..." style={{ width: '100%', paddingLeft: 30 }} />
                </div>
                <div className="btn-small-square btn-icon-filled" onClick={() => setIsSubModalOpen(true)}><FaPlus size={12} /></div>
              </div>

              <div className="subcategory-table">
                <div className="subcategory-table-header">
                  <div><input type="checkbox" /></div>
                  <div>#</div>
                  <div>NAME</div>
                  <div style={{ textAlign: 'right' }}>ACTION</div>
                </div>
                <div className="subcategory-table-body">
                  {(selectedCategoryPanel.subcategories && selectedCategoryPanel.subcategories.length > 0) ? (
                    selectedCategoryPanel.subcategories.map((sub, idx) => (
                      <div className="subcategory-table-row" key={sub._id || idx}>
                        <div><input type="checkbox" /></div>
                        <div className="sub-index">{idx + 1}</div>
                        <div className="sub-name">{sub.name}</div>
                        <div className="sub-actions">
                          <FaEdit
                            className="sub-action-icon edit"
                            onClick={() => handleEditSubClick(sub)}
                          />
                          <FaTrashAlt
                            className="sub-action-icon delete"
                            onClick={() => handleDeleteSubCategory(sub)}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-subs">No sub-categories found.</div>
                  )}
                </div>
              </div>

              <a href="#" className="add-subcat-link" onClick={(e) => { e.preventDefault(); setIsSubModalOpen(true); }}><FaPlus /> Add another sub-category</a>

              <div className="panel-footer-stats">
                <span>{selectedCategoryPanel.subcategories ? selectedCategoryPanel.subcategories.length : 0} Sub-categories</span>
                <span>{selectedCategoryPanel.totalItems || 0} Total Items</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: 40 }}>
              <FaLayerGroup size={40} style={{ marginBottom: 10, opacity: 0.5 }} />
              <p>Select a category to view details</p>
            </div>
          )}
        </div>
      </div>
      <SubCategoryModal
        isOpen={isSubModalOpen}
        onClose={() => {
          setIsSubModalOpen(false);
          setSubcategoryToEdit(null);
        }}
        onSave={handleSaveSubCategory}
        subcategory={subcategoryToEdit}
      />
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, data: null })}
        onConfirm={handleConfirmDelete}
        title={deleteModal.type === 'category' ? 'Delete Category' : 'Delete Sub-category'}
        confirmText="Yes, Delete"
        cancelText="Cancel"
      >
        Are you sure you want to delete the {deleteModal.type === 'category' ? 'category' : 'sub-category'} <strong>"{deleteModal.data?.name}"</strong>? This action cannot be undone.
      </ConfirmationModal>
    </div>
  );
};

export default Categories;
