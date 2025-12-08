import React from 'react';
import '../styles/VehiclePerformance.css';

const VehiclePerformance = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="vehicle-performance loading">
        <h3>🚗 Performance des véhicules</h3>
        <div className="performance-skeleton"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="vehicle-performance empty">
        <h3>🚗 Performance des véhicules</h3>
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  // Trier par revenus totaux
  const sortedData = [...data].sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0));

  return (
    <div className="vehicle-performance">
      <div className="performance-header">
        <h3>🚗 Performance des véhicules</h3>
        <span className="vehicle-count">{data.length} véhicule{data.length > 1 ? 's' : ''}</span>
      </div>

      <div className="performance-table">
        <div className="table-header">
          <div className="col-vehicle">Véhicule</div>
          <div className="col-bookings">Réservations</div>
          <div className="col-revenue">Revenus</div>
          <div className="col-avg">Moy./Rés.</div>
          <div className="col-rating">Note</div>
        </div>

        <div className="table-body">
          {sortedData.map((vehicle, index) => {
            const avgValue = vehicle.avg_booking_value ? Math.round(vehicle.avg_booking_value) : 0;
            const rating = vehicle.avg_rating ? parseFloat(vehicle.avg_rating).toFixed(1) : '—';
            const hasReviews = vehicle.review_count > 0;

            return (
              <div key={vehicle.id} className="table-row">
                <div className="col-vehicle">
                  <div className="vehicle-info">
                    {index < 3 && <span className="rank-badge">{['🥇', '🥈', '🥉'][index]}</span>}
                    <div className="vehicle-image">
                      {vehicle.image ? (
                        <img 
                          src={`http://localhost:5000${vehicle.image}`} 
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          onError={(e) => { e.target.src = '/no-image.svg'; }}
                        />
                      ) : (
                        <img src="/no-image.svg" alt="Pas d'image" />
                      )}
                    </div>
                    <div className="vehicle-name">
                      <span className="brand">{vehicle.brand}</span>
                      <span className="model">{vehicle.model}</span>
                    </div>
                  </div>
                </div>

                <div className="col-bookings">
                  <span className="bookings-value">{vehicle.total_bookings || 0}</span>
                  <span className="bookings-label">réservation{vehicle.total_bookings > 1 ? 's' : ''}</span>
                </div>

                <div className="col-revenue">
                  <span className="revenue-value">{vehicle.total_revenue || 0}€</span>
                </div>

                <div className="col-avg">
                  <span className="avg-value">{avgValue}€</span>
                </div>

                <div className="col-rating">
                  {hasReviews ? (
                    <div className="rating-info">
                      <span className="rating-value">⭐ {rating}</span>
                      <span className="rating-count">({vehicle.review_count})</span>
                    </div>
                  ) : (
                    <span className="no-rating">Aucun avis</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VehiclePerformance;
