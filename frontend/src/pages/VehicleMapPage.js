import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../styles/VehicleMap.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom car icon
const carIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="11" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
      <text x="12" y="17" text-anchor="middle" fill="white" font-size="12">🚗</text>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Component to handle map centering
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 12);
    }
  }, [center, map]);
  return null;
};

const VehicleMapPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([48.8566, 2.3522]); // Paris par défaut
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filters, setFilters] = useState({
    brand: '',
    maxPrice: '',
    available: true
  });

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/vehicles');
      
      // Filtrer les véhicules avec coordonnées
      const vehiclesWithLocation = response.data.filter(v => 
        v.latitude && v.longitude && 
        !isNaN(parseFloat(v.latitude)) && !isNaN(parseFloat(v.longitude))
      );
      
      setVehicles(vehiclesWithLocation);
      
      // Centrer la carte sur le premier véhicule si disponible
      if (vehiclesWithLocation.length > 0) {
        setMapCenter([
          parseFloat(vehiclesWithLocation[0].latitude),
          parseFloat(vehiclesWithLocation[0].longitude)
        ]);
      }
      
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des véhicules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Filtrer les véhicules
  const filteredVehicles = vehicles.filter(vehicle => {
    if (filters.brand && !vehicle.brand.toLowerCase().includes(filters.brand.toLowerCase())) {
      return false;
    }
    if (filters.maxPrice && parseFloat(vehicle.price_per_day) > parseFloat(filters.maxPrice)) {
      return false;
    }
    if (filters.available && !vehicle.is_available) {
      return false;
    }
    return true;
  });

  // Obtenir les marques uniques pour le filtre
  const uniqueBrands = [...new Set(vehicles.map(v => v.brand))].sort();

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setMapCenter([parseFloat(vehicle.latitude), parseFloat(vehicle.longitude)]);
  };

  const handleViewDetails = (vehicleId) => {
    navigate(`/vehicles/${vehicleId}`);
  };

  if (loading) {
    return (
      <div className="map-loading">
        <div className="spinner"></div>
        <p>Chargement de la carte...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-error">
        <p>{error}</p>
        <button onClick={fetchVehicles}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="vehicle-map-page">
      <div className="map-sidebar">
        <h2>Véhicules disponibles</h2>
        
        <div className="map-filters">
          <div className="filter-group">
            <label>Marque</label>
            <select 
              value={filters.brand}
              onChange={(e) => setFilters({...filters, brand: e.target.value})}
            >
              <option value="">Toutes</option>
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Prix max / jour</label>
            <input 
              type="number" 
              placeholder="Ex: 100"
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
            />
          </div>
          
          <div className="filter-group checkbox">
            <label>
              <input 
                type="checkbox"
                checked={filters.available}
                onChange={(e) => setFilters({...filters, available: e.target.checked})}
              />
              Disponibles uniquement
            </label>
          </div>
        </div>

        <div className="vehicles-count">
          {filteredVehicles.length} véhicule(s) trouvé(s)
        </div>

        <div className="vehicle-list">
          {filteredVehicles.map(vehicle => (
            <div 
              key={vehicle.id} 
              className={`vehicle-list-item ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
              onClick={() => handleVehicleClick(vehicle)}
            >
              <img 
                src={vehicle.image_url ? `http://localhost:5000${vehicle.image_url}` : '/no-image.svg'}
                alt={`${vehicle.brand} ${vehicle.model}`}
                onError={(e) => { e.target.src = '/no-image.svg'; }}
              />
              <div className="vehicle-list-info">
                <h4>{vehicle.brand} {vehicle.model}</h4>
                <p className="vehicle-location">{vehicle.location || 'Non spécifié'}</p>
                <p className="vehicle-price">{vehicle.price_per_day}€/jour</p>
              </div>
              <span className={`availability ${vehicle.is_available ? 'available' : 'unavailable'}`}>
                {vehicle.is_available ? '✓' : '✗'}
              </span>
            </div>
          ))}
          
          {filteredVehicles.length === 0 && (
            <div className="no-vehicles">
              <p>Aucun véhicule ne correspond à vos critères</p>
            </div>
          )}
        </div>
      </div>

      <div className="map-container">
        <MapContainer 
          center={mapCenter} 
          zoom={12} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={mapCenter} />
          
          {filteredVehicles.map(vehicle => (
            <Marker
              key={vehicle.id}
              position={[parseFloat(vehicle.latitude), parseFloat(vehicle.longitude)]}
              icon={carIcon}
              eventHandlers={{
                click: () => handleVehicleClick(vehicle)
              }}
            >
              <Popup>
                <div className="map-popup">
                  <img 
                    src={vehicle.image_url ? `http://localhost:5000${vehicle.image_url}` : '/no-image.svg'}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    onError={(e) => { e.target.src = '/no-image.svg'; }}
                  />
                  <h4>{vehicle.brand} {vehicle.model}</h4>
                  <p className="popup-year">{vehicle.year}</p>
                  <p className="popup-price">{vehicle.price_per_day}€/jour</p>
                  <p className="popup-location">{vehicle.location}</p>
                  <button onClick={() => handleViewDetails(vehicle.id)}>
                    Voir détails
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default VehicleMapPage;
