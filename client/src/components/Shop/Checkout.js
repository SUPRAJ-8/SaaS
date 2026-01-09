import React, { useState, useEffect, useRef } from 'react';

import { useCart } from './CartProvider';
import './Checkout.css';
import Stepper from './Stepper';
import AddressForm from './AddressForm';
import axios from 'axios';
import API_URL from '../../apiConfig';

import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import ConfirmLeaveModal from './ConfirmLeaveModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  const [availableCoupons, setAvailableCoupons] = useState([]); // Will be fetched from API in a real app
  const couponRef = useRef(null);
  const shippingFormRef = useRef(null);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

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

  const handleApplyCoupon = () => {
    // Here you would typically validate the coupon and apply the discount
    toast.success(`Coupon "${coupon}" applied successfully!`, {
      position: 'top-center',
      autoClose: 3000,
    });
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
    setFormData(prev => ({ ...prev, [id]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAddressChange = (addressData) => {
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
    if (items.length === 0) {
      toast.error('Your cart is empty! Please add items before checkout.', {
        position: 'top-center',
        autoClose: 3000,
      });
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
      },
      items: items,
      payment: { total: total },
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

      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 6000,
      });
    }
  };

  const handleGoToPayment = () => {
    // Add validation logic here if needed
    setStep(2);
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
          <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
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
                <form ref={shippingFormRef} onSubmit={(e) => { e.preventDefault(); handleGoToPayment(); }}>
                  <div className="general-info-container">
                    <h3>1.GENERAL Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="fullName">Full Name <span className="required-asterisk">*</span></label>
                        <input type="text" id="fullName" value={formData.fullName} onChange={handleGeneralInfoChange} placeholder="Enter your full name" required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone">Phone Number <span className="required-asterisk">*</span></label>
                        <input type="tel" id="phone" value={formData.phone} onChange={handleGeneralInfoChange} placeholder="Enter your phone number" required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input type="email" id="email" value={formData.email} onChange={handleGeneralInfoChange} placeholder="Enter your email address" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="orderNote">Order Note (optional)</label>
                      <input type="text" id="orderNote" value={formData.orderNote} onChange={handleGeneralInfoChange} placeholder="eg: I want to order this product for my family." />
                    </div>
                  </div>

                  <AddressForm addressData={formData} onAddressChange={handleAddressChange} />

                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleSubmit}>
                  <h3>Payment Information</h3>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <div className="payment-method-option selected">
                      <span className="payment-method-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 64 64"><path fill="#ffce31" d="M56 33h-8v-4h8v4zm-2-22H10c-1.1 0-2 .9-2 2v30h-2c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2h-2V13h44v20h-4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2h-2V13c0-1.1-.9-2-2-2z" /><path fill="#e8a337" d="M10 45h4c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2zm40 0h4c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2z" /><path fill="#42ade2" d="M48 21h-8v8h8v-8zm-36 0h8v8h-8v-8z" /><path fill="#ff7171" d="M58 21H10c-1.1 0-2 .9-2 2v12h52V23c0-1.1-.9-2-2-2z" /><path fill="#42ade2" d="M58 35H8v-2c0-1.1.9-2 2-2h46c1.1 0 2 .9 2 2v2z" /><path fill="#e8a337" d="M56 33h-8v-4h8v4z" /><g fill="#42ade2"><path d="M56 31h-8v-2h8v2zm-2-22H10c-1.1 0-2 .9-2 2v2h52V11c0-1.1-.9-2-2-2z" /><circle cx="14" cy="41" r="4" /><circle cx="50" cy="41" r="4" /></g></svg>
                      </span>
                      <span className="payment-method-text">Cash on delivery</span>
                      <div className="checkmark-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ff69b4" /><path stroke="#fff" stroke-width="2" d="M7 13l3 3 7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  {/* Add other payment fields here as needed */}
                  <button type="submit" className="place-order-btn">Place Order</button>
                </form>
              )}
            </div>

            <div className="order-summary">
              <h3>Order Summary</h3>
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
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="remove-item-icon">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </div>
                      <span className="order-item-quantity">Qty: {item.quantity}</span>
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
                  <span>FREE</span>
                </div>
                <div className="summary-row order-total">
                  <strong>Total:</strong>
                  <strong>NPR {total.toFixed()}</strong>
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
                {step === 1 && (
                  <button type="button" className="place-order-btn" onClick={() => shippingFormRef.current.requestSubmit()}>Proceed to Payment</button>
                )}
              </div>
            </div>
          </div>
        </div>
        <ConfirmLeaveModal
          isOpen={showLeaveModal}
          onClose={handleCancelLeave}
          onConfirm={handleConfirmLeave}
        />
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </div>
  );
};

export default Checkout;