import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays, format, startOfToday, subMonths, startOfYear } from 'date-fns';
import axios from 'axios';
import OrderDetailsModal from './OrderDetailsModal';
import ConfirmationModal from './ConfirmationModal';
import LabelsModal from './LabelsModal';
import { FaArrowUp, FaArrowDown, FaEdit, FaTrashAlt, FaStar, FaFilter, FaListUl, FaChartLine, FaFileInvoice, FaTruck, FaSlidersH, FaSearch, FaPlus, FaFileExport, FaInbox } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Customers.css'; // Reusing customer styles for now
import './OrderDetailsModal.css'; // Import modal styles for consistent dropdowns

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [labelFilter, setLabelFilter] = useState('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [startDate, setStartDate] = useState(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState(false);
  const [orderToEditLabels, setOrderToEditLabels] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [uniqueLabels, setUniqueLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use relative URL to go through proxy in development
  const ordersUrl = '/api/orders';

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

  const handleDeleteClick = (order) => {
    setOrderToDelete(order._id);
    setIsConfirmOpen(true);
  };

  const handleLabelsClick = (order) => {
    setOrderToEditLabels(order);
    setIsLabelsModalOpen(true);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderIds(orders.map(order => order.orderId));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOne = (e, orderId) => {
    if (e.target.checked) {
      setSelectedOrderIds(prev => [...prev, orderId]);
    } else {
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSaveLabels = async (orderId, newLabels) => {
    const orderToUpdate = orders.find(order => order.orderId === orderId);
    if (!orderToUpdate) return;

    const toastId = toast.loading('Saving labels...');

    try {
      const updatedOrder = {
        ...orderToUpdate,
        labels: newLabels
      };

      await axios.put(`/api/orders/${orderToUpdate._id}`, updatedOrder);

      const updatedOrders = orders.map(order =>
        order.orderId === orderId ? { ...order, labels: newLabels } : order
      );
      setOrders(updatedOrders);

      toast.update(toastId, {
        render: 'Labels saved successfully',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error saving labels:', error);
      toast.update(toastId, {
        render: 'Failed to save labels',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  const handleConfirmDelete = async () => {
    const toastId = toast.loading('Deleting order...');

    try {
      await axios.delete(`/api/orders/${orderToDelete}`);
      const updatedOrders = orders.filter(order => order._id !== orderToDelete);
      setOrders(updatedOrders);
      setIsConfirmOpen(false);
      setOrderToDelete(null);

      toast.update(toastId, {
        render: 'Order deleted successfully',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (err) {
      console.error('Error deleting order:', err);
      toast.update(toastId, {
        render: 'Failed to delete order. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  // Bulk delete orders
  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) {
      toast.warning('No orders selected');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedOrderIds.length} order(s)? This action cannot be undone.`);
    if (!confirmed) return;

    const toastId = toast.loading('Deleting orders...');

    try {
      // Get the _id for each selected orderId
      const ordersToDelete = orders.filter(order => selectedOrderIds.includes(order.orderId));
      const deletePromises = ordersToDelete.map(order =>
        axios.delete(`/api/orders/${order._id}`)
      );

      await Promise.all(deletePromises);

      // Update local state
      const updatedOrders = orders.filter(order => !selectedOrderIds.includes(order.orderId));
      setOrders(updatedOrders);
      setSelectedOrderIds([]);

      toast.update(toastId, {
        render: `Successfully deleted ${ordersToDelete.length} order(s)`,
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (err) {
      console.error('Error deleting orders:', err);
      toast.update(toastId, {
        render: 'Failed to delete some orders. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  // Bulk update payment status
  const handleBulkPaymentStatus = async (newStatus) => {
    if (selectedOrderIds.length === 0) {
      toast.warning('No orders selected');
      return;
    }

    const toastId = toast.loading('Updating payment status...');

    try {
      // Update each order's payment status (and order status if payment is Refunded)
      const updatePromises = orders
        .filter(order => selectedOrderIds.includes(order.orderId))
        .map(order => {
          const updatedInvoices = order.invoices && order.invoices.length > 0
            ? order.invoices.map(inv => ({ ...inv, status: newStatus }))
            : [{ status: newStatus }];

          const updateData = { invoices: updatedInvoices };
          if (newStatus === 'Refunded') {
            updateData.status = 'refunded';
          }

          return axios.put(`/api/orders/${order._id}`, updateData);
        });

      await Promise.all(updatePromises);

      // Update local state
      const updatedOrders = orders.map(order => {
        if (selectedOrderIds.includes(order.orderId)) {
          const updatedInvoices = order.invoices && order.invoices.length > 0
            ? order.invoices.map(inv => ({ ...inv, status: newStatus }))
            : [{ status: newStatus }];

          return {
            ...order,
            status: newStatus === 'Refunded' ? 'refunded' : order.status,
            invoices: updatedInvoices
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      setSelectedOrderIds([]);

      const message = newStatus === 'Refunded'
        ? `Successfully updated payment status to "Refunded" and order status to "refunded" for ${selectedOrderIds.length} order(s)`
        : `Successfully updated payment status to "${newStatus}" for ${selectedOrderIds.length} order(s) (order status unchanged)`;

      toast.update(toastId, {
        render: message,
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (err) {
      console.error('Error updating payment status:', err);
      toast.update(toastId, {
        render: 'Failed to update payment status. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  // Bulk update order status
  const handleBulkOrderStatus = async (newStatus) => {
    if (selectedOrderIds.length === 0) {
      toast.warning('No orders selected');
      return;
    }

    const toastId = toast.loading('Updating order status...');

    try {
      // Update each order's status (and payment status if order is refunded)
      const updatePromises = orders
        .filter(order => selectedOrderIds.includes(order.orderId))
        .map(order => {
          return axios.put(`/api/orders/${order._id}`, { status: newStatus });
        });

      await Promise.all(updatePromises);

      // Update local state
      const updatedOrders = orders.map(order => {
        if (selectedOrderIds.includes(order.orderId)) {
          return {
            ...order,
            status: newStatus
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      setSelectedOrderIds([]);

      const message = `Successfully updated order status to "${newStatus}" for ${selectedOrderIds.length} order(s)`;

      toast.update(toastId, {
        render: message,
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.update(toastId, {
        render: 'Failed to update order status. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(orders.map(order => order.orderId === updatedOrder.orderId ? updatedOrder : order));
  };

  const getTotalQuantity = (items) => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getStatusClass = (status) => {
    if (!status) return '';
    return `status-${status.toLowerCase().replace(/ /g, '-')}`;
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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(ordersUrl);
        console.log('Orders fetched:', res.data);
        setOrders(res.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders: ' + (err.response?.status || err.message));
      }
      setLoading(false);
    };

    fetchOrders();
  }, [ordersUrl]);

  useEffect(() => {
    if (orders.length > 0) {
      // localStorage.setItem('mockOrders', JSON.stringify(orders)); // No longer needed
      const allLabels = orders.flatMap(order => order.labels || []);
      const allLabelTexts = allLabels.map(label => label.text);
      const uniqueLabelTexts = [...new Set(allLabelTexts)];
      setUniqueLabels(uniqueLabelTexts);
    }
  }, [orders]);

  const handleRowClick = (e, order) => {
    // Do not open modal if the click is on an interactive element like the dropdown
    if (e.target.closest('.status-badge') || e.target.type === 'checkbox') {
      return;
    }
    setSelectedOrder(order);
  };

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    const orderToUpdate = orders.find(order => order.orderId === orderId);
    if (!orderToUpdate) return;

    const toastId = toast.loading('Updating payment status...');

    try {
      const updatedInvoices = orderToUpdate.invoices && orderToUpdate.invoices.length > 0
        ? orderToUpdate.invoices.map(inv => ({ ...inv, status: newStatus }))
        : [{ status: newStatus }];

      const updateData = {
        invoices: updatedInvoices
      };

      if (newStatus === 'Refunded') {
        updateData.status = 'refunded';
      }

      await axios.put(`/api/orders/${orderToUpdate._id}`, updateData);

      const updatedOrders = orders.map(order => {
        if (order.orderId === orderId) {
          return {
            ...order,
            status: newStatus === 'Refunded' ? 'refunded' : order.status,
            invoices: updatedInvoices
          };
        }
        return order;
      });

      setOrders(updatedOrders);

      const message = newStatus === 'Refunded'
        ? `Payment status updated to "Refunded" and order status set to "refunded"`
        : `Payment status updated to "${newStatus}" (order status unchanged)`;

      toast.update(toastId, {
        render: message,
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.update(toastId, {
        render: 'Failed to update payment status',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };



  const handleStatusChange = async (orderId, newStatus) => {
    const orderToUpdate = orders.find(order => order.orderId === orderId);
    if (!orderToUpdate) return;

    const toastId = toast.loading('Updating order status...');

    try {
      await axios.put(`/api/orders/${orderToUpdate._id}`, { status: newStatus });

      setOrders(orders.map(order =>
        order.orderId === orderId ? { ...order, status: newStatus } : order
      ));

      const message = `Order status updated to "${newStatus}"`;

      toast.update(toastId, {
        render: message,
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.update(toastId, {
        render: 'Failed to update order status',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  const sortedOrders = React.useMemo(() => {
    let filteredOrders = orders;

    if (statusFilter !== 'All') {
      filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
    }

    if (labelFilter !== 'All') {
      filteredOrders = filteredOrders.filter(o => o.labels && o.labels.some(label => label.text === labelFilter));
    }

    if (paymentMethodFilter !== 'All') {
      filteredOrders = filteredOrders.filter(o => o.customerDetails.paymentTerms === paymentMethodFilter);
    }

    if (startDate && endDate) {
      filteredOrders = filteredOrders.filter(o => {
        const orderDate = new Date(o.placedOn);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    let sortableOrders = filteredOrders.filter(order => {
      if (!searchTerm) return true;
      const searchTermLower = searchTerm.toLowerCase();
      const customerName = order.customerDetails?.name?.toLowerCase() || '';
      const customerEmail = order.customerDetails?.email?.toLowerCase() || '';
      const orderId = order.orderId?.toString() || '';

      return (
        customerName.includes(searchTermLower) ||
        customerEmail.includes(searchTermLower) ||
        orderId.includes(searchTermLower)
      );
    });
    if (sortConfig.key !== null) {
      sortableOrders.sort((a, b) => {
        const aValue = sortConfig.key === 'customer.name' ? a.customerDetails.name : sortConfig.key.split('.').reduce((o, i) => o[i], a);
        const bValue = sortConfig.key === 'customer.name' ? b.customerDetails.name : sortConfig.key.split('.').reduce((o, i) => o[i], b);

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableOrders;
  }, [orders, sortConfig, searchTerm, statusFilter, labelFilter, paymentMethodFilter, startDate, endDate]);

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="orders-container">
      <div className="filter-search-container">
        <div className="filters-wrapper">
          {/* Existing filter groups */}
          <div className="filter-group">
            <span className="filter-label">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="All">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipping">Shipping</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Label</span>
            <select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)} className="filter-select">
              <option value="All">All</option>
              {uniqueLabels.map(label => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Payment:</span>
            <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} className="filter-select">
              <option value="All">All</option>
              <option value="COD">COD</option>
              <option value="QR">QR</option>
            </select>
          </div>
          <div className="filter-group date-filter-group">
            <select
              className="filter-select date-preset-select"
              onChange={(e) => {
                const value = e.target.value;
                const now = new Date();
                switch (value) {
                  case 'today':
                    setStartDate(startOfToday());
                    break;
                  case 'last3days':
                    setStartDate(subDays(now, 3));
                    break;
                  case 'last7days':
                    setStartDate(subDays(now, 7));
                    break;
                  case 'last30days':
                    setStartDate(subDays(now, 30));
                    break;
                  case 'last3months':
                    setStartDate(subMonths(now, 3));
                    break;
                  case 'thisyear':
                    setStartDate(startOfYear(now));
                    break;
                  default:
                    setStartDate(subDays(now, 7));
                }
                setEndDate(now);
              }}
              defaultValue="last7days"
            >
              <option value="today">Today</option>
              <option value="last3days">Last 3 days</option>
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="last3months">Last 3 months</option>
              <option value="thisyear">This year</option>
            </select>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => {
                const [start, end] = update;
                setStartDate(start);
                setEndDate(end);
              }}
              dateFormat="MMM d, yyyy"
              className="date-range-display"
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              customInput={<button>{`${format(startDate, 'MMM d, yyyy')} - ${endDate ? format(endDate, 'MMM d, yyyy') : ''}`}</button>}
            />
          </div>
        </div>
        <div className="search-actions-wrapper">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search orders id, phone, email or name...."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-sales-input"
            />
          </div>
          <div className="actions-wrapper">
            <button className="action-button export-btn">
              <FaFileExport />
              <span>Export to Excel</span>
            </button>
            <button className="action-button create-order-btn">
              <FaPlus />
              <span>Create Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-left">
            <span className="bulk-count">{selectedOrderIds.length} order(s) selected</span>
            <button
              className="bulk-action-btn clear-btn"
              onClick={() => setSelectedOrderIds([])}
            >
              Clear Selection
            </button>
          </div>
          <div className="bulk-actions-right">
            <div className="bulk-payment-dropdown">
              <label>Order Status:</label>
              <select
                className="bulk-select"
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkOrderStatus(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Select Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipping">Shipping</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div className="bulk-payment-dropdown">
              <label>Payment Status:</label>
              <select
                className="bulk-select"
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkPaymentStatus(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Select Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
            <button
              className="bulk-action-btn delete-btn"
              onClick={handleBulkDelete}
            >
              <FaTrashAlt /> Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="customers-table-container">
        <OrderDetailsModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
          onOrderUpdate={handleOrderUpdate}
        />
        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirm Deletion"
        >
          Are you sure you want to delete this order? This action cannot be undone.
        </ConfirmationModal>
        <LabelsModal
          isOpen={isLabelsModalOpen}
          onClose={() => setIsLabelsModalOpen(false)}
          order={orderToEditLabels}
          onSaveLabels={handleSaveLabels}
        />
        <table className="customers-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                />
              </th>
              <th onClick={() => requestSort('orderId')} className="sortable-header">#<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'orderId' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'orderId' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('customerDetails.name')} className="sortable-header"> Name<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'customerDetails.name' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'customerDetails.name' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('items')} className="sortable-header">Quantity<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'items' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'items' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('payment.total')} className="sortable-header">Total<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'payment.total' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'payment.total' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('labels')} className="sortable-header">Labels<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'labels' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'labels' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('customerDetails.paymentTerms')} className="sortable-header">Pay Method<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'customerDetails.paymentTerms' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'customerDetails.paymentTerms' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('status')} className="sortable-header">Order / Pay Status<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'status' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'status' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('placedOn')} className="sortable-header">Created<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'placedOn' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'placedOn' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th onClick={() => requestSort('updatedOn')} className="sortable-header">Modified<span className="sort-icon-group"><FaArrowUp className={`sort-icon ${sortConfig.key === 'updatedOn' && sortConfig.direction === 'ascending' ? 'active' : ''}`} /><FaArrowDown className={`sort-icon ${sortConfig.key === 'updatedOn' && sortConfig.direction === 'descending' ? 'active' : ''}`} /></span></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.length > 0 ? (
              sortedOrders.map((order) => (
                <tr key={order.orderId} onClick={(e) => handleRowClick(e, order)} className="customer-row">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.orderId)}
                      onChange={(e) => handleSelectOne(e, order.orderId)}
                    />
                  </td>
                  <td>{getOrderNumber(order.orderId)}</td>
                  <td>{order.customerDetails.name}</td>
                  <td>{getTotalQuantity(order.items)}</td>
                  <td>NPR {order.payment && order.payment.total ? order.payment.total.toFixed() : 'N/A'}</td>
                  <td>
                    <div className="labels-cell">
                      {order.labels && order.labels.map((label, index) => (
                        <span key={index} className="label-tag-small" style={{ backgroundColor: label.color }}>{label.text}</span>
                      ))}
                      <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleLabelsClick(order); }}>
                        <FaEdit />
                      </button>
                    </div>
                  </td>
                  <td>{order.customerDetails.paymentTerms}</td>
                  <td>
                    <div className="status-cell">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                        className={`status-badge ${getStatusClass(order.status)}`}
                      >
                        <option value="pending">PENDING</option>
                        <option value="processing">PROCESSING</option>
                        <option value="shipping">SHIPPING</option>
                        <option value="delivered">DELIVERED</option>
                        <option value="cancelled">CANCELLED</option>
                        <option value="refunded">REFUNDED</option>
                      </select>
                      <span className="status-separator">&</span>
                      <select
                        value={getPaymentStatus(order.invoices)}
                        onChange={(e) => handlePaymentStatusChange(order.orderId, e.target.value)}
                        className={`status-badge ${getStatusClass(getPaymentStatus(order.invoices))}`}>
                        <option value="Paid">PAID</option>
                        <option value="Unpaid">UNPAID</option>
                        <option value="Refunded">REFUNDED</option>
                      </select>
                    </div>
                  </td>
                  <td>{formatDate(order.placedOn)}</td>
                  <td>{formatDate(order.updatedOn)}</td>
                  <td>
                    <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteClick(order); }}>
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="no-data-cell">
                  <div className="no-data-content">
                    <FaInbox className="no-data-icon" />
                    <span>No data available</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ToastContainer
        position="top-right"
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
  );
};

export default Orders;
