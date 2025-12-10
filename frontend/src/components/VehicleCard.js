import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/VehicleCard.css';

const VehicleCard = ({ vehicle, onCompareToggle }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [isCompared, setIsCompared] = useState(false);

  const defaultImage = '/no-image.svg';

  useEffect(() => {
    const compared = JSON.parse(localStorage.getItem('comparedVehicles') || '[]');
    setIsCompared(compared.some(v => v.id === vehicle.id));
  }, [vehicle.id]);

  const handleCompareToggle = (e) => {
    e.stopPropagation();
    const compared = JSON.parse(localStorage.getItem('comparedVehicles') || '[]');
    
    if (isCompared) {
      const updated = compared.filter(v => v.id !== vehicle.id);
      localStorage.setItem('comparedVehicles', JSON.stringify(updated));
      setIsCompared(false);
    } else {
      if (compared.length >= 3) {
        alert('Vous ne pouvez comparer que 3 véhicules maximum');
        return;
      }
      compared.push(vehicle);
      localStorage.setItem('comparedVehicles', JSON.stringify(compared));
      setIsCompared(true);
    }
    
    // Émettre un événement pour mettre à jour le widget de comparaison
    window.dispatchEvent(new Event('comparisonUpdated'));
    
    if (onCompareToggle) onCompareToggle();
  };

  const handleViewDetails = () => {
    navigate(`/vehicle/${vehicle.id}`);
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

  const getRemainingTime = (endDate) => {
    if (!endDate) return null;
    
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}j ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  const getRentalDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end - start;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}j ${hours}h`;
    }
    return `${hours}h`;
  };

  const isNewVehicle = () => {
    if (!vehicle.created_at) return false;
    const now = new Date();
    const created = new Date(vehicle.created_at);
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  const remainingTime = getRemainingTime(vehicle.current_reservation_end);
  const rentalDuration = getRentalDuration(vehicle.current_reservation_start, vehicle.current_reservation_end);

  return (
    <div className="vehicle-card" onClick={handleViewDetails}>
      <div className="vehicle-image">
        <img
          src={imageError || !vehicle.primary_image ? defaultImage : `http://localhost:5000${vehicle.primary_image}`}
          alt={`${vehicle.brand} ${vehicle.model}`}
          onError={() => setImageError(true)}
        />
        {vehicle.status === 'rented' && remainingTime && (
          <div className="status-badge rented">
            Loué ({rentalDuration}) - Dispo dans {remainingTime}
          </div>
        )}
        {vehicle.status === 'reserved' && remainingTime && (
          <div className="status-badge reserved">Réservé - reste {remainingTime}</div>
        )}
        {isNewVehicle() && !remainingTime && (
          <div className="status-badge new">Nouveau</div>
        )}
        {vehicle.reservation_count && parseInt(vehicle.reservation_count) > 10 && !remainingTime && (
          <div className="status-badge popular">Populaire</div>
        )}
        {!remainingTime && vehicle.status === 'available' && (
          <div className="status-badge available">Disponible</div>
        )}
        {vehicle.avg_rating && parseFloat(vehicle.avg_rating) > 0 ? (
          <div className="rating-badge">
            ⭐ {parseFloat(vehicle.avg_rating).toFixed(1)}/5 {vehicle.review_count > 0 && `(${vehicle.review_count} avis)`}
          </div>
        ) : (
          <div className="rating-badge no-rating">
            Pas encore d'avis
          </div>
        )}
      </div>

      <div className="vehicle-info">
        <div className="vehicle-header">
          <h3>{vehicle.brand} {vehicle.model}</h3>
          <p className="agency-name">{vehicle.agency_name}</p>
        </div>

        <div className="vehicle-specs">
          <span className="spec">
            {vehicle.seats} places
          </span>
          <span className="spec">
            {getFuelIcon(vehicle.fuel_type)}
          </span>
          <span className="spec">
            {vehicle.location}
          </span>
        </div>

        <div className="vehicle-footer">
          <div className="price">
            <span className="price-amount">{vehicle.price_per_hour}€</span>
            <span className="price-unit">/heure</span>
          </div>
          <div className="vehicle-actions">
            <div className="compare-checkbox-container" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isCompared}
                onChange={handleCompareToggle}
                className="compare-checkbox"
                id={`compare-${vehicle.id}`}
              />
              <label className="compare-label" htmlFor={`compare-${vehicle.id}`}>Comparer</label>
            </div>
            <button className="view-btn" onClick={handleViewDetails}>
              Voir détails
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
