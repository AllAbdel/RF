import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/RevenueChart.css';

const RevenueChart = ({ data, loading = false }) => {
  // Formater les données pour le graphique et inverser l'ordre (du plus ancien au plus récent)
  const chartData = data?.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
    revenue: item.revenue || 0,
    bookings: item.bookings || 0
  })).reverse() || [];

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].payload.month}</p>
          <p className="tooltip-revenue">
            <span className="tooltip-dot revenue"></span>
            Revenus: <strong>{payload[0].value}€</strong>
          </p>
          <p className="tooltip-bookings">
            <span className="tooltip-dot bookings"></span>
            Réservations: <strong>{payload[0].payload.bookings}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="revenue-chart loading">
        <div className="chart-skeleton"></div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="revenue-chart empty">
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>Aucune donnée disponible</p>
          <span className="empty-subtitle">Les statistiques apparaîtront après vos premières réservations</span>
        </div>
      </div>
    );
  }

  return (
    <div className="revenue-chart">
      <div className="chart-header">
        <h3>📈 Évolution des revenus</h3>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot revenue"></span>
            <span>Revenus (€)</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2196f3" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#2196f3" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis 
            dataKey="month" 
            stroke="var(--text-secondary)"
            style={{ fontSize: '0.85rem' }}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            style={{ fontSize: '0.85rem' }}
            tickFormatter={(value) => `${value}€`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#2196f3" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
