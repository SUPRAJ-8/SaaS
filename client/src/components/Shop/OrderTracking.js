import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaBox, FaTruck, FaCheckCircle, FaUndo, FaTimesCircle, FaClock, FaShoppingBag, FaPrint, FaUser, FaShoppingCart, FaShieldAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import API_URL from '../../apiConfig';
import axios from 'axios';
import { getShopPath, resolveImageUrl } from '../../themeUtils';
import './OrderTracking.css';

const OrderTracking = () => {
    const { orderId: urlOrderId } = useParams();
    const navigate = useNavigate();
    const [orderIdInput, setOrderIdInput] = useState(urlOrderId || '');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currency, setCurrency] = useState({ symbol: 'NPR', position: 'before' });
    const [expandedSections, setExpandedSections] = useState({ summary: true, items: true });

    useEffect(() => {
        const settings = localStorage.getItem('storeSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            setCurrency({
                symbol: parsed.currencySymbol || 'NPR',
                position: parsed.currencyPosition || 'before'
            });
        }

        // Auto-fetch if orderId is in URL
        if (urlOrderId) {
            fetchOrder(urlOrderId);
        }
    }, [urlOrderId]);

    const fetchOrder = async (id) => {
        setLoading(true);
        setError('');
        try {
            // Subdomain Detection for header (v1.0.3)
            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            let subdomain = null;

            if (hostname.endsWith('.localhost')) subdomain = parts[0];
            else if (hostname.endsWith('.nepostore.xyz')) subdomain = parts[0];
            else if (parts.length > 2) subdomain = parts[0];

            const config = { headers: {} };

            if (subdomain && subdomain !== 'app' && subdomain !== 'www' && subdomain !== 'localhost' && subdomain !== 'api') {
                config.headers['x-subdomain'] = subdomain;
            }

            const response = await axios.get(`${API_URL}/api/orders/track/${id}`, config);
            setOrder(response.data);
        } catch (err) {
            console.error('Error fetching order:', err);
            const errorMsg = err.response?.data?.msg || err.response?.data?.error || 'Failed to fetch order details. Please try again.';
            setError(errorMsg);
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!orderIdInput.trim()) {
            setError('Please provide an Order ID.');
            return;
        }
        fetchOrder(orderIdInput.trim());
    };

    // Helper to format currency
    const formatPrice = (price) => {
        const formatted = Number(price || 0).toLocaleString();
        return currency.position === 'before' ? `${currency.symbol} ${formatted}` : `${formatted} ${currency.symbol}`;
    };

    // Helper to get status details
    const getStatusStep = (status) => {
        const steps = [
            { id: 'pending', label: 'Order Placed', icon: <FaShoppingBag /> },
            { id: 'processing', label: 'Processing', icon: <FaBox /> },
            { id: 'shipping', label: 'Out for Delivery', icon: <FaTruck /> },
            { id: 'delivered', label: 'Delivered', icon: <FaCheckCircle /> }
        ];

        if (status === 'cancelled') return { label: 'Cancelled', icon: <FaTimesCircle />, color: '#e74c3c' };
        if (status === 'refunded') return { label: 'Refunded', icon: <FaUndo />, color: '#7f8c8d' };

        const currentIndex = steps.findIndex(s => s.id === status);
        return { steps, currentIndex };
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handlePrint = () => {
        window.print();
    };

    const statusInfo = order ? getStatusStep(order.status) : null;

    return (
        <div className="order-tracking-container">
            <div className="order-tracking-content">
                <div className="tracking-header">
                    <h1>Track Your Order</h1>
                    <p>Enter your Order ID to see real-time updates on your package journey.</p>
                </div>

                <div className="search-card-wrapper">
                    <form className="tracking-search-form" onSubmit={handleSearch}>
                        <div className="search-form-label">Order ID / Tracking ID</div>
                        <div className="search-input-group">
                            <div className="search-input-box">
                                <FaSearch className="inner-search-icon" />
                                <input
                                    type="text"
                                    placeholder="ORD-1014"
                                    value={orderIdInput}
                                    onChange={(e) => setOrderIdInput(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="track-submit-btn" disabled={loading}>
                                {loading ? 'Searching...' : <>Track Order <span className="arrow">→</span></>}
                            </button>
                        </div>
                    </form>
                </div>

                {error && <div className="tracking-error-notice">{error}</div>}

                {order && (
                    <div className="order-result-layout animate-fade-in">
                        <div className="main-tracking-card">
                            <div className="tracking-card-header">
                                <div className="id-display">
                                    <span className="small-label">ORDER ID / TRACKING ID</span>
                                    <h2 className="big-id">#{order.orderId}</h2>
                                </div>
                                <div className="header-meta">
                                    <div className={`status-tag ${order.status}`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </div>
                                    <button className="print-action-btn" onClick={handlePrint} title="Print Order" aria-label="Print Order">
                                        <FaPrint size={18} style={{ display: 'block' }} />
                                        <span style={{ fontSize: '12px', marginLeft: '5px' }}>Print</span>
                                    </button>
                                </div>
                            </div>

                            <div className="stepper-section">
                                <div className="stepper-line-bg"></div>
                                <div className={`stepper-progress-fill status-${order.status}`}></div>
                                <div className="stepper-steps-row">
                                    {statusInfo.steps.map((step, index) => {
                                        const isPast = index < statusInfo.currentIndex;
                                        const isCurrent = index === statusInfo.currentIndex;
                                        const isCompleted = index <= statusInfo.currentIndex;

                                        return (
                                            <div key={step.id} className={`track-step ${isCompleted ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                                                <div className="step-point-container">
                                                    <div className="step-circle">
                                                        {step.icon}
                                                    </div>
                                                </div>
                                                <div className="step-text-content">
                                                    <div className="step-name">{step.label}</div>
                                                    {isCurrent && (
                                                        <div className="step-timestamp">
                                                            {new Date(order.updatedOn || order.placedOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            <br />
                                                            {new Date(order.updatedOn || order.placedOn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="expandable-section">
                                <div className="section-trigger" onClick={() => toggleSection('summary')}>
                                    <div className="trigger-left">
                                        <FaUser className="trigger-icon" />
                                        <span>Customer & Order Summary</span>
                                    </div>
                                    {expandedSections.summary ? <FaChevronUp /> : <FaChevronDown />}
                                </div>

                                {expandedSections.summary && (
                                    <div className="section-content-grid">
                                        <div className="grid-col">
                                            <h4>CUSTOMER DETAILS</h4>
                                            <div className="info-pair">
                                                <span className="key">Name:</span>
                                                <span className="val">{order.customerName}</span>
                                            </div>
                                            <div className="info-pair">
                                                <span className="key">Placed On:</span>
                                                <span className="val">{new Date(order.placedOn).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })}</span>
                                            </div>
                                            <div className="info-pair">
                                                <span className="key">Email:</span>
                                                <span className="val">{order.customerEmail || 'N/A'}</span>
                                            </div>
                                            <div className="info-pair">
                                                <span className="key">Phone:</span>
                                                <span className="val">{order.customerPhone || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="grid-col">
                                            <h4>ORDER SUMMARY</h4>
                                            <div className="info-pair">
                                                <span className="key">Items:</span>
                                                <span className="val">{order.items.length}</span>
                                            </div>
                                            <div className="info-pair">
                                                <span className="key">Subtotal:</span>
                                                <span className="val">{formatPrice(order.payment?.total)}</span>
                                            </div>
                                            <div className="info-pair">
                                                <span className="key">Shipping:</span>
                                                <span className="val status-free">Free</span>
                                            </div>
                                            <div className="info-pair grand">
                                                <span className="key">Total Amount:</span>
                                                <span className="val primary">{formatPrice(order.payment?.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="expandable-section">
                                <div className="section-trigger" onClick={() => toggleSection('items')}>
                                    <div className="trigger-left">
                                        <FaShoppingCart className="trigger-icon" />
                                        <span>Order Items</span>
                                    </div>
                                    {expandedSections.items ? <FaChevronUp /> : <FaChevronDown />}
                                </div>

                                {expandedSections.items && (
                                    <div className="section-content-table">
                                        <div className="table-header-row">
                                            <div className="th-item">ITEM</div>
                                            <div className="th-qty">QUANTITY</div>
                                            <div className="th-price">PRICE</div>
                                            <div className="th-total">TOTAL</div>
                                        </div>
                                        <div className="table-body">
                                            {(order.items || []).map((item, idx) => (
                                                <div key={idx} className="table-item-row">
                                                    <div className="td-item">
                                                        <div className="item-info-meta">
                                                            <div className="name">{item.name}</div>
                                                            <div className="variant">{item.variant}</div>
                                                        </div>
                                                    </div>
                                                    <div className="td-qty">{item.quantity}</div>
                                                    <div className="td-price">{formatPrice(item.price)}</div>
                                                    <div className="td-total bold">{formatPrice(item.price * item.quantity)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="tracking-card-footer">
                                <div className="secure-tag">
                                    <FaShieldAlt className="shield-icon" />
                                    <span>SECURE PAYMENT PROCESSED</span>
                                </div>
                                <div className="footer-links">
                                    <a href="#" className="footer-link">Return Policy</a>
                                    <button className="footer-link-btn" onClick={handlePrint}>Download Invoice</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="page-help-footer">
                    <p>Having trouble? <a href="mailto:support@nepostore.xyz" className="primary-link">Contact Support</a></p>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
