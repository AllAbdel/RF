import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { vehicleAPI } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import SearchBar from '../components/SearchBar';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isClient, isAgency } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const response = await vehicleAPI.getAll();
      const availableVehicles = response.data.vehicles.filter(v => v.status === 'available');
      setVehicles(availableVehicles);
      setFilteredVehicles(availableVehicles);
    } catch (error) {
      console.error('Erreur chargement véhicules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters) => {
    let filtered = [...vehicles];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(v => 
        v.brand.toLowerCase().includes(searchLower) ||
        v.model.toLowerCase().includes(searchLower)
      );
    }

    if (filters.location) {
      filtered = filtered.filter(v => 
        v.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.fuel_type && filters.fuel_type !== '') {
      filtered = filtered.filter(v => v.fuel_type === filters.fuel_type);
    }

    if (filters.min_price) {
      filtered = filtered.filter(v => v.price_per_hour >= parseFloat(filters.min_price));
    }

    if (filters.max_price) {
      filtered = filtered.filter(v => v.price_per_hour <= parseFloat(filters.max_price));
    }

    // Tri
    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          filtered.sort((a, b) => a.price_per_hour - b.price_per_hour);
          break;
        case 'price_desc':
          filtered.sort((a, b) => b.price_per_hour - a.price_per_hour);
          break;
        case 'rating':
          filtered.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
          break;
        case 'recent':
        default:
          filtered.sort((a, b) => b.id - a.id);
          break;
      }
    }

    setFilteredVehicles(filtered);
  };

  const handleVehicleClick = (vehicleId) => {
    navigate(`/vehicle/${vehicleId}`);
  };

  const goToAuthPage = () => {
    navigate('/auth');
  };

  const goToDashboard = () => {
    if (isClient) {
      navigate('/client');
    } else if (isAgency) {
      navigate('/agency');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-content">
          <h1 className="logo">RentFlow</h1>
          <nav className="header-nav">
            {isAuthenticated ? (
              <button className="nav-btn dashboard-btn" onClick={goToDashboard}>
                Mon espace
              </button>
            ) : (
              <button className="nav-btn auth-btn" onClick={goToAuthPage}>
                Connexion / Inscription
              </button>
            )}
          </nav>
        </div>
      </header>

      <section className="hero-section">
        <h2>Trouvez votre véhicule idéal</h2>
        <p>Réservez en quelques clics parmi des centaines de véhicules disponibles</p>
      </section>

      <div className="home-content">
        <SearchBar onFilterChange={handleSearch} />
        
        <div className="vehicles-count">
          {filteredVehicles.length} véhicule{filteredVehicles.length > 1 ? 's' : ''} disponible{filteredVehicles.length > 1 ? 's' : ''}
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="no-vehicles">
            <p>Aucun véhicule trouvé avec ces critères</p>
          </div>
        ) : (
          <div className="vehicles-grid">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onClick={() => handleVehicleClick(vehicle.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
