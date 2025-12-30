import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import './AddressForm.css';

const AddressForm = ({ addressData, onAddressChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Mock data - in a real app, this would come from an API
  const allCities = [
    { name: 'Kathmandu', district: 'Kathmandu', province: 'Bagmati Province' },
    { name: 'Kirtipur', district: 'Kathmandu', province: 'Bagmati Province' },
    { name: 'Tokha', district: 'Kathmandu', province: 'Bagmati Province' },
    { name: 'Chandragiri', district: 'Kathmandu', province: 'Bagmati Province' },
    { name: 'Pokhara', district: 'Kaski', province: 'Gandaki Province' },
    { name: 'Lalitpur', district: 'Lalitpur', province: 'Bagmati Province' },
    { name: 'Bhaktapur', district: 'Bhaktapur', province: 'Bagmati Province' },
  ];
  const provinces = [
    'Koshi Province',
    'Madhesh Province',
    'Bagmati Province',
    'Gandaki Province',
    'Lumbini Province',
    'Karnali Province',
    'Sudurpashchim Province'
  ];
  const districts = {
    'Koshi Province': [],
    'Madhesh Province': [],
    'Bagmati Province': ['Kathmandu', 'Lalitpur', 'Bhaktapur'],
    'Gandaki Province': ['Kaski'],
    'Lumbini Province': [],
    'Karnali Province': [],
    'Sudurpashchim Province': []
  };
  const cities = { 'Kathmandu': ['Kathmandu', 'Kirtipur', 'Tokha', 'Chandragiri'], 'Kaski': ['Pokhara'] };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 1) {
      const filteredSuggestions = allCities.filter(city =>
        city.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (city) => {
    setSearchQuery(city.name);
    setSuggestions([]);
    onAddressChange({
      ...addressData,
      province: city.province,
      district: city.district,
      city: city.name
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newAddressData = { ...addressData, [name]: value };

    // Reset dependent fields if province or district changes
    if (name === 'province') {
      newAddressData.district = '';
      newAddressData.city = '';
    }
    if (name === 'district') {
      newAddressData.city = '';
    }

    onAddressChange(newAddressData);
  };

  return (
    <div className="address-form-container">
      <h3>2. Address Information</h3>

      <div className="form-group">
        <label className="quick-search-label">Quick City Search</label>
        <div className="search-input-wrapper">
          <FaSearch className="quick-search-icon" />
          <input
            type="text"
            placeholder="Type your city name..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {suggestions.length > 0 && (
            <div className="suggestions-list">
              {suggestions.map((city, index) => (
                <div key={index} className="suggestion-item" onClick={() => handleSuggestionClick(city)}>
                  <div className="suggestion-city-name">{city.name}</div>
                  <div className="suggestion-city-details">{city.district}, {city.province}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      <div className="address-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="province">Province <span class="required-asterisk">*</span></label>
            <select id="province" name="province" value={addressData.province} onChange={handleInputChange} required>
              <option value="">Select Province</option>
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="district">District <span class="required-asterisk">*</span></label>
            <select id="district" name="district" value={addressData.district} onChange={handleInputChange} disabled={!addressData.province} required>
              <option value="">{addressData.province ? 'Select District' : 'Select province first'}</option>
              {addressData.province && districts[addressData.province] && districts[addressData.province].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">City / Municipality <span class="required-asterisk">*</span></label>
            <select id="city" name="city" value={addressData.city} onChange={handleInputChange} disabled={!addressData.district} required>
              <option value="">{addressData.district ? 'Select City' : 'Select district first'}</option>
              {addressData.district && cities[addressData.district] && cities[addressData.district].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="postal-code">Toll</label>
            <input type="text" id="postal-code" name="postalCode" value={addressData.postalCode} onChange={handleInputChange} placeholder="Buddha Chock" />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="landmark">Landmark</label>
          <input type="text" id="landmark" name="landmark" value={addressData.landmark} onChange={handleInputChange} placeholder="eg: xyz hospital ko right side pati." />
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
