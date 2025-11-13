import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { vehicleAPI, reservationAPI, messageAPI } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/VehicleDetails.css';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isClient, isAuthenticated } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
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
      setVehicle(response.data.vehicle);
      setImages(response.data.images);
      setReviews(response.data.reviews);
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
      alert('Veuillez vous connecter pour réserver ce véhicule');
      navigate('/auth', { state: { returnTo: `/vehicle/${id}` } });
      return;
    }

    // Si authentifié mais pas client
    if (!isClient) {
      alert('Vous devez être connecté en tant que client pour réserver');
      return;
    }

    try {
      // Vérifier disponibilité
      const availResponse = await vehicleAPI.checkAvailability(id, reservationData);
      
      if (!availResponse.data.available) {
        alert('Ce véhicule n\'est pas disponible pour ces dates');
        return;
      }

      // Créer la réservation
      await reservationAPI.create({
        vehicle_id: id,
        ...reservationData
      });

      alert('Réservation créée avec succès ! En attente de validation par l\'agence.');
      navigate('/client');
    } catch (error) {
      console.error('Erreur réservation:', error);
      alert(error.response?.data?.error || 'Erreur lors de la réservation');
    }
  };

  const handleContactAgency = async () => {
    if (!isAuthenticated) {
      alert('Veuillez vous connecter pour contacter l\'agence');
      navigate('/auth', { state: { returnTo: `/vehicle/${id}` } });
      return;
    }

    if (!isClient) {
      alert('Vous devez être connecté en tant que client pour contacter l\'agence');
      return;
    }

    try {
      await messageAPI.getOrCreateConversation(vehicle.agency_id);
      alert('Vous pouvez maintenant contacter l\'agence depuis votre messagerie');
      navigate('/client');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la conversation');
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
        <div className="vehicle-images">
          <div className="main-image">
            {images.length > 0 ? (
              <img 
                src={`http://localhost:5000${images[selectedImage]?.image_url}`} 
                alt={vehicle.brand}
              />
            ) : (
              <div className="no-image">Pas d'image</div>
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
                />
              ))}
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

          {vehicle.description && (
            <div className="vehicle-description">
              <h3>Description</h3>
              <p>{vehicle.description}</p>
            </div>
          )}

          <div className="vehicle-actions">
            <button 
              className="reserve-btn"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/auth', { state: { returnTo: `/vehicle/${id}` } });
                } else {
                  setShowReservationForm(!showReservationForm);
                }
              }}
            >
              {showReservationForm ? 'Annuler' : 'Réserver'}
            </button>
            <button 
              className="contact-btn" 
              onClick={handleContactAgency}
            >
              Contacter l'agence
            </button>
            {!isAuthenticated && (
              <p className="login-message">
                Connectez-vous pour réserver ce véhicule
              </p>
            )}
          </div>

          {showReservationForm && isClient && (
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

      <Footer />
    </div>
  );
};

export default VehicleDetails;