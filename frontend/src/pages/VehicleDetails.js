import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { vehicleAPI, reservationAPI, messageAPI } from '../services/api';
import { showToast } from '../components/Toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShareButton from '../components/ShareButton';
import ImageLightbox from '../components/ImageLightbox';
import { FiArrowLeft, FiShare2, FiDownload, FiCheckCircle, FiStar, FiMapPin, FiFlag, FiUsers, FiCalendar, FiLock, FiSettings } from 'react-icons/fi';
import { MdLocalGasStation } from 'react-icons/md';
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
        {/* Breadcrumb */}
        <div className="vd-breadcrumb">
          <button className="vd-back-link" onClick={() => navigate(-1)}><FiArrowLeft className="vd-back-icon" /> Retour aux résultats</button>
          <div className="vd-breadcrumb-trail">
            <span onClick={() => navigate('/')} style={{cursor:'pointer'}}>Accueil</span>
            <span className="vd-sep">›</span>
            <span>Véhicules</span>
            <span className="vd-sep">›</span>
            <span className="vd-current">{vehicle.brand} {vehicle.model}</span>
          </div>
        </div>

        <div className="vd-layout">
          {/* LEFT COLUMN - Images & Description */}
          <div className="vd-left">
            <div className="vd-gallery">
              <div className="vd-main-image" onClick={() => images.length > 0 && setShowLightbox(true)} style={{ cursor: images.length > 0 ? 'zoom-in' : 'default' }}>
                {images.length > 0 ? (
                  <img 
                    src={`http://localhost:5000${images[selectedImage]?.image_url}`} 
                    alt={vehicle.brand}
                    onError={(e) => { e.target.src = '/no-image.svg'; }}
                  />
                ) : (
                  <img src="/no-image.svg" alt="Pas d'image" />
                )}
              </div>
              
              {images.length > 1 && (
                <div className="vd-thumbnails">
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

            {/* About section */}
            {vehicle.description && (
              <div className="vd-section">
                <h3>À propos de ce véhicule</h3>
                <p className="vd-description-text">{vehicle.description}</p>
              </div>
            )}

            {/* Rental conditions */}
            {(vehicle.rental_conditions || vehicle.rental_conditions_pdf) && (
              <div className="vd-section vd-conditions">
                <h3><FiDownload style={{verticalAlign:'middle'}} /> Conditions de location de l'agence</h3>
                
                {vehicle.rental_conditions && (
                  <div className="vd-conditions-list">
                    {vehicle.rental_conditions.split('\n').map((condition, index) => (
                      condition.trim() && (
                        <div key={index} className="vd-condition-item">
                          <FiCheckCircle className="vd-check" />
                          <span>{condition.trim()}</span>
                        </div>
                      )
                    ))}
                  </div>
                )}
                
                {vehicle.rental_conditions_pdf && (
                  <div className="vd-pdf-link">
                    <a 
                      href={`http://localhost:5000${vehicle.rental_conditions_pdf}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vd-pdf-btn"
                    >
                      Voir les conditions générales complètes ›
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="vd-section">
                <h2>Avis clients ({reviews.length})</h2>
                <div className="vd-reviews-list">
                  {reviews.map((review) => (
                      <div key={review.id} className="vd-review-card">
                      <div className="vd-review-header">
                        <span className="vd-review-author">{review.first_name} {review.last_name}</span>
                        <span className="vd-review-rating"><FiStar style={{color:'#f6c84c'}} /> {review.rating}/5</span>
                      </div>
                      {review.comment && <p className="vd-review-comment">{review.comment}</p>}
                      <span className="vd-review-date">
                        {new Date(review.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Sticky Sidebar */}
          <div className="vd-right">
            <div className="vd-sidebar">
              {/* Title + Rating */}
                <div className="vd-sidebar-header">
                <div className="vd-sidebar-title-row">
                  <h1>{vehicle.brand} {vehicle.model}</h1>
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                    {vehicle.avg_rating && (
                      <span className="vd-rating-badge"><FiStar style={{verticalAlign:'middle'}} /> {parseFloat(vehicle.avg_rating).toFixed(1)}</span>
                    )}
                    
                  </div>
                </div>
                <p className="vd-agency-name">
                  Proposé par <strong>{vehicle.agency_name}</strong>
                </p>
              </div>

              {/* Price */}
              <div className="vd-price-block">
                <span className="vd-price-amount">{vehicle.price_per_hour}€</span>
                <span className="vd-price-unit">/ heure</span>
              </div>

              {/* Specs */}
              <div className="vd-specs">
                <h4>CARACTÉRISTIQUES</h4>
                <div className="vd-specs-grid">
                  <div className="vd-spec">
                    <FiUsers className="vd-spec-icon" />
                    <div>
                      <small>Places</small>
                      <strong>{vehicle.seats}</strong>
                    </div>
                  </div>
                  <div className="vd-spec">
                    <MdLocalGasStation className="vd-spec-icon" />
                    <div>
                      <small>Carburant</small>
                      <strong>{getFuelIcon(vehicle.fuel_type)}</strong>
                    </div>
                  </div>
                  <div className="vd-spec">
                    <FiSettings className="vd-spec-icon" />
                    <div>
                      <small>Moteur</small>
                      <strong>{vehicle.engine || 'N/A'}</strong>
                    </div>
                  </div>
                  <div className="vd-spec">
                    <FiCalendar className="vd-spec-icon" />
                    <div>
                      <small>Année</small>
                      <strong>{vehicle.release_date ? new Date(vehicle.release_date).getFullYear() : 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="vd-addresses">
                <div className="vd-address">
                  <FiMapPin className="vd-address-icon" />
                  <div>
                    <strong>Prise en charge</strong>
                    <p>{vehicle.pickup_address || vehicle.location}</p>
                  </div>
                </div>
                <div className="vd-address">
                  <FiMapPin className="vd-address-icon" />
                  <div>
                    <strong>Retour</strong>
                    <p>{vehicle.return_address || vehicle.location}</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="vd-actions">
                <button 
                  className="vd-reserve-btn"
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
                >
                  {reservations.length > 0 ? 'Déjà réservé' : (showReservationForm ? 'Annuler' : 'Continuer vers la réservation ›')}
                </button>
                <button className="vd-contact-btn" onClick={handleContactAgency}>
                  Contacter l'agence
                </button>
                <div style={{marginTop:'0.5rem'}}>
                  <ShareButton vehicle={vehicle} />
                </div>
                {!isAuthenticated && (
                  <p className="vd-disclaimer"><FiLock style={{verticalAlign:'middle'}} /> Aucun montant ne sera débité pour le moment.</p>
                )}
                {isAuthenticated && !showReservationForm && (
                  <p className="vd-disclaimer"><FiLock style={{verticalAlign:'middle'}} /> Aucun montant ne sera débité pour le moment.</p>
                )}
              </div>

              {reservations.length > 0 && (
                <div className="vd-reserved-info">
                  <p><FiLock style={{verticalAlign:'middle'}} /> Ce véhicule est actuellement réservé</p>
                  <ul>
                    {reservations.map((res, idx) => (
                      <li key={idx}>
                        Jusqu'au {new Date(res.end_date).toLocaleDateString('fr-FR', { 
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showReservationForm && isClient && reservations.length === 0 && (
                <form className="vd-reservation-form" onSubmit={handleReservation}>
                  <h3>Réserver ce véhicule</h3>
                  
                  <div className="vd-form-group">
                    <label>Date et heure de début</label>
                    <input
                      type="datetime-local"
                      value={reservationData.start_date}
                      onChange={(e) => setReservationData({...reservationData, start_date: e.target.value})}
                      required
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  <div className="vd-form-group">
                    <label>Date et heure de fin</label>
                    <input
                      type="datetime-local"
                      value={reservationData.end_date}
                      onChange={(e) => setReservationData({...reservationData, end_date: e.target.value})}
                      required
                      min={reservationData.start_date || new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  {reservationData.start_date && reservationData.end_date && (
                    <div className="vd-total-price">
                      <span>Prix total estimé :</span>
                      <span className="vd-total-value">{calculateTotalPrice()}€</span>
                    </div>
                  )}

                  <button type="submit" className="vd-submit-btn">
                    Confirmer la réservation
                  </button>
                </form>
              )}
              
            </div>
          </div>
        </div>
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