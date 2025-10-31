import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import '../styles/ReservationList.css';

const ReservationList = ({ reservations, onStatusUpdate, isAgency }) => {
  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { text: 'En attente', class: 'status-pending', color: '#f59e0b' },
      accepted: { text: 'Acceptée', class: 'status-accepted', color: '#10b981' },
      rejected: { text: 'Refusée', class: 'status-rejected', color: '#ef4444' },
      completed: { text: 'Terminée', class: 'status-completed', color: '#6b7280' },
      cancelled: { text: 'Annulée', class: 'status-cancelled', color: '#ef4444' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  if (reservations.length === 0) {
    return (
      <div className="empty-state">
        <p>Aucune réservation</p>
      </div>
    );
  }

  return (
    <div className="reservation-list">
      {reservations.map((reservation) => {
        const statusInfo = getStatusInfo(reservation.status);
        
        return (
          <div key={reservation.id} className="reservation-card">
            <div className="reservation-header">
              <div className="reservation-vehicle">
                {reservation.vehicle_image && (
                  <img 
                    src={`http://localhost:5000${reservation.vehicle_image}`} 
                    alt="Vehicle"
                  />
                )}
                <div>
                  <h3>{reservation.brand} {reservation.model}</h3>
                  {isAgency && (
                    <p className="client-name">
                      Client: {reservation.first_name} {reservation.last_name}
                    </p>
                  )}
                  {!isAgency && (
                    <p className="agency-name">Agence: {reservation.agency_name}</p>
                  )}
                </div>
              </div>
              <span className={`status-badge ${statusInfo.class}`}>
                {statusInfo.text}
              </span>
            </div>

            <div className="reservation-details">
              <div className="detail-item">
                <span className="label">📅 Début:</span>
                <span className="value">{formatDate(reservation.start_date)}</span>
              </div>
              <div className="detail-item">
                <span className="label">📅 Fin:</span>
                <span className="value">{formatDate(reservation.end_date)}</span>
              </div>
              <div className="detail-item">
                <span className="label">💰 Prix total:</span>
                <span className="value">{reservation.total_price}€</span>
              </div>
              {isAgency && (
                <>
                  <div className="detail-item">
                    <span className="label">📞 Téléphone:</span>
                    <span className="value">{reservation.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">✉️ Email:</span>
                    <span className="value">{reservation.email}</span>
                  </div>
                </>
              )}
            </div>

            {isAgency && reservation.status === 'pending' && (
              <div className="reservation-actions">
                <button
                  className="accept-btn"
                  onClick={() => onStatusUpdate(reservation.id, 'accepted')}
                >
                  ✅ Accepter
                </button>
                <button
                  className="reject-btn"
                  onClick={() => onStatusUpdate(reservation.id, 'rejected')}
                >
                  ❌ Refuser
                </button>
              </div>
            )}

            {isAgency && reservation.status === 'accepted' && (
              <div className="reservation-actions">
                <button
                  className="complete-btn"
                  onClick={() => onStatusUpdate(reservation.id, 'completed')}
                >
                  ✔️ Marquer comme terminée
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReservationList;
