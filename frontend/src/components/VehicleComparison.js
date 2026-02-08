import React, { useState, useEffect } from 'react';
import '../styles/VehicleComparison.css';

const VehicleComparison = () => {
  const [comparedVehicles, setComparedVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const vehicles = JSON.parse(localStorage.getItem('comparedVehicles') || '[]');
    setComparedVehicles(vehicles);

    // Écouter les changements de comparaison
    const handleComparisonUpdate = () => {
      const updated = JSON.parse(localStorage.getItem('comparedVehicles') || '[]');
      setComparedVehicles(updated);
    };

    window.addEventListener('comparisonUpdated', handleComparisonUpdate);
    
    return () => {
      window.removeEventListener('comparisonUpdated', handleComparisonUpdate);
    };
  }, []);

  const removeVehicle = (vehicleId) => {
    const updated = comparedVehicles.filter(v => v.id !== vehicleId);
    localStorage.setItem('comparedVehicles', JSON.stringify(updated));
    setComparedVehicles(updated);
  };

  const clearAll = () => {
    localStorage.removeItem('comparedVehicles');
    setComparedVehicles([]);
    setShowModal(false);
  };

  const handleCompare = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Calculer les différences pour mettre en évidence les points de comparaison
  const getComparisonData = () => {
    if (comparedVehicles.length === 0) return [];
    
    const criteria = [
      { 
        label: 'Prix par heure', 
        key: 'price_per_hour', 
        format: (v) => v ? `${v}€/h` : 'N/A',
        getBest: (vehicles) => Math.min(...vehicles.map(v => parseFloat(v.price_per_hour || 0)))
      },
      { 
        label: 'Prix par jour', 
        key: 'price_per_day', 
        format: (v) => v ? `${v}€/jour` : 'N/A',
        getBest: (vehicles) => Math.min(...vehicles.map(v => parseFloat(v.price_per_day || 0)))
      },
      { 
        label: 'Nombre de places', 
        key: 'seats', 
        format: (v) => v ? `${v} places` : 'N/A',
        getBest: (vehicles) => Math.max(...vehicles.map(v => parseInt(v.seats || 0)))
      },
      { 
        label: 'Année', 
        key: 'year', 
        format: (v) => v || 'N/A',
        getBest: (vehicles) => Math.max(...vehicles.map(v => parseInt(v.year || 0)))
      },
      { 
        label: 'Kilométrage', 
        key: 'mileage', 
        format: (v) => v ? `${parseInt(v).toLocaleString()} km` : 'N/A',
        getBest: (vehicles) => Math.min(...vehicles.map(v => parseInt(v.mileage || 0)))
      },
      { 
        label: 'Carburant', 
        key: 'fuel_type', 
        format: (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : 'N/A'
      },
      { 
        label: 'Transmission', 
        key: 'transmission', 
        format: (v) => v === 'manual' ? 'Manuelle' : v === 'automatic' ? 'Automatique' : 'N/A'
      },
      { 
        label: 'Catégorie', 
        key: 'category', 
        format: (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : 'N/A'
      },
      { 
        label: 'Agence', 
        key: 'agency_name', 
        format: (v) => v || 'N/A'
      },
      { 
        label: 'Localisation', 
        key: 'location', 
        format: (v) => v || 'N/A'
      }
    ];

    return criteria;
  };

  if (comparedVehicles.length === 0) return null;

  return (
    <div className="comparison-floating">
      <div className="comparison-header">
        <h4>Comparaison ({comparedVehicles.length}/3)</h4>
        <button onClick={clearAll} className="clear-btn">Effacer tout</button>
      </div>
      <div className="comparison-items">
        {comparedVehicles.map(vehicle => (
          <div key={vehicle.id} className="comparison-item">
            <img 
              src={vehicle.primary_image ? `http://localhost:5000${vehicle.primary_image}` : '/no-image.svg'} 
              alt={vehicle.brand}
              onError={(e) => { e.target.src = '/no-image.svg'; }}
            />
            <div className="comparison-info">
              <p className="vehicle-name">{vehicle.brand} {vehicle.model}</p>
              <p className="vehicle-price">{vehicle.price_per_hour}€/h</p>
            </div>
            <button onClick={() => removeVehicle(vehicle.id)} className="remove-btn">×</button>
          </div>
        ))}
      </div>
      {comparedVehicles.length >= 2 && (
        <button className="compare-btn" onClick={handleCompare}>
          Comparer maintenant
        </button>
      )}

      {showModal && (
        <div className="comparison-modal-overlay" onClick={closeModal}>
          <div className="comparison-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Comparaison détaillée</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-content">
              {/* En-têtes des véhicules */}
              <div className="comparison-table">
                <div className="comparison-row header-row">
                  <div className="comparison-cell criteria-cell">Critères</div>
                  {comparedVehicles.map(vehicle => (
                    <div key={vehicle.id} className="comparison-cell vehicle-header">
                      <img 
                        src={vehicle.primary_image ? `http://localhost:5000${vehicle.primary_image}` : '/no-image.svg'} 
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="vehicle-header-img"
                        onError={(e) => { e.target.src = '/no-image.svg'; }}
                      />
                      <h3>{vehicle.brand}</h3>
                      <p>{vehicle.model}</p>
                      <span className="vehicle-status">{vehicle.status === 'available' ? 'Disponible' : 'Indisponible'}</span>
                    </div>
                  ))}
                </div>

                {/* Lignes de comparaison */}
                {getComparisonData().map((criterion, idx) => {
                  const bestValue = criterion.getBest ? criterion.getBest(comparedVehicles) : null;
                  
                  return (
                    <div key={idx} className="comparison-row">
                      <div className="comparison-cell criteria-cell">
                        <strong>{criterion.label}</strong>
                      </div>
                      {comparedVehicles.map(vehicle => {
                        const value = vehicle[criterion.key];
                        const formattedValue = criterion.format(value);
                        const isBest = bestValue !== null && (
                          (criterion.key === 'price_per_hour' || criterion.key === 'price_per_day' || criterion.key === 'mileage') 
                            ? parseFloat(value) === bestValue
                            : parseInt(value) === bestValue
                        );

                        return (
                          <div 
                            key={vehicle.id} 
                            className={`comparison-cell value-cell ${isBest ? 'best-value' : ''}`}
                          >
                            {formattedValue}
                            {isBest && <span className="best-badge">Meilleur</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div className="modal-actions">
                <button className="modal-btn secondary" onClick={clearAll}>
                  Effacer la comparaison
                </button>
                <button className="modal-btn primary" onClick={closeModal}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleComparison;
