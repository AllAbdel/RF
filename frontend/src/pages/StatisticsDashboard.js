import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import Header from '../components/Header';
import '../styles/StatisticsDashboard.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatisticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('all');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/agency/stats/detailed?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="stats-loading">
          <div className="spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="stats-error">
          <p>{error}</p>
          <button onClick={fetchStats}>Réessayer</button>
        </div>
      </>
    );
  }

  if (!stats) return null;

  // Préparer les données pour les graphiques
  const monthlyRevenueData = [...(stats.monthlyRevenue || [])].reverse().map(item => ({
    month: item.month,
    revenue: parseFloat(item.revenue) || 0,
    bookings: item.bookings
  }));

  const statusData = (stats.reservationBreakdown || []).map(item => ({
    name: getStatusLabel(item.status),
    value: item.count,
    revenue: parseFloat(item.total_value) || 0
  }));

  const weekdayData = (stats.weekdayDistribution || []).map(item => ({
    day: getDayLabel(item.day_name),
    bookings: item.booking_count,
    revenue: parseFloat(item.revenue) || 0
  }));

  const vehicleData = (stats.vehiclePerformance || []).slice(0, 5).map(v => ({
    name: `${v.brand} ${v.model}`.substring(0, 15),
    revenue: parseFloat(v.total_revenue) || 0,
    bookings: v.total_bookings,
    rating: parseFloat(v.avg_rating) || 0
  }));

  return (
    <>
    <Header />
    <div className="statistics-dashboard">
      <div className="stats-header">
        <h1>Tableau de Bord Statistiques</h1>
        <div className="period-selector">
          <label>Période:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">Tout</option>
            <option value="12m">12 derniers mois</option>
            <option value="6m">6 derniers mois</option>
            <option value="3m">3 derniers mois</option>
            <option value="1m">Dernier mois</option>
          </select>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="kpi-grid">
        <KPICard
          title="Revenus ce mois"
          value={`${(stats.currentMonthRevenue || 0).toLocaleString('fr-FR')}€`}
          change={stats.revenueChange}
          icon="💰"
        />
        <KPICard
          title="Véhicules"
          value={stats.vehicleCount || 0}
          icon="🚗"
        />
        <KPICard
          title="Note moyenne"
          value={`${(stats.avgRating || 0).toFixed(1)}/5`}
          icon="⭐"
        />
        <KPICard
          title="Taux d'occupation"
          value={`${stats.occupancyRate || 0}%`}
          icon="📊"
        />
        <KPICard
          title="Durée moy. location"
          value={`${Math.round(stats.avgRentalDays || 0)} jours`}
          icon="📅"
        />
        <KPICard
          title="Taux d'acceptation"
          value={`${stats.acceptanceRate || 0}%`}
          icon="✅"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="charts-row">
        <div className="chart-container large">
          <h3>Évolution des Revenus</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }}
                formatter={(value) => [`${value.toLocaleString('fr-FR')}€`, 'Revenus']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Répartition par Statut</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-row">
        <div className="chart-container">
          <h3>Top 5 Véhicules (Revenus)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vehicleData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
              <Tooltip 
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }}
                formatter={(value) => [`${value.toLocaleString('fr-FR')}€`, 'Revenus']}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Réservations par Jour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekdayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }}
              />
              <Bar dataKey="bookings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Clients & Upcoming Reservations */}
      <div className="tables-row">
        <div className="table-container">
          <h3>Top 5 Clients</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Réservations</th>
                <th>Total dépensé</th>
              </tr>
            </thead>
            <tbody>
              {(stats.topClients || []).map((client, index) => (
                <tr key={client.id}>
                  <td>
                    <span className="rank">#{index + 1}</span>
                    {client.first_name} {client.last_name}
                  </td>
                  <td>{client.booking_count}</td>
                  <td className="amount">{parseFloat(client.total_spent).toLocaleString('fr-FR')}€</td>
                </tr>
              ))}
              {(!stats.topClients || stats.topClients.length === 0) && (
                <tr><td colSpan="3" className="no-data">Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-container">
          <h3>Réservations à venir</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Véhicule</th>
                <th>Client</th>
                <th>Dans</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {(stats.upcomingReservations || []).slice(0, 5).map((res) => (
                <tr key={res.id}>
                  <td>{res.brand} {res.model}</td>
                  <td>{res.first_name} {res.last_name}</td>
                  <td>{res.days_until_start > 0 ? `${res.days_until_start}j` : "Aujourd'hui"}</td>
                  <td className="amount">{parseFloat(res.total_price).toLocaleString('fr-FR')}€</td>
                </tr>
              ))}
              {(!stats.upcomingReservations || stats.upcomingReservations.length === 0) && (
                <tr><td colSpan="4" className="no-data">Aucune réservation à venir</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};

// Helper components
const KPICard = ({ title, value, change, icon }) => (
  <div className="kpi-card">
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-content">
      <span className="kpi-title">{title}</span>
      <span className="kpi-value">{value}</span>
      {change !== undefined && (
        <span className={`kpi-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs mois dernier
        </span>
      )}
    </div>
  </div>
);

// Helper functions
const getStatusLabel = (status) => {
  const labels = {
    pending: 'En attente',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    completed: 'Terminée',
    cancelled: 'Annulée'
  };
  return labels[status] || status;
};

const getDayLabel = (day) => {
  const labels = {
    Monday: 'Lun',
    Tuesday: 'Mar',
    Wednesday: 'Mer',
    Thursday: 'Jeu',
    Friday: 'Ven',
    Saturday: 'Sam',
    Sunday: 'Dim'
  };
  return labels[day] || day;
};

export default StatisticsDashboard;
