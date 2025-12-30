import React, { useState, useEffect } from 'react';
import { FaTrashAlt, FaEdit, FaInbox } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Customers.css'; // Reusing customer styles for now
import { CategoryModal } from './CategoryModal.js';
import API_URL from '../../apiConfig';

const Categories = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories`);
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

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

  const handleSaveCategory = async (categoryData) => {
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

    console.log('Sending FormData to server:', formData);
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      const response = await fetch(url, {
        method,
        body: formData, // No 'Content-Type' header, browser sets it for FormData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.error || 'Failed to save category');
      }

      const savedCategory = data;

      if (isUpdating) {
        setCategories(categories.map(c => (c._id === savedCategory._id ? savedCategory : c)));
        toast.success('Category updated successfully!');
      } else {
        setCategories(prev => [...prev, savedCategory]);
        toast.success('Category added successfully!');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category.');
    } finally {
      setIsEditModalOpen(false);
      setCategoryToEdit(null);
    }
  };

  return (
    <div className="customers-page">
      <ToastContainer />
      <CategoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={categoryToEdit}
        onSave={handleSaveCategory}
      />
      <div className="page-header">
        <div className="page-header-top">
          <h2 className="page-title">Categories</h2>
          <button className="btn btn-primary" onClick={handleAddClick}>Add Category</button>
        </div>
      </div>
      <div className="customers-table-container">
        <table className="customers-table">
          <thead>
            <tr>
              <th><input type="checkbox" onChange={handleSelectAll} checked={selectedCategories.length === categories.length && categories.length > 0} /></th>
              <th>#</th>
              <th>Image</th>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td>
              </tr>
            ) : categories.length > 0 ? (
              categories.map((category, index) => (
                <tr key={category._id} className={selectedCategories.includes(category._id) ? 'row-selected' : ''}>
                  <td><input type="checkbox" checked={selectedCategories.includes(category._id)} onChange={(e) => handleSelectOne(e, category._id)} onClick={(e) => e.stopPropagation()} /></td>
                  <td>{index + 1}</td>
                  <td>
                    <img
                      src={category.image ? `${API_URL}${category.image}` : 'https://i.ibb.co/p3r5F5s/no-image-icon-6.png'}
                      alt={category.name}
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                  </td>
                  <td>{category.name}</td>
                  <td>{category.description}</td>
                  <td>{category.status}</td>
                  <td>
                    <button className="action-btn edit-btn" onClick={() => handleEditClick(category)}><FaEdit /></button>
                    <button className="action-btn delete-btn"><FaTrashAlt /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data-cell">
                  <div className="no-data-content">
                    <FaInbox className="no-data-icon" />
                    <span>No data available</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Categories;
