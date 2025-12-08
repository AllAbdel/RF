import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DocumentViewer from './DocumentViewer';
import '../styles/MyReservations.css';

const MyReservations = ({ reservations, onCancel, onRefresh, onSubmitReview }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDocuments, setShowDocuments] = useState({});
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });
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

  const handleOpenReviewModal = (reservation) => {
    setSelectedReservation(reservation);
    setReviewData({ rating: 5, comment: '' });
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedReservation(null);
    setReviewData({ rating: 5, comment: '' });
  };

  const handleSubmitReview = async () => {
    if (selectedReservation) {
      await onSubmitReview(selectedReservation.id, reviewData);
      handleCloseReviewModal();
    }
  };

  const toggleDocuments = (reservationId) => {
    setShowDocuments(prev => ({
      ...prev,
      [reservationId]: !prev[reservationId]
    }));
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
                <div className="no-image">Pas d'image</div>
              )}
            </div>

            <div className="reservation-content">
              <div className="reservation-top">
                <div>
                  <h3>{reservation.brand} {reservation.model}</h3>
                  <p className="agency-name">Agence: {reservation.agency_name}</p>
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
                <div className="date-separator">—</div>
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
                  <button
                    className="documents-btn"
                    onClick={() => toggleDocuments(reservation.id)}
                  >
                    {showDocuments[reservation.id] ? '📁 Masquer documents' : '📄 Voir documents'}
                  </button>
                  {canCancel(reservation) && (
                    <button
                      className="cancel-btn"
                      onClick={() => onCancel(reservation.id)}
                    >
                      Annuler
                    </button>
                  )}
                  {reservation.status === 'completed' && !reservation.has_review && (
                    <button 
                      className="review-btn"
                      onClick={() => handleOpenReviewModal(reservation)}
                    >
                      Laisser un avis
                    </button>
                  )}
                  {reservation.status === 'completed' && reservation.has_review && (
                    <span className="already-reviewed">✓ Avis laissé</span>
                  )}
                </div>
              </div>

              {showDocuments[reservation.id] && (
                <DocumentViewer 
                  reservationId={reservation.id} 
                  userType="client"
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Modal d'avis */}
      {showReviewModal && selectedReservation && (
        <div className="review-modal-overlay" onClick={handleCloseReviewModal}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Laisser un avis</h3>
            <p className="modal-vehicle-name">
              {selectedReservation.brand} {selectedReservation.model}
            </p>

            <div className="form-group">
              <label>Note</label>
              <div className="rating-selector">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${reviewData.rating >= star ? 'active' : ''}`}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                  >
                    ★
                  </button>
                ))}
              </div>
              <span className="rating-text">{reviewData.rating}/5</span>
            </div>

            <div className="form-group">
              <label>Commentaire (optionnel)</label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                placeholder="Partagez votre expérience..."
                rows="4"
              />
            </div>

            <div className="modal-actions">
              <button className="cancel-modal-btn" onClick={handleCloseReviewModal}>
                Annuler
              </button>
              <button className="submit-review-btn" onClick={handleSubmitReview}>
                Publier l'avis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReservations;
