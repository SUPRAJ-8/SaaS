import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import OrderDetailsModal from './OrderDetailsModal';
import './CustomerDetails.css';
import './OrderDetailsModal.css';
import API_URL from '../../apiConfig';

const CustomerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(orders.map(order => order.orderId === updatedOrder.orderId ? updatedOrder : order));
  };

  // Helper function to extract order number from orderId
  const getOrderNumber = (orderId) => {
    if (!orderId) return 'N/A';
    const match = orderId.match(/ORD-(\d+)/);
    if (match && match[1]) {
      const number = match[1];
      // If it's a timestamp (more than 10 digits), show only last 4 digits
      // Otherwise show the full number for sequential IDs (1000, 1001, etc.)
      if (number.length > 10) {
        return `#${number.slice(-4)}`;
      }
      return `#${number}`;
    }
    return orderId;
  };

  const getPaymentStatus = (invoices) => {
    if (!invoices || invoices.length === 0) return 'Unpaid';
    const allRefunded = invoices.every(inv => inv.status === 'Refunded');
    if (allRefunded) return 'Refunded';
    const allPaid = invoices.every(inv => inv.status === 'Paid');
    if (allPaid) return 'Paid';
    const somePaid = invoices.some(inv => inv.status === 'Paid');
    if (somePaid) return 'Paid';
    return 'Unpaid';
  };

  const getStatusClass = (status) => {
    if (!status) return '';
    return `status-${status.toLowerCase().replace(/ /g, '-')}`;
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/customers/${id}`);
        if (!response.ok) {
          throw new Error('Customer not found');
        }
        const data = await response.json();
        console.log('Customer data fetched:', data);
        setCustomer(data);
        setOrders(data.orders || []);
      } catch (error) {
        console.error('Error fetching customer:', error);
        // If customer not found, navigate back to customers list
        navigate('/dashboard/customers');
      }
    };

    fetchCustomerData();
  }, [id, navigate]);

  // No longer needed - orders are fetched from API
  // useEffect(() => {
  //   if (orders.length > 0) {
  //     const storageKey = `customerOrders_${id}`;
  //     localStorage.setItem(storageKey, JSON.stringify(orders));
  //   }
  // }, [orders, id]);

  const handlePaymentStatusChange = (orderId, newStatus) => {
    const updatedOrders = orders.map(order => {
      if (order.orderId === orderId) {
        const newInvoices = order.invoices.map(inv => ({ ...inv, status: newStatus }));
        return {
          ...order,
          status: newStatus === 'Refunded' ? 'refunded' : order.status,
          invoices: newInvoices
        };
      }
      return order;
    });
    setOrders(updatedOrders);
  };



  const handleStatusChange = (orderId, field, value) => {
    setOrders(orders.map(order => {
      if (order.orderId === orderId) {
        // If changing status to refunded, also update payment status
        if (field === 'status' && value === 'refunded') {
          const updatedInvoices = order.invoices && order.invoices.length > 0
            ? order.invoices.map(inv => ({ ...inv, status: 'Refunded' }))
            : [{ status: 'Refunded' }];
          return {
            ...order,
            [field]: value,
            invoices: updatedInvoices,
            lastModified: new Date().toISOString()
          };
        }
        return { ...order, [field]: value, lastModified: new Date().toISOString() };
      }
      return order;
    }));
  };

  const handleRowClick = (e, order) => {
    if (e.target.closest('.status-badge')) {
      return;
    }
    setSelectedOrder(order);
  };

  const sortedOrders = useMemo(() => {
    let sortableOrders = [...orders];
    if (sortConfig.key !== null) {
      sortableOrders.sort((a, b) => {
        const keyA = sortConfig.key.split('.').reduce((o, i) => o[i], a);
        const keyB = sortConfig.key.split('.').reduce((o, i) => o[i], b);
        if (keyA < keyB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (keyA > keyB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableOrders;
  }, [orders, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const dateOptions = {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    };
    const timeOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    const datePart = date.toLocaleDateString('en-US', dateOptions).replace(',', '');
    const timePart = date.toLocaleTimeString('en-US', timeOptions);
    return (
      <>
        {datePart}
        <br />
        {timePart}
      </>
    );
  };

  if (!customer) {
    return <div>Loading...</div>;
  }

  return (
    <div className="customer-details-page">
      <div className="page-header">
        <h2 className="page-title">
          <span className="clickable-path" onClick={() => navigate('/dashboard/customers')}>
            Customers
          </span> / Orders
        </h2>
      </div>
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('orderId')} className="sortable-header">
                #
                <span className="sort-icon-group">
                  <FaArrowUp
                    className={`sort-icon ${sortConfig.key === 'orderId' && sortConfig.direction === 'ascending' ? 'active' : ''}`}
                  />
                  <FaArrowDown
                    className={`sort-icon ${sortConfig.key === 'orderId' && sortConfig.direction === 'descending' ? 'active' : ''}`}
                  />
                </span>
              </th>
              <th onClick={() => requestSort('customerDetails.name')} className="sortable-header">Name<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'customerDetails.name' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'customerDetails.name' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('items.length')} className="sortable-header">Quantity<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'items.length' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'items.length' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('payment.total')} className="sortable-header">Price<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'payment.total' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'payment.total' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('paymentStatus')} className="sortable-header">Pay status<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'paymentStatus' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'paymentStatus' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('customerDetails.paymentTerms')} className="sortable-header">Pay Method<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'customerDetails.paymentTerms' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'customerDetails.paymentTerms' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('status')} className="sortable-header">Status<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'status' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'status' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('placedOn')} className="sortable-header">Created<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'placedOn' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'placedOn' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('updatedOn')} className="sortable-header">Modified<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'updatedOn' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'updatedOn' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map((order) => (
              <tr key={order.orderId} onClick={(e) => handleRowClick(e, order)} className="order-row">
                <td>{getOrderNumber(order.orderId)}</td>
                <td>{order.customerDetails.name}</td>
                <td>{order.items.length}</td>
                <td>Rs. {order.payment.total.toFixed(2)}</td>
                <td>
                  <select
                    value={getPaymentStatus(order.invoices)}
                    onChange={(e) => handlePaymentStatusChange(order.orderId, e.target.value)}
                    className={`status-badge ${getStatusClass(getPaymentStatus(order.invoices))}`}>
                    <option value="Paid">PAID</option>
                    <option value="Unpaid">UNPAID</option>
                    <option value="Refunded">REFUNDED</option>
                  </select>
                </td>
                <td>{order.customerDetails.paymentTerms}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.orderId, 'status', e.target.value)}
                    className={`status-badge ${getStatusClass(order.status)}`}>
                    <option value="pending">PENDING</option>
                    <option value="processing">PROCESSING</option>
                    <option value="shipping">SHIPPING</option>
                    <option value="delivered">DELIVERED</option>
                    <option value="cancelled">CANCELLED</option>
                    <option value="refunded">REFUNDED</option>
                  </select>
                </td>
                <td>{formatDate(order.placedOn)}</td>
                <td>{formatDate(order.updatedOn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onOrderUpdate={handleOrderUpdate}
      />
    </div>
  );
};

export default CustomerDetails;
