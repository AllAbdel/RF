import React from 'react';
import '../styles/AgencyStats.css';

const AgencyStats = ({ stats }) => {
  const getReservationStatusCount = (status) => {
    const item = stats.reservation_stats.find(s => s.status === status);
    return item ? item.count : 0;
  };

  return (
    <div className="agency-stats">
  <h2>Statistiques de l'agence</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">Véhicules</div>
          <div className="stat-content">
            <h3>Véhicules</h3>
            <p className="stat-value">{stats.vehicle_count}</p>
            <span className="stat-label">Total</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">Revenus</div>
          <div className="stat-content">
            <h3>Revenus</h3>
            <p className="stat-value">{stats.total_revenue.toFixed(2)}€</p>
            <span className="stat-label">Total</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">Note</div>
          <div className="stat-content">
            <h3>Note moyenne</h3>
            <p className="stat-value">{stats.avg_rating ? stats.avg_rating.toFixed(1) : 'N/A'}</p>
            <span className="stat-label">Sur 5</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">Réservations</div>
          <div className="stat-content">
            <h3>Réservations</h3>
            <p className="stat-value">
              {stats.reservation_stats.reduce((sum, s) => sum + s.count, 0)}
            </p>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>

      <div className="reservations-breakdown">
        <h3>Répartition des réservations</h3>
        <div className="breakdown-grid">
          <div className="breakdown-item pending">
            <span className="breakdown-label">En attente</span>
            <span className="breakdown-value">{getReservationStatusCount('pending')}</span>
          </div>
          <div className="breakdown-item accepted">
            <span className="breakdown-label">Acceptées</span>
            <span className="breakdown-value">{getReservationStatusCount('accepted')}</span>
          </div>
          <div className="breakdown-item completed">
            <span className="breakdown-label">Terminées</span>
            <span className="breakdown-value">{getReservationStatusCount('completed')}</span>
          </div>
          <div className="breakdown-item rejected">
            <span className="breakdown-label">Refusées</span>
            <span className="breakdown-value">{getReservationStatusCount('rejected')}</span>
          </div>
        </div>
      </div>

      {stats.recent_reservations.length > 0 && (
        <div className="recent-reservations">
          <h3>Réservations récentes</h3>
          <div className="recent-list">
            {stats.recent_reservations.map((reservation) => (
              <div key={reservation.id} className="recent-item">
                <div className="recent-vehicle">
                  {reservation.brand} {reservation.model}
                </div>
                <div className="recent-client">
                  {reservation.first_name} {reservation.last_name}
                </div>
                <div className="recent-price">{reservation.total_price}€</div>
                <div className={`recent-status status-${reservation.status}`}>
                  {reservation.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyStats;
