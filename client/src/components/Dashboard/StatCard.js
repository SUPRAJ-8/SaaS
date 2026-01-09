import React from 'react';
import './StatCard.css';
import { FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa6';

const StatCard = ({ title, value, icon, iconBgColor, iconColor, trend, trendValue, trendIsUp, trendLabel }) => {
  return (
    <div className="stat-card-premium">
      <div className="stat-card-info">
        <span className="stat-card-label">{title}</span>
        <h2 className="stat-card-display-value">{value}</h2>
        {trend && (
          <div className={`stat-card-trend ${trendIsUp ? 'up' : 'drop'}`}>
            <span className="trend-icon">
              {trendIsUp ? '↗' : '↘'}
            </span>
            <span className="trend-text">{trendValue} from {trendLabel || 'last month'}</span>
          </div>
        )}
      </div>
      <div className="stat-card-icon-wrapper" style={{ backgroundColor: iconBgColor }}>
        <div className="stat-card-icon-inner" style={{ color: iconColor }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
