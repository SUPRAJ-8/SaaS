import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
    FaSearch, FaArrowUp, FaArrowDown, FaTrash, FaPrint,
    FaFileExport, FaInbox, FaChevronLeft, FaChevronRight,
    FaCalendarAlt, FaFilter, FaTag, FaCreditCard, FaHistory,
    FaPlus, FaFileExcel, FaChevronDown, FaCheck, FaWallet, FaTimes, FaEdit
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import OrderDetailsModal from './OrderDetailsModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import API_URL from '../../apiConfig';
import './Orders.css';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'placedOn', direction: 'descending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [statusEditId, setStatusEditId] = useState(null);
    const [payStatusEditId, setPayStatusEditId] = useState(null);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [labelFilter, setLabelFilter] = useState('All Labels');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('All Methods');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('All Statuses');
    const [timeframeFilter, setTimeframeFilter] = useState('All Time');

    // Custom Date Range
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isDateRangeActive, setIsDateRangeActive] = useState(false);

    // Dropdown visibility
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isMainFilterOpen, setIsMainFilterOpen] = useState(false);
    const dropdownRef = useRef(null);
    const mainFilterRef = useRef(null);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (statusFilter !== 'All Statuses') count++;
        if (labelFilter !== 'All Labels') count++;
        if (paymentMethodFilter !== 'All Methods') count++;
        if (paymentStatusFilter !== 'All Statuses') count++;
        if (timeframeFilter !== 'All Time') count++;
        if (startDate || endDate) count++;
        return count;
    }, [statusFilter, labelFilter, paymentMethodFilter, paymentStatusFilter, timeframeFilter, startDate, endDate]);

    const statusOptions = ['All Statuses', 'Pending', 'Processing', 'Shipping', 'Delivered', 'Cancelled', 'Refunded'];
    const paymentMethodOptions = ['All Methods', 'QR', 'COD'];
    const paymentStatusOptions = ['All Statuses', 'Paid', 'Unpaid', 'Partial', 'Refunded'];
    const timeframeOptions = ['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'This Year'];

    useEffect(() => {
        fetchOrders();

        const handleClickOutside = (event) => {
            if (mainFilterRef.current && !mainFilterRef.current.contains(event.target)) {
                setIsMainFilterOpen(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
                setStatusEditId(null);
                setPayStatusEditId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const clearAllFilters = () => {
        setStatusFilter('All Statuses');
        setLabelFilter('All Labels');
        setPaymentMethodFilter('All Methods');
        setPaymentStatusFilter('All Statuses');
        setTimeframeFilter('All Time');
        setStartDate(null);
        setEndDate(null);
        setActiveDropdown(null);
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/orders`, { withCredentials: true });
            setOrders(response.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
            setLoading(false);
        }
    };

    // Extract unique labels
    const availableLabels = useMemo(() => {
        const labels = new Set();
        orders.forEach(order => {
            if (order.labels && Array.isArray(order.labels)) {
                order.labels.forEach(l => {
                    if (l.text) labels.add(l.text);
                });
            }
        });
        return ['All Labels', ...Array.from(labels)];
    }, [orders]);

    // Track last filter state to avoid resetting page on data updates
    const lastFilters = useRef('');

    useEffect(() => {
        const currentFilterString = JSON.stringify({ searchTerm, statusFilter, labelFilter, paymentMethodFilter, paymentStatusFilter, timeframeFilter, startDate, endDate });
        const filtersChanged = lastFilters.current !== currentFilterString;
        lastFilters.current = currentFilterString;

        const filtered = orders.filter(order => {
            // 1. Search filter
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = (
                order.orderId?.toLowerCase().includes(searchLower) ||
                order.customerDetails?.name?.toLowerCase().includes(searchLower) ||
                order.customerDetails?.email?.toLowerCase().includes(searchLower) ||
                order.customerDetails?.phone?.toLowerCase().includes(searchLower)
            );

            // 2. Status filter
            const matchesStatus = statusFilter === 'All Statuses' || order.status === statusFilter.toLowerCase();

            // 3. Label filter
            const matchesLabel = labelFilter === 'All Labels' ||
                (order.labels && order.labels.some(l => l.text === labelFilter));

            // 4. Payment Method filter
            const matchesMethod = paymentMethodFilter === 'All Methods' ||
                order.customerDetails?.paymentTerms === paymentMethodFilter;

            // 5. Payment Status filter
            const matchesPayStatus = paymentStatusFilter === 'All Statuses' ||
                getPaymentStatus(order.invoices) === paymentStatusFilter;

            // 6. Timeframe filter
            let matchesTimeframe = true;
            if (timeframeFilter !== 'All Time') {
                const now = new Date();
                const placedAt = new Date(order.placedOn);
                const diffTime = Math.abs(now - placedAt);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (timeframeFilter === 'Today') {
                    matchesTimeframe = placedAt.toDateString() === now.toDateString();
                } else if (timeframeFilter === 'Yesterday') {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    matchesTimeframe = placedAt.toDateString() === yesterday.toDateString();
                } else if (timeframeFilter === 'Last 7 Days') {
                    matchesTimeframe = diffDays <= 7;
                } else if (timeframeFilter === 'Last 30 Days') {
                    matchesTimeframe = diffDays <= 30;
                } else if (timeframeFilter === 'Last 3 Months') {
                    matchesTimeframe = diffDays <= 90;
                } else if (timeframeFilter === 'This Year') {
                    matchesTimeframe = placedAt.getFullYear() === now.getFullYear();
                }
            }

            // 7. Date Range filter
            let matchesDateRange = true;
            if (startDate || endDate) {
                const orderDate = new Date(order.placedOn);
                orderDate.setHours(0, 0, 0, 0);

                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (orderDate < start) matchesDateRange = false;
                }

                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (orderDate > end) matchesDateRange = false;
                }
            }

            return matchesSearch && matchesStatus && matchesLabel &&
                matchesMethod && matchesPayStatus &&
                matchesTimeframe && matchesDateRange;
        });

        setFilteredOrders(filtered);
        if (filtersChanged) {
            setCurrentPage(1);
        }
    }, [orders, searchTerm, statusFilter, labelFilter, paymentMethodFilter, paymentStatusFilter, timeframeFilter, startDate, endDate]);

    const sortedOrders = useMemo(() => {
        let sortableOrders = [...filteredOrders];
        if (sortConfig.key !== null) {
            sortableOrders.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];
                if (sortConfig.key.includes('.')) {
                    const keys = sortConfig.key.split('.');
                    valA = keys.reduce((obj, k) => obj?.[k], a);
                    valB = keys.reduce((obj, k) => obj?.[k], b);
                }
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableOrders;
    }, [filteredOrders, sortConfig]);

    const currentItems = sortedOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getPaymentStatus = (invoices) => {
        if (!invoices || invoices.length === 0) return 'Unpaid';

        const statuses = invoices.map(inv => inv.status);

        if (statuses.every(s => s === 'Refunded')) return 'Refunded';
        if (statuses.every(s => s === 'Paid')) return 'Paid';
        if (statuses.every(s => s === 'Unpaid')) return 'Unpaid';

        // If there's any 'Partial' or a mix of Paid/Unpaid, return 'Partial'
        return 'Partial';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleDelete = (e, order) => {
        e.stopPropagation();
        setOrderToDelete(order);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (orderToDelete) {
            // Single delete
            try {
                await axios.delete(`${API_URL}/api/orders/${orderToDelete._id}`, { withCredentials: true });
                toast.success(`Order ${orderToDelete.orderId} deleted`);
                setOrders(prevOrders => prevOrders.filter(o => o._id !== orderToDelete._id));
                setOrderToDelete(null);
                setIsDeleteModalOpen(false);
            } catch (error) {
                console.error('Error deleting order:', error);
                toast.error('Failed to delete order');
            }
        } else {
            // Bulk delete
            try {
                const ids = Array.from(selectedOrders);
                await axios.post(`${API_URL}/api/orders/bulk-delete`, { ids }, { withCredentials: true });
                toast.success(`${ids.length} orders deleted`);
                setOrders(prevOrders => prevOrders.filter(o => !ids.includes(o._id)));
                setSelectedOrders(new Set());
                setIsAllSelected(false);
                setIsDeleteModalOpen(false);
            } catch (error) {
                console.error('Error bulk deleting orders:', error);
                toast.error('Failed to delete orders');
            }
        }
    };

    const handleBulkDelete = () => {
        if (selectedOrders.size === 0) return;
        setOrderToDelete(null);
        setIsDeleteModalOpen(true);
    };

    const handleBulkUpdateStatus = async (status, type = 'order') => {
        console.log(`Bulk update triggered: status=${status}, type=${type}, selected=${selectedOrders.size}`);
        if (selectedOrders.size === 0) return;
        try {
            const ids = Array.from(selectedOrders);
            console.log('IDs for bulk update:', ids);
            const response = await axios.post(`${API_URL}/api/orders/bulk-status`, { ids, status, type }, { withCredentials: true });
            console.log('Bulk update response:', response.data);

            // Local state update
            if (type === 'payment') {
                setOrders(prevOrders => prevOrders.map(order =>
                    ids.includes(order._id)
                        ? { ...order, invoices: order.invoices?.map(inv => ({ ...inv, status })) || [{ status }], status: status === 'Refunded' ? 'refunded' : order.status }
                        : order
                ));
            } else {
                setOrders(prevOrders => prevOrders.map(order =>
                    ids.includes(order._id) ? { ...order, status: status.toLowerCase() } : order
                ));
            }

            toast.success(`Updated ${ids.length} orders to ${status}`);
            setSelectedOrders(new Set());
            setIsAllSelected(false);
        } catch (error) {
            console.error('Error bulk updating status:', error);
            toast.error(error.response?.data?.msg || 'Failed to update orders');
        }
    };

    const handleOrderUpdate = (updatedOrder) => {
        setOrders(prevOrders => prevOrders.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    };

    const updateOrderStatus = async (order, newStatus) => {
        try {
            const response = await axios.put(
                `${API_URL}/api/orders/${order._id}`,
                { status: newStatus.toLowerCase() },
                { withCredentials: true }
            );
            handleOrderUpdate(response.data);
            toast.success(`Order status updated to ${newStatus}`);
            setStatusEditId(null);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const updatePayStatus = async (order, newStatus) => {
        try {

            // Follow the same logic as OrderDetailsModal for updating invoices
            const updatedInvoices = order.invoices && order.invoices.length > 0
                ? order.invoices.map(inv => ({ ...inv, status: newStatus }))
                : [{ status: newStatus }];

            const updateData = { invoices: updatedInvoices };

            // If payment status is set to Refunded, automatically set order status to refunded
            if (newStatus === 'Refunded') {
                updateData.status = 'refunded';
            }

            const response = await axios.put(
                `${API_URL}/api/orders/${order._id}`,
                updateData,
                { withCredentials: true }
            );
            handleOrderUpdate(response.data);
            toast.success(`Payment status updated to ${newStatus}`);
            setPayStatusEditId(null);
        } catch (error) {
            console.error('Error updating pay status:', error);
            toast.error(error.response?.data?.message || 'Failed to update payment status');
        }
    };

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedOrders(new Set());
            setIsAllSelected(false);
        } else {
            const allIds = currentItems.map(order => order._id);
            setSelectedOrders(new Set(allIds));
            setIsAllSelected(true);
        }
    };

    const toggleSelectOrder = (e, orderId) => {
        e.stopPropagation();
        const newSelected = new Set(selectedOrders);
        if (newSelected.has(orderId)) {
            newSelected.delete(orderId);
        } else {
            newSelected.add(orderId);
        }
        setSelectedOrders(newSelected);
    };

    // Keep "Select All" checkbox in sync with current page items
    useEffect(() => {
        if (currentItems.length === 0) {
            setIsAllSelected(false);
            return;
        }
        const allIds = currentItems.map(order => order._id);
        const allOnPageSelected = allIds.every(id => selectedOrders.has(id));
        setIsAllSelected(allOnPageSelected);
    }, [currentItems, selectedOrders]);

    const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    const clearDateRange = (e) => {
        e.stopPropagation();
        setStartDate(null);
        setEndDate(null);
    };

    if (loading && orders.length === 0) {
        return <div className="loading-fade">Loading orders...</div>;
    }

    return (
        <div className="orders-page" ref={dropdownRef}>
            <div className="orders-page-header">
                <div className="header-title-section">
                    <h2>Orders Management</h2>
                    <p className="page-description">Manage, filter and track all customer orders efficiently.</p>
                </div>
            </div>

            <div className="filter-card">
                <div className="actions-row">
                    <div className="orders-search-container">
                        <FaSearch className="orders-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by order ID, name, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="orders-search-input"
                        />
                    </div>

                    <div className="filter-actions-group">
                        <div className="main-filter-container" ref={mainFilterRef}>
                            <button
                                className={`main-filter-btn ${isMainFilterOpen ? 'active' : ''} ${activeFiltersCount > 0 ? 'has-active-filters' : ''}`}
                                onClick={() => setIsMainFilterOpen(!isMainFilterOpen)}
                            >
                                <div className="btn-content">
                                    <FaFilter className="filter-icon" />
                                    <span>Filter</span>
                                    {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
                                </div>
                                <FaChevronDown className={`chevron-icon ${isMainFilterOpen ? 'rotate' : ''}`} />
                            </button>

                            {isMainFilterOpen && (
                                <div className="main-filter-dropdown">
                                    <div className="filter-dropdown-header">
                                        <div className="header-text">
                                            <h3>Filters</h3>
                                            <p>{activeFiltersCount} active filters</p>
                                        </div>
                                        {activeFiltersCount > 0 && (
                                            <button className="clear-filters-link" onClick={clearAllFilters}>
                                                Clear All
                                            </button>
                                        )}
                                    </div>

                                    <div className="filter-grid-container">
                                        {/* Status Filter */}
                                        <div className="filter-item">
                                            <span className="filter-label">Status</span>
                                            <div className={`dropdown-box ${activeDropdown === 'status' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleDropdown('status'); }}>
                                                <FaFilter className="dropdown-icon" />
                                                <span>{statusFilter}</span>
                                                <FaChevronDown className="chevron-icon" />
                                                {activeDropdown === 'status' && (
                                                    <div className="dropdown-menu">
                                                        {statusOptions.map(opt => (
                                                            <div key={opt} className={`dropdown-option ${statusFilter === opt ? 'selected' : ''}`}
                                                                onClick={(e) => { e.stopPropagation(); setStatusFilter(opt); setActiveDropdown(null); }}>
                                                                {opt} {statusFilter === opt && <FaCheck className="check-icon" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Label Filter */}
                                        <div className="filter-item">
                                            <span className="filter-label">Label</span>
                                            <div className={`dropdown-box ${activeDropdown === 'label' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleDropdown('label'); }}>
                                                <FaTag className="dropdown-icon" />
                                                <div className="label-pills">
                                                    {labelFilter === 'All Labels' ? (<span>All Labels</span>) : (<span className="pill-urgent">{labelFilter}</span>)}
                                                </div>
                                                <FaChevronDown className="chevron-icon" />
                                                {activeDropdown === 'label' && (
                                                    <div className="dropdown-menu">
                                                        {availableLabels.map(opt => (
                                                            <div key={opt} className={`dropdown-option ${labelFilter === opt ? 'selected' : ''}`}
                                                                onClick={(e) => { e.stopPropagation(); setLabelFilter(opt); setActiveDropdown(null); }}>
                                                                {opt} {labelFilter === opt && <FaCheck className="check-icon" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Payment Method Filter */}
                                        <div className="filter-item">
                                            <span className="filter-label">Payment Method</span>
                                            <div className={`dropdown-box ${activeDropdown === 'method' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleDropdown('method'); }}>
                                                <FaCreditCard className="dropdown-icon" />
                                                <span>{paymentMethodFilter}</span>
                                                <FaChevronDown className="chevron-icon" />
                                                {activeDropdown === 'method' && (
                                                    <div className="dropdown-menu">
                                                        {paymentMethodOptions.map(opt => (
                                                            <div key={opt} className={`dropdown-option ${paymentMethodFilter === opt ? 'selected' : ''}`}
                                                                onClick={(e) => { e.stopPropagation(); setPaymentMethodFilter(opt); setActiveDropdown(null); }}>
                                                                {opt} {paymentMethodFilter === opt && <FaCheck className="check-icon" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Payment Status Filter */}
                                        <div className="filter-item">
                                            <span className="filter-label">Payment Status</span>
                                            <div className={`dropdown-box ${activeDropdown === 'paystatus' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleDropdown('paystatus'); }}>
                                                <FaWallet className="dropdown-icon" />
                                                <span>{paymentStatusFilter}</span>
                                                <FaChevronDown className="chevron-icon" />
                                                {activeDropdown === 'paystatus' && (
                                                    <div className="dropdown-menu">
                                                        {paymentStatusOptions.map(opt => (
                                                            <div key={opt} className={`dropdown-option ${paymentStatusFilter === opt ? 'selected' : ''}`}
                                                                onClick={(e) => { e.stopPropagation(); setPaymentStatusFilter(opt); setActiveDropdown(null); }}>
                                                                {opt} {paymentStatusFilter === opt && <FaCheck className="check-icon" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timeframe Filter */}
                                        <div className="filter-item">
                                            <span className="filter-label">Timeframe</span>
                                            <div className={`dropdown-box ${activeDropdown === 'timeframe' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleDropdown('timeframe'); }}>
                                                <FaHistory className="dropdown-icon" />
                                                <span>{timeframeFilter}</span>
                                                <FaChevronDown className="chevron-icon" />
                                                {activeDropdown === 'timeframe' && (
                                                    <div className="dropdown-menu">
                                                        {timeframeOptions.map(opt => (
                                                            <div key={opt} className={`dropdown-option ${timeframeFilter === opt ? 'selected' : ''}`}
                                                                onClick={(e) => { e.stopPropagation(); setTimeframeFilter(opt); setActiveDropdown(null); }}>
                                                                {opt} {timeframeFilter === opt && <FaCheck className="check-icon" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Advanced Date Range */}
                                        <div className="filter-item">
                                            <span className="filter-label">Date Range</span>
                                            <div className={`advanced-date-picker-trigger ${activeDropdown === 'daterange' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleDropdown('daterange'); }}>
                                                <FaCalendarAlt className="date-icon-inline" />
                                                <span>
                                                    {startDate && endDate
                                                        ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                                                        : 'Select Range'}
                                                </span>
                                                <FaChevronDown className="chevron-icon" />

                                                {activeDropdown === 'daterange' && (
                                                    <div className="advanced-date-picker-popover" onClick={(e) => e.stopPropagation()}>
                                                        <DatePicker
                                                            selected={startDate}
                                                            onChange={(update) => {
                                                                const [start, end] = update;
                                                                setStartDate(start);
                                                                setEndDate(end);
                                                            }}
                                                            startDate={startDate}
                                                            endDate={endDate}
                                                            selectsRange
                                                            monthsShown={window.innerWidth > 768 ? 2 : 1}
                                                            showPreviousMonths
                                                            maxDate={new Date()}
                                                            inline
                                                        />
                                                        <div className="date-picker-footer">
                                                            <div className="time-select-row">
                                                                <div className="time-block">
                                                                    <span className="time-label">START</span>
                                                                    <div className="time-input-group">
                                                                        <input type="text" className="time-input" defaultValue="10" />
                                                                        <span className="time-divider">:</span>
                                                                        <input type="text" className="time-input" defaultValue="00" />
                                                                        <select className="ampm-select">
                                                                            <option>AM</option>
                                                                            <option>PM</option>
                                                                        </select>
                                                                    </div>
                                                                    <span className="time-date-label">{startDate?.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</span>
                                                                </div>
                                                                <div className="time-block">
                                                                    <span className="time-label">END</span>
                                                                    <div className="time-input-group">
                                                                        <input type="text" className="time-input" defaultValue="06" />
                                                                        <span className="time-divider">:</span>
                                                                        <input type="text" className="time-input" defaultValue="00" />
                                                                        <select className="ampm-select">
                                                                            <option>AM</option>
                                                                            <option selected>PM</option>
                                                                        </select>
                                                                    </div>
                                                                    <span className="time-date-label">{endDate?.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</span>
                                                                </div>
                                                            </div>
                                                            <div className="footer-actions">
                                                                <div className="range-summary">
                                                                    {startDate && endDate && (
                                                                        <>
                                                                            <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, 10:00 AM</span>
                                                                            <span className="arrow">→</span>
                                                                            <span>{endDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, 06:00 PM</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="footer-buttons">
                                                                    <button className="btn-cancel" onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); }}>Cancel</button>
                                                                    <button className="btn-apply" onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); }}>Apply</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="filter-dropdown-footer">
                                        <button className="btn-apply-filters" onClick={() => setIsMainFilterOpen(false)}>
                                            Show {filteredOrders.length} Orders
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="btn-group">
                            <button className="export-excel-btn">
                                <FaFileExcel className="excel-icon" />
                                <span>Export</span>
                            </button>
                            <button className="create-order-btn">
                                <FaPlus className="plus-icon" />
                                <span>Create Order</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedOrders.size > 0 && (
                <div className="bulk-actions-bar">
                    <div className="bulk-actions-left">
                        <span className="bulk-count">{selectedOrders.size} selected</span>
                        <button className="deselect-all-btn" onClick={() => { setSelectedOrders(new Set()); setIsAllSelected(false); }}>
                            <FaTimes /> Deselect All
                        </button>
                    </div>
                    <div className="bulk-actions-right">
                        <div className="bulk-action-group">
                            <span className="group-label">Mark As:</span>
                            <select
                                className="bulk-select-input"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        handleBulkUpdateStatus(val);
                                        e.target.value = "";
                                    }
                                }}
                            >
                                <option value="">Update Status...</option>
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipping">Shipping</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Refunded">Refunded</option>
                            </select>
                        </div>
                        <div className="bulk-divider"></div>
                        <div className="bulk-action-group">
                            <span className="group-label">Payment:</span>
                            <select
                                className="bulk-select-input"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        handleBulkUpdateStatus(val, 'payment');
                                        e.target.value = "";
                                    }
                                }}
                            >
                                <option value="">Set Payment...</option>
                                <option value="Paid">Paid</option>
                                <option value="Unpaid">Unpaid</option>
                                <option value="Partial">Partial</option>
                                <option value="Refunded">Refunded</option>
                            </select>
                        </div>
                        <div className="bulk-divider"></div>
                        <button className="bulk-delete-btn" onClick={handleBulkDelete}>
                            <FaTrash /> Delete
                        </button>
                    </div>
                </div>
            )}

            <div className="orders-table-container">
                <div className="orders-table-wrapper">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th className="checkbox-column">
                                    <div className="header-checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            className="custom-checkbox"
                                            checked={isAllSelected && currentItems.length > 0}
                                            onChange={toggleSelectAll}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="hash-symbol">#</span>
                                    </div>
                                </th>
                                <th onClick={() => requestSort('orderId')} className="sortable-header">
                                    Order ID <span className="sort-icon-group">
                                        <FaArrowUp className={`sort-icon ${sortConfig.key === 'orderId' && sortConfig.direction === 'ascending' ? 'active' : ''}`} />
                                        <FaArrowDown className={`sort-icon ${sortConfig.key === 'orderId' && sortConfig.direction === 'descending' ? 'active' : ''}`} />
                                    </span>
                                </th>
                                <th onClick={() => requestSort('customerDetails.name')} className="sortable-header">
                                    Customer <span className="sort-icon-group">
                                        <FaArrowUp className={`sort-icon ${sortConfig.key === 'customerDetails.name' && sortConfig.direction === 'ascending' ? 'active' : ''}`} />
                                        <FaArrowDown className={`sort-icon ${sortConfig.key === 'customerDetails.name' && sortConfig.direction === 'descending' ? 'active' : ''}`} />
                                    </span>
                                </th>
                                <th onClick={() => requestSort('payment.total')} className="sortable-header">
                                    Amount <span className="sort-icon-group">
                                        <FaArrowUp className={`sort-icon ${sortConfig.key === 'payment.total' && sortConfig.direction === 'ascending' ? 'active' : ''}`} />
                                        <FaArrowDown className={`sort-icon ${sortConfig.key === 'payment.total' && sortConfig.direction === 'descending' ? 'active' : ''}`} />
                                    </span>
                                </th>
                                <th onClick={() => requestSort('status')} className="sortable-header">
                                    Order Status <span className="sort-icon-group">
                                        <FaArrowUp className={`sort-icon ${sortConfig.key === 'status' && sortConfig.direction === 'ascending' ? 'active' : ''}`} />
                                        <FaArrowDown className={`sort-icon ${sortConfig.key === 'status' && sortConfig.direction === 'descending' ? 'active' : ''}`} />
                                    </span>
                                </th>
                                <th>Pay Status</th>
                                <th onClick={() => requestSort('placedOn')} className="sortable-header">
                                    Date <span className="sort-icon-group">
                                        <FaArrowUp className={`sort-icon ${sortConfig.key === 'placedOn' && sortConfig.direction === 'ascending' ? 'active' : ''}`} />
                                        <FaArrowDown className={`sort-icon ${sortConfig.key === 'placedOn' && sortConfig.direction === 'descending' ? 'active' : ''}`} />
                                    </span>
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((order, index) => (
                                    <tr key={order._id} className={`order-row ${selectedOrders.has(order._id) ? 'row-selected' : ''}`} onClick={() => setSelectedOrder(order)}>
                                        <td className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                                            <div className="cell-checkbox-wrapper">
                                                <input
                                                    type="checkbox"
                                                    className="custom-checkbox"
                                                    checked={selectedOrders.has(order._id)}
                                                    onChange={(e) => toggleSelectOrder(e, order._id)}
                                                />
                                                <span className="row-number">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                            </div>
                                        </td>
                                        <td className="text-bold">{order.orderId}</td>
                                        <td>
                                            <div className="customer-info">
                                                <span className="customer-name">{order.customerDetails?.name || 'Guest'}</span>
                                                <span className="customer-phone" style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.customerDetails?.phone}</span>
                                            </div>
                                        </td>
                                        <td>Rs. {order.payment?.total?.toFixed(2) || '0.00'}</td>
                                        <td>
                                            <div className="status-badge-container"
                                                onClick={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => e.stopPropagation()}
                                            >
                                                <span
                                                    className={`ord-status-badge ord-status-${order.status?.toLowerCase()} clickable-status`}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        setStatusEditId(statusEditId === order._id ? null : order._id);
                                                    }}
                                                >
                                                    {order.status}
                                                    <FaChevronDown className="status-chevron" />
                                                </span>
                                                {statusEditId === order._id && (
                                                    <div className="status-dropdown-menu">
                                                        {statusOptions.filter(opt => opt !== 'All Statuses').map(opt => (
                                                            <div
                                                                key={opt}
                                                                className={`status-dropdown-option ${order.status?.toLowerCase() === opt.toLowerCase() ? 'selected' : ''}`}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    updateOrderStatus(order, opt);
                                                                }}
                                                            >
                                                                {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="status-badge-container"
                                                onClick={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => e.stopPropagation()}
                                            >
                                                <span
                                                    className={`ord-status-badge ord-status-${getPaymentStatus(order.invoices).toLowerCase()} clickable-status`}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        setPayStatusEditId(payStatusEditId === order._id ? null : order._id);
                                                    }}
                                                >
                                                    {getPaymentStatus(order.invoices)}
                                                    <FaChevronDown className="status-chevron" />
                                                </span>
                                                {payStatusEditId === order._id && (
                                                    <div className="status-dropdown-menu">
                                                        {paymentStatusOptions.filter(opt => opt !== 'All Statuses').map(opt => (
                                                            <div
                                                                key={opt}
                                                                className={`status-dropdown-option ${getPaymentStatus(order.invoices) === opt ? 'selected' : ''}`}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    updatePayStatus(order, opt);
                                                                }}
                                                            >
                                                                {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>{formatDate(order.placedOn)}</td>
                                        <td className="actions-cell">
                                            <div className="actions-wrapper">
                                                <button className="edit-btn" onClick={() => setSelectedOrder(order)}><FaEdit /></button>
                                                <button className="delete-btn" onClick={(e) => handleDelete(e, order)}><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="8" className="no-data-cell"><div className="no-data-content"><FaInbox className="no-data-icon" /><span>No orders found</span></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {sortedOrders.length > 0 && (
                    <div className="table-footer">
                        <div className="showing-results">
                            Showing <span className="text-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-bold">{Math.min(currentPage * itemsPerPage, sortedOrders.length)}</span> of <span className="text-bold">{sortedOrders.length}</span> results
                        </div>
                        <div className="pagination-controls">
                            <button className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}><FaChevronLeft /></button>
                            <button className="pagination-btn active">{currentPage}</button>
                            <button className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}><FaChevronRight /></button>
                        </div>
                    </div>
                )}
            </div>

            {selectedOrder && (
                <OrderDetailsModal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} order={selectedOrder} onOrderUpdate={handleOrderUpdate} />
            )}

            {isDeleteModalOpen && (
                <DeleteConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => { setIsDeleteModalOpen(false); setOrderToDelete(null); }}
                    onConfirm={confirmDelete}
                    itemName={orderToDelete ? orderToDelete.orderId : `${selectedOrders.size} orders`}
                    itemType="order"
                />
            )}
        </div>
    );
};

export default Orders;
