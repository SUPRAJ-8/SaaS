import React, { useState, useEffect } from 'react';
import './CategoryModal.css';

const SubCategoryModal = ({ isOpen, onClose, onSave, subcategory, isSaving }) => {
    const [formData, setFormData] = useState({
        name: '',
    });

    useEffect(() => {
        if (subcategory) {
            setFormData({
                name: subcategory.name || '',
            });
        } else {
            setFormData({
                name: '',
            });
        }
    }, [subcategory, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="category-modal-overlay">
            <div className="category-modal-content animate-slide-up">
                <div className="category-modal-header">
                    <h3>{subcategory ? 'Edit Sub-category' : 'Add New Sub-category'}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Sub-category Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. T-Shirts, Laptops, etc."
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSaving}>
                            Cancel
                        </button>
                        <button type="submit" className={`btn btn-primary ${isSaving ? 'btn-loading' : ''}`} disabled={isSaving}>
                            {isSaving ? 'Saving...' : (subcategory ? 'Update' : 'Add Sub-category')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export { SubCategoryModal };
