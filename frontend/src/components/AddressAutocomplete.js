import React, { useState, useEffect, useRef } from 'react';
import '../styles/AddressAutocomplete.css';

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Rechercher une adresse...",
  label,
  required = false,
  name
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (searchQuery) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Utiliser l'API Nominatim d'OpenStreetMap (gratuite)
      // Restreint à la France avec countrycodes=fr
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=8&addressdetails=1&countrycodes=fr`,
        {
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'CarRentalApp/1.0'
          }
        }
      );
      const data = await response.json();
      
      const formattedSuggestions = data.map(item => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        address: item.address,
        // Créer une adresse courte
        shortAddress: [
          item.address?.house_number,
          item.address?.road,
          item.address?.city || item.address?.town || item.address?.village,
          item.address?.postcode
        ].filter(Boolean).join(', '),
        // Extraire la localisation (ville ou département)
        location: item.address?.city || item.address?.town || item.address?.village || item.address?.county || item.address?.state,
        // Pays toujours France
        country: 'France'
      }));
      
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Erreur recherche adresse:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    
    // Appeler onChange pour mettre à jour le formData parent
    if (onChange) {
      onChange({
        target: {
          name: name,
          value: newQuery
        }
      });
    }

    // Debounce la recherche
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchAddress(newQuery);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Appeler onChange avec la nouvelle valeur
    if (onChange) {
      onChange({
        target: {
          name: name,
          value: suggestion.display_name
        }
      });
    }
    
    // Appeler onSelect avec les coordonnées
    if (onSelect) {
      onSelect({
        address: suggestion.display_name,
        shortAddress: suggestion.shortAddress,
        latitude: suggestion.lat,
        longitude: suggestion.lon,
        addressDetails: suggestion.address,
        location: suggestion.location,
        country: suggestion.country
      });
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="address-autocomplete" ref={wrapperRef}>
      {label && (
        <label className="address-label">
          {label} {required && '*'}
        </label>
      )}
      <div className="address-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          className="address-input"
        />
        {isLoading && (
          <div className="address-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        <div className="address-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="address-suggestions">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="suggestion-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className="suggestion-text">
                <span className="suggestion-main">{suggestion.shortAddress}</span>
                <span className="suggestion-detail">{suggestion.display_name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
