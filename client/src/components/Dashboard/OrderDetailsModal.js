import React, { useState, useEffect } from 'react';
import { FaPrint, FaPencilAlt } from 'react-icons/fa';
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
      case 'paid': return 'status-paid';
      case 'unpaid': return 'status-unpaid';
      case 'refunded': return 'status-refunded';
      case 'partially paid': return 'status-processing';
      case 'processing': return 'status-processing';
      case 'pending': return 'status-pending';
      case 'shipping': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled':
      case 'canceled': return 'status-cancelled';
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

  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status);
      setPaymentStatus(getPaymentStatus(order.invoices));
      setEditedDetails(order.customerDetails);
    } else {
      // Reset when modal is closed
      setIsEditing(false);
      setEditedDetails(null);
    }
  }, [order]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    const previousStatus = currentStatus;
    const previousPaymentStatus = paymentStatus;
    setCurrentStatus(newStatus);

    // If order status is set to refunded, automatically set payment status to Refunded
    if (newStatus === 'refunded') {
      setPaymentStatus('Refunded');
    }

    try {
      const updatedInvoices = newStatus === 'refunded'
        ? (order.invoices && order.invoices.length > 0
          ? order.invoices.map(inv => ({ ...inv, status: 'Refunded' }))
          : [{ status: 'Refunded' }])
        : order.invoices;

      const updatedOrder = {
        ...order,
        status: newStatus,
        invoices: updatedInvoices
      };

      await axios.put(`/api/orders/${order._id}`, updatedOrder);

      // Update parent component
      if (onOrderUpdate) {
        onOrderUpdate(updatedOrder);
      }

      const message = newStatus === 'refunded'
        ? `Order status updated to "refunded" and payment status set to "Refunded"`
        : `Order status updated to "${newStatus}"`;

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
    setIsEditing(false);
  };

  const handleSaveClick = () => {
    const updatedOrder = { ...order, customerDetails: editedDetails };
    onOrderUpdate(updatedOrder);
    // Manually update the local 'order' object for immediate reflection
    Object.assign(order, updatedOrder);
    setIsEditing(false);
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
      setCurrentStatus('refunded');
    }

    try {
      const updatedInvoices = order.invoices && order.invoices.length > 0
        ? order.invoices.map(inv => ({ ...inv, status: newPaymentStatus }))
        : [{ status: newPaymentStatus }];

      const updatedOrder = {
        ...order,
        status: newPaymentStatus === 'Refunded' ? 'refunded' : order.status,
        invoices: updatedInvoices
      };

      await axios.put(`/api/orders/${order._id}`, updatedOrder);

      // Update parent component
      if (onOrderUpdate) {
        onOrderUpdate(updatedOrder);
      }

      const message = newPaymentStatus === 'Refunded'
        ? `Payment status updated to "Refunded" and order status set to "refunded"`
        : `Payment status updated to "${newPaymentStatus}"`;

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
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-top">
            <button onClick={onClose} className="back-button-modal">←</button>
            <div className="header-title">

              <div className="order-title-status">
                <div className="order-header-top-line">
                  <h2>Order #{getOrderNumber(order.orderId)}</h2>
                  <div className="status-title"> Status: </div>
                  <select id="order-status" name="order-status" className={`status-badge ${getStatusClass(currentStatus)}`} value={currentStatus} onChange={handleStatusChange}>
                    <option value="pending">PENDING</option>
                    <option value="processing">PROCESSING</option>
                    <option value="shipping">SHIPPING</option>
                    <option value="delivered">DELIVERED</option>
                    <option value="cancelled">CANCELLED</option>
                    <option value="refunded">REFUNDED</option>
                  </select> &
                  <select id="payment-status" name="payment-status" className={`status-badge ${getStatusClass(paymentStatus)}`} value={paymentStatus} onChange={handlePaymentStatusChange}>
                    <option value="Paid">PAID</option>
                    <option value="Unpaid">UNPAID</option>
                    <option value="Refunded">REFUNDED</option>
                  </select>
                </div>
                <div className="header-detail-item">
                  <span className="header-detail-label">Created: </span>
                  <span className="header-detail-value"> {formatDate(order.placedOn)}</span>

                  <span className="header-detail-label">Modified: </span>
                  <span className="header-detail-value"> {formatDate(order.updatedOn)}</span>

                  <span className="header-detail-label">Payment Method: </span>
                  <span className="header-detail-value"> {order.customerDetails.paymentTerms}</span>
                </div>

              </div>
            </div>
            <div className="header-actions">
              <button className="btn-secondary btn-print">
                <FaPrint /> Print
              </button>
            </div>
          </div>
        </div>

        <div className="modal-body">
          <div className="details-flex-container">
            <div className="info-cards">
              <div className="card full-width-card">
                <div className="card-header">
                  <h4>CUSTOMER & SHIPPING DETAILS</h4>
                  {isEditing ? (
                    <div className="edit-actions">
                      <button onClick={handleCancelClick} className="btn-cancel">Cancel</button>
                      <button onClick={handleSaveClick} className="btn-save">Save</button>
                    </div>
                  ) : (
                    <button onClick={handleEditClick} className="btn-edit">
                      <FaPencilAlt /> Edit
                    </button>
                  )}
                </div>
                <div className="card-body">
                  {isEditing && editedDetails ? (
                    <div className="details-grid-edit">
                      <label>Name:</label> <input type="text" name="name" value={editedDetails.name} onChange={handleInputChange} />
                      <label>Email:</label> <input type="email" name="email" value={editedDetails.email} onChange={handleInputChange} />
                      <label>Phone Number:</label> <input type="text" name="phone" value={editedDetails.phone} onChange={handleInputChange} />
                      <label>Province:</label> <input type="text" name="province" value={editedDetails.province} onChange={handleInputChange} />
                      <label>City:</label> <input type="text" name="city" value={editedDetails.city} onChange={handleInputChange} />
                      <label>District:</label> <input type="text" name="district" value={editedDetails.district} onChange={handleInputChange} />
                      <label>Landmark:</label> <input type="text" name="landmark" value={editedDetails.landmark} onChange={handleInputChange} />
                      <label>Order Note:</label> <textarea name="orderNotes" value={editedDetails.orderNotes} onChange={handleInputChange}></textarea>
                    </div>
                  ) : (
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Name:</span>
                        <span className="detail-value">{order.customerDetails.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{order.customerDetails.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone Number:</span>
                        <span className="detail-value">{order.customerDetails.phone || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Province:</span>
                        <span className="detail-value">{order.customerDetails.province || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">City:</span>
                        <span className="detail-value">{order.customerDetails.city || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">District:</span>
                        <span className="detail-value">{order.customerDetails.district || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Landmark:</span>
                        <span className="detail-value">{order.customerDetails.landmark || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Order Note:</span>
                        <span className="detail-value">{order.customerDetails.orderNotes || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="items-ordered-section card">
              <div className="card-header">
                <h4>Items ordered</h4>
              </div>
              <table className="items-table">
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
                      <td>{index + 1}.</td>
                      <td>
                        <div className="item-name-cell">
                          {item.image && <img src={item.image} alt={item.name} />}
                          {item.name}
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>NPR {item.price.toFixed()}</td>
                      <td>NPR {(item.quantity * item.price).toFixed()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="items-total-section">
                <div className="totals">
                  <p><span>Sub-total</span><span>NPR {(order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)).toFixed()}</span></p>
                  <p><span>Delivery Charge</span><span>NPR {((order.payment && order.payment.shippingHandling) || 0).toFixed()}</span></p>
                  <p className="grand-total"><span>Total</span><span>NPR {(order.payment && order.payment.total ? order.payment.total.toFixed() : 'N/A')}</span></p>
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
