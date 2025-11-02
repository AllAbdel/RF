import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { vehicleAPI, reservationAPI } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import SearchBar from '../components/SearchBar';
import MyReservations from '../components/MyReservations';
import '../styles/Client.css';
import { useNavigate } from 'react-router-dom';


const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('search');
  const [vehicles, setVehicles] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    fuel_type: '',
    min_price: '',
    max_price: '',
    location: '',
    sort: 'recent'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'search') {
      loadVehicles();
    } else if (activeTab === 'reservations') {
      loadReservations();
    }
  }, [activeTab, filters]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await vehicleAPI.getAll(filters);
      setVehicles(response.data.vehicles);
    } catch (error) {
      console.error('Erreur chargement véhicules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    setLoading(true);
    try {
      const response = await reservationAPI.getClientReservations();
      setReservations(response.data.reservations);
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleCancelReservation = async (reservationId) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      try {
        await reservationAPI.cancel(reservationId);
        loadReservations();
      } catch (error) {
        console.error('Erreur annulation réservation:', error);
        alert('Erreur lors de l\'annulation de la réservation');
      }
    }
  };

  return (
    <div className="client-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🚗 Location de Voitures</h1>
          <div className="header-actions">
            <span className="user-info">
              Bonjour, {user?.first_name} {user?.last_name}
            </span>
            <button className="logout-btn" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Rechercher
        </button>
        <button
          className={`nav-btn ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          📅 Mes réservations
        </button>
        <button
          className={`nav-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => navigate('/messages')}
        >
          💬 Messages
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'search' && (
          <div className="search-section">
            <SearchBar filters={filters} onFilterChange={handleFilterChange} />
            
            {loading ? (
              <div className="loading">Chargement...</div>
            ) : (
              <div className="vehicles-grid">
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))
                ) : (
                  <div className="no-results">
                    <p>Aucun véhicule trouvé</p>
                    <button onClick={() => setFilters({
                      search: '',
                      fuel_type: '',
                      min_price: '',
                      max_price: '',
                      location: '',
                      sort: 'recent'
                    })}>
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="reservations-section">
            <h2>Mes réservations</h2>
            {loading ? (
              <div className="loading">Chargement...</div>
            ) : (
              <MyReservations
                reservations={reservations}
                onCancel={handleCancelReservation}
                onRefresh={loadReservations}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
