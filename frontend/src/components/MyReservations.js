import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import '../styles/MyReservations.css';

const MyReservations = ({ reservations, onCancel, onRefresh }) => {
  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { text: 'En attente', class: 'status-pending' },
      accepted: { text: 'Acceptée', class: 'status-accepted' },
      rejected: { text: 'Refusée', class: 'status-rejected' },
      completed: { text: 'Terminée', class: 'status-completed' },
      cancelled: { text: 'Annulée', class: 'status-cancelled' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const canCancel = (reservation) => {
    return reservation.status === 'pending' || reservation.status === 'accepted';
  };

  if (reservations.length === 0) {
    return (
      <div className="empty-state">
        <p>Vous n'avez aucune réservation</p>
        <p className="subtitle">Commencez par rechercher un véhicule</p>
      </div>
    );
  }

  return (
    <div className="my-reservations">
      {reservations.map((reservation) => {
        const statusInfo = getStatusInfo(reservation.status);
        
        return (
          <div key={reservation.id} className="my-reservation-card">
            <div className="reservation-image">
              {reservation.vehicle_image ? (
                <img 
                  src={`http://localhost:5000${reservation.vehicle_image}`} 
                  alt={`${reservation.brand} ${reservation.model}`}
                />
              ) : (
                <div className="no-image">📷</div>
              )}
            </div>

            <div className="reservation-content">
              <div className="reservation-top">
                <div>
                  <h3>{reservation.brand} {reservation.model}</h3>
                  <p className="agency-name">📍 {reservation.agency_name}</p>
                </div>
                <span className={`status-badge ${statusInfo.class}`}>
                  {statusInfo.text}
                </span>
              </div>

              <div className="reservation-dates">
                <div className="date-info">
                  <span className="date-label">Début:</span>
                  <span className="date-value">{formatDate(reservation.start_date)}</span>
                </div>
                <div className="date-separator">→</div>
                <div className="date-info">
                  <span className="date-label">Fin:</span>
                  <span className="date-value">{formatDate(reservation.end_date)}</span>
                </div>
              </div>

              <div className="reservation-bottom">
                <div className="price-info">
                  <span className="price-label">Prix total:</span>
                  <span className="price-value">{reservation.total_price}€</span>
                </div>

                <div className="reservation-actions">
                  {canCancel(reservation) && (
                    <button
                      className="cancel-btn"
                      onClick={() => onCancel(reservation.id)}
                    >
                      Annuler
                    </button>
                  )}
                  {reservation.status === 'completed' && (
                    <button className="review-btn">
                      ⭐ Laisser un avis
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyReservations;
