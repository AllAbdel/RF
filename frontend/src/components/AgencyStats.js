import React, { useState, useEffect } from 'react';
import { agencyAPI } from '../services/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/AgencyStats.css';

const AgencyStats = () => {
  const [detailedStats, setDetailedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState('revenue');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDetailedStats();
  }, [selectedPeriod]);

  const loadDetailedStats = async () => {
    try {
      setLoading(true);
      const response = await agencyAPI.getDetailedStats(selectedPeriod);
      setDetailedStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0);
  const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(Math.round(num || 0));
  const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const exportToCSV = () => {
    if (!detailedStats) return;
    const csvData = [
      ['Statistiques RentFlow', new Date().toLocaleDateString('fr-FR')],
      [],
      ['Période', getPeriodLabel()],
      ['Revenus totaux', formatCurrency(getTotalRevenue())],
      ['Réservations totales', getTotalBookings()],
      ['Durée moyenne (jours)', parseFloat(detailedStats.avgRentalDays)?.toFixed(1) || 'N/A'],
      ['Taux de complétion', getCompletionRate() + '%'],
      [],
      ['Mois', 'Revenus (€)', 'Réservations'],
      ...detailedStats.monthlyRevenue.map(m => [m.month, parseFloat(m.revenue).toFixed(2), m.bookings])
    ];
    const csvContent = '\uFEFF' + csvData.map(r => r.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rentflow_stats_${selectedPeriod}_${Date.now()}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    if (!detailedStats) return;
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(255, 107, 53);
    doc.text('RentFlow - Statistiques', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' }), 14, 27);
    doc.text(getPeriodLabel(), 14, 32);
    
    // KPIs
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Vue d\'ensemble', 14, 42);
    
    const kpiData = [
      ['Revenus totaux', formatCurrency(getTotalRevenue())],
      ['Réservations totales', getTotalBookings()],
      ['Taux de complétion', getCompletionRate() + '%'],
      ['Durée moyenne', (parseFloat(detailedStats.avgRentalDays)?.toFixed(1) || 'N/A') + ' jours']
    ];
    
    autoTable(doc, {
      startY: 45,
      head: [['Indicateur', 'Valeur']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [255, 107, 53] }
    });
    
    // Revenus mensuels
    if (detailedStats.monthlyRevenue?.length > 0) {
      doc.text('Revenus mensuels', 14, doc.lastAutoTable.finalY + 10);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 13,
        head: [['Mois', 'Revenus', 'Réservations']],
        body: detailedStats.monthlyRevenue.map(m => [
          m.month,
          formatCurrency(parseFloat(m.revenue)),
          m.bookings
        ]),
        theme: 'striped',
        headStyles: { fillColor: [255, 107, 53] }
      });
    }
    
    // Top véhicules
    if (detailedStats.vehiclePerformance?.length > 0) {
      doc.addPage();
      doc.text('Top 10 Véhicules', 14, 20);
      autoTable(doc, {
        startY: 23,
        head: [['Véhicule', 'Revenus', 'Réservations', 'Note']],
        body: detailedStats.vehiclePerformance.slice(0, 10).map(v => [
          `${v.brand} ${v.model}`,
          formatCurrency(parseFloat(v.total_revenue || 0)),
          v.total_bookings || 0,
          (parseFloat(v.avg_rating) || 0).toFixed(1) + '/5'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [255, 107, 53] }
      });
    }
    
    doc.save(`rentflow_stats_${selectedPeriod}_${Date.now()}.pdf`);
  };

  const getRevenueChartData = () => {
    if (!detailedStats?.monthlyRevenue) return [];
    return detailedStats.monthlyRevenue.map(item => ({
      month: new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      revenue: parseFloat(item.revenue) || 0,
      bookings: item.bookings || 0
    })).reverse();
  };

  const getPieData = () => {
    if (!detailedStats?.reservationBreakdown) return [];
    const colors = { pending: '#F59E0B', accepted: '#10B981', completed: '#6366F1', rejected: '#EF4444' };
    const labels = { pending: 'En attente', accepted: 'Acceptées', completed: 'Terminées', rejected: 'Refusées' };
    return detailedStats.reservationBreakdown.map(item => ({
      name: labels[item.status] || item.status,
      value: item.count,
      color: colors[item.status] || '#94A3B8'
    }));
  };

  const getWeekdayData = () => {
    if (!detailedStats?.weekdayDistribution) return [];
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return detailedStats.weekdayDistribution.map(item => ({
      day: days[item.day_num - 1],
      bookings: item.booking_count,
      revenue: parseFloat(item.revenue) || 0
    }));
  };

  const getVehicleData = () => {
    if (!detailedStats?.vehiclePerformance) return [];
    return detailedStats.vehiclePerformance.slice(0, 10).map(v => ({
      name: `${v.brand} ${v.model}`.substring(0, 18),
      revenue: parseFloat(v.total_revenue) || 0,
      bookings: v.total_bookings || 0,
      rating: parseFloat(v.avg_rating) || 0
    }));
  };

  const getTotalRevenue = () => detailedStats?.monthlyRevenue?.reduce((sum, item) => sum + (parseFloat(item.revenue) || 0), 0) || 0;
  const getTotalBookings = () => detailedStats?.reservationBreakdown?.reduce((sum, item) => sum + item.count, 0) || 0;
  const getCompletionRate = () => {
    if (!detailedStats?.reservationBreakdown) return 0;
    const completed = detailedStats.reservationBreakdown.find(r => r.status === 'completed')?.count || 0;
    const total = getTotalBookings();
    return total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
  };

  const getPeriodLabel = () => {
    const labels = { 'all': 'Tout l\'historique', '12m': '12 derniers mois', '6m': '6 derniers mois', '3m': '3 derniers mois', '1m': 'Ce mois' };
    return labels[selectedPeriod] || 'Tout l\'historique';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="custom-tooltip-modern">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, i) => (
            <p key={i} style={{ color: entry.color }}>
              {entry.name}: <strong>{entry.name.includes('Revenus') || entry.name.includes('revenue') ? formatCurrency(entry.value) : entry.value}</strong>
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
  const pieData = getPieData();
  const vehicleData = getVehicleData();
  const weekdayData = getWeekdayData();

  return (
    <div className="agency-stats-modern">
      {/* Header avec filtres et actions */}
      <div className="stats-modern-header">
        <div className="header-title">
          <h1>Tableau de bord analytique</h1>
          <p>Vue d'ensemble complète de votre activité</p>
        </div>
        <div className="header-actions">
          <div className="period-selector">
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="period-select">
              <option value="all">Tout l'historique</option>
              <option value="12m">12 derniers mois</option>
              <option value="6m">6 derniers mois</option>
              <option value="3m">3 derniers mois</option>
              <option value="1m">Ce mois</option>
            </select>
          </div>
          <button className="btn-export" onClick={exportToCSV}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
            </svg>
            CSV
          </button>
          <button className="btn-export" onClick={exportToPDF}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
            </svg>
            PDF
          </button>
          <button className="btn-refresh" onClick={loadDetailedStats}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* Navigation des onglets */}
      <div className="stats-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
          Vue d'ensemble
        </button>
        <button className={activeTab === 'vehicles' ? 'active' : ''} onClick={() => setActiveTab('vehicles')}>
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
          Véhicules
        </button>
        <button className={activeTab === 'clients' ? 'active' : ''} onClick={() => setActiveTab('clients')}>
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          Clients
        </button>
        <button className={activeTab === 'upcoming' ? 'active' : ''} onClick={() => setActiveTab('upcoming')}>
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
          À venir
        </button>
      </div>

      {/* Onglet: Vue d'ensemble */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
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
                  {detailedStats?.revenueChange > 0 ? '+' : ''}{detailedStats?.revenueChange || 0}% ce mois
                </div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
              <div className="kpi-content">
                <p className="kpi-label">Réservations</p>
                <h2 className="kpi-value">{formatNumber(getTotalBookings())}</h2>
                <div className="kpi-meta">Taux d'acceptation: {detailedStats?.acceptanceRate || 0}%</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
              </div>
              <div className="kpi-content">
                <p className="kpi-label">Note moyenne</p>
                <h2 className="kpi-value">{(parseFloat(detailedStats?.avgRating) || 0).toFixed(1)}<span className="kpi-unit">/5</span></h2>
                <div className="kpi-meta">{detailedStats?.vehicleCount || 0} véhicules</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </div>
              <div className="kpi-content">
                <p className="kpi-label">Durée moyenne</p>
                <h2 className="kpi-value">{(parseFloat(detailedStats?.avgRentalDays) || 0).toFixed(1)}<span className="kpi-unit">j</span></h2>
                <div className="kpi-meta">Valeur moy: {formatCurrency(detailedStats?.avgBookingValue)}</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-card large">
              <div className="chart-header">
                <h3>Évolution temporelle</h3>
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
                        <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffa500" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ffa500" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                    <XAxis dataKey="month" stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey={activeMetric} stroke={activeMetric === 'revenue' ? '#ff6b35' : '#ffa500'} fillOpacity={1} fill={activeMetric === 'revenue' ? 'url(#colorRevenue)' : 'url(#colorBookings)'} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Répartition des réservations</h3>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weekday Distribution */}
          {weekdayData.length > 0 && (
            <div className="chart-card full-width">
              <div className="chart-header">
                <h3>Répartition par jour de la semaine</h3>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                    <XAxis dataKey="day" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="bookings" name="Réservations" fill="#ff6b35" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="revenue" name="Revenus (€)" fill="#ffa500" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Documents Stats */}
          {detailedStats?.documentsStats && detailedStats.documentsStats.length > 0 && (
            <div className="documents-grid-modern">
              {detailedStats.documentsStats.map((doc, i) => (
                <div key={i} className="doc-stat-card">
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
          )}
        </>
      )}

      {/* Onglet: Véhicules */}
      {activeTab === 'vehicles' && (
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Performance des véhicules (Top 10)</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={vehicleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="revenue" name="Revenus (€)" fill="#ff6b35" radius={[8, 8, 0, 0]} />
                <Bar dataKey="bookings" name="Réservations" fill="#ffa500" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Onglet: Clients */}
      {activeTab === 'clients' && detailedStats?.topClients && (
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Meilleurs clients</h3>
          </div>
          <div className="top-clients-list">
            {detailedStats.topClients.map((client, i) => (
              <div key={client.id} className="client-item-modern">
                <div className="client-rank">#{i + 1}</div>
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

      {/* Onglet: Réservations à venir */}
      {activeTab === 'upcoming' && detailedStats?.upcomingReservations && (
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Réservations à venir ({detailedStats.upcomingReservations.length})</h3>
          </div>
          <div className="upcoming-list">
            {detailedStats.upcomingReservations.map((res) => (
              <div key={res.id} className="upcoming-item">
                <img src={`http://localhost:5000${res.image}`} alt={`${res.brand} ${res.model}`} className="upcoming-vehicle-img" />
                <div className="upcoming-details">
                  <h4>{res.brand} {res.model}</h4>
                  <p className="upcoming-client">{res.first_name} {res.last_name}</p>
                  <div className="upcoming-dates">
                    <span>Du {formatDate(res.start_date)}</span>
                    <span>au {formatDate(res.end_date)}</span>
                  </div>
                </div>
                <div className="upcoming-meta">
                  <div className={`upcoming-status status-${res.status}`}>
                    {res.status === 'pending' ? 'En attente' : 'Acceptée'}
                  </div>
                  <div className="upcoming-price">{formatCurrency(res.total_price)}</div>
                  <div className="upcoming-countdown">Dans {res.days_until_start} jour{res.days_until_start > 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
            {detailedStats.upcomingReservations.length === 0 && (
              <p className="no-data">Aucune réservation à venir</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyStats;
