import React from 'react';
import StatCard from './StatCard';
import { FaExternalLinkAlt, FaMoneyBillWave, FaShoppingCart, FaCalendarDay } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DashboardHome.css';

const DashboardHome = () => {
  // Mock data for the stat cards, inspired by your image
  const stats = [
    {
      title: 'Total Sales',
      value: 'Rs 1,50,000',
      icon: <FaMoneyBillWave />,
      iconColor: '#22c55e', // Green color
    },
    {
      title: 'Total Orders',
      value: '15',
      icon: <FaShoppingCart />,
    },
    {
      title: "Today's Total Order",
      value: '5',
      icon: <FaCalendarDay />,
    },
  ];

  // Mock data for the chart
  const chartData = [
    { date: '2025-07-25', Order: 4, Revenue: 24000 },
    { date: '2025-07-26', Order: 3, Revenue: 13980 },
    { date: '2025-07-27', Order: 2, Revenue: 9800 },
    { date: '2025-07-28', Order: 2, Revenue: 12468 },
    { date: '2025-07-29', Order: 1, Revenue: 8300 },
    { date: '2025-07-30', Order: 2, Revenue: 19800 },
    { date: '2025-07-31', Order: 1, Revenue: 2250 },
  ];

  return (
    <div className="dashboard-home">
      <div className="dashboard-home-header">
        <a href="/" target="_blank" rel="noopener noreferrer" className="website-link-btn">
          Go to your website
          <FaExternalLinkAlt />
        </a>
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
