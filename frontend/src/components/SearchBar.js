import React, { useState, useEffect } from 'react';
import '../styles/SearchBar.css';

const SearchBar = ({ filters = {}, onFilterChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: filters.search || '',
    fuel_type: filters.fuel_type || '',
    min_price: filters.min_price || '',
    max_price: filters.max_price || '',
    location: filters.location || '',
    sort: filters.sort || 'recent'
  });

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);
  }, []);

  const saveToHistory = (searchTerm) => {
    if (!searchTerm.trim()) return;
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const newHistory = [searchTerm, ...history.filter(h => h !== searchTerm)].slice(0, 5);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    setSearchHistory(newHistory);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters({ ...localFilters, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveToHistory(localFilters.search);
    onFilterChange(localFilters);
    setShowHistory(false);
  };

  const handleQuickPrice = (min, max) => {
    const newFilters = { ...localFilters, min_price: min, max_price: max };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleHistoryClick = (searchTerm) => {
    const newFilters = { ...localFilters, search: searchTerm };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
    setShowHistory(false);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      fuel_type: '',
      min_price: '',
      max_price: '',
      location: '',
      sort: 'recent'
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit}>
        <div className="search-main">
          <div className="search-input-group">
            <input
              type="text"
              name="search"
              placeholder="Rechercher une voiture (marque, modèle...)"
              value={localFilters.search}
              onChange={handleChange}
              onFocus={() => setShowHistory(searchHistory.length > 0)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            />
            {showHistory && searchHistory.length > 0 && (
              <div className="search-history">
                <p className="history-title">Recherches récentes</p>
                {searchHistory.map((term, index) => (
                  <button
                    key={index}
                    type="button"
                    className="history-item"
                    onClick={() => handleHistoryClick(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="search-buttons">
            <button type="submit" className="search-btn">
              Rechercher
            </button>
            <button
              type="button"
              className="advanced-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '▲ Moins de filtres' : '▼ Plus de filtres'}
            </button>
          </div>
        </div>

        {/* Filtres rapides par prix */}
        <div className="quick-price-filters">
          <span className="quick-filter-label">Prix rapides :</span>
          <button
            type="button"
            className="quick-price-badge"
            onClick={() => handleQuickPrice('', '20')}
          >
            Moins de 20€/h
          </button>
          <button
            type="button"
            className="quick-price-badge"
            onClick={() => handleQuickPrice('20', '50')}
          >
            20-50€/h
          </button>
          <button
            type="button"
            className="quick-price-badge"
            onClick={() => handleQuickPrice('50', '100')}
          >
            50-100€/h
          </button>
          <button
            type="button"
            className="quick-price-badge"
            onClick={() => handleQuickPrice('100', '')}
          >
            Plus de 100€/h
          </button>
        </div>

        {/* Filtres géographiques */}
        <div className="quick-location-filters">
          <span className="quick-filter-label">Villes populaires :</span>
          <button
            type="button"
            className="quick-location-badge"
            onClick={() => {
              const newFilters = { ...localFilters, location: 'Paris' };
              setLocalFilters(newFilters);
              onFilterChange(newFilters);
            }}
          >
            Paris
          </button>
          <button
            type="button"
            className="quick-location-badge"
            onClick={() => {
              const newFilters = { ...localFilters, location: 'Lyon' };
              setLocalFilters(newFilters);
              onFilterChange(newFilters);
            }}
          >
            Lyon
          </button>
          <button
            type="button"
            className="quick-location-badge"
            onClick={() => {
              const newFilters = { ...localFilters, location: 'Marseille' };
              setLocalFilters(newFilters);
              onFilterChange(newFilters);
            }}
          >
            Marseille
          </button>
          <button
            type="button"
            className="quick-location-badge"
            onClick={() => {
              const newFilters = { ...localFilters, location: 'Toulouse' };
              setLocalFilters(newFilters);
              onFilterChange(newFilters);
            }}
          >
            Toulouse
          </button>
          <button
            type="button"
            className="quick-location-badge"
            onClick={() => {
              const newFilters = { ...localFilters, location: 'Nice' };
              setLocalFilters(newFilters);
              onFilterChange(newFilters);
            }}
          >
            Nice
          </button>
        </div>

        {showAdvanced && (
          <div className="search-advanced">
            <div className="filter-group">
              <label>Type de carburant</label>
              <select name="fuel_type" value={localFilters.fuel_type} onChange={handleChange}>
                <option value="">Tous</option>
                <option value="essence">Essence</option>
                <option value="diesel">Diesel</option>
                <option value="electrique">Électrique</option>
                <option value="hybride">Hybride</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Prix minimum (€/h)</label>
              <input
                type="number"
                name="min_price"
                placeholder="0"
                value={localFilters.min_price}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="filter-group">
              <label>Prix maximum (€/h)</label>
              <input
                type="number"
                name="max_price"
                placeholder="1000"
                value={localFilters.max_price}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="filter-group">
              <label>Localisation</label>
              <input
                type="text"
                name="location"
                placeholder="Ville..."
                value={localFilters.location}
                onChange={handleChange}
              />
            </div>

            <div className="filter-group">
              <label>Trier par</label>
              <select name="sort" value={localFilters.sort} onChange={handleChange}>
                <option value="recent">Plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="rating">Mieux notés</option>
              </select>
            </div>

            <div className="filter-actions">
              <button type="button" className="reset-btn" onClick={handleReset}>
                Réinitialiser
              </button>
              <button type="submit" className="apply-btn">
                Appliquer les filtres
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
