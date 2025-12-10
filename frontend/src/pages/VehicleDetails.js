import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { vehicleAPI, reservationAPI, messageAPI } from '../services/api';
import { showToast } from '../components/Toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShareButton from '../components/ShareButton';
import ImageLightbox from '../components/ImageLightbox';
import '../styles/VehicleDetails.css';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isClient, isAuthenticated } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationData, setReservationData] = useState({
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadVehicleDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadVehicleDetails = async () => {
    try {
      const response = await vehicleAPI.getById(id);
      console.log('🚗 Vehicle data:', response.data.vehicle);
      console.log('📄 terms_pdf:', response.data.vehicle.terms_pdf);
      setVehicle(response.data.vehicle);
      setImages(response.data.images);
      setReviews(response.data.reviews);
      setReservations(response.data.reservations || []);
    } catch (error) {
      console.error('Erreur chargement véhicule:', error);
      alert('Erreur lors du chargement du véhicule');
    } finally {
      setLoading(false);
    }
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    
    // Si pas authentifié, rediriger vers la page de connexion
    if (!isAuthenticated) {
      showToast('Veuillez vous connecter pour réserver ce véhicule', 'warning');
      navigate('/auth', { state: { returnTo: `/vehicle/${id}` } });
      return;
    }

    // Si authentifié mais pas client
    if (!isClient) {
      showToast('Vous devez être connecté en tant que client pour réserver', 'warning');
      return;
    }

    try {
      // Vérifier disponibilité
      const availResponse = await vehicleAPI.checkAvailability(id, reservationData);
      
      if (!availResponse.data.available) {
        showToast('Ce véhicule n\'est pas disponible pour ces dates', 'error');
        return;
      }

      // Créer la réservation
      await reservationAPI.create({
        vehicle_id: id,
        ...reservationData
      });

      showToast('Réservation créée avec succès ! En attente de validation par l\'agence.', 'success');
      navigate('/client');
    } catch (error) {
      console.error('Erreur réservation:', error);
      showToast(error.response?.data?.error || 'Erreur lors de la réservation', 'error');
    }
  };

  const handleContactAgency = async () => {
    if (!isAuthenticated) {
      showToast('Veuillez vous connecter pour contacter l\'agence', 'warning');
      navigate('/auth', { state: { returnTo: `/vehicle/${id}` } });
      return;
    }

    if (!isClient) {
      showToast('Vous devez être connecté en tant que client pour contacter l\'agence', 'warning');
      return;
    }

    try {
      await messageAPI.getOrCreateConversation(vehicle.agency_id);
      showToast('Vous pouvez maintenant contacter l\'agence depuis votre messagerie', 'success');
      navigate('/client');
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la création de la conversation', 'error');
    }
  };

  const getFuelIcon = (fuelType) => {
    switch (fuelType) {
      case 'essence': return 'Essence';
      case 'diesel': return 'Diesel';
      case 'electrique': return 'Électrique';
      case 'hybride': return 'Hybride';
      default: return fuelType || 'N/A';
    }
  };

  const calculateTotalPrice = () => {
    if (!reservationData.start_date || !reservationData.end_date || !vehicle) {
      return 0;
    }
    const start = new Date(reservationData.start_date);
    const end = new Date(reservationData.end_date);
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    return (hours * vehicle.price_per_hour).toFixed(2);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!vehicle) {
    return <div className="error">Véhicule non trouvé</div>;
  }

  return (
    <div className="vehicle-details">
      <Header />
      
      <div className="vehicle-details-wrapper">
        <button className="back-btn" onClick={() => navigate(-1)}>
          Retour
        </button>

      <div className="vehicle-details-container">
        <div className="vehicle-left-column">
          <div className="vehicle-images">
            <div className="main-image" onClick={() => images.length > 0 && setShowLightbox(true)} style={{ cursor: images.length > 0 ? 'zoom-in' : 'default' }}>
              {images.length > 0 ? (
                <img 
                  src={`http://localhost:5000${images[selectedImage]?.image_url}`} 
                  alt={vehicle.brand}
                  onError={(e) => { e.target.src = '/no-image.svg'; }}
                />
              ) : (
                <img src="/no-image.svg" alt="Pas d'image" />
              )}
              {images.length > 0 && (
                <div className="zoom-hint">Cliquer pour agrandir</div>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="image-thumbnails">
                {images.map((img, index) => (
                  <img
                    key={img.id}
                    src={`http://localhost:5000${img.image_url}`}
                    alt={`${vehicle.brand} ${index + 1}`}
                    className={selectedImage === index ? 'active' : ''}
                    onClick={() => setSelectedImage(index)}
                    onError={(e) => { e.target.src = '/no-image.svg'; }}
                  />
                ))}
              </div>
            )}
          </div>

          {vehicle.description && (
            <div className="vehicle-description">
              <h3>Description</h3>
              <p>{vehicle.description}</p>
            </div>
          )}

          {(vehicle.rental_conditions || vehicle.rental_conditions_pdf) && (
            <div className="rental-conditions">
              <h3>Conditions de location de l'agence</h3>
              
              {vehicle.rental_conditions && (
                <div className="conditions-content">
                  {vehicle.rental_conditions.split('\n').map((condition, index) => (
                    condition.trim() && (
                      <div key={index} className="condition-item">
                        <span className="condition-bullet">✓</span>
                        <span className="condition-text">{condition.trim()}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
              
              {vehicle.rental_conditions_pdf && (
                <div className="pdf-download">
                  {!vehicle.rental_conditions && (
                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                      Les conditions de location sont disponibles en PDF ci-dessous
                    </p>
                  )}
                  <a 
                    href={`http://localhost:5000${vehicle.rental_conditions_pdf}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-pdf-btn"
                  >
                    📄 Voir/Télécharger les conditions (PDF)
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="vehicle-info-details">
          <div className="vehicle-header-details">
            <h1>{vehicle.brand} {vehicle.model}</h1>
            <p className="agency-name">Agence: {vehicle.agency_name}</p>
            {vehicle.avg_rating && (
              <div className="rating">
                {`${parseFloat(vehicle.avg_rating).toFixed(1)}/5`} ({vehicle.review_count} avis)
              </div>
            )}
          </div>

          <div className="vehicle-price">
            <span className="price-amount">{vehicle.price_per_hour}€</span>
            <span className="price-unit">/heure</span>
          </div>

          <div className="vehicle-specs-details">
            <div className="spec-item">
              <span className="spec-label">Places</span>
              <span className="spec-value">{vehicle.seats}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Carburant</span>
              <span className="spec-value">{getFuelIcon(vehicle.fuel_type)}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Moteur</span>
              <span className="spec-value">{vehicle.engine || 'N/A'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Réservoir</span>
              <span className="spec-value">{vehicle.tank_capacity ? `${vehicle.tank_capacity}L` : 'N/A'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Localisation</span>
              <span className="spec-value">{vehicle.location}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Année</span>
              <span className="spec-value">{vehicle.release_date ? new Date(vehicle.release_date).getFullYear() : 'N/A'}</span>
            </div>
          </div>

          <div className="vehicle-addresses">
            <h3>Adresses de prise en charge</h3>
            <div className="address-info">
              <div className="address-item">
                <strong>Récupération :</strong>
                <p>{vehicle.pickup_address || vehicle.location}</p>
              </div>
              <div className="address-item">
                <strong>Dépôt/Retour :</strong>
                <p>{vehicle.return_address || vehicle.location}</p>
              </div>
            </div>
          </div>

          <div className="vehicle-actions">
            <button 
              className="reserve-btn"
              onClick={() => {
                if (reservations.length > 0) {
                  showToast('Ce véhicule est actuellement réservé', 'warning');
                  return;
                }
                if (!isAuthenticated) {
                  navigate('/auth', { state: { returnTo: `/vehicle/${id}` } });
                } else {
                  setShowReservationForm(!showReservationForm);
                }
              }}
              disabled={reservations.length > 0}
              style={{
                opacity: reservations.length > 0 ? 0.5 : 1,
                cursor: reservations.length > 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {reservations.length > 0 ? 'Déjà réservé' : (showReservationForm ? 'Annuler' : 'Réserver')}
            </button>
            <button 
              className="contact-btn" 
              onClick={handleContactAgency}
            >
              Contacter l'agence
            </button>
            <ShareButton vehicle={vehicle} />
            {!isAuthenticated && (
              <p className="login-message">
                Connectez-vous pour réserver ce véhicule
              </p>
            )}
            {reservations.length > 0 && (
              <div className="reserved-info">
                <p>⚠️ Ce véhicule est actuellement réservé</p>
                <ul>
                  {reservations.map((res, idx) => (
                    <li key={idx}>
                      Jusqu'au {new Date(res.end_date).toLocaleDateString('fr-FR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {showReservationForm && isClient && reservations.length === 0 && (
            <form className="reservation-form" onSubmit={handleReservation}>
              <h3>Réserver ce véhicule</h3>
              
              <div className="form-group">
                <label>Date et heure de début</label>
                <input
                  type="datetime-local"
                  value={reservationData.start_date}
                  onChange={(e) => setReservationData({
                    ...reservationData,
                    start_date: e.target.value
                  })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="form-group">
                <label>Date et heure de fin</label>
                <input
                  type="datetime-local"
                  value={reservationData.end_date}
                  onChange={(e) => setReservationData({
                    ...reservationData,
                    end_date: e.target.value
                  })}
                  required
                  min={reservationData.start_date || new Date().toISOString().slice(0, 16)}
                />
              </div>

              {reservationData.start_date && reservationData.end_date && (
                <div className="total-price">
                  <span>Prix total estimé :</span>
                  <span className="price-value">{calculateTotalPrice()}€</span>
                </div>
              )}

              <button type="submit" className="submit-reservation-btn">
                Confirmer la réservation
              </button>
            </form>
          )}
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="reviews-section">
          <h2>Avis clients ({reviews.length})</h2>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <span className="review-author">
                    {review.first_name} {review.last_name}
                  </span>
                  <span className="review-rating">
                    {`${review.rating}/5`}
                  </span>
                </div>
                {review.comment && <p className="review-comment">{review.comment}</p>}
                <span className="review-date">
                  {new Date(review.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      {showLightbox && images.length > 0 && (
        <ImageLightbox
          imageUrl={`http://localhost:5000${images[selectedImage]?.image_url}`}
          alt={`${vehicle.brand} ${vehicle.model}`}
          onClose={() => setShowLightbox(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default VehicleDetails;