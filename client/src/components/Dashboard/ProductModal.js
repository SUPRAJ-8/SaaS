import React, { useState, useEffect } from 'react';
import './ProductModal.css';
import RichTextEditor from './RichTextEditor';
import 'react-quill-new/dist/quill.snow.css';
import API_URL from '../../apiConfig';
import { resolveImageUrl } from '../../themeUtils';
import {
  FaInfoCircle, FaTag, FaImage, FaBullhorn, FaTimes,
  FaCloudUploadAlt, FaTrash, FaCheckCircle, FaMinusCircle,
  FaLink, FaSearch, FaPalette, FaCube, FaChevronDown
} from 'react-icons/fa';

const ProductModal = ({ isOpen, onClose, product, onSave, isSaving }) => {
  const [activeTab, setActiveTab] = useState('media');
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
    status: 'Active',
    images: [],
    hasVariants: false,
    variants: [],
    variantColors: [],
    variantSizes: [],
    existingImages: [],
    samePriceForAllVariants: false,
    seoTitle: '',
    seoDescription: '',
    handle: '',
    sku: ''
  });
  const [categories, setCategories] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [activeImagePicker, setActiveImagePicker] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories`);
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
        images: [],
        existingImages: product.images || [],
        variantColors: product.variantColors || [],
        variantSizes: product.variantSizes || [],
        variants: product.variants || [],
        samePriceForAllVariants: product.samePriceForAllVariants || false,
        seoTitle: product.seoTitle || '',
        seoDescription: product.seoDescription || '',
        handle: product.handle || '',
        status: product.status || 'Active',
        sku: product.sku || ''
      });
    } else {
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
        status: 'Active',
        images: [],
        hasVariants: false,
        variants: [],
        variantColors: [],
        variantSizes: [],
        existingImages: [],
        samePriceForAllVariants: false,
        seoTitle: '',
        seoDescription: '',
        handle: '',
        sku: ''
      });
    }
  }, [product, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setFormData(prev => ({ ...prev, [name]: value, subcategory: '' }));
    } else if (name === 'name' && !formData.handle) {
      // Auto-generate handle if it's empty
      const autoHandle = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, [name]: value, handle: autoHandle }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusChange = (status) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleDescriptionChange = (value) => {
    setFormData(prev => ({ ...prev, longDescription: value }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[index] = { ...updatedVariants[index], [field]: value };
      return { ...prev, variants: updatedVariants };
    });
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
            sku: '',
            image: ''
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
        let formattedValue = value;
        if (type === 'color') {
          formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        } else if (type === 'size') {
          formattedValue = value.toUpperCase();
        }

        if (type === 'color' && !formData.variantColors.includes(formattedValue)) {
          const newColors = [...formData.variantColors, formattedValue];
          const newVariants = generateVariants(newColors, formData.variantSizes, formData.variants);
          setFormData(prev => ({ ...prev, variantColors: newColors, variants: newVariants }));
        } else if (type === 'size' && !formData.variantSizes.includes(formattedValue)) {
          const newSizes = [...formData.variantSizes, formattedValue];
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
    const hasNewImages = formData.images?.length > 0;
    const hasExistingImages = formData.existingImages?.length > 0;

    if (!hasNewImages && !hasExistingImages) {
      setActiveTab('media');
      alert('You must upload at least one image.');
      return;
    }

    if (!formData.name?.trim()) {
      setActiveTab('basic');
      alert('Product name is required.');
      return;
    }

    if (!formData.longDescription?.trim()) {
      setActiveTab('basic');
      alert('Product description is required.');
      return;
    }

    if (!formData.category) {
      setActiveTab('basic');
      alert('Category is required.');
      return;
    }

    // SKU is now optional
    // if (!formData.sku?.trim()) {
    //   setActiveTab('basic');
    //   alert('SKU is required.');
    //   return;
    // }

    if (!formData.hasVariants) {
      if (!formData.sellingPrice) {
        setActiveTab('pricing');
        alert('Selling price is required.');
        return;
      }
      if (formData.quantity === '' || formData.quantity === undefined) {
        setActiveTab('pricing');
        alert('Stock quantity is required.');
        return;
      }
    } else {
      // Check if variant options are added
      if (formData.variantColors.length === 0 && formData.variantSizes.length === 0) {
        setActiveTab('pricing');
        alert('Please add at least one color or size variant.');
        return;
      }
      // Check if variants have prices and stock if samePriceForAllVariants is false
      if (!formData.samePriceForAllVariants) {
        const invalidVariant = formData.variants.find(v => !v.sellingPrice || v.quantity === '' || v.quantity === undefined);
        if (invalidVariant) {
          setActiveTab('pricing');
          alert(`Please fill price and stock for all variants (${invalidVariant.color}/${invalidVariant.size}).`);
          return;
        }
      } else {
        if (!formData.sellingPrice) {
          setActiveTab('pricing');
          alert('Selling price is required for variants.');
          return;
        }
      }
    }

    onSave(formData);
  };

  const handleFileSelect = (e) => {
    const files = [...e.target.files];
    if (files.length > 0) {
      if ((formData.images.length + formData.existingImages.length + files.length) > 10) {
        alert('Max 10 images allowed.');
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

  const renderTabContent = () => {
    const selectedCategory = categories.find(c => c._id === formData.category);
    const hasSubcategories = selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0;

    switch (activeTab) {
      case 'basic':
        return (
          <div className="pm-tab-pane animate-fade-in">
            <div className="pm-row">
              <div className="pm-group flex-2">
                <label>Product Name <span className="pm-required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Premium Leather Desk Mat"
                />
              </div>
              <div className="pm-group flex-1">
                <label>SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="e.g. PLD-001"
                />
              </div>
            </div>

            <div className="pm-row">
              <div className="pm-group flex-1">
                <label>Category <span className="pm-required">*</span></label>
                <div className="pm-custom-select-wrapper">
                  <select name="category" value={formData.category} onChange={handleInputChange}>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  <FaChevronDown className="pm-select-icon" />
                </div>
              </div>
              {hasSubcategories && (
                <div className="pm-group flex-1 animate-fade-in">
                  <label>Subcategory</label>
                  <div className="pm-custom-select-wrapper">
                    <select name="subcategory" value={formData.subcategory} onChange={handleInputChange}>
                      <option value="">Select Subcategory</option>
                      {selectedCategory.subcategories.map(sub => (
                        <option key={sub.name} value={sub.name}>{sub.name}</option>
                      ))}
                    </select>
                    <FaChevronDown className="pm-select-icon" />
                  </div>
                </div>
              )}
            </div>

            <div className="pm-row">
              <div className="pm-group flex-3">
                <label>Description <span className="pm-required">*</span></label>
                <div
                  className="pm-rich-text-trigger"
                  onClick={() => setIsDescriptionModalOpen(true)}
                >
                  {formData.longDescription ? (
                    <div className="ql-editor" dangerouslySetInnerHTML={{ __html: formData.longDescription }} />
                  ) : (
                    <p className="pm-placeholder">Write a compelling description for your product...</p>
                  )}
                  <div className="pm-edit-overlay"><FaPalette /> Edit Description</div>
                </div>
              </div>
              <div className="pm-group flex-2">
                <label>Status <span className="pm-required">*</span></label>
                <div className="pm-status-selector">
                  <div
                    className={`pm-status-card ${formData.status === 'Active' ? 'active green' : ''}`}
                    onClick={() => handleStatusChange('Active')}
                  >
                    <div className="pm-status-indicator"></div>
                    <div className="pm-status-info">
                      <h4>Active</h4>
                      <p>Visible to all customers on the store front.</p>
                    </div>
                  </div>
                  <div
                    className={`pm-status-card ${formData.status === 'Draft' ? 'active orange' : ''}`}
                    onClick={() => handleStatusChange('Draft')}
                  >
                    <div className="pm-status-indicator"></div>
                    <div className="pm-status-info">
                      <h4>Draft</h4>
                      <p>Hidden from the store while you work on it.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="pm-tab-pane animate-fade-in">
            {!formData.hasVariants ? (
              <div className="pm-card">
                <div className="pm-card-header-with-action">
                  <div className="pm-header-meta">
                    <FaTag className="pm-header-icon" />
                    <h4>Base Pricing</h4>
                  </div>
                  <div className="pm-toggle-wrapper">
                    <span>Enable Variants</span>
                    <label className="pm-switch">
                      <input
                        type="checkbox"
                        checked={formData.hasVariants}
                        onChange={() => setFormData(prev => ({ ...prev, hasVariants: !prev.hasVariants }))}
                      />
                      <span className="pm-slider"></span>
                    </label>
                  </div>
                </div>
                <div className="pm-row mt-20">
                  <div className="pm-group flex-1">
                    <label>Original Price</label>
                    <div className="pm-input-with-symbol">
                      <span className="pm-symbol">NPR</span>
                      <input
                        type="number"
                        name="crossedPrice"
                        value={formData.crossedPrice}
                        onChange={handleInputChange}
                        placeholder="120"
                      />
                    </div>
                  </div>
                  <div className="pm-group flex-1">
                    <label>Sale Price <span className="pm-required">*</span></label>
                    <div className="pm-input-with-symbol">
                      <span className="pm-symbol">NPR</span>
                      <input
                        type="number"
                        name="sellingPrice"
                        value={formData.sellingPrice}
                        onChange={handleInputChange}
                        placeholder="89"
                      />
                    </div>
                  </div>
                  <div className="pm-group flex-1">
                    <label>Cost per item</label>
                    <div className="pm-input-with-symbol">
                      <span className="pm-symbol">NPR</span>
                      <input
                        type="number"
                        name="costPrice"
                        value={formData.costPrice}
                        onChange={handleInputChange}
                        placeholder="35"
                      />
                    </div>
                  </div>
                </div>

                <div className="pm-section-divider"></div>

                <div className="pm-row mt-20">
                  <div className="pm-group flex-1">
                    <label>Stock Quantity <span className="pm-required">*</span></label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="100"
                    />
                  </div>
                  <div className="pm-group flex-1">
                    {/* Placeholder to keep alignment */}
                  </div>
                  <div className="pm-group flex-1">
                    {/* Placeholder to keep alignment */}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="pm-card">
                  <div className="pm-card-header-with-action">
                    <div className="pm-header-meta">
                      <FaPalette className="pm-header-icon" />
                      <h4>VARIANT SETTINGS</h4>
                    </div>
                    <div className="pm-toggle-wrapper">
                      <span>Enable Variants</span>
                      <label className="pm-switch">
                        <input
                          type="checkbox"
                          checked={formData.hasVariants}
                          onChange={() => setFormData(prev => ({ ...prev, hasVariants: !prev.hasVariants }))}
                        />
                        <span className="pm-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="pm-variants-setup">
                    <div className="pm-row">
                      <div className="pm-group flex-1">
                        <label>Color Options</label>
                        <div className="pm-tag-input">
                          {formData.variantColors.map(color => (
                            <span key={color} className="pm-tag">
                              {color} <FaTimes onClick={() => removeTag(color, 'color')} />
                            </span>
                          ))}
                          <input type="text" placeholder="Add color..." onKeyDown={(e) => handleTagInputChange(e, 'color')} />
                        </div>
                      </div>
                      <div className="pm-group flex-1">
                        <label>Size Options</label>
                        <div className="pm-tag-input">
                          {formData.variantSizes.map(size => (
                            <span key={size} className="pm-tag">
                              {size} <FaTimes onClick={() => removeTag(size, 'size')} />
                            </span>
                          ))}
                          <input type="text" placeholder="Add size..." onKeyDown={(e) => handleTagInputChange(e, 'size')} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pm-card mt-20">
                  <div className="pm-card-header-with-action">
                    <div className="pm-header-meta">
                      <FaTag className="pm-header-icon" />
                      <h4>Pricing Strategy</h4>
                    </div>
                    <div className="pm-toggle-wrapper">
                      <span>Same price for all variants</span>
                      <label className="pm-switch">
                        <input
                          type="checkbox"
                          checked={formData.samePriceForAllVariants}
                          onChange={() => setFormData(prev => ({ ...prev, samePriceForAllVariants: !prev.samePriceForAllVariants }))}
                        />
                        <span className="pm-slider"></span>
                      </label>
                    </div>
                  </div>

                  {formData.samePriceForAllVariants && (
                    <div className="pm-global-pricing-box animate-fade-in">
                      <div className="pm-box-header">
                        <FaCube /> Global Variant Price <span className="pm-badge">ENABLED</span>
                      </div>
                      <div className="pm-row p-20">
                        <div className="pm-group flex-1">
                          <label>Original Price</label>
                          <div className="pm-input-with-symbol">
                            <span className="pm-symbol">NPR</span>
                            <input type="number" name="crossedPrice" value={formData.crossedPrice} onChange={handleSamePriceChange} placeholder="15000" />
                          </div>
                        </div>
                        <div className="pm-group flex-1">
                          <label>Sale Price <span className="pm-required">*</span></label>
                          <div className="pm-input-with-symbol">
                            <span className="pm-symbol">NPR</span>
                            <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleSamePriceChange} placeholder="12000" />
                          </div>
                        </div>
                        <div className="pm-group flex-1">
                          <label>Cost per item</label>
                          <div className="pm-input-with-symbol">
                            <span className="pm-symbol">NPR</span>
                            <input type="number" name="costPrice" value={formData.costPrice} onChange={handleSamePriceChange} placeholder="7500" />
                          </div>
                        </div>
                      </div>
                      <div className="pm-box-footer">
                        <FaInfoCircle /> Global prices are currently overriding individual variant pricing.
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}


            {formData.hasVariants && formData.variants.length > 0 && (
              <div className="pm-variants-list-table mt-20">
                <table>
                  <thead>
                    <tr>
                      <th>IMAGE</th>
                      <th>VARIANT</th>
                      <th>PRICE (NPR)</th>
                      <th>SALE PRICE (NPR) <span className="pm-required">*</span></th>
                      <th>COST PRICE (NPR)</th>
                      <th>STOCK <span className="pm-required">*</span></th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.variants.map((v, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="pm-variant-img-picker">
                            {v.image ? (
                              <div className="pm-variant-thumb-container">
                                <img src={resolveImageUrl(v.image, API_URL)} alt="variant" />
                                <button type="button" className="pm-remove-thumb" onClick={() => handleVariantChange(idx, 'image', '')}><FaTimes /></button>
                              </div>
                            ) : (
                              <div className="pm-variant-thumb-container">
                                <button
                                  type="button"
                                  className="pm-btn-select-img"
                                  onClick={() => setActiveImagePicker(idx)}
                                >
                                  <FaImage />
                                </button>
                                {activeImagePicker === idx && (
                                  <>
                                    <div className="pm-picker-backdrop" onClick={() => setActiveImagePicker(null)} />
                                    <div className={`pm-image-bubble-picker animate-scale-in ${idx >= formData.variants.length - 2 && formData.variants.length > 2 ? 'pm-picker-upward' : ''}`}>
                                      <div className="pm-picker-header">
                                        <span>Select Image</span>
                                        <FaTimes onClick={() => setActiveImagePicker(null)} />
                                      </div>
                                      <div className="pm-picker-grid">
                                        {formData.existingImages.length > 0 ? (
                                          formData.existingImages.map((img, i) => (
                                            <div
                                              key={i}
                                              className="pm-picker-item"
                                              onClick={() => {
                                                handleVariantChange(idx, 'image', img);
                                                setActiveImagePicker(null);
                                              }}
                                            >
                                              <img src={resolveImageUrl(img, API_URL)} alt={`Gallery ${i}`} />
                                              <span className="pm-img-index">{i + 1}</span>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="pm-picker-empty">
                                            <p>No images in gallery yet.</p>
                                            <small>Upload images in the Media tab first.</small>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="pm-variant-name">{v.color} / {v.size}</td>
                        <td>
                          <div className="pm-cell-input">
                            <span className="pm-currency">NPR</span>
                            <input
                              type="number"
                              value={v.crossedPrice}
                              onChange={(e) => handleVariantChange(idx, 'crossedPrice', e.target.value)}
                              disabled={formData.samePriceForAllVariants}
                            />
                          </div>
                        </td>
                        <td>
                          <div className="pm-cell-input">
                            <span className="pm-currency">NPR</span>
                            <input
                              type="number"
                              value={v.sellingPrice}
                              onChange={(e) => handleVariantChange(idx, 'sellingPrice', e.target.value)}
                              disabled={formData.samePriceForAllVariants}
                            />
                          </div>
                        </td>
                        <td>
                          <div className="pm-cell-input">
                            <span className="pm-currency">NPR</span>
                            <input
                              type="number"
                              value={v.costPrice}
                              onChange={(e) => handleVariantChange(idx, 'costPrice', e.target.value)}
                              disabled={formData.samePriceForAllVariants}
                            />
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="pm-stock-input"
                            value={v.quantity}
                            onChange={(e) => handleVariantChange(idx, 'quantity', e.target.value)}
                          />
                        </td>
                        <td className="pm-actions-cell">
                          <FaTrash className="pm-delete-row" onClick={() => { }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'media':
        return (
          <div className="pm-tab-pane animate-fade-in">
            <div className="pm-media-upload-zone"
              onClick={() => document.getElementById('pm-media-upload').click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const files = [...e.dataTransfer.files];
                if (files.length > 0) setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
              }}
            >
              <div className="pm-upload-content">
                <div className="pm-upload-icon-circle">
                  <FaCloudUploadAlt />
                </div>
                <h3>Drop your media here</h3>
                <p>Drag and drop images to upload. We support JPG, PNG, and WEBP formats up to 5MB each.</p>
                <input type="file" id="pm-media-upload" hidden multiple onChange={handleFileSelect} />
              </div>
            </div>

            <div className="pm-media-gallery-section mt-30">
              <div className="pm-section-header">
                <div className="pm-header-left">
                  <h4>PRODUCT GALLERY <span className="pm-required">*</span></h4>
                  <p className="pm-header-desc">Manage and reorder your product images</p>
                </div>
                <div className="pm-helper-info">
                  <FaInfoCircle /> First image is the main thumbnail
                </div>
              </div>
              <div className="pm-gallery-grid">
                {formData.existingImages.map((img, idx) => (
                  <div key={`ex-${idx}`} className={`pm-gallery-item group ${idx === 0 ? 'pm-main-thumbnail' : ''}`}>
                    <img src={resolveImageUrl(img, API_URL)} alt="product" />
                    <div className="pm-item-actions">
                      <button type="button" onClick={() => removeImage(idx, true)}><FaTrash /></button>
                    </div>
                  </div>
                ))}
                {formData.images.map((img, idx) => {
                  const isMain = formData.existingImages.length === 0 && idx === 0;
                  return (
                    <div key={`new-${idx}`} className={`pm-gallery-item group ${isMain ? 'pm-main-thumbnail' : ''}`}>
                      <img src={URL.createObjectURL(img)} alt="product" />
                      <div className="pm-item-actions">
                        <button type="button" onClick={() => removeImage(idx)}><FaTrash /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'seo':
        return (
          <div className="pm-tab-pane animate-fade-in">
            <div className="pm-seo-preview-card">
              <div className="pm-preview-header">
                SEARCH ENGINE LISTING PREVIEW <FaInfoCircle title="This is how your product will appear in Google search results." style={{ cursor: 'help' }} />
              </div>
              <div className="pm-preview-content">
                <div className="pm-preview-url">yourstore.com › products › {formData.handle || 'product-slug'}</div>
                <div className="pm-preview-title">{formData.seoTitle || formData.name || 'Product Name'} | {categories.find(c => c._id === formData.category)?.name || 'Store'}</div>
                <div className="pm-preview-desc">
                  {formData.seoDescription || (formData.longDescription ? formData.longDescription.replace(/<[^>]*>/g, '').substring(0, 160) : 'Add a meta description to improve your search ranking. This description is what appears under your page title in search results.')}
                </div>
              </div>
            </div>

            <div className="pm-card mt-20">
              <div className="pm-group">
                <div className="pm-label-with-hint">
                  <label>Page Title</label>
                  <FaInfoCircle title="A catchy title helps you rank higher and get more clicks. Keep it under 60 characters." style={{ cursor: 'help' }} />
                </div>
                <input
                  type="text"
                  name="seoTitle"
                  value={formData.seoTitle}
                  onChange={handleInputChange}
                  placeholder="Premium Leather Desk Mat | Quality Shop"
                />
                <div className="pm-input-footer">
                  <span>Keep it between 50-60 characters for best results.</span>
                  <span className={formData.seoTitle.length > 60 ? 'error' : ''}>{formData.seoTitle.length} / 60</span>
                </div>
              </div>

              <div className="pm-group mt-20">
                <div className="pm-label-with-hint">
                  <label>Meta Description</label>
                  <FaInfoCircle title="The meta description is a brief summary of your product. It influence whether people click your link in search results." style={{ cursor: 'help' }} />
                </div>
                <textarea
                  name="seoDescription"
                  value={formData.seoDescription}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Handcrafted top-grain leather desk mat designed for ultimate comfort and elegance..."
                />
                <div className="pm-input-footer">
                  <span>Recommended length is around 150-160 characters.</span>
                  <span className={formData.seoDescription.length > 160 ? 'error' : ''}>{formData.seoDescription.length} / 160</span>
                </div>
              </div>

              <div className="pm-group mt-20">
                <div className="pm-label-with-hint">
                  <label>URL Handle</label>
                  <FaInfoCircle title="This is the web address for your product. It should be unique and contain keywords." style={{ cursor: 'help' }} />
                </div>
                <div className="pm-url-input-group">
                  <span className="pm-prefix">/products/</span>
                  <input
                    type="text"
                    name="handle"
                    value={formData.handle}
                    onChange={handleInputChange}
                    placeholder="premium-leather-desk-mat"
                  />
                  <button
                    type="button"
                    className="pm-btn-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/products/${formData.handle}`);
                      alert('Product link copied to clipboard!');
                    }}
                    title="Copy product link"
                  >
                    <FaLink />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="pm-top-bar">
          <div className="pm-title-area">
            <div className="pm-title-icon">
              <FaCube />
            </div>
            <div className="pm-title-text">
              <h3>{product ? 'Edit Product' : 'Add Product'}</h3>
              <p>Managing: {formData.name || 'New Item'}</p>
            </div>
          </div>
          <button className="pm-close-icon" onClick={onClose}><FaTimes /></button>
        </div>

        <nav className="pm-tabs">
          <button
            className={`pm-tab-btn ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <FaImage /> Media
          </button>
          <button
            className={`pm-tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            <FaInfoCircle /> Basic Info
          </button>
          <button
            className={`pm-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <FaTag /> Pricing & Inventory
          </button>
          <button
            className={`pm-tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
            onClick={() => setActiveTab('seo')}
          >
            <FaBullhorn /> Marketing (SEO)
          </button>
        </nav>

        <div className="pm-body">
          {renderTabContent()}
        </div>

        <div className="pm-footer">
          <div className="pm-footer-left">
          </div>
          <div className="pm-footer-right">
            <button type="button" onClick={onClose} className="pm-btn-discard">Discard Changes</button>
            <button
              type="button"
              onClick={handleSubmit}
              className={`pm-btn-save ${isSaving ? 'loading' : ''}`}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : (product ? 'Update Product' : 'Save Product')}
            </button>
          </div>
        </div>

        {isDescriptionModalOpen && (
          <div className="pm-rt-modal-overlay" onClick={() => setIsDescriptionModalOpen(false)}>
            <div className="pm-rt-modal-content" onClick={e => e.stopPropagation()}>
              <div className="pm-rt-modal-header">
                <h3>Rich Product Description</h3>
                <button onClick={() => setIsDescriptionModalOpen(false)}><FaTimes /></button>
              </div>
              <div className="pm-rt-editor-body">
                <RichTextEditor
                  value={formData.longDescription}
                  onChange={handleDescriptionChange}
                />
              </div>
              <div className="pm-rt-modal-footer">
                <button className="pm-btn-save" onClick={() => setIsDescriptionModalOpen(false)}>Apply Changes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ProductModal };
