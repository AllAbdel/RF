import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import '../styles/Favorites.css';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get('/favorites');
      setFavorites(response.data.favorites);
    } catch (err) {
      console.error('Erreur chargement favoris:', err);
      setError('Impossible de charger vos favoris');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (vehicleId) => {
    try {
      await axios.delete(`/favorites/${vehicleId}`);
      setFavorites(favorites.filter(f => f.id !== vehicleId));
    } catch (err) {
      console.error('Erreur suppression favori:', err);
    }
  };

  const addToComparator = (vehicle) => {
    const comparator = JSON.parse(localStorage.getItem('comparator') || '[]');
    if (comparator.length >= 3) {
      alert('Vous ne pouvez comparer que 3 véhicules maximum');
      return;
    }
    if (comparator.find(v => v.id === vehicle.id)) {
      alert('Ce véhicule est déjà dans le comparateur');
      return;
    }
    comparator.push(vehicle);
    localStorage.setItem('comparator', JSON.stringify(comparator));
    alert('Véhicule ajouté au comparateur');
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="favorites-page">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement de vos favoris...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="favorites-page">
      <div className="favorites-header">
        <h1>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          Mes Favoris
        </h1>
        <p>{favorites.length} véhicule{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''}</p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <h2>Aucun favori</h2>
          <p>Parcourez nos véhicules et ajoutez vos préférés en cliquant sur le cœur</p>
          <Link to="/" className="browse-btn">Parcourir les véhicules</Link>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map(vehicle => (
            <div key={vehicle.id} className="favorite-card">
              <div className="favorite-image">
                <img 
                  src={vehicle.primary_image ? `http://localhost:5000${vehicle.primary_image}` : '/placeholder-car.jpg'} 
                  alt={`${vehicle.brand} ${vehicle.model}`}
                />
                <button 
                  className="remove-favorite-btn"
                  onClick={() => removeFavorite(vehicle.id)}
                  title="Retirer des favoris"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
              </div>
              
              <div className="favorite-info">
                <h3>{vehicle.brand} {vehicle.model}</h3>
                <p className="agency-name">{vehicle.agency_name}</p>
                
                <div className="vehicle-specs">
                  <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> {vehicle.seats} places</span>
                  <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> {vehicle.fuel_type}</span>
                </div>
                
                <div className="rating">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span>{parseFloat(vehicle.avg_rating || 0).toFixed(1)}</span>
                  <span className="review-count">({vehicle.review_count || 0} avis)</span>
                </div>
                
                <div className="favorite-footer">
                  <span className="price">{vehicle.price_per_hour}€<small>/h</small></span>
                  <div className="favorite-actions">
                    <button 
                      className="compare-btn"
                      onClick={() => addToComparator(vehicle)}
                      title="Ajouter au comparateur"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                      </svg>
                    </button>
                    <Link to={`/vehicle/${vehicle.id}`} className="view-btn">Voir</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {favorites.length > 0 && (
        <div className="favorites-actions">
          <Link to="/comparator" className="comparator-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Ouvrir le comparateur
          </Link>
        </div>
      )}
    </div>
    </>
  );
}
