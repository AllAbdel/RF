import React, { useState } from 'react';
import '../styles/SearchBar.css';

const SearchBar = ({ filters, onFilterChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters({ ...localFilters, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(localFilters);
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
            />
          </div>
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
