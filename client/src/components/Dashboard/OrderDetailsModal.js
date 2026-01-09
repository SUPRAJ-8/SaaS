import React, { useState, useEffect } from 'react';
import { FaPrint, FaPencilAlt, FaChevronDown, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import './OrderDetailsModal.css';

const OrderDetailsModal = ({ isOpen, onClose, order, onOrderUpdate }) => {

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

  const getStatusClass = (status) => {
    if (!status) return '';
    switch (status.toLowerCase()) {
      case 'paid': return 'od-status-paid';
      case 'unpaid': return 'od-status-unpaid';
      case 'refunded': return 'od-status-refunded';
      case 'partial':
      case 'partially paid': return 'od-status-processing';
      case 'processing': return 'od-status-processing';
      case 'pending': return 'od-status-pending';
      case 'shipping': return 'od-status-shipped';
      case 'delivered': return 'od-status-delivered';
      case 'cancelled':
      case 'canceled': return 'od-status-cancelled';
      default: return '';
    }
  };

  const getPaymentStatus = (invoices) => {
    if (!invoices || invoices.length === 0) return 'Unpaid';
    const allRefunded = invoices.every(inv => inv.status && inv.status.toLowerCase() === 'refunded');
    if (allRefunded) return 'Refunded';
    const allPaid = invoices.every(inv => inv.status && inv.status.toLowerCase() === 'paid');
    return allPaid ? 'Paid' : 'Unpaid';
  };

  const [currentStatus, setCurrentStatus] = useState(order ? order.status : '');
  const [paymentStatus, setPaymentStatus] = useState(order ? getPaymentStatus(order.invoices) : '');
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState(null);
  const [internalNote, setInternalNote] = useState(order ? order.internalNote : '');

  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status);
      setPaymentStatus(getPaymentStatus(order.invoices));
      setEditedDetails(order.customerDetails);
      setInternalNote(order.internalNote || '');
    } else {
      // Reset when modal is closed
      setIsEditing(false);
      setEditedDetails(null);
      setInternalNote('');
    }
  }, [order]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    const previousStatus = currentStatus;
    const previousPaymentStatus = paymentStatus;
    setCurrentStatus(newStatus);

    try {
      const updatedOrder = { ...order, status: newStatus };
      await axios.put(`/api/orders/${order._id}`, { status: newStatus });

      // Update parent component
      if (onOrderUpdate) {
        onOrderUpdate(updatedOrder);
      }

      const message = `Order status updated to "${newStatus}"`;

      toast.success(message, {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      setCurrentStatus(previousStatus); // Revert on error
      setPaymentStatus(previousPaymentStatus);
      toast.error('Failed to update order status', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleEditClick = () => setIsEditing(true);

  const handleCancelClick = () => {
    setEditedDetails(order.customerDetails);
    setInternalNote(order.internalNote || '');
    setIsEditing(false);
  };

  const handleSaveClick = async () => {
    try {
      const updateData = {
        customerDetails: editedDetails,
        internalNote: internalNote
      };

      const response = await axios.put(`/api/orders/${order._id}`, updateData);

      if (onOrderUpdate) {
        onOrderUpdate(response.data);
      }

      // Manually update the local 'order' object for immediate reflection if needed
      // Although parent's state change should preferrably re-render this.
      Object.assign(order, response.data);

      setIsEditing(false);
      toast.success('Order details updated successfully');
    } catch (error) {
      console.error('Error saving order details:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentStatusChange = async (e) => {
    const newPaymentStatus = e.target.value;
    const previousPaymentStatus = paymentStatus;
    const previousStatus = currentStatus;
    setPaymentStatus(newPaymentStatus);

    // If payment status is set to Refunded, automatically set order status to refunded
    if (newPaymentStatus === 'Refunded') {
      setCurrentStatus('cancelled');
    }

    try {
      const updatedInvoices = order.invoices && order.invoices.length > 0
        ? order.invoices.map(inv => ({ ...inv, status: newPaymentStatus }))
        : [{ status: newPaymentStatus }];

      const updateData = {
        invoices: updatedInvoices
      };

      if (newPaymentStatus === 'Refunded') {
        updateData.status = 'cancelled';
      }

      await axios.put(`/api/orders/${order._id}`, updateData);

      const updatedOrder = { ...order, ...updateData };
      // Update parent component
      if (onOrderUpdate) {
        onOrderUpdate(updatedOrder);
      }

      const message = newPaymentStatus === 'Refunded'
        ? `Payment status updated to "Refunded" and order status set to "cancelled"`
        : `Payment status updated to "${newPaymentStatus}" (order status unchanged)`;

      toast.success(message, {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      setPaymentStatus(previousPaymentStatus); // Revert on error
      setCurrentStatus(previousStatus);
      toast.error('Failed to update payment status', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    return new Date(dateString).toLocaleString('en-US', options).replace(',', '');
  };

  if (!isOpen || !order) {
    return null;
  }

  return (
    <div className={`od-modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}>
      <div className="od-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="od-modal-header">
          <div className="od-modal-header-top">
            <button onClick={onClose} className="od-back-button-modal"><FaArrowLeft /></button>
            <div className="od-header-title">

              <div className="od-order-title-status">
                <div className="od-order-header-top-line">
                  <h2>Order #{getOrderNumber(order.orderId)}</h2>
                  <div className="od-status-title"> Status: </div>
                  <div className="od-status-badges-group">
                    <div className="od-status-select-wrapper">
                      <select id="order-status" name="order-status" className={`od-modal-status-badge ${getStatusClass(currentStatus)}`} value={currentStatus} onChange={handleStatusChange}>
                        <option value="pending">PENDING</option>
                        <option value="processing">PROCESSING</option>
                        <option value="shipping">SHIPPING</option>
                        <option value="delivered">DELIVERED</option>
                        <option value="cancelled">CANCELLED</option>
                      </select>
                      <FaChevronDown className="od-badge-chevron" />
                    </div>
                    <span className="od-status-operator">&</span>
                    <div className="od-status-select-wrapper">
                      <select id="payment-status" name="payment-status" className={`od-modal-status-badge ${getStatusClass(paymentStatus)}`} value={paymentStatus} onChange={handlePaymentStatusChange}>
                        <option value="Paid">PAID</option>
                        <option value="Unpaid">UNPAID</option>
                        <option value="Partial">PARTIAL</option>
                        <option value="Refunded">REFUNDED</option>
                      </select>
                      <FaChevronDown className="od-badge-chevron" />
                    </div>
                  </div>
                </div>
                <div className="od-header-detail-row">
                  <div className="od-meta-item">
                    <span className="od-header-meta-label">Created:</span>
                    <span className="od-header-meta-value">{formatDate(order.placedOn)}</span>
                  </div>
                  <div className="od-meta-item">
                    <span className="od-header-meta-label">Modified:</span>
                    <span className="od-header-meta-value">{formatDate(order.updatedOn)}</span>
                  </div>
                  <div className="od-meta-item">
                    <span className="od-header-meta-label">Payment Method:</span>
                    <span className="od-header-meta-value">{order.customerDetails.paymentTerms}</span>
                  </div>
                </div>

              </div>
            </div>
            <div className="od-header-actions">
              <button className="od-btn-secondary od-btn-print">
                <FaPrint /> Print
              </button>
            </div>
          </div>
        </div>

        <div className="od-modal-body">
          <div className="od-details-flex-container">
            <div className="od-info-cards">
              <div className="od-card od-full-width-card">
                <div className="od-card-header">
                  <h4>CUSTOMER & SHIPPING DETAILS</h4>
                  {isEditing ? (
                    <div className="od-edit-actions">
                      <button onClick={handleCancelClick} className="od-btn-cancel">Cancel</button>
                      <button onClick={handleSaveClick} className="od-btn-save">Save</button>
                    </div>
                  ) : (
                    <button onClick={handleEditClick} className="od-btn-edit">
                      <FaPencilAlt /> Edit
                    </button>
                  )}
                </div>
                <div className="od-card-body">
                  {isEditing && editedDetails ? (
                    <div className="od-details-form">
                      <div className="od-edit-field">
                        <label>Name</label>
                        <input type="text" name="name" value={editedDetails.name} onChange={handleInputChange} placeholder="Enter customer name" />
                      </div>
                      <div className="od-edit-field">
                        <label>Email</label>
                        <input type="email" name="email" value={editedDetails.email} onChange={handleInputChange} placeholder="Enter email address" />
                      </div>
                      <div className="od-edit-field">
                        <label>Phone Number</label>
                        <input type="text" name="phone" value={editedDetails.phone} onChange={handleInputChange} placeholder="Enter phone number" />
                      </div>
                      <div className="od-edit-field">
                        <label>Province</label>
                        <input type="text" name="province" value={editedDetails.province} onChange={handleInputChange} placeholder="Enter province" />
                      </div>
                      <div className="od-edit-field">
                        <label>District</label>
                        <input type="text" name="district" value={editedDetails.district} onChange={handleInputChange} placeholder="Enter district" />
                      </div>
                      <div className="od-edit-field">
                        <label>City</label>
                        <input type="text" name="city" value={editedDetails.city} onChange={handleInputChange} placeholder="Enter city" />
                      </div>
                      <div className="od-edit-field">
                        <label>Tole / Toll</label>
                        <input type="text" name="toll" value={editedDetails.toll || ''} onChange={handleInputChange} placeholder="Enter toll" />
                      </div>
                      <div className="od-edit-field full-width">
                        <label>Landmark</label>
                        <input type="text" name="landmark" value={editedDetails.landmark} onChange={handleInputChange} placeholder="Enter landmark" />
                      </div>
                      <div className="od-edit-field full-width">
                        <label>Customer Note</label>
                        <textarea name="orderNotes" value={editedDetails.orderNotes} onChange={handleInputChange} placeholder="Specific instructions from customer..."></textarea>
                      </div>
                      <div className="od-edit-field full-width">
                        <label>Order Note</label>
                        <textarea name="internalNote" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Add any internal order notes..."></textarea>
                      </div>
                    </div>
                  ) : (
                    <div className="od-details-grid">
                      <div className="od-detail-item">
                        <span className="od-detail-label">Name:</span>
                        <span className="od-detail-value">{order.customerDetails.name}</span>
                      </div>
                      <div className="od-detail-item">
                        <span className="od-detail-label">Email:</span>
                        <span className="od-detail-value">{order.customerDetails.email}</span>
                      </div>
                      <div className="od-detail-item">
                        <span className="od-detail-label">Phone Number:</span>
                        <span className="od-detail-value">{order.customerDetails.phone || 'N/A'}</span>
                      </div>
                      <div className="od-detail-item">
                        <span className="od-detail-label">Province:</span>
                        <span className="od-detail-value">{order.customerDetails.province || 'N/A'}</span>
                      </div>
                      <div className="od-detail-item">
                        <span className="od-detail-label">District:</span>
                        <span className="od-detail-value">{order.customerDetails.district || 'N/A'}</span>
                      </div>
                      <div className="od-detail-item">
                        <span className="od-detail-label">City:</span>
                        <span className="od-detail-value">{order.customerDetails.city || 'N/A'}</span>
                      </div>
                      <div className="od-detail-item">
                        <span className="od-detail-label">Tole / Toll:</span>
                        <span className="od-detail-value">{order.customerDetails.toll || 'N/A'}</span>
                      </div>
                      <div className="od-detail-item">
                        <span className="od-detail-label">Landmark:</span>
                        <span className={`od-detail-value ${!order.customerDetails.landmark ? 'od-italic-na' : ''}`}>
                          {order.customerDetails.landmark || 'N/A'}
                        </span>
                      </div>
                      <div className="od-detail-item od-full-width-row">
                        <span className="od-detail-label">Customer Note:</span>
                        <span className={`od-detail-value ${!order.customerDetails.orderNotes ? 'od-italic-na' : ''}`}>
                          {order.customerDetails.orderNotes || 'N/A'}
                        </span>
                      </div>
                      <div className="od-detail-item od-note-row od-full-width-row">
                        <span className="od-detail-label">Order Note:</span>
                        <div
                          className="od-note-value-box od-clickable-note"
                          onClick={handleEditClick}
                          title="Click to edit internal order note"
                        >
                          {order.internalNote || 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="od-items-ordered-section od-card">
              <div className="od-card-header">
                <h4>ITEMS ORDERED</h4>
              </div>
              <table className="od-items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ITEMS NAME</th>
                    <th>QUANTITY</th>
                    <th>PRICE</th>
                    <th>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="od-item-index">{index + 1}.</td>
                      <td>
                        <div className="od-item-name-cell">
                          {item.image && <img src={item.image} alt={item.name} />}
                          <span className="od-item-name-text">{item.name}</span>
                        </div>
                      </td>
                      <td className="od-text-center">{item.quantity}</td>
                      <td className="od-text-right">NPR {item.price.toLocaleString()}</td>
                      <td className="od-text-right od-text-bold">NPR {(item.quantity * item.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="od-items-total-section">
                <div className="od-totals">
                  <div className="od-total-row">
                    <span>Sub-total</span>
                    <span className="od-text-bold">NPR {(order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)).toLocaleString()}</span>
                  </div>
                  <div className="od-total-row">
                    <span>Delivery Charge</span>
                    <span className="od-text-bold">NPR {((order.payment && order.payment.shippingHandling) || 0).toLocaleString()}</span>
                  </div>
                  <div className="od-total-row od-grand-total-row">
                    <span className="od-total-label">Total</span>
                    <span className="od-total-amount-highlight">NPR {(order.payment && order.payment.total ? order.payment.total.toLocaleString() : 'N/A')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
