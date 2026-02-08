import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import '../styles/Comparator.css';

export default function ComparatorPage() {
  const [vehicles, setVehicles] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Charger les véhicules du comparateur depuis localStorage
    const stored = JSON.parse(localStorage.getItem('comparator') || '[]');
    setVehicles(stored);

    // Charger tous les véhicules pour la recherche
    fetchAllVehicles();
  }, []);

  const fetchAllVehicles = async () => {
    try {
      const response = await axios.get('/vehicles');
      setAllVehicles(response.data.vehicles);
    } catch (err) {
      console.error('Erreur chargement véhicules:', err);
    }
  };

  const addVehicle = (vehicle) => {
    if (vehicles.length >= 3) {
      alert('Maximum 3 véhicules dans le comparateur');
      return;
    }
    if (vehicles.find(v => v.id === vehicle.id)) {
      alert('Ce véhicule est déjà dans le comparateur');
      return;
    }
    const updated = [...vehicles, vehicle];
    setVehicles(updated);
    localStorage.setItem('comparator', JSON.stringify(updated));
    setShowAddModal(false);
    setSearchQuery('');
  };

  const removeVehicle = (vehicleId) => {
    const updated = vehicles.filter(v => v.id !== vehicleId);
    setVehicles(updated);
    localStorage.setItem('comparator', JSON.stringify(updated));
  };

  const clearAll = () => {
    setVehicles([]);
    localStorage.removeItem('comparator');
  };

  const filteredVehicles = allVehicles.filter(v => 
    !vehicles.find(cv => cv.id === v.id) &&
    (`${v.brand} ${v.model}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
     v.agency_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Trouver la meilleure valeur pour chaque critère
  const getBestValue = (field, isLowerBetter = false) => {
    if (vehicles.length === 0) return null;
    const values = vehicles.map(v => parseFloat(v[field]) || 0);
    return isLowerBetter ? Math.min(...values) : Math.max(...values);
  };

  const renderComparisonRow = (label, field, unit = '', isLowerBetter = false, format = null) => {
    const bestValue = getBestValue(field, isLowerBetter);
    
    return (
      <tr>
        <td className="label-cell">{label}</td>
        {vehicles.map(v => {
          const value = v[field];
          const numValue = parseFloat(value) || 0;
          const isBest = numValue === bestValue && vehicles.length > 1;
          const displayValue = format ? format(value) : (value || '-');
          
          return (
            <td key={v.id} className={isBest ? 'best-value' : ''}>
              {displayValue}{unit && value ? unit : ''}
              {isBest && <span className="best-badge">Meilleur</span>}
            </td>
          );
        })}
        {vehicles.length < 3 && <td className="empty-cell"></td>}
        {vehicles.length < 2 && <td className="empty-cell"></td>}
      </tr>
    );
  };

  return (
    <>
    <Header />
    <div className="comparator-page">
      <div className="comparator-header">
        <h1>
          Comparateur de véhicules
        </h1>
        <p>Comparez jusqu'à 3 véhicules côte à côte</p>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-comparator">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <h2>Aucun véhicule à comparer</h2>
          <p>Ajoutez des véhicules depuis la liste ou vos favoris</p>
          <div className="empty-actions">
            <button className="add-btn" onClick={() => setShowAddModal(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ajouter un véhicule
            </button>
            <Link to="/" className="browse-btn">Parcourir les véhicules</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="comparator-actions">
            {vehicles.length < 3 && (
              <button className="add-btn" onClick={() => setShowAddModal(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Ajouter ({3 - vehicles.length} restant{3 - vehicles.length > 1 ? 's' : ''})
              </button>
            )}
            <button className="clear-btn" onClick={clearAll}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Tout effacer
            </button>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="label-cell"></th>
                  {vehicles.map(v => (
                    <th key={v.id} className="vehicle-header">
                      <button 
                        className="remove-btn"
                        onClick={() => removeVehicle(v.id)}
                        title="Retirer"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                      <div className="vehicle-thumb">
                        <img 
                          src={v.primary_image ? `http://localhost:5000${v.primary_image}` : '/placeholder-car.jpg'} 
                          alt={`${v.brand} ${v.model}`}
                        />
                      </div>
                      <h3>{v.brand} {v.model}</h3>
                      <p>{v.agency_name}</p>
                      <Link to={`/vehicle/${v.id}`} className="detail-link">Voir détails</Link>
                    </th>
                  ))}
                  {vehicles.length < 3 && (
                    <th className="add-vehicle-cell" onClick={() => setShowAddModal(true)}>
                      <div className="add-placeholder">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        <span>Ajouter</span>
                      </div>
                    </th>
                  )}
                  {vehicles.length < 2 && <th className="empty-cell"></th>}
                </tr>
              </thead>
              <tbody>
                <tr className="section-row">
                  <td colSpan={4}>Tarification</td>
                </tr>
                {renderComparisonRow('Prix / heure', 'price_per_hour', '€', true)}
                
                <tr className="section-row">
                  <td colSpan={4}>Caractéristiques</td>
                </tr>
                {renderComparisonRow('Places', 'seats', '')}
                {renderComparisonRow('Carburant', 'fuel_type', '', false, v => {
                  const labels = { essence: 'Essence', diesel: 'Diesel', electrique: 'Électrique', hybride: 'Hybride' };
                  return labels[v] || v;
                })}
                {renderComparisonRow('Moteur', 'engine')}
                {renderComparisonRow('Réservoir', 'tank_capacity', 'L')}
                
                <tr className="section-row">
                  <td colSpan={4}>Évaluations</td>
                </tr>
                {renderComparisonRow('Note moyenne', 'avg_rating', '/5', false, v => v ? parseFloat(v).toFixed(1) : '-')}
                {renderComparisonRow('Nombre d\'avis', 'review_count')}
                
                <tr className="section-row">
                  <td colSpan={4}>Localisation</td>
                </tr>
                {renderComparisonRow('Ville', 'location')}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ajouter un véhicule</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher un véhicule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="vehicle-list">
              {filteredVehicles.slice(0, 10).map(v => (
                <div key={v.id} className="vehicle-item" onClick={() => addVehicle(v)}>
                  <img 
                    src={v.primary_image ? `http://localhost:5000${v.primary_image}` : '/placeholder-car.jpg'} 
                    alt={`${v.brand} ${v.model}`}
                  />
                  <div className="vehicle-item-info">
                    <h4>{v.brand} {v.model}</h4>
                    <p>{v.agency_name} • {v.price_per_hour}€/h</p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
              ))}
              {filteredVehicles.length === 0 && (
                <p className="no-results">Aucun véhicule trouvé</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
