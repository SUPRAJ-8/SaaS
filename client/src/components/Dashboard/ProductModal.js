import React, { useState, useEffect } from 'react';
import './ProductModal.css';
import RichTextEditor from './RichTextEditor';
import 'react-quill-new/dist/quill.snow.css';
import API_URL from '../../apiConfig';
import { resolveImageUrl } from '../../themeUtils';

const ProductModal = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    longDescription: '',
    gender: 'No use',
    crossedPrice: '',
    sellingPrice: '',
    costPrice: '',
    quantity: '',
    category: '',
    subcategory: '',
    section: 'None',
    images: [],
    hasVariants: false,
    variants: [],
    variantColors: [],
    variantSizes: [],
    existingImages: [],
    samePriceForAllVariants: false
  });
  const [categories, setCategories] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

  const handleDescriptionChange = (value) => {
    setFormData(prev => ({ ...prev, longDescription: value }));
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();

    if (product) {
      setFormData({
        ...product,
        section: product.section || 'None',
        images: [], // keep new uploads separate
        existingImages: product.images || [],
        variantColors: product.variantColors || [],
        variantSizes: product.variantSizes || [],
        variants: product.variants || [],
        samePriceForAllVariants: product.samePriceForAllVariants || false,
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        shortDescription: '',
        longDescription: '',
        gender: 'No use',
        crossedPrice: '',
        sellingPrice: '',
        costPrice: '',
        quantity: '',
        category: '',
        subcategory: '',
        section: 'None',
        images: [],
        hasVariants: false,
        variants: [],
        variantColors: [],
        variantSizes: [],
        status: 'Active',
        existingImages: [],
        samePriceForAllVariants: false
      });
    }
  }, [product, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setFormData(prev => ({ ...prev, [name]: value, subcategory: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = value;
    setFormData(prev => ({ ...prev, variants: updatedVariants }));
  };

  const handleSamePriceChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedVariants = prev.variants.map(v => ({ ...v, [name]: value }));
      return { ...prev, [name]: value, variants: updatedVariants };
    });
  };

  const generateVariants = (colors, sizes, currentVariants = []) => {
    const newVariants = [];
    const existingVariantMap = new Map(
      currentVariants.map(v => [`${v.color}-${v.size}`, v])
    );

    colors.forEach(color => {
      sizes.forEach(size => {
        const key = `${color}-${size}`;
        const existingVariant = existingVariantMap.get(key);
        if (existingVariant) {
          newVariants.push(existingVariant);
        } else {
          newVariants.push({
            color,
            size,
            crossedPrice: formData.samePriceForAllVariants ? formData.crossedPrice : 0,
            sellingPrice: formData.samePriceForAllVariants ? formData.sellingPrice : 0,
            costPrice: formData.samePriceForAllVariants ? formData.costPrice : 0,
            weight: 0,
            quantity: 0,
            sku: ''
          });
        }
      });
    });
    return newVariants;
  };

  const handleTagInputChange = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value) {
        if (type === 'color' && !formData.variantColors.includes(value)) {
          const newColors = [...formData.variantColors, value];
          const newVariants = generateVariants(newColors, formData.variantSizes, formData.variants);
          setFormData(prev => ({ ...prev, variantColors: newColors, variants: newVariants }));
        } else if (type === 'size' && !formData.variantSizes.includes(value)) {
          const newSizes = [...formData.variantSizes, value];
          const newVariants = generateVariants(formData.variantColors, newSizes, formData.variants);
          setFormData(prev => ({ ...prev, variantSizes: newSizes, variants: newVariants }));
        }
        e.target.value = '';
      }
    }
  };

  const removeTag = (tag, type) => {
    if (type === 'color') {
      const newColors = formData.variantColors.filter(c => c !== tag);
      const newVariants = generateVariants(newColors, formData.variantSizes, formData.variants);
      setFormData(prev => ({ ...prev, variantColors: newColors, variants: newVariants }));
    } else if (type === 'size') {
      const newSizes = formData.variantSizes.filter(s => s !== tag);
      const newVariants = generateVariants(formData.variantColors, newSizes, formData.variants);
      setFormData(prev => ({ ...prev, variantSizes: newSizes, variants: newVariants }));
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if there are any images (either new uploads or existing)
    const hasNewImages = formData.images && formData.images.length > 0 && formData.images.some(img => img instanceof File);
    const hasExistingImages = formData.existingImages && formData.existingImages.length > 0;

    if (!hasNewImages && !hasExistingImages) {
      alert('You must upload at least one image.');
      return;
    }

    if (!formData.name || formData.name.trim() === '') {
      alert('Product name is required.');
      return;
    }

    // Ensure status is set
    const dataToSave = {
      ...formData,
      status: formData.status || 'Active'
    };

    onSave(dataToSave);
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
    const files = [...e.dataTransfer.files];
    if (files && files.length > 0) {
      if (formData.images.length + formData.existingImages.length + files.length > 10) {
        alert('You can only upload a maximum of 10 images.');
        return;
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    }
  };

  const handleFileSelect = (e) => {
    const files = [...e.target.files];
    if (files && files.length > 0) {
      if (formData.images.length + formData.existingImages.length + files.length > 10) {
        alert('You can only upload a maximum of 10 images.');
        return;
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    }
  };

  const removeImage = (index, isExisting = false) => {
    if (isExisting) {
      setFormData(prev => ({
        ...prev,
        existingImages: prev.existingImages.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="form-header">
            <h3>{product ? 'Edit Product' : 'Add New Product'}</h3>
            <button type="button" className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="form-layout">
            {/* Left Column */}
            <div className="form-column-left">
              <div className="card">
                <h3>General Information</h3>
                <div className="form-group">
                  <label>Name Product</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <div
                    className="rich-text-preview"
                    onClick={() => setIsDescriptionModalOpen(true)}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      minHeight: '100px',
                      cursor: 'pointer',
                      background: '#fff',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}
                  >
                    {formData.longDescription ? (
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: formData.longDescription }} />
                    ) : (
                      <div style={{ padding: '10px' }}>
                        <span style={{ color: '#999' }}>Click to add description...</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="No use">No use</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              </div>

              <div className="card">
                <h3>Pricing And Stock</h3>
                <div className="form-group">
                  <div className="label-toggle">
                    <label>Enable Product Variants</label>
                    <label className="switch">
                      <input type="checkbox" checked={formData.hasVariants} onChange={() => setFormData(prev => ({ ...prev, hasVariants: !prev.hasVariants }))} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
                {formData.hasVariants ? (
                  <div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Choose Color</label>
                        <div className="tag-input">
                          {formData.variantColors.map(color => (
                            <span key={color} className="tag">{color.charAt(0).toUpperCase() + color.slice(1)} <button type="button" onClick={() => removeTag(color, 'color')}>×</button></span>
                          ))}
                          <input type="text" placeholder="eg. Red, Green" onKeyDown={(e) => handleTagInputChange(e, 'color')} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Choose Size</label>
                        <div className="tag-input">
                          {formData.variantSizes.map(size => (
                            <span key={size} className="tag">{size.toUpperCase()} <button type="button" onClick={() => removeTag(size, 'size')}>×</button></span>
                          ))}
                          <input type="text" placeholder="eg. M, XL" onKeyDown={(e) => handleTagInputChange(e, 'size')} />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="label-toggle">
                        <label>Same price for all variants</label>
                        <label className="switch">
                          <input type="checkbox" checked={formData.samePriceForAllVariants} onChange={() => setFormData(prev => ({ ...prev, samePriceForAllVariants: !prev.samePriceForAllVariants }))} />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>

                    {formData.samePriceForAllVariants && (
                      <div>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="crossed-price-label">Crossed Price</label>
                            <input type="number" name="crossedPrice" value={formData.crossedPrice} onChange={handleSamePriceChange} />
                          </div>
                          <div className="form-group">
                            <label>Selling Price</label>
                            <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleSamePriceChange} />
                          </div>
                          <div className="form-group">
                            <label>Cost Price</label>
                            <input type="number" name="costPrice" value={formData.costPrice} onChange={handleSamePriceChange} />
                          </div>
                        </div>
                      </div>
                    )}
                    {formData.variants.length > 0 && (
                      <div className="variants-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Variant</th>
                              <th className="crossed-price-label">Crossed Price</th>
                              <th>Selling Price</th>
                              <th>Cost Price</th>
                              <th>Weight</th>
                              <th>Quantity</th>
                              <th>SKU</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.variants.map((variant, index) => (
                              <tr key={index}>
                                <td>{variant.color}/{variant.size}</td>
                                <td><input type="number" value={variant.crossedPrice} onChange={(e) => handleVariantChange(index, 'crossedPrice', e.target.value)} disabled={formData.samePriceForAllVariants} /></td>
                                <td><input type="number" value={variant.sellingPrice} onChange={(e) => handleVariantChange(index, 'sellingPrice', e.target.value)} disabled={formData.samePriceForAllVariants} /></td>
                                <td><input type="number" value={variant.costPrice} onChange={(e) => handleVariantChange(index, 'costPrice', e.target.value)} disabled={formData.samePriceForAllVariants} /></td>
                                <td><input type="number" value={variant.weight} onChange={(e) => handleVariantChange(index, 'weight', e.target.value)} /></td>
                                <td><input type="number" value={variant.quantity} onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)} /></td>
                                <td><input type="text" value={variant.sku} onChange={(e) => handleVariantChange(index, 'sku', e.target.value)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="crossed-price-label">Crossed Price</label>
                        <input type="number" name="crossedPrice" value={formData.crossedPrice} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Selling Price</label>
                        <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Cost Price</label>
                        <input type="number" name="costPrice" value={formData.costPrice} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Quantity</label>
                        <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="form-column-right">
              <div className="card">
                <h3>Upload Img</h3>
                <div
                  className={`image-upload-container ${isDragging ? 'dragging' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file-input"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="file-input" className="upload-label">
                    <img src="https://img.icons8.com/ios/50/000000/image--v1.png" alt="upload icon" />
                    <p>Drop your files here, or <span>Browse</span></p>
                  </label>
                </div>
                <div className="image-preview">
                  {formData.existingImages.map((image, index) => (
                    <div key={`existing-${index}`} className="image-thumbnail">
                      <img
                        src={resolveImageUrl(image, API_URL)}
                        alt={`existing ${index}`}
                      />
                      <button type="button" onClick={() => removeImage(index, true)}>×</button>
                    </div>
                  ))}
                  {formData.images.map((image, index) => (
                    <div key={`new-${index}`} className="image-thumbnail">
                      <img src={URL.createObjectURL(image)} alt={`preview ${index}`} />
                      <button type="button" onClick={() => removeImage(index)}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3>Status</h3>
                <div className="form-group">
                  <label>Product Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="card">
                <h3>Category</h3>
                <div className="form-group">
                  <label>Product Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange}>
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {formData.category && categories.find(c => c._id === formData.category)?.subcategories?.length > 0 && (
                  <div className="form-group">
                    <label>Product Sub-Category</label>
                    <select name="subcategory" value={formData.subcategory} onChange={handleInputChange}>
                      <option value="">Select a sub-category</option>
                      {categories.find(c => c._id === formData.category).subcategories.map(sub => (
                        <option key={sub._id || sub.name} value={sub.name}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Only show Choose Section if Ecommerce Theme is enabled */}
                {(localStorage.getItem('themeId') || 'ecommerce') === 'ecommerce' && (
                  <div className="form-group">
                    <label>Choose Section</label>
                    <select name="section" value={formData.section} onChange={handleInputChange}>
                      <option value="None">None</option>
                      <option value="Popular">Popular</option>
                      <option value="Featured">Featured</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{product ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </div>
      {isDescriptionModalOpen && (
        <div className="rich-text-modal-overlay" onClick={() => setIsDescriptionModalOpen(false)}>
          <div className="rich-text-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Description</h3>
              <button className="close-btn" onClick={() => setIsDescriptionModalOpen(false)}>×</button>
            </div>
            <RichTextEditor
              value={formData.longDescription}
              onChange={handleDescriptionChange}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            />
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setIsDescriptionModalOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ProductModal };
