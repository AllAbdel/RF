import React, { useState, useEffect } from 'react';
import { agencyAPI } from '../services/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/AgencyStats.css';

const AgencyStats = () => {
  const [detailedStats, setDetailedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState('revenue'); // revenue, bookings

  useEffect(() => {
    loadDetailedStats();
  }, []);

  const loadDetailedStats = async () => {
    try {
      setLoading(true);
      const response = await agencyAPI.getDetailedStats();
      console.log('Detailed stats received:', response.data);
      setDetailedStats(response.data);
    } catch (error) {
      console.error('Erreur chargement statistiques détaillées:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatNumber = (num) => {
    if (!num) return 0;
    return new Intl.NumberFormat('fr-FR').format(Math.round(num));
  };

  // Préparer les données pour les graphiques
  const getRevenueChartData = () => {
    if (!detailedStats?.monthlyRevenue) return [];
    return detailedStats.monthlyRevenue.map(item => ({
      month: new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      revenue: parseFloat(item.revenue) || 0,
      bookings: item.bookings || 0
    })).reverse();
  };

  const getReservationsPieData = () => {
    if (!detailedStats?.reservationBreakdown) return [];
    const statusMap = {
      pending: { label: 'En attente', color: '#F59E0B' },
      accepted: { label: 'Acceptées', color: '#10B981' },
      completed: { label: 'Terminées', color: '#6366F1' },
      rejected: { label: 'Refusées', color: '#EF4444' }
    };
    
    return detailedStats.reservationBreakdown.map(item => ({
      name: statusMap[item.status]?.label || item.status,
      value: item.count,
      color: statusMap[item.status]?.color || '#94A3B8'
    }));
  };

  const getVehiclePerformanceData = () => {
    if (!detailedStats?.vehiclePerformance) return [];
    return detailedStats.vehiclePerformance.slice(0, 10).map(vehicle => ({
      name: `${vehicle.brand} ${vehicle.model}`.substring(0, 15),
      revenue: parseFloat(vehicle.total_revenue) || 0,
      bookings: vehicle.total_bookings || 0,
      rating: parseFloat(vehicle.avg_rating) || 0
    }));
  };

  const getTotalRevenue = () => {
    if (!detailedStats?.monthlyRevenue) return 0;
    return detailedStats.monthlyRevenue.reduce((sum, item) => sum + (parseFloat(item.revenue) || 0), 0);
  };

  const getTotalBookings = () => {
    if (!detailedStats?.reservationBreakdown) return 0;
    return detailedStats.reservationBreakdown.reduce((sum, item) => sum + item.count, 0);
  };

  const getCompletionRate = () => {
    if (!detailedStats?.reservationBreakdown) return 0;
    const completed = detailedStats.reservationBreakdown.find(r => r.status === 'completed')?.count || 0;
    const total = getTotalBookings();
    return total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip-modern">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: <strong>{entry.name.includes('Revenus') ? formatCurrency(entry.value) : entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="agency-stats-modern">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  const revenueChartData = getRevenueChartData();
  const pieData = getReservationsPieData();
  const vehicleData = getVehiclePerformanceData();

  return (
    <div className="agency-stats-modern">
      {/* Header avec actions */}
      <div className="stats-modern-header">
        <div className="header-title">
          <h1>Tableau de bord analytique</h1>
          <p>Vue d'ensemble de votre activité</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadDetailedStats} disabled={loading}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card revenue">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
            </svg>
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Revenus totaux</p>
            <h2 className="kpi-value">{formatCurrency(getTotalRevenue())}</h2>
            <div className={`kpi-change ${detailedStats?.revenueChange >= 0 ? 'positive' : 'negative'}`}>
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d={detailedStats?.revenueChange >= 0 ? "M7 14l5-5 5 5z" : "M7 10l5 5 5-5z"}/>
              </svg>
              <span>{detailedStats?.revenueChange > 0 ? '+' : ''}{detailedStats?.revenueChange || 0}% ce mois</span>
            </div>
          </div>
        </div>

        <div className="kpi-card bookings">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Réservations totales</p>
            <h2 className="kpi-value">{formatNumber(getTotalBookings())}</h2>
            <div className="kpi-meta">
              <span>Toutes périodes confondues</span>
            </div>
          </div>
        </div>

        <div className="kpi-card rating">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Note moyenne</p>
            <h2 className="kpi-value">{detailedStats?.avgRating ? detailedStats.avgRating.toFixed(1) : '0'}<span className="kpi-unit">/5</span></h2>
            <div className="kpi-meta">
              <span>{detailedStats?.vehicleCount || 0} véhicules</span>
            </div>
          </div>
        </div>

        <div className="kpi-card completion">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Taux de complétion</p>
            <h2 className="kpi-value">{getCompletionRate()}<span className="kpi-unit">%</span></h2>
            <div className="kpi-meta">
              <span>Occupation: {detailedStats?.occupancyRate || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card large">
          <div className="chart-header">
            <h3>Évolution des revenus</h3>
            <div className="chart-actions">
              <button className={activeMetric === 'revenue' ? 'active' : ''} onClick={() => setActiveMetric('revenue')}>Revenus</button>
              <button className={activeMetric === 'bookings' ? 'active' : ''} onClick={() => setActiveMetric('bookings')}>Réservations</button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey={activeMetric} 
                  stroke={activeMetric === 'revenue' ? '#6366F1' : '#10B981'} 
                  fillOpacity={1} 
                  fill={activeMetric === 'revenue' ? 'url(#colorRevenue)' : 'url(#colorBookings)'} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reservations Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Répartition des réservations</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Vehicle Performance Chart */}
      <div className="chart-card full-width">
        <div className="chart-header">
          <h3>Performance des véhicules (Top 10)</h3>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={vehicleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" name="Revenus (€)" fill="#6366F1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="bookings" name="Réservations" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Clients */}
      {detailedStats?.topClients && detailedStats.topClients.length > 0 && (
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Meilleurs clients</h3>
          </div>
          <div className="top-clients-list">
            {detailedStats.topClients.map((client, index) => (
              <div key={client.id} className="client-item-modern">
                <div className="client-rank">#{index + 1}</div>
                <div className="client-info">
                  <h4>{client.first_name} {client.last_name}</h4>
                  <p>{client.email}</p>
                </div>
                <div className="client-stats">
                  <div className="stat">
                    <span className="stat-value">{client.booking_count}</span>
                    <span className="stat-label">réservations</span>
                  </div>
                  <div className="stat highlight">
                    <span className="stat-value">{formatCurrency(client.total_spent)}</span>
                    <span className="stat-label">dépensés</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Stats */}
      {detailedStats?.documentsStats && detailedStats.documentsStats.length > 0 && (
        <div className="chart-card">
          <div className="chart-header">
            <h3>Documents générés</h3>
          </div>
          <div className="documents-grid-modern">
            {detailedStats.documentsStats.map((doc) => (
              <div key={doc.document_type} className="doc-stat-card">
                <div className="doc-icon">
                  <svg viewBox="0 0 24 24" width="32" height="32">
                    <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                  </svg>
                </div>
                <h4>{doc.count}</h4>
                <p>{doc.document_type === 'invoice' ? 'Factures' : doc.document_type === 'receipt' ? 'Reçus' : 'Contrats'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyStats;
