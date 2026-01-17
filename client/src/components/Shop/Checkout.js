import React, { useState, useEffect, useRef } from 'react';

import { useCart } from './CartProvider';
import './Checkout.css';
import Stepper from './Stepper';
import AddressForm from './AddressForm';
import axios from 'axios';
import API_URL from '../../apiConfig';

import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ConfirmLeaveModal from './ConfirmLeaveModal';
import { getShopPath } from '../../themeUtils';

const Checkout = () => {
  const { items, dispatch } = useCart();
  const navigate = useNavigate();

  // Helper function to extract order number from orderId
  const getOrderNumber = (orderId) => {
    if (!orderId) return 'N/A';
    const match = orderId.match(/ORD-(\d+)/);
    if (match && match[1]) {
      const number = match[1];
      // If it's a timestamp (more than 10 digits), show only last 4 digits
      // Otherwise show the full number for sequential IDs (1000, 1001, etc.)
      if (number.length > 10) {
        return number.slice(-4);
      }
      return number;
    }
    return orderId;
  };
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    orderNote: '',
    province: '',
    district: '',
    city: '',
    landmark: '',
    toll: '',
  });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [coupon, setCoupon] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const couponRef = useRef(null);
  const shippingFormRef = useRef(null);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Delivery charge states
  const [deliverySettings, setDeliverySettings] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('checkoutFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error('Error loading saved checkout data:', error);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      localStorage.setItem('checkoutFormData', JSON.stringify(formData));
    }
  }, [formData, hasUnsavedChanges]);

  // Warn before leaving page (refresh/close)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && items.length > 0 && !isOrderComplete) {
        // Data will be saved to localStorage automatically
        // Just return to trigger the save
        return;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, items, isOrderComplete]);

  // Fetch delivery settings
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];

        if (subdomain && subdomain !== 'localhost' && subdomain !== 'app' && subdomain !== 'www') {
          const response = await axios.get(`${API_URL}/api/store-settings/public/${subdomain}`);
          if (response.data.deliveryCharge) {
            setDeliverySettings(response.data.deliveryCharge);
          }
        }
      } catch (error) {
        console.error('Error fetching delivery settings:', error);
      }
    };
    fetchDeliverySettings();
  }, []);

  // Calculate delivery charge when city or cart changes
  useEffect(() => {
    if (!deliverySettings || !formData.city || items.length === 0) {
      setDeliveryCharge(0);
      return;
    }

    // Calculate total weight (assuming each item has a weight property, default to 1kg if not)
    const totalWeight = items.reduce((sum, item) => {
      const itemWeight = item.weight || 1; // Default 1kg per item
      return sum + (itemWeight * item.quantity);
    }, 0);

    // Determine weight bracket
    let weightBracket;
    if (totalWeight <= 1) weightBracket = '0-1';
    else if (totalWeight <= 2) weightBracket = '1-2';
    else if (totalWeight <= 3) weightBracket = '2-3';
    else if (totalWeight <= 5) weightBracket = '3-5';
    else if (totalWeight <= 10) weightBracket = '5-10';
    else weightBracket = '10+';

    // Get region-specific config or use global rates
    const regionConfig = deliverySettings.regions?.[formData.city];

    // Check if delivery is enabled for this region
    if (regionConfig && regionConfig.enabled === false) {
      setDeliveryCharge(0);
      return;
    }

    // Get rate: region-specific rate > global rate > 0
    let rate = 0;
    if (regionConfig?.rates?.[weightBracket]) {
      rate = parseFloat(regionConfig.rates[weightBracket]);
    } else if (deliverySettings.global?.[weightBracket]) {
      rate = parseFloat(deliverySettings.global[weightBracket]);
    }

    setDeliveryCharge(rate || 0);
  }, [deliverySettings, formData.city, items]);

  const handleApplyCoupon = () => {
    // Here you would typically validate the coupon and apply the discount
    alert(`Coupon "${coupon}" applied successfully!`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (couponRef.current && !couponRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [couponRef]);

  const handleGeneralInfoChange = (e) => {
    const { id, value } = e.target;
    // Clear error for this field
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: false }));
    }

    // Strict numeric 10-digit limit for phone field for better UX
    if (id === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [id]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
    setHasUnsavedChanges(true);
  };

  const handleAddressChange = (addressData) => {
    // Clear errors for any address fields changed
    const updatedFields = Object.keys(addressData).filter(key => addressData[key] !== formData[key]);
    if (updatedFields.some(field => errors[field])) {
      const newErrors = { ...errors };
      updatedFields.forEach(field => { newErrors[field] = false; });
      setErrors(newErrors);
    }

    setFormData(prev => ({ ...prev, ...addressData }));
    setHasUnsavedChanges(true);
  };

  // Check if form has any data
  const hasFormData = () => {
    return formData.fullName ||
      formData.phone ||
      formData.email ||
      formData.orderNote ||
      formData.province ||
      formData.district ||
      formData.city ||
      formData.landmark;
  };

  // Handle back navigation with warning
  const handleBackClick = () => {
    // Show warning if any form data exists OR if there are items in cart
    if (hasFormData() || items.length > 0) {
      setShowLeaveModal(true);
    } else {
      navigate(getShopPath('/'));
    }
  };

  // Confirm leaving checkout
  const handleConfirmLeave = () => {
    localStorage.removeItem('checkoutFormData');
    // Clear the cart as well
    dispatch({ type: 'CLEAR_CART' });
    setShowLeaveModal(false);
    navigate(getShopPath('/'));
  };

  // Cancel leaving checkout
  const handleCancelLeave = () => {
    setShowLeaveModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (items.length === 0) {
      alert('Your cart is empty! Please add items before checkout.');
      return;
    }

    // Final Validation check
    const nameWords = formData.fullName.trim().split(/\s+/);
    if (!formData.fullName.trim() || nameWords.length < 2) {
      newErrors.fullName = true;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      newErrors.phone = true;
    }

    // Validation: Email (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = true;
    }

    if (!formData.city) newErrors.city = true;
    if (!formData.landmark) newErrors.landmark = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setStep(1);
      // Scroll to top to show errors
      window.scrollTo(0, 0);
      return;
    }

    const orderDetails = {
      customerDetails: {
        name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        orderNote: formData.orderNote,
        province: formData.province,
        district: formData.district,
        city: formData.city,
        landmark: formData.landmark,
        toll: formData.toll,
        paymentTerms: paymentMethod,
      },
      items: items,
      payment: {
        subtotal: total,
        deliveryCharge: deliveryCharge,
        total: total + deliveryCharge
      },
      placedOn: new Date().toISOString(),
      status: 'pending',
      // These fields can be populated as needed
      invoices: [],
      labels: [],
    };

    try {
      // Get subdomain from current hostname to send with request
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];

      console.log('Placing order with hostname:', hostname, 'subdomain:', subdomain);
      console.log('Order details:', orderDetails);

      // Add subdomain header to help server identify the client
      const config = {
        headers: {}
      };

      // Only add subdomain header if it's not 'app', 'www', or 'localhost'
      if (subdomain && subdomain !== 'app' && subdomain !== 'www' && subdomain !== 'localhost' && subdomain !== 'api') {
        config.headers['x-subdomain'] = subdomain;
        console.log('Sending subdomain header:', subdomain);
      }

      const response = await axios.post(`${API_URL}/api/orders`, orderDetails, config);
      console.log('Order placed successfully:', response.data);
      dispatch({ type: 'CLEAR_CART' });
      setCompletedOrderId(response.data.orderId);
      setIsOrderComplete(true);
      setHasUnsavedChanges(false);
      // Clear saved checkout data after successful order
      localStorage.removeItem('checkoutFormData');
    } catch (error) {
      console.error('Failed to place order - Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);

      let errorMessage = 'Unknown error occurred';

      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.msg || error.response.data?.error || error.response.statusText || 'Server error';
        if (error.response.status === 400) {
          errorMessage = error.response.data?.msg || 'Invalid order data. Please check your information and try again.';
        } else if (error.response.status === 500) {
          errorMessage = error.response.data?.msg || 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your internet connection and try again.';
      } else {
        // Error in request setup
        errorMessage = error.message || 'Failed to place order. Please try again.';
      }

      setErrors({ global: errorMessage });
      alert(errorMessage);
    }
  };

  const handleGoToPayment = () => {
    const newErrors = {};

    // Validation: Full Name must be at least 2 words
    const nameWords = formData.fullName.trim().split(/\s+/);
    if (!formData.fullName.trim() || nameWords.length < 2) {
      newErrors.fullName = true;
    }

    // Validation: Phone Number must be exactly 10 digits
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      newErrors.phone = true;
    }

    // Validation: Email (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = true;
    }

    // Other required fields check
    if (!formData.city) newErrors.city = true;
    if (!formData.landmark) newErrors.landmark = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStep(2);
    window.scrollTo(0, 0);
  };

  if (isOrderComplete) {
    return (
      <div className="product-list-page">
        <div className="shop-page-wrapper">
          <div className="checkout">
            <div className="stepper-wrapper">
              <Stepper currentStep={3} />
            </div>
            <div className="order-confirmation-container">
              <div className="confirmation-card">
                <div className="success-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <h2>Order Placed Successfully!</h2>
                <p>Thank you for your purchase. You will be receiving a confirmation sms or call soon.</p>
                <p className="order-number">Your order number is: <strong>#{getOrderNumber(completedOrderId)}</strong></p>
                <div className="confirmation-actions">
                  <Link
                    to={getShopPath(`/track-order/${completedOrderId}`)}
                    className="track-order-btn"
                    onClick={() => localStorage.removeItem('checkoutFormData')}
                  >
                    Track Your Order
                  </Link>
                  <Link
                    to={getShopPath('/')}
                    className="continue-shopping-btn"
                    onClick={() => localStorage.removeItem('checkoutFormData')}
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <ConfirmLeaveModal
            isOpen={showLeaveModal}
            onClose={handleCancelLeave}
            onConfirm={handleConfirmLeave}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="product-list-page">
      <div className="shop-page-wrapper">
        <div className="checkout">
          <div className="stepper-wrapper">
            <Stepper currentStep={step} />
          </div>
          <div className="checkout-header">
            <button className="back-arrow-btn" onClick={handleBackClick} aria-label="Go back to shop">
              <FaArrowLeft />
            </button>
            <h2>Checkout</h2>
          </div>
          <div className="checkout-content">
            <div className="shipping-form">
              {step === 1 && (
                <form ref={shippingFormRef} noValidate onSubmit={(e) => { e.preventDefault(); handleGoToPayment(); }}>
                  <div className="general-info-container">
                    <h3>1.GENERAL Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="fullName">Full Name <span className="required-asterisk">*</span></label>
                        <input type="text" id="fullName" value={formData.fullName} onChange={handleGeneralInfoChange} placeholder="Enter your first and last name" required className={errors.fullName ? 'error-input' : ''} />
                        {errors.fullName && <span className="error-text">Please enter at least 2 words</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone">Phone Number <span className="required-asterisk">*</span></label>
                        <input type="tel" id="phone" value={formData.phone} onChange={handleGeneralInfoChange} placeholder="10-digit mobile number" pattern="[0-9]{10}" maxLength="10" required className={errors.phone ? 'error-input' : ''} />
                        {errors.phone && <span className="error-text">Please enter a valid 10-digit number</span>}
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input type="email" id="email" value={formData.email} onChange={handleGeneralInfoChange} placeholder="Enter your email address" className={errors.email ? 'error-input' : ''} />
                      {errors.email && <span className="error-text">Please enter a valid email address</span>}
                    </div>
                  </div>

                  <AddressForm addressData={formData} onAddressChange={handleAddressChange} errors={errors} />
                </form>
              )}

              {step === 2 && (
                <div className="payment-section-container">
                  <form noValidate onSubmit={handleSubmit}>
                    <h3>Payment Information</h3>
                    <div className="form-group payment-method-group">
                      <label>Payment Method</label>
                      <div className="payment-methods-grid">
                        <div
                          className={`payment-method-option ${paymentMethod === 'COD' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('COD')}
                        >
                          <span className="payment-method-icon">
                            <img src="/COD.png" alt="Cash on Delivery" width="60" height="60" />
                          </span>
                          <span className="payment-method-text">Cash on delivery</span>
                          {paymentMethod === 'COD' && (
                            <div className="checkmark-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="Black" /><path stroke="#fff" stroke-width="2" d="M7 13l3 3 7-7" /></svg>
                            </div>
                          )}
                        </div>

                        <div
                          className={`payment-method-option ${paymentMethod === 'QR' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('QR')}
                        >
                          <span className="payment-method-icon">
                            <img src="/QR Pay.png" alt="QR Payment" width="60" height="60" />
                          </span>
                          <span className="payment-method-text">QR Pay</span>
                          {paymentMethod === 'QR' && (
                            <div className="checkmark-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="Black" /><path stroke="#fff" stroke-width="2" d="M7 13l3 3 7-7" /></svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Mobile-only action button */}
              <div className="mobile-checkout-action">
                <button
                  type="button"
                  className="place-order-btn"
                  onClick={step === 1 ? handleGoToPayment : handleSubmit}
                >
                  {step === 1 ? 'Proceed to Payment' : 'Place Order'}
                </button>
              </div>
            </div>

            <div className={`order-summary ${isSummaryExpanded ? 'expanded' : ''}`}>
              <h3 onClick={() => setIsSummaryExpanded(!isSummaryExpanded)} className="summary-toggle-header">
                Order Summary
                {isSummaryExpanded ? <FaChevronUp className="summary-chevron" /> : <FaChevronDown className="summary-chevron" />}
              </h3>
              <div className="order-summary-content">
                <div className="order-items">
                  {items.map((item, index) => (
                    <div key={`${item.id}-${item.variant || index}`} className="order-item">
                      <img src={item.image} alt={item.name} className="order-item-image" />
                      <div className="order-item-details">
                        <span className="order-item-name">{item.name}</span>
                        {item.variant && <span className="order-item-variant">{item.variant}</span>}
                      </div>
                      <div className="order-item-pricing">
                        <div className="price-and-remove">
                          <span className="order-item-price">NPR {(item.price * item.quantity).toFixed()}</span>
                          <svg onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id, variant: item.variant } })}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            className="remove-item-icon"
                          >
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor" />
                          </svg>
                        </div>
                        <span className="order-item-qty">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-summary-footer">
                  <div className="summary-row">
                    <span>Sub-total:</span>
                    <span>Rs. {total.toFixed()}</span>
                  </div>
                  <div className="summary-row">
                    <span className="delivery-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="delivery-icon"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                      Delivery Charge
                    </span>
                    <span>{!formData.city ? 'Select place' : (deliveryCharge > 0 ? `Rs. ${deliveryCharge.toFixed()}` : 'FREE')}</span>
                  </div>
                  <div className="summary-row order-total">
                    <strong>Total:</strong>
                    <strong>NPR {(total + deliveryCharge).toFixed()}</strong>
                  </div>
                  <div className="apply-coupon" ref={couponRef}>
                    <div className="coupon-header">
                      <span className="coupon-icon"></span>
                      <h4>Apply Coupon</h4>
                    </div>
                    <div className="coupon-body">
                      <div className="coupon-input-container" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                        />
                        <span className="dropdown-arrow"></span>
                      </div>
                      <button onClick={handleApplyCoupon}>Apply</button>
                    </div>
                    {isDropdownOpen && (
                      <div className="coupon-dropdown">
                        {availableCoupons.length === 0 ? (
                          <div className="no-coupons-message">
                            <span className="no-coupons-icon"></span>
                            <p>No available coupons</p>
                          </div>
                        ) : (
                          <ul>
                            {availableCoupons.map((c, index) => (
                              <li key={index} onClick={() => { setCoupon(c.code); setIsDropdownOpen(false); }}>
                                {c.code} - {c.description}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Desktop action buttons */}
                  <div className="checkout-action-container desktop-only-action" style={{ marginTop: '20px' }}>
                    {step === 1 ? (
                      <button
                        type="button"
                        className="place-order-btn step-button"
                        onClick={handleGoToPayment}
                        style={{ width: '100%' }}
                      >
                        Proceed to Payment
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="place-order-btn"
                        onClick={handleSubmit}
                        style={{ width: '100%' }}
                      >
                        Place Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ConfirmLeaveModal
          isOpen={showLeaveModal}
          onClose={handleCancelLeave}
          onConfirm={handleConfirmLeave}
        />
      </div>
    </div >
  );
};

export default Checkout;