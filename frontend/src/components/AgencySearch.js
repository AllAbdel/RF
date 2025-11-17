import React, { useState, useEffect } from 'react';
import { agencyAPI } from '../services/api';
import '../styles/AgencySearch.css';

const AgencySearch = ({ onSelectAgency, selectedAgency }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchAgencies = async () => {
      if (search.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await agencyAPI.searchAgencies(search);
        setResults(response.data.agencies);
      } catch (error) {
        console.error('Erreur recherche agences:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      searchAgencies();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSelect = (agency) => {
    onSelectAgency(agency);
    setSearch('');
    setResults([]);
  };

  return (
    <div className="agency-search">
      <div className="form-group">
        <label>Rechercher une agence</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tapez le nom de l'agence..."
          disabled={selectedAgency !== null}
        />
      </div>

      {loading && <div className="search-loading">Recherche...</div>}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((agency) => (
            <div
              key={agency.id}
              className="search-result-item"
              onClick={() => handleSelect(agency)}
            >
              {agency.logo && (
                <img
                  src={`http://localhost:5000${agency.logo}`}
                  alt={agency.name}
                  className="agency-logo"
                />
              )}
              <div className="agency-info">
                <strong>{agency.name}</strong>
                <span>{agency.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAgency && (
        <div className="selected-agency">
          <div className="selected-agency-content">
            {selectedAgency.logo && (
              <img
                src={`http://localhost:5000${selectedAgency.logo}`}
                alt={selectedAgency.name}
                className="agency-logo"
              />
            )}
            <div className="agency-info">
              <strong>{selectedAgency.name}</strong>
              <span>{selectedAgency.email}</span>
            </div>
          </div>
          <button
            type="button"
            className="remove-selection-btn"
            onClick={() => onSelectAgency(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default AgencySearch;
