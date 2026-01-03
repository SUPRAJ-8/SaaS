import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaUpload, FaTrashAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import API_URL from '../../apiConfig';
import './Customers.css';
import './StoreSettings.css';

const StoreSettings = () => {
  const [activeTab, setActiveTab] = useState(() => {
    // Load the last active tab from localStorage on mount
    return localStorage.getItem('storeSettingsActiveTab') || 'store-details';
  });
  const [dragActive, setDragActive] = useState({ logo: false, favicon: false });
  const [expandedSections, setExpandedSections] = useState({
    branding: false,
    brandName: false,
    imageRatio: false,
    currencyIndicator: false,
    siteConstruction: false,
    themes: false,
    components: false,
    navigation: false
  });

  // Predefined color themes
  /*
  const colorThemes = [
    { name: 'Purple Dream', primary: '#7c3aed', secondary: '#a78bfa', accent: '#c4b5fd', bg: '#faf5ff' },
    { name: 'Ocean Blue', primary: '#0ea5e9', secondary: '#38bdf8', accent: '#7dd3fc', bg: '#f0f9ff' },
    { name: 'Forest Green', primary: '#10b981', secondary: '#34d399', accent: '#6ee7b7', bg: '#f0fdf4' },
    { name: 'Sunset Orange', primary: '#f97316', secondary: '#fb923c', accent: '#fdba74', bg: '#fff7ed' },
    { name: 'Ruby Red', primary: '#ef4444', secondary: '#f87171', accent: '#fca5a5', bg: '#fef2f2' },
    { name: 'Royal Gold', primary: '#eab308', secondary: '#facc15', accent: '#fde047', bg: '#fefce8' },
    { name: 'Midnight Dark', primary: '#1e293b', secondary: '#334155', accent: '#475569', bg: '#f8fafc' },
    { name: 'Pink Blossom', primary: '#ec4899', secondary: '#f472b6', accent: '#f9a8d4', bg: '#fdf2f8' },
  ];
  */
  const colorThemes = {
    social: [
      { name: 'YouTube Light', primary: '#ff0200', secondary: '#0200ff', accent: '#ff3533', bg: '#fbfbfb', surface: '#f0f0f0', text: '#262626' },
      { name: 'YouTube Dark', primary: '#ff0200', secondary: '#0200ff', accent: '#ff3533', bg: '#1a1a1a', surface: '#262626', text: '#fbfbfb' },
      { name: 'Twitch Light', primary: '#9147ff', secondary: '#ff4759', accent: '#af7aff', bg: '#fbfbfb', surface: '#f0eff0', text: '#262527' },
      { name: 'Twitch Dark', primary: '#9147ff', secondary: '#ff4759', accent: '#af7aff', bg: '#19191a', surface: '#262527', text: '#fbfbfb' },
      { name: 'Discord Light', primary: '#5866f2', secondary: '#f25899', accent: '#8791f6', bg: '#fafafc', surface: '#ecedf4', text: '#1d1e30' },
      { name: 'Discord Dark', primary: '#5866f2', secondary: '#f25899', accent: '#8791f6', bg: '#131420', surface: '#1d1e30', text: '#fafafc' },
    ],
    platform: [
      { name: 'Indie Hackers Light', primary: '#4699eb', secondary: '#eb9846', accent: '#74b2f0', bg: '#fafbfd', surface: '#eaf0f5', text: '#192634' },
      { name: 'Indie Hackers Dark', primary: '#4699eb', secondary: '#eb9846', accent: '#74b2f0', bg: '#111a22', surface: '#192634', text: '#fafbfd' },
      { name: 'Unreal Engine Light', primary: '#02abf5', secondary: '#f50246', accent: '#2dbefd', bg: '#fafcfd', surface: '#eaf2f5', text: '#192b34' },
      { name: 'Unreal Engine Dark', primary: '#02abf5', secondary: '#f50246', accent: '#2dbefd', bg: '#111d22', surface: '#192b34', text: '#fafcfd' },
    ],
    classic: [
      { name: 'Purple Dream', primary: '#7c3aed', secondary: '#a78bfa', accent: '#c4b5fd', bg: '#faf5ff', surface: '#ffffff', text: '#1f2937' },
      { name: 'Ocean Blue', primary: '#0ea5e9', secondary: '#38bdf8', accent: '#7dd3fc', bg: '#f0f9ff', surface: '#ffffff', text: '#1f2937' },
      { name: 'Forest Green', primary: '#10b981', secondary: '#34d399', accent: '#6ee7b7', bg: '#f0fdf4', surface: '#ffffff', text: '#1f2937' },
      { name: 'Sunset Orange', primary: '#f97316', secondary: '#fb923c', accent: '#fdba74', bg: '#fff7ed', surface: '#ffffff', text: '#1f2937' },
      { name: 'Ruby Red', primary: '#ef4444', secondary: '#f87171', accent: '#fca5a5', bg: '#fef2f2', surface: '#ffffff', text: '#1f2937' },
      { name: 'Royal Gold', primary: '#eab308', secondary: '#facc15', accent: '#fde047', bg: '#fefce8', surface: '#ffffff', text: '#1f2937' },
      { name: 'Midnight Dark', primary: '#1e293b', secondary: '#334155', accent: '#475569', bg: '#f8fafc', surface: '#ffffff', text: '#1f2937' },
      { name: 'Pink Blossom', primary: '#ec4899', secondary: '#f472b6', accent: '#f9a8d4', bg: '#fdf2f8', surface: '#ffffff', text: '#1f2937' },
    ]
  };


  const defaultSettings = {
    storeName: '',
    businessCategory: 'Fashion, Shoes & Accessories',
    contactNumber: '',
    storeAddress: '',
    contactEmail: '',
    registeredBusinessName: '',
    panVatNumber: '',
    registrationNumber: '',
    ecommerceNumber: '',
    outlets: '',
    complianceEmail: '',
    companyAddress: '',
    complianceContactNumber: '',
    complaintOfficer: '',
    showInWebsite: false,
    // Social Accounts
    facebook: '',
    instagram: '',
    tiktok: '',
    whatsappNumber: '',
    // Domains
    subdomain: '',
    customDomain: '',
    // Appearances - Branding
    logo: '',
    favicon: '',
    brandName: '',
    imageRatio: '1:1',
    currencySymbol: 'Rs',
    currencyPosition: 'before',
    siteUnderConstruction: false,
    constructionMessage: 'We are currently updating our store. Please check back soon!',
    constructionContactEmail: '',
    primaryColor: '#5866f2',
    secondaryColor: '#f25899',
    accentColor: '#8791f6',
    backgroundColor: '#131420',
    surfaceColor: '#1d1e30',
    textColor: '#fafafc',
    selectedTheme: 'Discord Dark',
    fontFamily: 'Inter',
    // Appearances - Components
    buttonStyle: 'rounded',
    cardStyle: 'shadow',
    layoutStyle: 'modern',
    headerStyle: 'fixed',
  };

  const [storeData, setStoreData] = useState(defaultSettings);
  const [navbarSettings, setNavbarSettings] = useState({
    navbarStyle: 'basic'
  });
  const [footerSettings, setFooterSettings] = useState({
    tagline: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      // 1. Try to fetch from API first (Source of Truth)
      try {
        const response = await axios.get(`${API_URL}/api/store-settings`, {
          withCredentials: true
        });

        if (response.data && Object.keys(response.data).length > 0) {
          // Merge API data with defaults
          const mergedData = { ...defaultSettings, ...response.data };
          setStoreData(mergedData);

          // Also update localStorage to keep it in sync for other components
          localStorage.setItem('storeSettings', JSON.stringify(mergedData));
          window.dispatchEvent(new Event('storeSettingsUpdated'));
          return;
        }
      } catch (error) {
        console.error('Failed to load store settings from API:', error);
      }

      // 2. Fallback to localStorage if API fails or returns empty
      const savedSettings = localStorage.getItem('storeSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setStoreData(prev => ({ ...prev, ...parsed }));
        } catch (error) {
          console.error('Failed to parse local store settings:', error);
        }
      }

      const savedNavbar = localStorage.getItem('navbarSettings');
      if (savedNavbar) setNavbarSettings(JSON.parse(savedNavbar));

      const savedFooter = localStorage.getItem('footerSettings');
      if (savedFooter) setFooterSettings(JSON.parse(savedFooter));
    };

    loadSettings();

    // Listen for updates from other parts of the dashboard (like Themes page)
    const handleLocalUpdate = () => {
      const savedSettings = localStorage.getItem('storeSettings');
      if (savedSettings) {
        setStoreData(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
    };

    window.addEventListener('storeSettingsUpdated', handleLocalUpdate);
    return () => window.removeEventListener('storeSettingsUpdated', handleLocalUpdate);
  }, []);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('storeSettingsActiveTab', activeTab);
  }, [activeTab]);

  // Helper function to save settings to API and LocalStorage
  const saveSettingsToApi = async (newData, successMessage) => {
    try {
      // 1. Save to API
      await axios.put(`${API_URL}/api/store-settings`, newData, {
        withCredentials: true
      });

      // 2. Save to LocalStorage (for immediate UI updates in dashboard)
      localStorage.setItem('storeSettings', JSON.stringify(newData));
      window.dispatchEvent(new Event('storeSettingsUpdated'));

      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings to server. Changes saved locally only.');
      // Fallback: still save locally
      localStorage.setItem('storeSettings', JSON.stringify(newData));
      window.dispatchEvent(new Event('storeSettingsUpdated'));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    const updatedData = {
      ...storeData,
      [name]: newValue
    };
    setStoreData(updatedData);

    // Immediate local feedback for branding/naming fields (updates tab title, sidebar, etc.)
    if (['brandName', 'storeName'].includes(name)) {
      localStorage.setItem('storeSettings', JSON.stringify(updatedData));
      window.dispatchEvent(new Event('storeSettingsUpdated'));
    }

    // Auto-save font family changes (keeps existing logic)
    if (name === 'fontFamily') {
      saveSettingsToApi(updatedData, 'Font family updated successfully!');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveSettingsToApi(storeData, 'Store settings saved successfully!');
  };

  const handleComplianceSubmit = (e) => {
    e.preventDefault();
    saveSettingsToApi(storeData, 'Compliance information saved successfully!');
  };

  const handleSocialAccountsSubmit = (e) => {
    e.preventDefault();
    saveSettingsToApi(storeData, 'Social accounts saved successfully!');
  };

  const handleDomainsSubmit = (e) => {
    e.preventDefault();
    saveSettingsToApi(storeData, 'Domain settings saved successfully!');
  };

  const handleBrandingSubmit = (e) => {
    e.preventDefault();
    saveSettingsToApi(storeData, 'Branding settings saved successfully!');
  };

  const handleBrandNameSubmit = (e) => {
    e.preventDefault();
    saveSettingsToApi(storeData, 'Brand Name saved successfully!');
  };

  const handleImageRatioSubmit = (e) => {
    e.preventDefault();
    saveSettingsToApi(storeData, 'Image Ratio settings saved successfully!');
  };

  const handleCurrencySubmit = (e) => {
    e.preventDefault();
    saveSettingsToApi(storeData, 'Currency settings saved successfully!');
  };

  const handleConstructionSubmit = (e) => {
    e.preventDefault();
    saveSettingsToApi(storeData, 'Site construction settings saved successfully!');
  };

  const handleThemesSubmit = (e) => {
    e.preventDefault();
    saveSettingsToApi(storeData, 'Themes & Fonts settings saved successfully!');
  };

  const handleComponentsSubmit = (e) => {
    e.preventDefault();
    saveSettingsToApi(storeData, 'Component settings saved successfully!');
  };

  const handleThemeSelect = (theme) => {
    const updatedData = {
      ...storeData,
      primaryColor: theme.primary,
      secondaryColor: theme.secondary,
      accentColor: theme.accent,
      backgroundColor: theme.bg,
      surfaceColor: theme.surface,
      textColor: theme.text,
      selectedTheme: theme.name
    };
    setStoreData(updatedData);
    saveSettingsToApi(updatedData, `${theme.name} theme applied successfully!`);
  };

  const handleFileUpload = (file, field) => {
    if (!file) return;

    console.log(`[File Upload] Detected:`, { name: file.name, type: file.type, size: `${(file.size / 1024 / 1024).toFixed(2)} MB` });

    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    const isIco = file.type === 'image/x-icon' || file.type === 'image/vnd.microsoft.icon' || file.name.toLowerCase().endsWith('.ico');
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    const isJpg = file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');
    const fieldName = field === 'logo' ? 'Logo' : 'Favicon';

    // 1. Size Validation (Max 10MB to prevent browser/server crashes)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${fieldName} is too large! Max limit is 10MB.`);
      return;
    }

    // 2. Initial Validation
    if (field === 'favicon') {
      const allowedTypes = ['image/svg+xml', 'image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/jpeg'];
      const isAllowed = allowedTypes.includes(file.type) || isIco || isSvg || isPng || isJpg;

      if (!isAllowed) {
        toast.error('Favicon must be SVG, PNG, JPG or ICO format!');
        return;
      }
    } else if (!file.type.startsWith('image/') && !isIco && !isSvg && !isPng && !isJpg) {
      toast.error('Please upload a valid image file');
      return;
    }

    // 3. Read file (Ensures data access)
    const reader = new FileReader();

    reader.onload = (e) => {
      const base64Data = e.target.result;
      if (!base64Data) {
        toast.error(`Failed to read ${fieldName} data. Please try again.`);
        return;
      }

      const commitUpload = () => {
        const updatedData = { ...storeData, [field]: base64Data };
        setStoreData(updatedData);
        saveSettingsToApi(updatedData, `${fieldName} uploaded successfully!`);
      };

      if (isSvg) {
        commitUpload();
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxWidth = field === 'logo' ? 3000 : 1024; // Relaxed limits
        const maxHeight = field === 'logo' ? 1500 : 1024;

        if (img.width > maxWidth || img.height > maxHeight) {
          toast.error(`${fieldName} is too large (${img.width}x${img.height}px). Max: ${maxWidth}x${maxHeight}px`);
          return;
        }
        commitUpload();
      };

      img.onerror = () => {
        if (isIco) {
          commitUpload();
        } else {
          toast.error('Could not verify image dimensions. The file might be in an unsupported format.');
        }
      };

      img.src = base64Data;
    };

    reader.onerror = (err) => {
      console.error("FileReader Error:", err);
      toast.error(`Error reading ${file.name}. It might be corrupted or locked by another app.`);
    };

    try {
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Reader Trigger Error:", err);
      toast.error("An error occurred while starting the file read.");
    }
  };

  const handleDrag = (e, field, isActive) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [field]: isActive }));
  };

  const handleDrop = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [field]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], field);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="customers-page">
      <div className="page-header">
        <div className="page-header-top">
          <h2 className="page-title">Store Settings</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'store-details' ? 'active' : ''}`}
          onClick={() => setActiveTab('store-details')}
        >
          Store Details
        </button>
        <button
          className={`tab-button ${activeTab === 'social-accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('social-accounts')}
        >
          Social Accounts
        </button>
        <button
          className={`tab-button ${activeTab === 'appearances' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearances')}
        >
          Appearances
        </button>
        <button
          className={`tab-button ${activeTab === 'delivery-charge' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivery-charge')}
        >
          Delivery Charge
        </button>
        <button
          className={`tab-button ${activeTab === 'domains' ? 'active' : ''}`}
          onClick={() => setActiveTab('domains')}
        >
          Domains
        </button>
      </div>

      <div className="store-settings-container">
        {/* Tab Content */}
        {activeTab === 'store-details' && (
          <div className="tab-content">
            {/* Store Details Section */}
            <form onSubmit={handleSubmit} className="settings-form">
              <h3 className="section-heading">Store Details</h3>

              <div className="form-row">
                <div className="form-field">
                  <label>
                    Store Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="storeName"
                    value={storeData.storeName}
                    onChange={handleInputChange}
                    placeholder="eg:Nepo Store"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>
                    Business Category <span className="required">*</span>
                  </label>
                  <select
                    name="businessCategory"
                    value={storeData.businessCategory}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Fashion, Shoes & Accessories">Fashion, Shoes & Accessories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Sports & Outdoors">Sports & Outdoors</option>
                    <option value="Books & Media">Books & Media</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Health & Beauty">Health & Beauty</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>
                    Contact Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={storeData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="eg:+97798000000000"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Store Address</label>
                  <input
                    type="text"
                    name="storeAddress"
                    value={storeData.storeAddress}
                    onChange={handleInputChange}
                    placeholder="eg:Tokha - 8, Kathmandu"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field full-width">
                  <label>
                    Contact Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={storeData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="eg:hello@yourstore.com"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="save-button">
                Save Changes
              </button>
            </form>

            {/* Ecommerce Compliance Information */}
            <form onSubmit={handleComplianceSubmit} className="settings-form compliance-section">
              <div className="section-header-with-checkbox">
                <h3 className="section-heading">Ecommerce Compliance Information</h3>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="showInWebsite"
                    checked={storeData.showInWebsite}
                    onChange={handleInputChange}
                  />
                  <span>Show in website</span>
                </label>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Registered Business Name</label>
                  <input
                    type="text"
                    name="registeredBusinessName"
                    value={storeData.registeredBusinessName}
                    onChange={handleInputChange}
                    placeholder="eg: WHCH"
                  />
                </div>

                <div className="form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    name="complianceEmail"
                    value={storeData.complianceEmail}
                    onChange={handleInputChange}
                    placeholder="eg: hello@yourstore.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>PAN/VAT Number</label>
                  <input
                    type="text"
                    name="panVatNumber"
                    value={storeData.panVatNumber}
                    onChange={handleInputChange}
                    placeholder="eg: 123456789"
                  />
                </div>

                <div className="form-field">
                  <label>Company Address</label>
                  <input
                    type="text"
                    name="companyAddress"
                    value={storeData.companyAddress}
                    onChange={handleInputChange}
                    placeholder="eg: Kathmandu, Nepal"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={storeData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="eg: 1234567890"
                  />
                </div>

                <div className="form-field">
                  <label>Contact Number</label>
                  <input
                    type="tel"
                    name="complianceContactNumber"
                    value={storeData.complianceContactNumber}
                    onChange={handleInputChange}
                    placeholder="eg: +97798000000000"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>E-commerce Number</label>
                  <input
                    type="text"
                    name="ecommerceNumber"
                    value={storeData.ecommerceNumber}
                    onChange={handleInputChange}
                    placeholder="eg: EC12345"
                  />
                </div>

                <div className="form-field">
                  <label>Complaint Officer</label>
                  <input
                    type="text"
                    name="complaintOfficer"
                    value={storeData.complaintOfficer}
                    onChange={handleInputChange}
                    placeholder="eg: John Doe"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field full-width">
                  <label>Outlets</label>
                  <input
                    type="text"
                    name="outlets"
                    value={storeData.outlets}
                    onChange={handleInputChange}
                    placeholder="Type and press Enter"
                  />
                </div>
              </div>

              <button type="submit" className="save-button">
                Save Changes
              </button>
            </form>
          </div>
        )}

        {activeTab === 'social-accounts' && (
          <div className="tab-content">
            <form onSubmit={handleSocialAccountsSubmit} className="settings-form">
              <h3 className="section-heading">Social Accounts</h3>

              <div className="form-row">
                <div className="form-field">
                  <label>Facebook</label>
                  <input
                    type="text"
                    name="facebook"
                    value={storeData.facebook}
                    onChange={handleInputChange}
                    placeholder="eg: https://fb.com/nepostore"
                  />
                </div>

                <div className="form-field">
                  <label>Instagram</label>
                  <input
                    type="text"
                    name="instagram"
                    value={storeData.instagram}
                    onChange={handleInputChange}
                    placeholder="eg: https://instagram.com/nepostore"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Tiktok</label>
                  <input
                    type="text"
                    name="tiktok"
                    value={storeData.tiktok}
                    onChange={handleInputChange}
                    placeholder="eg: https://tiktok.com/nepostore"
                  />
                </div>

                <div className="form-field">
                  <label>Whatsapp Number</label>
                  <input
                    type="text"
                    name="whatsappNumber"
                    value={storeData.whatsappNumber}
                    onChange={handleInputChange}
                    placeholder="eg: +97798000000000"
                  />
                </div>
              </div>

              <button type="submit" className="save-button">
                Save
              </button>
            </form>
          </div>
        )}

        {activeTab === 'appearances' && (
          <div className="tab-content">
            {/* Branding Section */}
            <form onSubmit={handleBrandingSubmit} className="settings-form">
              <div
                className="collapsible-section-header"
                onClick={() => toggleSection('branding')}
              >
                <h3 className="section-heading">Branding</h3>
                {expandedSections.branding ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {expandedSections.branding && (
                <div className="collapsible-content">

                  <div className="form-row branding-row">
                    <div className="form-field">
                      <label className="upload-label">Brand Logo</label>
                      <p className="upload-recommendation">Preferred: 725 x 145 px</p>
                      <div className="upload-card">
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'logo')}
                          style={{ display: 'none' }}
                        />
                        <div
                          className={`upload-zone ${dragActive.logo ? 'drag-active' : ''} ${storeData.logo ? 'has-image' : ''}`}
                          onDragEnter={(e) => handleDrag(e, 'logo', true)}
                          onDragLeave={(e) => handleDrag(e, 'logo', false)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, 'logo')}
                        >
                          {!storeData.logo ? (
                            <label htmlFor="logo-upload" className="upload-content">
                              <div className="upload-icon-wrapper">
                                <FaUpload />
                              </div>
                              <span className="upload-title">Upload Logo</span>
                              <small className="upload-subtitle">Click or drag and drop</small>
                              <small className="upload-hint">PNG, JPG, SVG • Max 2000 x 500 px</small>
                            </label>
                          ) : (
                            <div className="uploaded-preview">
                              <label htmlFor="logo-upload" className="preview-click-area" title="Click to change logo">
                                <img src={storeData.logo} alt="Logo" />
                              </label>
                              <button
                                type="button"
                                className="delete-icon-button"
                                onClick={() => {
                                  const updatedData = { ...storeData, logo: '' };
                                  setStoreData(updatedData);
                                  saveSettingsToApi(updatedData, 'Logo deleted successfully!');
                                }}
                                title="Delete logo"
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="upload-label">Brand Favicon</label>
                      <p className="upload-recommendation">Preferred: 96 x 96 px</p>
                      <div className="upload-card">
                        <input
                          type="file"
                          id="favicon-upload"
                          accept="image/svg+xml,image/png"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'favicon')}
                          style={{ display: 'none' }}
                        />
                        <div
                          className={`upload-zone ${dragActive.favicon ? 'drag-active' : ''} ${storeData.favicon ? 'has-image' : ''}`}
                          onDragEnter={(e) => handleDrag(e, 'favicon', true)}
                          onDragLeave={(e) => handleDrag(e, 'favicon', false)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, 'favicon')}
                        >
                          {!storeData.favicon ? (
                            <label htmlFor="favicon-upload" className="upload-content">
                              <div className="upload-icon-wrapper">
                                <FaUpload />
                              </div>
                              <span className="upload-title">Upload Favicon</span>
                              <small className="upload-subtitle">Click or drag and drop</small>
                              <small className="upload-hint">SVG or PNG only • Max 256 x 256 px</small>
                            </label>
                          ) : (
                            <div className="uploaded-preview">
                              <label htmlFor="favicon-upload" className="preview-click-area" title="Click to change favicon">
                                <img src={storeData.favicon} alt="Favicon" />
                              </label>
                              <button
                                type="button"
                                className="delete-icon-button"
                                onClick={() => {
                                  const updatedData = { ...storeData, favicon: '' };
                                  setStoreData(updatedData);
                                  saveSettingsToApi(updatedData, 'Favicon deleted successfully!');
                                }}
                                title="Delete favicon"
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="save-button">
                    Save Changes
                  </button>
                </div>
              )}
            </form>

            {/* Brand Name Section */}
            <form onSubmit={handleBrandNameSubmit} className="settings-form compliance-section">
              <div
                className="collapsible-section-header"
                onClick={() => toggleSection('brandName')}
              >
                <h3 className="section-heading">Brand Name</h3>
                {expandedSections.brandName ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {expandedSections.brandName && (
                <div className="collapsible-content">
                  <div className="form-row">
                    <div className="form-field full-width">
                      <label>Brand Name</label>
                      <input
                        type="text"
                        name="brandName"
                        value={storeData.brandName}
                        onChange={handleInputChange}
                        placeholder={storeData.storeName || "Enter your brand name"}
                      />
                      <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>This will be displayed across your store</small>
                    </div>
                  </div>

                  <button type="submit" className="save-button">
                    Save Changes
                  </button>
                </div>
              )}
            </form>

            {/* Image Ratio Section */}
            <form onSubmit={handleImageRatioSubmit} className="settings-form compliance-section">
              <div
                className="collapsible-section-header"
                onClick={() => toggleSection('imageRatio')}
              >
                <h3 className="section-heading">Image Ratio</h3>
                {expandedSections.imageRatio ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {expandedSections.imageRatio && (
                <div className="collapsible-content">
                  <div className="form-row">
                    <div className="form-field">
                      <label>Product Image Ratio</label>
                      <select
                        name="imageRatio"
                        value={storeData.imageRatio}
                        onChange={handleInputChange}
                      >
                        <option value="1:1">1:1 (Square)</option>
                        <option value="4:3">4:3 (Standard)</option>
                        <option value="16:9">16:9 (Wide)</option>
                        <option value="3:4">3:4 (Portrait)</option>
                      </select>
                      <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>Select the aspect ratio for product images</small>
                    </div>
                  </div>

                  <button type="submit" className="save-button">
                    Save Changes
                  </button>
                </div>
              )}
            </form>

            {/* Currency Indicator Section */}
            <form onSubmit={handleCurrencySubmit} className="settings-form compliance-section">
              <div
                className="collapsible-section-header"
                onClick={() => toggleSection('currencyIndicator')}
              >
                <h3 className="section-heading">Currency Indicator</h3>
                {expandedSections.currencyIndicator ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {expandedSections.currencyIndicator && (
                <div className="collapsible-content">
                  <div className="form-row">
                    <div className="form-field">
                      <label>Currency Symbol</label>
                      <input
                        type="text"
                        name="currencySymbol"
                        value={storeData.currencySymbol}
                        onChange={handleInputChange}
                        placeholder="eg: Rs, $, €, £, ₹"
                      />
                      <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>Enter your currency symbol (e.g., $, €, £, ₹, Rs)</small>
                    </div>

                    <div className="form-field">
                      <label>Currency Position</label>
                      <select
                        name="currencyPosition"
                        value={storeData.currencyPosition}
                        onChange={handleInputChange}
                      >
                        <option value="before">Before Price (Rs 100)</option>
                        <option value="after">After Price (100 Rs)</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="save-button">
                    Save Changes
                  </button>
                </div>
              )}
            </form>

            {/* Site Under Construction Section */}
            <form onSubmit={handleConstructionSubmit} className="settings-form compliance-section">
              <div
                className="collapsible-section-header"
                onClick={() => toggleSection('siteConstruction')}
              >
                <h3 className="section-heading">Site Under Construction</h3>
                {expandedSections.siteConstruction ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {expandedSections.siteConstruction && (
                <div className="collapsible-content">
                  <div className="form-row">
                    <div className="form-field full-width">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="siteUnderConstruction"
                          checked={storeData.siteUnderConstruction}
                          onChange={handleInputChange}
                        />
                        <span>Enable Site Under Construction Mode</span>
                      </label>
                      <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                        When enabled, visitors will see a maintenance message instead of your store
                      </small>
                    </div>
                  </div>

                  {storeData.siteUnderConstruction && (
                    <>
                      <div className="form-row construction-message-row">
                        <div className="form-field construction-message-field">
                          <label>Construction Message</label>
                          <textarea
                            name="constructionMessage"
                            value={storeData.constructionMessage}
                            onChange={handleInputChange}
                            placeholder="Enter message to display during construction"
                            rows="4"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-field full-width">
                          <label>Contact Email</label>
                          <input
                            type="email"
                            name="constructionContactEmail"
                            value={storeData.constructionContactEmail}
                            onChange={handleInputChange}
                            placeholder="eg: contact@yourstore.com"
                          />
                          <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                            This email will be displayed on the construction page for visitors to contact you
                          </small>
                        </div>
                      </div>
                    </>
                  )}

                  <button type="submit" className="save-button">
                    Save Changes
                  </button>
                </div>
              )}
            </form>

            {/* Themes & Fonts Section */}
            <form onSubmit={handleThemesSubmit} className="settings-form compliance-section">
              <div
                className="collapsible-section-header"
                onClick={() => toggleSection('themes')}
              >
                <h3 className="section-heading">Themes & Fonts</h3>
                {expandedSections.themes ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {expandedSections.themes && (
                <div className="collapsible-content">

                  <div className="color-themes-section">
                    <h4 className="themes-heading">Social Media Themes</h4>
                    <div className="color-themes-grid">
                      {colorThemes.social.map((theme) => (
                        <div
                          key={theme.name}
                          className={`theme-card ${storeData.selectedTheme === theme.name ? 'selected' : ''}`}
                          onClick={() => handleThemeSelect(theme)}
                        >
                          <div className="theme-colors">
                            <div className="color-dot" style={{ backgroundColor: theme.primary }} title="Primary"></div>
                            <div className="color-dot" style={{ backgroundColor: theme.secondary }} title="Secondary"></div>
                            <div className="color-dot" style={{ backgroundColor: theme.text }} title="Text"></div>
                            <div className="color-dot" style={{ backgroundColor: theme.bg }} title="Background"></div>
                          </div>
                          <span className="theme-name">{theme.name}</span>
                          {storeData.selectedTheme === theme.name && (
                            <div className="selected-badge">✓</div>
                          )}
                        </div>
                      ))}
                    </div>

                    <h4 className="themes-heading" style={{ marginTop: '2rem' }}>Platform Themes</h4>
                    <div className="color-themes-grid">
                      {colorThemes.platform.map((theme) => (
                        <div
                          key={theme.name}
                          className={`theme-card ${storeData.selectedTheme === theme.name ? 'selected' : ''}`}
                          onClick={() => handleThemeSelect(theme)}
                        >
                          <div className="theme-colors">
                            <div className="color-dot" style={{ backgroundColor: theme.primary }} title="Primary"></div>
                            <div className="color-dot" style={{ backgroundColor: theme.secondary }} title="Secondary"></div>
                            <div className="color-dot" style={{ backgroundColor: theme.text }} title="Text"></div>
                            <div className="color-dot" style={{ backgroundColor: theme.bg }} title="Background"></div>
                          </div>
                          <span className="theme-name">{theme.name}</span>
                          {storeData.selectedTheme === theme.name && (
                            <div className="selected-badge">✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <h4 className="themes-heading" style={{ marginTop: '2rem' }}>Classic Themes</h4>
                    <div className="color-themes-grid">
                      {colorThemes.classic.map((theme) => (
                        <div
                          key={theme.name}
                          className={`theme-card ${storeData.selectedTheme === theme.name ? 'selected' : ''}`}
                          onClick={() => handleThemeSelect(theme)}
                        >
                          <div className="theme-colors">
                            <div className="color-dot" style={{ backgroundColor: theme.primary }} title="Primary"></div>
                            <div className="color-dot" style={{ backgroundColor: theme.secondary }} title="Secondary"></div>
                            <div className="color-dot" style={{ backgroundColor: theme.text }} title="Text"></div>
                            <div className="color-dot" style={{ backgroundColor: theme.bg }} title="Background"></div>
                          </div>
                          <span className="theme-name">{theme.name}</span>
                          {storeData.selectedTheme === theme.name && (
                            <div className="selected-badge">✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="font-family-section">
                    <h4 className="themes-heading">Font Family</h4>
                    <div className="form-field">
                      <select
                        name="fontFamily"
                        value={storeData.fontFamily}
                        onChange={handleInputChange}
                        className="font-family-select"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Outfit">Outfit (Premium)</option>
                        <option value="Jost">Jost (Modern)</option>
                        <option value="Space Grotesk">Space Grotesk</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Playfair Display">Playfair Display (Serif)</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="save-button">
                    Save Changes
                  </button>
                </div>
              )}
            </form>

            {/* Components Section */}
            <form onSubmit={handleComponentsSubmit} className="settings-form compliance-section">
              <div
                className="collapsible-section-header"
                onClick={() => toggleSection('components')}
              >
                <h3 className="section-heading">Components</h3>
                {expandedSections.components ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {expandedSections.components && (
                <div className="collapsible-content">

                  <div className="form-row">
                    <div className="form-field">
                      <label>Button Style</label>
                      <select
                        name="buttonStyle"
                        value={storeData.buttonStyle}
                        onChange={handleInputChange}
                      >
                        <option value="rounded">Rounded</option>
                        <option value="square">Square</option>
                        <option value="pill">Pill</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Card Style</label>
                      <select
                        name="cardStyle"
                        value={storeData.cardStyle}
                        onChange={handleInputChange}
                      >
                        <option value="shadow">Shadow</option>
                        <option value="border">Border</option>
                        <option value="flat">Flat</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Layout Style</label>
                      <select
                        name="layoutStyle"
                        value={storeData.layoutStyle}
                        onChange={handleInputChange}
                      >
                        <option value="modern">Modern</option>
                        <option value="classic">Classic</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Header Style</label>
                      <select
                        name="headerStyle"
                        value={storeData.headerStyle}
                        onChange={handleInputChange}
                      >
                        <option value="fixed">Fixed</option>
                        <option value="sticky">Sticky</option>
                        <option value="static">Static</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="save-button">
                    Save Changes
                  </button>
                </div>
              )}
            </form>

            {/* Navigation & Footer Section */}
            <form onSubmit={(e) => e.preventDefault()} className="settings-form compliance-section">
              <div
                className="collapsible-section-header"
                onClick={() => toggleSection('navigation')}
              >
                <h3 className="section-heading">Navigation & Footer</h3>
                {expandedSections.navigation ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {expandedSections.navigation && (
                <div className="collapsible-content">
                  <h4 className="themes-heading">Navbar Style</h4>
                  <div className="navbar-style-options">
                    {[
                      { id: 'basic', name: 'Basic', desc: 'Logo & Menu' },
                      { id: 'with-category', name: 'Categories', desc: 'Inline Categories' },
                      { id: 'custom', name: 'Premium (WHCH)', desc: 'Wide Search & Icons' }
                    ].map(style => (
                      <div
                        key={style.id}
                        className={`navbar-style-card ${navbarSettings.navbarStyle === style.id ? 'active' : ''}`}
                        onClick={() => {
                          const updated = { ...navbarSettings, navbarStyle: style.id };
                          setNavbarSettings(updated);
                          localStorage.setItem('navbarSettings', JSON.stringify(updated));
                          window.dispatchEvent(new Event('navbarSettingsUpdated'));
                          toast.success(`${style.name} Navbar applied!`);
                        }}
                      >
                        <span className="style-name">{style.name}</span>
                        <small className="style-desc">{style.desc}</small>
                        {navbarSettings.navbarStyle === style.id && <div className="selected-badge-mini">✓</div>}
                      </div>
                    ))}
                  </div>

                  <h4 className="themes-heading" style={{ marginTop: '2rem' }}>Footer Content</h4>
                  <div className="form-row">
                    <div className="form-field full-width">
                      <label>Footer Tagline</label>
                      <input
                        type="text"
                        value={footerSettings.tagline || ''}
                        onChange={(e) => {
                          const updated = { ...footerSettings, tagline: e.target.value };
                          setFooterSettings(updated);
                          localStorage.setItem('footerSettings', JSON.stringify(updated));
                        }}
                        placeholder="eg: Discover the best products for your needs"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Contact Email</label>
                      <input
                        type="email"
                        value={footerSettings.contactEmail || ''}
                        onChange={(e) => {
                          const updated = { ...footerSettings, contactEmail: e.target.value };
                          setFooterSettings(updated);
                          localStorage.setItem('footerSettings', JSON.stringify(updated));
                        }}
                      />
                    </div>
                    <div className="form-field">
                      <label>Contact Phone</label>
                      <input
                        type="text"
                        value={footerSettings.contactPhone || ''}
                        onChange={(e) => {
                          const updated = { ...footerSettings, contactPhone: e.target.value };
                          setFooterSettings(updated);
                          localStorage.setItem('footerSettings', JSON.stringify(updated));
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === 'delivery-charge' && (
          <div className="tab-content">
            <p className="coming-soon">Delivery Charge - Coming Soon</p>
          </div>
        )}

        {activeTab === 'domains' && (
          <div className="tab-content">
            <form onSubmit={handleDomainsSubmit} className="settings-form">
              <div className="form-row">
                <div className="form-field full-width">
                  <label>Subdomain</label>
                  <div className="domain-input-wrapper">
                    <input
                      type="text"
                      name="subdomain"
                      value={storeData.subdomain}
                      onChange={handleInputChange}
                      placeholder="eg: my-store"
                      className="subdomain-input"
                    />
                    <span className="domain-suffix">.storecms.com</span>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field full-width">
                  <label>Custom Domain</label>
                  <input
                    type="text"
                    name="customDomain"
                    value={storeData.customDomain}
                    onChange={handleInputChange}
                    placeholder="eg: yourstore.com"
                  />
                </div>
              </div>

              <button type="submit" className="save-button">
                Save
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreSettings;

