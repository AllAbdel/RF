import React from 'react';
import '../styles/StatisticsCard.css';

const StatisticsCard = ({ icon, title, value, change, changeType, suffix = '', loading = false }) => {
  const getChangeClass = () => {
    if (!change || change === 0) return '';
    if (changeType === 'neutral') return 'neutral';
    return change > 0 ? 'positive' : 'negative';
  };

  const getChangeIcon = () => {
    if (!change || change === 0) return '—';
    return change > 0 ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="statistics-card loading">
        <div className="stat-skeleton"></div>
      </div>
    );
  }

  return (
    <div className="statistics-card">
      <div className="stat-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-title">{title}</span>
      </div>
      <div className="stat-value">
        {value !== null && value !== undefined ? value : '—'}
        {suffix && <span className="stat-suffix">{suffix}</span>}
      </div>
      {change !== null && change !== undefined && (
        <div className={`stat-change ${getChangeClass()}`}>
          <span className="change-icon">{getChangeIcon()}</span>
          <span className="change-value">{Math.abs(change)}%</span>
          <span className="change-label">vs mois dernier</span>
        </div>
      )}
    </div>
  );
};

export default StatisticsCard;
