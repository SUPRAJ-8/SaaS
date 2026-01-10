import React, { useState, useEffect } from 'react';
import { FaGlobeAmericas, FaSearch, FaSave, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './DeliverySettings.css';

// Initial default list
const DEFAULT_REGIONS = [
    "Kathmandu Inside Ringroad",
    "Kathmandu Outside Ringroad",
    "Lalitpur Inside Ringroad",
    "Lalitpur Outside Ringroad",
    "Bhaktapur",
    "Pokhara Metropolitan",
    "Biratnagar Sub-Metro",
    "Dharan Metropolitan",
    "Butwal",
    "Bhairahawa",
    "Bharatpur (Chitwan)",
    "Hetauda",
    "Janakpur",
    "Birgunj",
    "Nepalgunj",
    "Dhangadhi",
    "Itahari",
    "Damak",
    "Birtamod",
    "Mechinagar (Kakarvitta)",
    "Surkhet (Birendranagar)"
];

const WEIGHT_BRACKETS = ["0-1", "1-2", "2-3", "3-5", "5-10", "10+"];

const DeliverySettings = ({ storeData, setStoreData, onSave }) => {
    const [globalRates, setGlobalRates] = useState({
        "0-1": 100, "1-2": 150, "2-3": 200, "3-5": 300, "5-10": 500, "10+": 800
    });

    // configurations for regions: { [regionName]: { enabled: true, cod: true, rates: { ... } } }
    const [regionConfigs, setRegionConfigs] = useState({});
    const [allRegions, setAllRegions] = useState(DEFAULT_REGIONS);
    const [searchQuery, setSearchQuery] = useState('');

    // Renaming state
    const [editingRegion, setEditingRegion] = useState(null);
    const [tempName, setTempName] = useState('');

    // Initialize state from storeData
    useEffect(() => {
        if (storeData.deliveryCharge) {
            if (storeData.deliveryCharge.global) {
                setGlobalRates(prev => ({ ...prev, ...storeData.deliveryCharge.global }));
            }
            if (storeData.deliveryCharge.regions) {
                setRegionConfigs(storeData.deliveryCharge.regions || {});
            }
            if (storeData.deliveryCharge.allRegions && Array.isArray(storeData.deliveryCharge.allRegions)) {
                setAllRegions(storeData.deliveryCharge.allRegions);
            }
        }
    }, [storeData]);

    const handleGlobalRateChange = (bracket, value) => {
        setGlobalRates(prev => ({
            ...prev,
            [bracket]: value
        }));
    };

    const handleUpdateDefaults = () => {
        const updatedDelivery = {
            global: globalRates,
            regions: regionConfigs,
            allRegions: allRegions
        };
        setStoreData({ ...storeData, deliveryCharge: updatedDelivery });
        toast.success("Global defaults updated locally. Click 'Save All Changes' to persist.");
    };

    const handleRegionToggle = (regionName, field) => {
        setRegionConfigs(prev => {
            const currentConfig = prev[regionName] || { enabled: true, cod: true, rates: {} };
            const newConfig = { ...currentConfig, [field]: !currentConfig[field] };
            return { ...prev, [regionName]: newConfig };
        });
    };

    const handleRegionRateChange = (regionName, bracket, value) => {
        setRegionConfigs(prev => {
            const currentConfig = prev[regionName] || { enabled: true, cod: true, rates: {} };
            const newRates = { ...currentConfig.rates, [bracket]: value };
            if (value === '') delete newRates[bracket];
            return { ...prev, [regionName]: { ...currentConfig, rates: newRates } };
        });
    };

    const resetAllCustomRates = () => {
        if (window.confirm("Are you sure you want to reset all custom region configurations?")) {
            setRegionConfigs({});
            toast.info("All custom region rates have been reset.");
        }
    };

    const startEditing = (name) => {
        setEditingRegion(name);
        setTempName(name);
    };

    const cancelEditing = () => {
        setEditingRegion(null);
        setTempName('');
    };

    const saveRegionName = (oldName) => {
        if (!tempName.trim()) {
            toast.error("Region name cannot be empty");
            return;
        }
        if (tempName !== oldName && allRegions.includes(tempName)) {
            toast.error("Region name already exists");
            return;
        }

        if (tempName !== oldName) {
            // 1. Update list
            const updatedRegions = allRegions.map(r => r === oldName ? tempName : r);
            setAllRegions(updatedRegions);

            // 2. Update configs (migrate data to new key)
            const newConfigs = { ...regionConfigs };
            if (newConfigs[oldName]) {
                newConfigs[tempName] = newConfigs[oldName];
                delete newConfigs[oldName];
            }
            setRegionConfigs(newConfigs);
        }
        setEditingRegion(null);
    };

    const handleSaveAll = () => {
        const updatedDelivery = {
            global: globalRates,
            regions: regionConfigs,
            allRegions: allRegions // Save specific list order/names
        };
        const newData = { ...storeData, deliveryCharge: updatedDelivery };
        setStoreData(newData);
        onSave(newData);
    };

    // Filter only
    const filteredRegions = allRegions.filter(r =>
        r.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [newRegionName, setNewRegionName] = useState('');

    const addNewRegion = () => {
        if (!newRegionName.trim()) {
            toast.error("Please enter a region name");
            return;
        }
        if (allRegions.some(r => r.toLowerCase() === newRegionName.trim().toLowerCase())) {
            toast.error("Region already exists");
            return;
        }
        setAllRegions(prev => [...prev, newRegionName.trim()]);
        setNewRegionName('');
        toast.success("New region added");
    };

    return (
        <div className="delivery-settings-container">
            <div className="ds-header">
                <div>
                    <h2>Delivery Rates Manager</h2>
                    <p className="ds-subtitle">Configure global defaults and region-specific shipping costs.</p>
                </div>
                <div style={{ display: 'flex' }}>
                    <button className="ds-save-btn" onClick={handleSaveAll}>
                        <FaSave /> Save All Changes
                    </button>
                </div>
            </div>

            {/* Global Defaults */}
            <div className="ds-section">
                <div className="ds-global-header">
                    <div className="ds-global-icon">
                        <FaGlobeAmericas />
                    </div>
                    <h3 className="ds-section-title">Global Default Rates <span className="ds-section-helper">(Used when custom rates are empty)</span></h3>
                </div>

                <div className="ds-rates-grid">
                    {WEIGHT_BRACKETS.map(bracket => (
                        <div key={bracket} className="ds-input-group">
                            <label>{bracket} KG</label>
                            <div className="ds-input-wrapper">
                                <span className="ds-currency-prefix">Rs.</span>
                                <input
                                    type="number"
                                    className="ds-input"
                                    value={globalRates[bracket]}
                                    onChange={(e) => handleGlobalRateChange(bracket, e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                    <button className="ds-update-btn" onClick={handleUpdateDefaults}>
                        Update Defaults
                    </button>
                </div>
            </div>

            {/* Regions Table */}
            <div className="ds-section">
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <div className="ds-input-group" style={{ flex: 1, maxWidth: '300px' }}>
                        <label>Add New Delivery Region</label>
                        <input
                            type="text"
                            className="ds-input"
                            placeholder="Enter region name..."
                            value={newRegionName}
                            onChange={(e) => setNewRegionName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addNewRegion()}
                        />
                    </div>
                    <button className="ds-save-btn" style={{ height: '42px', backgroundColor: '#10b981' }} onClick={addNewRegion}>
                        + Add Region
                    </button>
                </div>

                <div className="ds-toolbar">
                    <div className="ds-search-box">
                        <FaSearch className="ds-search-icon" />
                        <input
                            type="text"
                            className="ds-search-input"
                            placeholder="Search by region or district..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="ds-toolbar-actions">
                        <span>Showing {filteredRegions.length} regions</span>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <button className="ds-reset-link" onClick={resetAllCustomRates}>Reset All Custom Rates</button>
                    </div>
                </div>

                <div className="ds-table-wrapper">
                    <table className="ds-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>REGION STATUS</th>
                                <th>REGION/PLACE NAME</th>
                                <th>COD AVAILABILITY</th>
                                {WEIGHT_BRACKETS.map(bracket => (
                                    <th key={bracket}>{bracket} KG</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRegions.map((regionName, index) => {
                                const config = regionConfigs[regionName] || { enabled: true, cod: true, rates: {} };
                                const isEditing = editingRegion === regionName;

                                return (
                                    <tr key={regionName} style={{ opacity: config.enabled ? 1 : 0.6 }}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <label className="ds-toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    className="ds-toggle-input"
                                                    checked={config.enabled}
                                                    onChange={() => handleRegionToggle(regionName, 'enabled')}
                                                />
                                                <span className="ds-toggle-slider"></span>
                                            </label>
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <div className="ds-rename-wrapper">
                                                    <input
                                                        type="text"
                                                        className="ds-table-input"
                                                        style={{ width: '180px' }}
                                                        value={tempName}
                                                        autoFocus
                                                        onChange={(e) => setTempName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveRegionName(regionName);
                                                            if (e.key === 'Escape') cancelEditing();
                                                        }}
                                                    />
                                                    <button className="ds-icon-btn check" onClick={() => saveRegionName(regionName)}><FaCheck /></button>
                                                    <button className="ds-icon-btn cancel" onClick={cancelEditing}><FaTimes /></button>
                                                </div>
                                            ) : (
                                                <div className="ds-region-name-wrapper">
                                                    <span className="ds-region-name">{regionName}</span>
                                                    <button className="ds-edit-icon-btn" onClick={() => startEditing(regionName)}>
                                                        <FaEdit />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="ds-region-toggle">
                                                <label className="ds-toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        className="ds-toggle-input"
                                                        checked={config.cod}
                                                        onChange={() => handleRegionToggle(regionName, 'cod')}
                                                        disabled={!config.enabled}
                                                    />
                                                    <span className="ds-toggle-slider"></span>
                                                </label>
                                                <span className={`toggle-label-text ${config.cod ? 'enabled-text' : 'disabled-text'}`}>
                                                    {config.cod ? 'ENABLED' : 'DISABLED'}
                                                </span>
                                            </div>
                                        </td>
                                        {WEIGHT_BRACKETS.map(bracket => (
                                            <td key={bracket}>
                                                <input
                                                    type="number"
                                                    className="ds-table-input"
                                                    value={config.rates[bracket] || ''}
                                                    onChange={(e) => handleRegionRateChange(regionName, bracket, e.target.value)}
                                                    disabled={!config.enabled}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                            {filteredRegions.length === 0 && (
                                <tr>
                                    <td colSpan={4 + WEIGHT_BRACKETS.length} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                        No regions found matching "{searchQuery}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeliverySettings;
