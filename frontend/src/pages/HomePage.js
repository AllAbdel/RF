import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { vehicleAPI } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import SearchBar from '../components/SearchBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isClient, isAgency } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

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

  // Catégoriser les véhicules
  const getNewestVehicles = () => {
    return [...filteredVehicles]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);
  };

  const getTopRatedVehicles = () => {
    return [...filteredVehicles]
      .sort((a, b) => (parseFloat(b.avg_rating) || 0) - (parseFloat(a.avg_rating) || 0))
      .slice(0, 8);
  };

  const getVehiclesByAgency = () => {
    const byAgency = {};
    filteredVehicles.forEach(v => {
      if (!byAgency[v.agency_name]) {
        byAgency[v.agency_name] = [];
      }
      byAgency[v.agency_name].push(v);
    });
    return byAgency;
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
          filtered.sort((a, b) => (parseFloat(b.avg_rating) || 0) - (parseFloat(a.avg_rating) || 0));
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
      <Header />

      <section className="hero-section">
        <h2>Trouvez votre véhicule idéal</h2>
        <p>Réservez en quelques clics parmi des centaines de véhicules disponibles</p>
      </section>

      <div className="home-content">
        <SearchBar onFilterChange={handleSearch} />
        
        <div className="vehicles-count">
          {filteredVehicles.length} véhicule{filteredVehicles.length > 1 ? 's' : ''} disponible{filteredVehicles.length > 1 ? 's' : ''}
        </div>

        {/* Tabs de catégories */}
        <div className="category-tabs">
          <button 
            className={activeCategory === 'all' ? 'tab active' : 'tab'}
            onClick={() => setActiveCategory('all')}
          >
            Tous les véhicules
          </button>
          <button 
            className={activeCategory === 'newest' ? 'tab active' : 'tab'}
            onClick={() => setActiveCategory('newest')}
          >
            Nouveautés
          </button>
          <button 
            className={activeCategory === 'top-rated' ? 'tab active' : 'tab'}
            onClick={() => setActiveCategory('top-rated')}
          >
            Les mieux notés
          </button>
          <button 
            className={activeCategory === 'by-agency' ? 'tab active' : 'tab'}
            onClick={() => setActiveCategory('by-agency')}
          >
            Par agence
          </button>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="no-vehicles">
            <p>Aucun véhicule trouvé avec ces critères</p>
          </div>
        ) : (
          <>
            {/* Affichage selon la catégorie */}
            {activeCategory === 'all' && (
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

            {activeCategory === 'newest' && (
              <div className="vehicles-section">
                <h3 className="section-title">Dernières Nouveautés</h3>
                <div className="vehicles-grid">
                  {getNewestVehicles().map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onClick={() => handleVehicleClick(vehicle.id)}
                      badge="Nouveau"
                    />
                  ))}
                </div>
              </div>
            )}

            {activeCategory === 'top-rated' && (
              <div className="vehicles-section">
                <h3 className="section-title">Les Mieux Notés</h3>
                <div className="vehicles-grid">
                  {getTopRatedVehicles().map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onClick={() => handleVehicleClick(vehicle.id)}
                      badge={vehicle.avg_rating ? `⭐ ${parseFloat(vehicle.avg_rating).toFixed(1)}` : null}
                    />
                  ))}
                </div>
                {getTopRatedVehicles().length === 0 && (
                  <p className="no-rated">Aucun véhicule noté pour le moment</p>
                )}
              </div>
            )}

            {activeCategory === 'by-agency' && (
              <div className="agencies-section">
                {Object.entries(getVehiclesByAgency()).map(([agencyName, agencyVehicles]) => (
                  <div key={agencyName} className="agency-group">
                    <h3 className="agency-title">{agencyName}</h3>
                    <div className="vehicles-grid">
                      {agencyVehicles.slice(0, 4).map((vehicle) => (
                        <VehicleCard
                          key={vehicle.id}
                          vehicle={vehicle}
                          onClick={() => handleVehicleClick(vehicle.id)}
                        />
                      ))}
                    </div>
                    {agencyVehicles.length > 4 && (
                      <button 
                        className="view-more-btn"
                        onClick={() => {
                          setActiveCategory('all');
                          handleSearch({ search: agencyName });
                        }}
                      >
                        Voir tous les véhicules de {agencyName} ({agencyVehicles.length})
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
