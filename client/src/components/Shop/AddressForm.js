import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../apiConfig';
import './AddressForm.css';

// Fallback list if API fails
const FALLBACK_REGIONS = [
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

const AddressForm = ({ addressData, onAddressChange, errors = {} }) => {
  const [regions, setRegions] = useState(FALLBACK_REGIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        // Get subdomain from current hostname
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];

        // Only fetch if we have a valid subdomain (not localhost, app, www, etc.)
        if (subdomain && subdomain !== 'localhost' && subdomain !== 'app' && subdomain !== 'www') {
          const response = await axios.get(`${API_URL}/api/store-settings/delivery-regions/${subdomain}`);
          if (response.data.regions && response.data.regions.length > 0) {
            setRegions(response.data.regions);
          }
        }
      } catch (error) {
        console.error('Error fetching delivery regions:', error);
        // Keep using fallback regions
      } finally {
        setLoading(false);
      }
    };

    fetchRegions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onAddressChange({ ...addressData, [name]: value });
  };

  return (
    <div className="address-form-container">
      <h3>2. Address Information</h3>

      <div className="address-form">
        <div className="form-group">
          <label htmlFor="city">City / District <span className="required-asterisk">*</span></label>
          <select
            id="city"
            name="city"
            value={addressData.city}
            onChange={handleInputChange}
            required
            className={`full-width-select ${errors.city ? 'error-input' : ''}`}
            disabled={loading}
          >
            <option value="">{loading ? 'Loading regions...' : 'Select City / District'}</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          {errors.city && <span className="error-text">Please select your city</span>}
        </div>

        <div className="form-group">
          <label htmlFor="landmark">Address <span className="required-asterisk">*</span></label>
          <input
            type="text"
            id="landmark"
            name="landmark"
            value={addressData.landmark}
            onChange={handleInputChange}
            placeholder="eg: Street Name, Tole, House No."
            required
            className={errors.landmark ? 'error-input' : ''}
          />
          {errors.landmark && <span className="error-text">Please enter your address</span>}
        </div>

        <div className="form-group">
          <label htmlFor="orderNote">Order Note (optional)</label>
          <textarea
            id="orderNote"
            name="orderNote"
            value={addressData.orderNote}
            onChange={handleInputChange}
            placeholder="eg: I want to order this product for my family."
            rows="3"
            style={{ resize: 'vertical', minHeight: '80px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
