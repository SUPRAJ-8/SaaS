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

        // First, try to get client by clientId (the user's current client)
        let fetchedClient = null;
        try {
          const clientRes = await axios.get(`${API_URL}/api/super-admin/clients/${userRes.data.clientId}`);
          fetchedClient = clientRes.data;
          console.log('Fetched client:', fetchedClient);
        } catch (clientError) {
          console.error('Error fetching client:', clientError);
        }

        // If client doesn't have subdomain, try to get stores or generate one
        if (!fetchedClient || !fetchedClient.subdomain) {
          try {
            const storesRes = await axios.get(`${API_URL}/api/auth/my-stores`, { withCredentials: true });
            const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
            console.log('Fetched stores:', stores);
            
            // Find first store with subdomain
            const storeWithSubdomain = stores.find(s => s && s.subdomain);
            if (storeWithSubdomain) {
              console.log('Using store with subdomain:', storeWithSubdomain.name, storeWithSubdomain.subdomain);
              setClient(storeWithSubdomain);
            } else if (fetchedClient) {
              // Use the fetched client even without subdomain
              console.log('Using client without subdomain:', fetchedClient.name);
              setClient(fetchedClient);
            } else if (stores.length > 0) {
              // Use first store even without subdomain
              console.log('Using first store without subdomain:', stores[0].name);
              setClient(stores[0]);
            }
          } catch (storesError) {
            console.error('Error fetching stores:', storesError);
            // Use the fetched client if available
            if (fetchedClient) {
              setClient(fetchedClient);
            }
          }
        } else {
          // Client has subdomain, use it
          setClient(fetchedClient);
        }

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
      return null;
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

  const handleVisitStore = (e) => {
    e.preventDefault();
    const shopUrl = getShopLink();
    if (shopUrl) {
      window.open(shopUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.warn('Store URL not available yet');
    }
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

  // Debug logging
  console.log('DashboardHome render - client:', client);
  console.log('DashboardHome render - client.subdomain:', client?.subdomain);

  return (
    <div className="dashboard-home">
      <div className="dashboard-home-header">
        <div>
          <h1>Welcome back, {user?.name || 'Store Owner'}!</h1>
          <p>Your store <strong>{client?.name || 'Loading...'}</strong> is doing great today.</p>
          {client && !client.subdomain && (
            <p style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.5rem' }}>
              ⚠️ No subdomain set. Please create a store with a subdomain to view it live.
            </p>
          )}
        </div>
        <div className="header-actions">
          <button className="customize-btn" onClick={() => window.location.href = '/dashboard/themes'}>
            <FaPaintBrush /> Customize Shop
          </button>
          {client && client.subdomain ? (
            <button 
              onClick={handleVisitStore}
              className="website-link-btn"
              title={`Visit ${client.subdomain}.${window.location.hostname.includes('nepostore.xyz') ? 'nepostore.xyz' : 'localhost:3000'}`}
            >
              View Live Store
              <FaExternalLinkAlt />
            </button>
          ) : (
            <button 
              className="website-link-btn"
              disabled
              title="No store subdomain available. Click on 'NEPO OWNER' in the sidebar to create a store."
            >
              View Live Store
              <FaExternalLinkAlt />
            </button>
          )}
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
