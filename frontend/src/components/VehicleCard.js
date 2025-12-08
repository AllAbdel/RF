import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/VehicleCard.css';

const VehicleCard = ({ vehicle }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const defaultImage = '/no-image.svg';

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

  const remainingTime = getRemainingTime(vehicle.current_reservation_end);

  return (
    <div className="vehicle-card" onClick={handleViewDetails}>
      <div className="vehicle-image">
        <img
          src={imageError || !vehicle.primary_image ? defaultImage : `http://localhost:5000${vehicle.primary_image}`}
          alt={`${vehicle.brand} ${vehicle.model}`}
          onError={() => setImageError(true)}
        />
        {vehicle.status === 'rented' && (
          <div className="status-badge rented">Loué</div>
        )}
        {remainingTime && (
          <div className="status-badge reserved">Réservé - reste {remainingTime}</div>
        )}
        {vehicle.avg_rating && (
          <div className="rating-badge">
            {`${parseFloat(vehicle.avg_rating).toFixed(1)}/5`}
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
          <button className="view-btn" onClick={handleViewDetails}>
            Voir détails
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
