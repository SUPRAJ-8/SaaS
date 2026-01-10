import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from './StatCard';
import { FaExternalLinkAlt, FaMoneyBillWave, FaShoppingCart, FaBoxOpen, FaPaintBrush, FaEye, FaUser, FaChevronRight } from 'react-icons/fa';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import API_URL from '../../apiConfig';
import OnboardingModal from './OnboardingModal';
import PricingModal from './PricingModal';
import { isToday, isThisMonth, isSameMonth, subMonths, startOfMonth, endOfMonth, startOfToday, subDays, isSameDay, formatDistanceToNow } from 'date-fns';
import './DashboardHome.css';

const DashboardHome = () => {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [productsCount, setProductsCount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpiTab, setKpiTab] = useState('All Time');
  const [chartType, setChartType] = useState('Both');
  const [processedChartData, setProcessedChartData] = useState([]);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userRes = await axios.get(`${API_URL}/auth/current_user`, { withCredentials: true });
        if (!userRes.data || !userRes.data.clientId) {
          console.log('⚠️ DashboardHome: No user or clientId found', userRes.data);
          setLoading(false);
          return;
        }
        setUser(userRes.data);
        console.log('📍 DashboardHome: User loaded', userRes.data.email);

        // Fetch client details using the safe endpoint
        try {
          // If populated by backend with either subdomain or custom domain, use it directly
          if (typeof userRes.data.clientId === 'object' && (userRes.data.clientId.subdomain || userRes.data.clientId.customDomain)) {
            console.log('✅ DashboardHome: Client data already populated');
            setClient(userRes.data.clientId);
          } else {
            console.log('🔄 DashboardHome: Fetching client data from my-store');
            const clientRes = await axios.get(`${API_URL}/api/store-settings/my-store`, { withCredentials: true });
            console.log('✅ DashboardHome: Client data fetched from my-store', clientRes.data?.subdomain);
            setClient(clientRes.data);
          }
        } catch (err) {
          console.error('❌ DashboardHome: Error fetching client info:', err);
        }

        // Onboarding/Pricing check
        if (!userRes.data.isOnboarded) {
          setShowOnboarding(true);
        } else if (!userRes.data.hasSelectedPlan) {
          setShowPricing(true);
        }

        // Real counts
        const productsRes = await axios.get(`${API_URL}/api/products`, { withCredentials: true });
        setProductsCount(productsRes.data?.length || 0);

        const ordersRes = await axios.get(`${API_URL}/api/orders`, { withCredentials: true });

        const fetchedOrders = ordersRes.data || [];
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Sync Chart Data with KPI Tab
  const chartDataDynamic = React.useMemo(() => {
    const now = new Date();
    const result = [];

    if (kpiTab === 'Daily') {
      // Show hourly breakdown for today (2-hour blocks for more detail)
      const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
      const today = now.toDateString();

      hours.forEach(h => {
        const filtered = orders.filter(o => {
          const od = new Date(o.placedOn);
          return od.toDateString() === today && od.getHours() >= h && od.getHours() < h + 2;
        });

        const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        result.push({
          name: label,
          Revenue: filtered.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + (o.payment?.total || 0), 0),
          Orders: filtered.length
        });
      });
    } else if (kpiTab === 'Monthly') {
      // Show all days of current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        const targetYear = d.getFullYear();
        const targetMonth = d.getMonth();
        const targetDay = d.getDate();

        const filtered = orders.filter(o => {
          const od = new Date(o.placedOn);
          return od.getFullYear() === targetYear && od.getMonth() === targetMonth && od.getDate() === targetDay;
        });

        result.push({
          name: i.toString(),
          Revenue: filtered.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + (o.payment?.total || 0), 0),
          Orders: filtered.length
        });
      }
    } else {
      // All Time: Show last 12 months for a complete year view
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.getMonth();
        const year = d.getFullYear();
        const filtered = orders.filter(o => {
          const od = new Date(o.placedOn);
          return od.getMonth() === month && od.getFullYear() === year;
        });
        result.push({
          name: monthNames[month],
          Revenue: filtered.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + (o.payment?.total || 0), 0),
          Orders: filtered.length
        });
      }
    }

    // Use demo data if the calculated result for this specific view is empty/zero
    const hasAnyActivity = result.some(item => item.Revenue > 0 || item.Orders > 0);
    if (!hasAnyActivity) {
      if (kpiTab === 'Daily') {
        const demo = [];
        const hours = ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM'];
        const revValues = [0, 400, 1200, 2800, 1900, 2400];
        const ordValues = [0, 1, 4, 8, 5, 7];
        hours.forEach((h, idx) => demo.push({ name: h, Revenue: revValues[idx], Orders: ordValues[idx] }));
        return demo;
      } else if (kpiTab === 'Monthly') {
        const demo = [];
        for (let i = 1; i <= 30; i++) {
          demo.push({
            name: i.toString(),
            Revenue: Math.floor(Math.sin(i / 5) * 500) + 700,
            Orders: Math.floor(Math.random() * 3) + 1
          });
        }
        return demo;
      } else {
        return [
          { name: 'Aug', Revenue: 1800, Orders: 6 },
          { name: 'Sep', Revenue: 2400, Orders: 9 },
          { name: 'Oct', Revenue: 4200, Orders: 15 },
          { name: 'Nov', Revenue: 3600, Orders: 12 },
          { name: 'Dec', Revenue: 5600, Orders: 20 },
          { name: 'Jan', Revenue: 7200, Orders: 28 },
        ];
      }
    }

    return result;
  }, [orders, kpiTab]);

  const handleVisitStore = (e) => {
    e.preventDefault();
    if (!client) {
      console.warn('Cannot visit store: Client data not loaded');
      return;
    }

    // Prioritize Custom Domain if available
    if (client.customDomain) {
      const url = client.customDomain.startsWith('http') ? client.customDomain : `https://${client.customDomain}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!client.subdomain) {
      console.warn('Cannot visit store: No subdomain set');
      return;
    }

    const { hostname, protocol, port } = window.location;
    let baseDomain = hostname.includes('nepostore.xyz') ? 'nepostore.xyz' : 'localhost';
    let targetProtocol = hostname.includes('nepostore.xyz') ? 'https:' : protocol;

    // In local development, we often use port 3000 for the frontend
    let targetPort = port ? `:${port}` : (hostname.includes('nepostore.xyz') ? '' : ':3000');

    const shopUrl = `${targetProtocol}//${client.subdomain}.${baseDomain}${targetPort}`;
    window.open(shopUrl, '_blank', 'noopener,noreferrer');
  };


  // KPI Filtering Logic
  const filteredStats = React.useMemo(() => {
    let filtered = orders;

    if (kpiTab === 'Daily') {
      filtered = orders.filter(order => isToday(new Date(order.placedOn)));
    } else if (kpiTab === 'Monthly') {
      filtered = orders.filter(order => isThisMonth(new Date(order.placedOn)));
    }

    const revenue = filtered
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, order) => acc + (order.payment?.total || 0), 0);
    return {
      revenue,
      ordersCount: filtered.length
    };
  }, [orders, kpiTab]);

  // Trend Calculation Logic
  const trends = React.useMemo(() => {
    let currentSet = [];
    let previousSet = [];
    let label = "last month";

    if (kpiTab === 'Daily') {
      const today = startOfToday();
      const yesterday = subDays(today, 1);
      currentSet = orders.filter(o => isSameDay(new Date(o.placedOn), today));
      previousSet = orders.filter(o => isSameDay(new Date(o.placedOn), yesterday));
      label = "yesterday";
    } else {
      // Monthly or All Time: compare this month vs last month
      const today = new Date();
      const lastMonth = subMonths(today, 1);

      currentSet = orders.filter(o => isThisMonth(new Date(o.placedOn)));
      previousSet = orders.filter(o => isSameMonth(new Date(o.placedOn), lastMonth));
      label = "last month";
    }

    const calc = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      const val = Math.round(((curr - prev) / prev) * 100);
      return val;
    };

    const currRev = currentSet.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + (o.payment?.total || 0), 0);
    const prevRev = previousSet.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + (o.payment?.total || 0), 0);

    const currOrd = currentSet.length;
    const prevOrd = previousSet.length;

    return {
      revenue: calc(currRev, prevRev),
      orders: calc(currOrd, prevOrd),
      label
    };
  }, [orders, kpiTab]);

  // Mock data for chart based on image style
  const chartData = [
    { name: 'Mon', Revenue: 800, Orders: 2 },
    { name: 'Tue', Revenue: 1500, Orders: 4 },
    { name: 'Wed', Revenue: 1300, Orders: 3 },
    { name: 'Thu', Revenue: 1100, Orders: 2 },
    { name: 'Fri', Revenue: 2200, Orders: 6 },
    { name: 'Sat', Revenue: 1800, Orders: 5 },
    { name: 'Sun', Revenue: 1600, Orders: 4 },
  ];

  if (loading) return <div className="dashboard-loader">Loading...</div>;

  return (
    <div className="dashboard-home-premium">
      {/* Header Section */}
      <div className="dashboard-home-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.name || 'Store Owner'}!</h1>
          <p>Your store <span className="highlight-store">{client?.name || 'My Store'}</span> is doing great today.</p>
        </div>
        <div className="header-actions-premium">
          <button className="customize-btn-premium" onClick={() => window.location.href = '/dashboard/themes'}>
            <FaPaintBrush /> Customize Shop
          </button>
          <button
            className="website-link-btn-premium"
            onClick={handleVisitStore}
            disabled={!client?.subdomain && !client?.customDomain}
          >
            <FaEye /> View Live Store
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="kpi-container">
        <div className="kpi-header">
          <h3>Key Performance Indicators</h3>
          <div className="kpi-tabs">
            {['All Time', 'Daily', 'Monthly'].map(tab => (
              <button
                key={tab}
                className={`kpi-tab ${kpiTab === tab ? 'active' : ''}`}
                onClick={() => setKpiTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="stats-grid-premium">
          <StatCard
            title={kpiTab === 'All Time' ? "Total Revenue" : `${kpiTab} Revenue`}
            value={`Rs. ${filteredStats.revenue.toLocaleString()}`}

            icon={<FaMoneyBillWave />}
            iconBgColor="#e6fffa"
            iconColor="#319795"
            trend={true}
            trendValue={`${Math.abs(trends.revenue)}%`}
            trendIsUp={trends.revenue >= 0}
            trendLabel={trends.label}
          />
          <StatCard
            title={kpiTab === 'All Time' ? "Total Orders" : `${kpiTab} Orders`}
            value={filteredStats.ordersCount.toString()}
            icon={<FaShoppingCart />}
            iconBgColor="#ebf8ff"
            iconColor="#3182ce"
            trend={true}
            trendValue={`${Math.abs(trends.orders)}%`}
            trendIsUp={trends.orders >= 0}
            trendLabel={trends.label}
          />
          <StatCard
            title="Total Products"
            value={productsCount.toString()}
            icon={<FaBoxOpen />}
            iconBgColor="#faf5ff"
            iconColor="#805ad5"
            trend={false}
          />
        </div>
      </div>

      {/* Chart Section */}
      <div className="analytics-card-premium">
        <div className="analytics-header">
          <h3>Analytics Overview</h3>
          <div className="chart-toggle-pill">
            <button
              className={chartType === 'Both' ? 'active' : ''}
              onClick={() => setChartType('Both')}
            >
              All
            </button>
            <button
              className={chartType === 'Revenue' ? 'active' : ''}
              onClick={() => setChartType('Revenue')}
            >
              Revenue
            </button>
            <button
              className={chartType === 'Orders' ? 'active' : ''}
              onClick={() => setChartType('Orders')}
            >
              Orders
            </button>
          </div>
        </div>

        <div className="chart-container-premium">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartDataDynamic.length > 0 ? chartDataDynamic : chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} horizontal={true} stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                yAxisId="left"
                hide={true}
              />
              <YAxis
                yAxisId="right"
                hide={true}
                orientation="right"
              />
              <Tooltip
                contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }}
                itemStyle={{ fontSize: '14px', fontWeight: '600' }}
              />
              {/* Revenue Area */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="Revenue"
                stroke="#6366f1"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorValue)"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                hide={chartType !== 'Revenue' && chartType !== 'Both'}
              />
              {/* Orders Area */}
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="Orders"
                stroke="#10b981"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorOrders)"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                hide={chartType !== 'Orders' && chartType !== 'Both'}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="dot revenue"></span> Revenue
            </div>
            <div className="legend-item">
              <span className="dot orders"></span> Orders
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="recent-orders-section-premium">
        <div className="section-header-premium">
          <h3>Recent Orders</h3>
          <button className="see-all-btn" onClick={() => window.location.href = '/dashboard/orders'}>
            See all <FaChevronRight />
          </button>
        </div>
        <div className="orders-cards-grid">
          {orders.sort((a, b) => new Date(b.placedOn) - new Date(a.placedOn)).slice(0, 4).map(order => (
            <div key={order._id} className="order-item-card-premium">
              <div className="order-card-header">
                <div className="customer-avatar">
                  <FaUser />
                </div>
                <div className="customer-info">
                  <h4>{order.customerDetails?.name || 'Guest Customer'}</h4>
                  <span className="order-time">{formatDistanceToNow(new Date(order.placedOn), { addSuffix: true })}</span>
                </div>
              </div>
              <div className="order-card-details">
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value">#{order.orderId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value">Rs {order.payment?.total?.toLocaleString()}</span>
                </div>
              </div>
              <div className="order-card-footer">
                <span className={`status-badge-premium ${order.status || 'pending'}`}>
                  {(order.status || 'pending').toUpperCase()}
                </span>
                <button className="view-order-btn" onClick={() => window.location.href = `/dashboard/orders`}>
                  View details
                </button>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="no-orders-placeholder">
              <p>No orders yet. They will appear here once they start coming in!</p>
            </div>
          )}
        </div>
      </div>

      {showOnboarding && <OnboardingModal user={user} client={client} onComplete={() => setShowOnboarding(false)} />}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div >
  );
};

export default DashboardHome;
