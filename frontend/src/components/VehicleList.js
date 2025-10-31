import React from 'react';
import '../styles/VehicleList.css';

const VehicleList = ({ vehicles, onEdit, onDelete }) => {
  const getStatusBadge = (status) => {
    const badges = {
      available: { text: 'Disponible', class: 'status-available' },
      rented: { text: 'Loué', class: 'status-rented' },
      maintenance: { text: 'Maintenance', class: 'status-maintenance' }
    };
    return badges[status] || badges.available;
  };

  const getFuelIcon = (fuelType) => {
    const icons = {
      essence: '⛽',
      diesel: '🛢️',
      electrique: '🔋',
      hybride: '🔌'
    };
    return icons[fuelType] || '⛽';
  };

  if (vehicles.length === 0) {
    return (
      <div className="empty-state">
        <p>Aucun véhicule enregistré</p>
        <p className="subtitle">Commencez par ajouter votre premier véhicule</p>
      </div>
    );
  }

  return (
    <div className="vehicle-list">
      {vehicles.map((vehicle) => {
        const statusBadge = getStatusBadge(vehicle.status);
        return (
          <div key={vehicle.id} className="vehicle-item">
            <div className="vehicle-item-image">
              {vehicle.primary_image ? (
                <img src={`http://localhost:5000${vehicle.primary_image}`} alt={vehicle.model} />
              ) : (
                <div className="no-image">📷</div>
              )}
            </div>

            <div className="vehicle-item-info">
              <div className="vehicle-item-header">
                <h3>{vehicle.brand} {vehicle.model}</h3>
                <span className={`status-badge ${statusBadge.class}`}>
                  {statusBadge.text}
                </span>
              </div>

              <div className="vehicle-item-details">
                <span>👥 {vehicle.seats} places</span>
                <span>{getFuelIcon(vehicle.fuel_type)} {vehicle.fuel_type}</span>
                <span>📍 {vehicle.location}</span>
                <span className="price">💰 {vehicle.price_per_hour}€/h</span>
              </div>

              {vehicle.active_reservations > 0 && (
                <div className="reservations-info">
                  📅 {vehicle.active_reservations} réservation(s) active(s)
                </div>
              )}
            </div>

            <div className="vehicle-item-actions">
              <button className="edit-btn" onClick={() => onEdit(vehicle)}>
                ✏️ Modifier
              </button>
              <button className="delete-btn" onClick={() => onDelete(vehicle.id)}>
                🗑️ Supprimer
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VehicleList;
