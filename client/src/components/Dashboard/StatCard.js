import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, icon, iconColor }) => {
  const iconStyle = {
    color: iconColor, // Use the passed color
  };

  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={iconStyle}>{icon}</div>
      <h4 className="stat-card-title">{title}</h4>
      <p className="stat-card-value">{value}</p>
    </div>
  );
};

export default StatCard;
