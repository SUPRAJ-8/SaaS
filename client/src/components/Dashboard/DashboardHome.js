import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from './StatCard';
import { FaExternalLinkAlt, FaMoneyBillWave, FaShoppingCart, FaCalendarDay, FaPaintBrush } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import API_URL from '../../apiConfig';
import './DashboardHome.css';

const DashboardHome = () => {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [productsCount, setProductsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch current user and their client details
        const userRes = await axios.get(`${API_URL}/auth/current_user`);
        
        if (!userRes.data || !userRes.data.clientId) {
          console.error('User not authenticated or missing clientId');
          setLoading(false);
          return;
        }

        setUser(userRes.data);

        // Fetch client details
        const clientRes = await axios.get(`${API_URL}/api/super-admin/clients/${userRes.data.clientId}`);
        setClient(clientRes.data);

        // Fetch real counts for this tenant (these will be filtered by clientId on the backend)
        const productsRes = await axios.get(`${API_URL}/api/products`);
        setProductsCount(productsRes.data?.length || 0);

        const ordersRes = await axios.get(`${API_URL}/api/orders`);
        setOrdersCount(ordersRes.data?.length || 0);

        // Calculate revenue
        const revenue = ordersRes.data?.reduce((acc, order) => acc + (order.payment?.total || 0), 0) || 0;
        setTotalRevenue(revenue);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Don't redirect here - ProtectedRoute will handle authentication
        // Just show error state
        if (error.response?.status === 401) {
          console.error('User not authenticated');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Build the shop link
  const getShopLink = () => {
    if (!client || !client.subdomain) {
      console.warn('Client or subdomain not available');
      return '#';
    }
    
    const hostname = window.location.hostname;
    let protocol = window.location.protocol;
    let port = window.location.port ? `:${window.location.port}` : '';
    let baseDomain = 'localhost';
    
    // Determine base domain and protocol based on environment
    if (hostname.includes('nepostore.xyz')) {
      // Production
      baseDomain = 'nepostore.xyz';
      protocol = 'https:';
      port = ''; // No port in production
    } else if (hostname.endsWith('.localhost') || hostname === 'localhost') {
      // Development
      baseDomain = 'localhost';
      protocol = 'http:';
    }
    
    const shopUrl = `${protocol}//${client.subdomain}.${baseDomain}${port}`;
    return shopUrl;
  };

  // Real data for the stat cards
  const stats = [
    {
      title: 'Total Revenue',
      value: `Rs ${totalRevenue.toLocaleString()}`,
      icon: <FaMoneyBillWave />,
      iconColor: '#22c55e',
    },
    {
      title: 'Total Orders',
      value: ordersCount.toString(),
      icon: <FaShoppingCart />,
    },
    {
      title: "Total Products",
      value: productsCount.toString(),
      icon: <FaCalendarDay />,
    },
  ];

  // Empty chart data for now
  const chartData = [];

  if (loading) return <div className="loading-fade">Loading Dashboard...</div>;

  return (
    <div className="dashboard-home">
      <div className="dashboard-home-header">
        <div>
          <h1>Welcome back, {user?.name || 'Store Owner'}!</h1>
          <p>Your store <strong>{client?.name}</strong> is doing great today.</p>
        </div>
        <div className="header-actions">
          <button className="customize-btn" onClick={() => window.location.href = '/dashboard/themes'}>
            <FaPaintBrush /> Customize Shop
          </button>
          <a href={getShopLink()} target="_blank" rel="noopener noreferrer" className="website-link-btn">
            View Live Store
            <FaExternalLinkAlt />
          </a>
        </div>
      </div>
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} title={stat.title} value={stat.value} icon={stat.icon} iconColor={stat.iconColor} />
        ))}
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `Rs ${value / 1000}k`} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Revenue" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="Order" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardHome;
