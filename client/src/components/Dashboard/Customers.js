import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit, FaArrowUp, FaArrowDown, FaSearch, FaInbox, FaChevronLeft, FaChevronRight, FaPrint, FaFileExport, FaPlus, FaStar } from 'react-icons/fa';
import CustomerAvatar from './CustomerAvatar';
import { toast, ToastContainer } from 'react-toastify';
import ConfirmationModal from './ConfirmationModal.js';
import API_URL from '../../apiConfig';
import './Customers.css';
import './Switch.css'; // Reuse the same switch styles

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: 'single', customer: null });

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/customers`);
        console.log('Customers fetched:', response.data);
        setCustomers(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to fetch customers');
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers based on search term
  useEffect(() => {
    if (customers.length > 0) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, searchTerm]);

  const handleRowClick = (customer) => {
    navigate(`/dashboard/customers/orders/${customer._id}`);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentIds = currentItems.map(c => c._id);
      setSelectedCustomers(prev => {
        const newSelected = [...prev];
        currentIds.forEach(id => {
          if (!newSelected.includes(id)) newSelected.push(id);
        });
        return newSelected;
      });
    } else {
      const currentIds = currentItems.map(c => c._id);
      setSelectedCustomers(prev => prev.filter(id => !currentIds.includes(id)));
    }
  };

  const handleSelectOne = (e, id) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedCustomers(prev => [...prev, id]);
    } else {
      setSelectedCustomers(prev => prev.filter(cid => cid !== id));
    }
  };

  const sortedCustomers = React.useMemo(() => {
    let sortableCustomers = [...filteredCustomers];
    if (sortConfig.key !== null) {
      sortableCustomers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableCustomers;
  }, [filteredCustomers, sortConfig]);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const currentItems = sortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = (customer) => {
    setDeleteModal({ isOpen: true, type: 'single', customer });
  };

  const handleBulkDelete = () => {
    setDeleteModal({ isOpen: true, type: 'bulk', customer: null });
  };

  const confirmDelete = async () => {
    if (deleteModal.type === 'single') {
      const customer = deleteModal.customer;
      if (!customer) return;
      try {
        const response = await axios.delete(`${API_URL}/api/customers/${customer._id}`);
        setCustomers(customers.filter((c) => c._id !== customer._id));

        const deletedOrdersCount = response.data.deletedOrdersCount || 0;
        const message = deletedOrdersCount > 0
          ? `Customer ${customer.name} and ${deletedOrdersCount} order(s) deleted successfully`
          : `Customer ${customer.name} deleted successfully`;

        toast.success(message);
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer. Please try again.');
      }
    } else if (deleteModal.type === 'bulk') {
      try {
        await axios.post(`${API_URL}/api/customers/bulk-delete`, { ids: selectedCustomers });
        setCustomers(customers.filter(c => !selectedCustomers.includes(c._id)));
        setSelectedCustomers([]);
        toast.success(`${selectedCustomers.length} customers deleted successfully`);
      } catch (error) {
        console.error('Error bulk deleting customers:', error);
        toast.error('Failed to bulk delete customers');
      }
    }
    setDeleteModal({ isOpen: false, type: 'single', customer: null });
  };

  const handleBulkUpdateStatus = async (status) => {
    try {
      await axios.post(`${API_URL}/api/customers/bulk-update-status`, { ids: selectedCustomers, status });
      setCustomers(customers.map(c => selectedCustomers.includes(c._id) ? { ...c, status } : c));
      setSelectedCustomers([]);
      toast.success(`Selected customers marked as ${status}`);
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleStatusChange = async (customerId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/customers/${customerId}`, { status: newStatus });
      setCustomers(customers.map(c => c._id === customerId ? { ...c, status: newStatus } : c));
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const formatDate = (dateString) => {
    const options = {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return new Date(dateString).toLocaleString('en-US', options).replace(',', '');
  };

  const formatCurrency = (amount) => {
    return `Rs. ${new Intl.NumberFormat('en-NP').format(amount)}`
  };

  return (
    <div className="customers-page">
      {/* Top Header Section: Title & Tabs */}
      <div className="customers-page-header">
        <div className="header-title-section">
          <h2 className="page-title">Customers</h2>
          <p className="page-description">Manage and view your customer base details.</p>
        </div>
      </div>

      {/* Toolbar Section: Actions & Search */}
      <div className="customers-toolbar">
        <div className="toolbar-actions-row">
          <button className="btn-outline-white icon-text-btn" title="Print">
            <FaPrint /> Print
          </button>
          <button className="btn-outline-white icon-text-btn">
            <FaFileExport /> Export
          </button>
          <button className="btn-dark icon-text-btn">
            <FaPlus /> Add Customer
          </button>
        </div>

        <div className="search-wrapper-full">
          <FaSearch className="search-icon-grey" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-full"
          />
        </div>
      </div>

      {/* Conditional Bulk Actions */}
      {selectedCustomers.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-left">
            <span className="bulk-count">{selectedCustomers.length} selected</span>
            <button className="bulk-action-btn clear-btn" onClick={() => setSelectedCustomers([])}>Deselect All</button>
          </div>
          <div className="bulk-actions-right">
            <button className="bulk-action-btn" onClick={() => handleBulkUpdateStatus('Active')}>Mark Active</button>
            <button className="bulk-action-btn" onClick={() => handleBulkUpdateStatus('Inactive')}>Mark Inactive</button>
            <div className="bulk-divider" style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.3)' }}></div>
            <button className="bulk-action-btn delete-btn" onClick={handleBulkDelete}>Delete</button>
          </div>
        </div>
      )}
      <div className="customers-table-container">
        <div className="customers-table-scrollable">
          <table className="customers-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={currentItems.length > 0 && currentItems.every(c => selectedCustomers.includes(c._id))}
                  />
                </th>
                <th>#</th>
                <th onClick={() => requestSort('name')} className="sortable-header">
                  Customer
                  <span className="sort-icon-group">
                    <FaArrowUp
                      className={`sort-icon ${sortConfig.key === 'name' && sortConfig.direction === 'ascending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                    />
                    <FaArrowDown
                      className={`sort-icon ${sortConfig.key === 'name' && sortConfig.direction === 'descending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                    />
                  </span>
                </th>
                <th onClick={() => requestSort('totalOrders')} className="sortable-header">
                  Orders
                  <span className="sort-icon-group">
                    <FaArrowUp
                      className={`sort-icon ${sortConfig.key === 'totalOrders' && sortConfig.direction === 'ascending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                    />
                    <FaArrowDown
                      className={`sort-icon ${sortConfig.key === 'totalOrders' && sortConfig.direction === 'descending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                    />
                  </span>
                </th>
                <th onClick={() => requestSort('totalSpent')} className="sortable-header">
                  Total Spent
                  <span className="sort-icon-group">
                    <FaArrowUp
                      className={`sort-icon ${sortConfig.key === 'totalSpent' && sortConfig.direction === 'ascending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                    />
                    <FaArrowDown
                      className={`sort-icon ${sortConfig.key === 'totalSpent' && sortConfig.direction === 'descending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                    />
                  </span>
                </th>
                <th onClick={() => requestSort('lastOrder')} className="sortable-header">
                  Last Order
                  <span className="sort-icon-group">
                    <FaArrowUp
                      className={`sort-icon ${sortConfig.key === 'lastOrder' && sortConfig.direction === 'ascending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                    />
                    <FaArrowDown
                      className={`sort-icon ${sortConfig.key === 'lastOrder' && sortConfig.direction === 'descending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                    />
                  </span>
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((customer, index) => (
                  <React.Fragment key={customer._id}>
                    <tr className={`customer-row ${selectedCustomers.includes(customer._id) ? 'row-selected' : ''}`} onClick={() => handleRowClick(customer)} >
                      <td className="checkbox-cell"><input type="checkbox" checked={selectedCustomers.includes(customer._id)} onChange={(e) => handleSelectOne(e, customer._id)} onClick={(e) => e.stopPropagation()} /></td>
                      <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td>
                        <div className="customer-name-cell">
                          <CustomerAvatar name={customer.name} />
                          <div>
                            <div className="customer-name">{customer.name}</div>
                            <div className="customer-email">{customer.email}</div>
                            <div className="customer-phone" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{customer.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>{customer.totalOrders}</td>
                      <td>{formatCurrency(customer.totalSpent)}</td>
                      <td>{formatDate(customer.lastOrder)}</td>
                      <td>
                        <select
                          className={`status-select status-${(customer.status || 'Active').toLowerCase()}`}
                          value={customer.status || 'Active'}
                          onChange={(e) => handleStatusChange(customer._id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="actions-cell">
                        <div className="actions-wrapper">
                          <button
                            className="edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info("Edit customer feature coming soon");
                            }}
                            title="Edit customer"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(customer);
                            }}
                            title="Delete customer"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data-cell">
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
        <div className="table-footer">
          <div className="showing-results">
            Showing <span className="text-bold">{sortedCustomers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-bold">{Math.min(currentPage * itemsPerPage, sortedCustomers.length)}</span> of <span className="text-bold">{sortedCustomers.length}</span> results
          </div>
          <div className="pagination-controls">
            <button
              className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <FaChevronLeft />
            </button>
            <button className="pagination-btn active">{currentPage}</button>
            <button
              className={`pagination-btn ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title={deleteModal.type === 'bulk' ? 'Bulk Delete Customers' : 'Delete Customer'}
        confirmText="Yes, Delete"
        cancelText="Cancel"
      >
        {deleteModal.type === 'bulk' ? (
          <>Are you sure you want to delete <strong>{selectedCustomers.length}</strong> customers? This will also delete all their associated orders. This action cannot be undone.</>
        ) : (
          <>Are you sure you want to delete <strong>{deleteModal.customer?.name}</strong>? This will also delete their {deleteModal.customer?.totalOrders || 0} associated order(s). This action cannot be undone.</>
        )}
      </ConfirmationModal>
      <ToastContainer />
    </div>
  );
};

export default Customers;
