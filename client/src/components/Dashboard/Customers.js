import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaArrowUp, FaArrowDown, FaSearch, FaInbox, FaChevronLeft, FaChevronRight, FaPrint, FaFileExport, FaPlus, FaStar } from 'react-icons/fa';
import CustomerAvatar from './CustomerAvatar';
import { toast } from 'react-toastify';
import DeleteConfirmModal from './DeleteConfirmModal';
import API_URL from '../../apiConfig';
import './Customers.css';
import './Switch.css'; // Reuse the same switch styles

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
      const allCustomerIds = sortedCustomers.map(c => c._id);
      setSelectedCustomers(allCustomerIds);
    } else {
      setSelectedCustomers([]);
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
    setCustomerToDelete(customer);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      try {
        const response = await axios.delete(`${API_URL}/api/customers/${customerToDelete._id}`);
        setCustomers(customers.filter((customer) => customer._id !== customerToDelete._id));

        const deletedOrdersCount = response.data.deletedOrdersCount || 0;
        const message = deletedOrdersCount > 0
          ? `Customer ${customerToDelete.name} and ${deletedOrdersCount} order(s) deleted successfully`
          : `Customer ${customerToDelete.name} deleted successfully`;

        toast.success(message);
        setCustomerToDelete(null);
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer. Please try again.');
        setCustomerToDelete(null);
      }
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

      {/* Toolbar Section: Search & Actions */}
      <div className="customers-toolbar">
        <div className="search-wrapper-wide">
          <FaSearch className="search-icon-grey" />
          <input
            type="text"
            placeholder="Search by name, email, or customer ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-wide"
          />
        </div>

        <div className="toolbar-actions">
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
      </div>
      <div className="customers-table-container">
        <table className="customers-table">
          <thead>
            <tr>
              <th><input type="checkbox" onChange={handleSelectAll} checked={selectedCustomers.length === sortedCustomers.length && sortedCustomers.length > 0} /></th>
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
              <th onClick={() => requestSort('phone')} className="sortable-header">
                Phone
                <span className="sort-icon-group">
                  <FaArrowUp
                    className={`sort-icon ${sortConfig.key === 'phone' && sortConfig.direction === 'ascending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                  />
                  <FaArrowDown
                    className={`sort-icon ${sortConfig.key === 'phone' && sortConfig.direction === 'descending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((customer, index) => (
                <React.Fragment key={customer._id}>
                  <tr className={`customer-row ${selectedCustomers.includes(customer._id) ? 'row-selected' : ''}`} onClick={() => handleRowClick(customer)} >
                    <td><input type="checkbox" checked={selectedCustomers.includes(customer._id)} onChange={(e) => handleSelectOne(e, customer._id)} onClick={(e) => e.stopPropagation()} /></td>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>
                      <div className="customer-name-cell">
                        <CustomerAvatar name={customer.name} />
                        <div>
                          <div className="customer-name">{customer.name}</div>
                          <div className="customer-email">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{customer.phone}</td>
                    <td>{customer.totalOrders}</td>
                    <td>{formatCurrency(customer.totalSpent)}</td>
                    <td>{formatDate(customer.lastOrder)}</td>
                    <td className="actions-cell">
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

      {customerToDelete && (
        <DeleteConfirmModal
          isOpen={!!customerToDelete}
          onClose={() => setCustomerToDelete(null)}
          onConfirm={confirmDelete}
          itemName={customerToDelete?.name}
          itemType="customer"
          ordersCount={customerToDelete?.totalOrders || 0}
        />
      )}
    </div>
  );
};

export default Customers;
