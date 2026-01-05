import React, { useState, useEffect } from 'react';
import './CategoryModal.css';

const CategoryModal = ({ isOpen, onClose, category, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    image: null,
    status: 'Active',
  });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        image: category.image || null,
        status: category.status || 'Active',
      });
    } else {
      setFormData({
        name: '',
        image: null,
        status: 'Active',
      });
    }
  }, [category, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      _id: category ? category._id : null,
    };
    console.log('Saving category data:', payload);
    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="category-modal-overlay">
      <div className="category-modal-content animate-slide-up">
        <div className="category-modal-header">
          <h3>{category ? 'Edit Category' : 'Add New Category'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Image</label>
            <div
              className={`image-upload-container ${isDragging ? 'dragging' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="category-file-input"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/jpeg, image/png, image/gif"
              />
              <label htmlFor="category-file-input" className="upload-label">
                <img src="https://img.icons8.com/?size=100&id=4716&format=png&color=000000" alt="upload icon" className="upload-icon" />
                <p>Drag and drop image here, or click to browse</p>
                <span>Supported formats: JPG, PNG, GIF (max 5MB each)</span>
              </label>
            </div>
            {formData.image && (
              <div className="category-image-preview">
                <img
                  src={typeof formData.image === 'string' ? formData.image : URL.createObjectURL(formData.image)}
                  alt="Category Preview"
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {category ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { CategoryModal };
