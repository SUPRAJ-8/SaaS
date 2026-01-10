import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
    FaCalendarAlt, FaFilter, FaDownload, FaEllipsisV, FaChevronRight,
    FaArrowUp, FaArrowDown, FaChevronLeft, FaChartLine, FaShoppingBag, FaUsers,
    FaCheckCircle, FaTimesCircle, FaChevronDown, FaMoneyBillWave
} from 'react-icons/fa';

import API_URL from '../../apiConfig';
import './Analytics.css';

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30 Days');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [stats, setStats] = useState({
        revenue: 0,
        profit: 0,
        orders: 0,
        customers: 0,
        conversion: 0,
        revenueGrowth: 0,
        profitGrowth: 0,
        ordersGrowth: 0,
        customersGrowth: 0,
        conversionGrowth: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        completedGrowth: 0,
        cancelledGrowth: 0
    });

    const [salesData, setSalesData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    // Temp state for date picker before applying
    const [tempStartDate, setTempStartDate] = useState(null);
    const [tempEndDate, setTempEndDate] = useState(null);

    // Category data state
    const [categoryData, setCategoryData] = useState([
        // Initial mock data to avoid empty chart flash, or just empty
        { name: 'Loading...', value: 100 }
    ]);

    // Responsive months shown in date picker
    const [monthsShown, setMonthsShown] = useState(window.innerWidth < 1024 ? 1 : 2);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setMonthsShown(1);
            } else {
                setMonthsShown(2);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const params = {
                timeRange,
                startDate: startDate ? startDate.toISOString() : undefined,
                endDate: endDate ? endDate.toISOString() : undefined
            };

            const [statsRes, salesRes, productsRes, categoryRes] = await Promise.all([
                axios.get(`${API_URL}/api/analytics/stats`, { params, withCredentials: true }),
                axios.get(`${API_URL}/api/analytics/sales-chart`, { params, withCredentials: true }),
                axios.get(`${API_URL}/api/analytics/top-products`, { params, withCredentials: true }),
                axios.get(`${API_URL}/api/analytics/revenue-by-category`, { params, withCredentials: true })
            ]);

            setStats(statsRes.data);
            setSalesData(salesRes.data);
            setTopProducts(productsRes.data);
            // If we have category data, use it; otherwise fallback to empty to avoid showing mock data if actual data is 0
            if (categoryRes.data && categoryRes.data.length > 0) {
                setCategoryData(categoryRes.data);
            } else {
                setCategoryData([]);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange, startDate, endDate]);

    const handleApplyDateRange = () => {
        if (tempStartDate && tempEndDate) {
            setStartDate(tempStartDate);
            setEndDate(tempEndDate);
            setTimeRange('Custom');
            setActiveDropdown(null);
        }
    };

    const handlePillClick = (range) => {
        setTimeRange(range);
        setStartDate(null);
        setEndDate(null);
        setTempStartDate(null);
        setTempEndDate(null);
    };

    const getComparisonLabel = () => {
        switch (timeRange) {
            case 'All Time': return 'overall';
            case '30 Days': return 'vs prev 30 days';
            case '90 Days': return 'vs prev 90 days';
            case 'YTD': return 'vs prev period';
            default: return 'vs prev period';
        }

    };

    const StatCard = ({ title, value, growth, icon, colorClass }) => (
        <div className="analytics-stat-card-premium">
            <div className="stat-card-main">
                <div className={`stat-icon-box ${colorClass}`}>
                    {icon}
                </div>
                <div className="stat-info">
                    <h3>{title}</h3>
                    <p className="stat-value">{value}</p>
                </div>
            </div>
            <div className="stat-card-footer">
                <span className={`growth-indicator ${growth >= 0 ? 'up' : 'down'}`}>
                    {growth >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                    {Math.abs(growth)}%
                </span>
                <span className="footer-label">{getComparisonLabel()}</span>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="analytics-loading-container">
                <div className="analytics-loader"></div>
                <p>Analyzing your store data...</p>
            </div>
        );
    }

    return (
        <div className="analytics-page-premium">
            <div className="analytics-header-premium">
                <div className="header-left">
                    <div className="header-main-title">
                        <h1 className="page-title">Analytics</h1>
                        <p className="page-description">Deep dive into your store's performance and customer behavior.</p>
                    </div>
                </div>
                <div className="header-right">
                    <div className="time-range-segmented-control">
                        {['All Time', '30 Days', '90 Days', 'YTD'].map(range => (
                            <button
                                key={range}
                                className={`range-pill ${timeRange === range ? 'active' : ''}`}
                                onClick={() => handlePillClick(range)}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <div className={`advanced-date-picker-trigger ${activeDropdown === 'daterange' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'daterange' ? null : 'daterange'); }}>
                        <FaCalendarAlt className="date-icon" />
                        <span className="date-text">
                            {startDate && endDate
                                ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                                : 'Select Date Range'}
                        </span>
                        <FaChevronDown className="chevron-icon" />

                        {activeDropdown === 'daterange' && (
                            <div className="advanced-date-picker-popover" onClick={(e) => e.stopPropagation()}>
                                <DatePicker
                                    selected={tempStartDate}
                                    onChange={(update) => {
                                        const [start, end] = update;
                                        setTempStartDate(start);
                                        setTempEndDate(end);
                                    }}
                                    startDate={tempStartDate}
                                    endDate={tempEndDate}
                                    selectsRange
                                    monthsShown={monthsShown}
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
                                        </div>
                                        <div className="time-block">
                                            <span className="time-label">END</span>
                                            <div className="time-input-group">
                                                <input type="text" className="time-input" defaultValue="06" />
                                                <span className="time-divider">:</span>
                                                <input type="text" className="time-input" defaultValue="00" />
                                                <select className="ampm-select">
                                                    <option>AM</option>
                                                    <option defaultValue>PM</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="footer-actions">
                                        <button className="btn-cancel" onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); }}>Cancel</button>
                                        <button className="btn-apply" onClick={(e) => { e.stopPropagation(); handleApplyDateRange(); }}>Apply</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="export-report-btn">
                        <FaDownload />
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            <div className="analytics-stats-grid-premium">
                <StatCard
                    title="Total Revenue"
                    value={`Rs. ${(stats.revenue || 0).toLocaleString()}`}
                    growth={stats.revenueGrowth}
                    icon={<FaChartLine />}
                    colorClass="indigo"
                />
                <StatCard
                    title="Total Profit"
                    value={`Rs. ${(stats.profit || 0).toLocaleString()}`}
                    growth={stats.profitGrowth}
                    icon={<FaMoneyBillWave />}
                    colorClass="emerald"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.orders}
                    growth={stats.ordersGrowth}
                    icon={<FaShoppingBag />}
                    colorClass="pink"
                />
                <StatCard
                    title="Total Customers"
                    value={stats.customers}
                    growth={stats.customersGrowth}
                    icon={<FaUsers />}
                    colorClass="amber"
                />
                <StatCard
                    title="Avg. Conversion"
                    value={`${stats.conversion}%`}
                    growth={stats.conversionGrowth}
                    icon={<FaFilter />}
                    colorClass="blue"
                />
                <StatCard
                    title="Completed Orders"
                    value={stats.completedOrders}
                    growth={stats.completedGrowth}
                    icon={<FaCheckCircle />}
                    colorClass="indigo"
                />
                <StatCard
                    title="Cancelled Orders"
                    value={stats.cancelledOrders}
                    growth={stats.cancelledGrowth}
                    icon={<FaTimesCircle />}
                    colorClass="rose"
                />
            </div>


            <div className="analytics-charts-row">
                <div className="chart-card-premium sales-overview">
                    <div className="chart-header">
                        <h3>Sales & Orders Overview</h3>
                        <button className="chart-action-btn"><FaEllipsisV /></button>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                <Area type="monotone" dataKey="orders" stroke="#fb7185" strokeWidth={3} fill="none" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card-premium category-distribution">
                    <div className="chart-header">
                        <h3>Revenue by Category</h3>
                        <button className="chart-action-btn"><FaEllipsisV /></button>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="analytics-bottom-row">
                <div className="table-card-premium analytics-top-products">
                    <div className="card-header">
                        <div className="header-text">
                            <h3>Top Performing Products</h3>
                            <p className="card-subtitle">Deep analytics on your best selling inventory.</p>
                        </div>
                        <button className="see-all-premium-btn">
                            View All <FaChevronRight className="arrow-icon" />
                        </button>
                    </div>
                    <div className="table-wrapper">
                        <table className="premium-analytics-table">
                            <thead>
                                <tr>
                                    <th>PRODUCT</th>
                                    <th className="text-right">PRICE</th>
                                    <th className="text-right">SOLD</th>
                                    <th className="text-right">REVENUE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.length > 0 ? (
                                    topProducts.map((item, i) => (
                                        <tr key={i}>
                                            <td className="product-info-td">
                                                <div className="product-meta-cell">
                                                    <div className="product-img-box">
                                                        <img src={item.image} alt={item.name} />
                                                    </div>
                                                    <div className="product-text-details">
                                                        <div className="product-title-row">
                                                            <span className="p-name">{item.name}</span>
                                                            {item.badge && <span className={`p-badge ${item.badgeClass || ''}`}>{item.badge}</span>}
                                                        </div>
                                                        <span className="p-category">{item.category}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="price-td">Rs. {item.price.toLocaleString()}</td>
                                            <td className="sold-td">
                                                <div className="sold-info">
                                                    <span className="sold-count">{item.sold}</span>
                                                    <span className={`sold-growth ${item.isUp ? 'up' : 'down'}`}>
                                                        {item.isUp ? <FaArrowUp /> : <FaArrowDown />}
                                                        {item.growth}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="revenue-td">Rs. {item.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="no-data-cell">No top products found for this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-footer-pagination">
                        <span className="pagination-info">Showing 4 of 28 products</span>
                        <div className="pagination-arrows">
                            <button className="p-arrow-btn disabled"><FaChevronLeft /></button>
                            <button className="p-arrow-btn"><FaChevronRight /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
