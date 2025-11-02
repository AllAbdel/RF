import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { agencyAPI, vehicleAPI, reservationAPI } from '../services/api';
import VehicleForm from '../components/VehicleForm';
import VehicleList from '../components/VehicleList';
import ReservationList from '../components/ReservationList';
import AgencyMembers from '../components/AgencyMembers';
import AgencyStats from '../components/AgencyStats';
import '../styles/Agency.css';
import { useNavigate } from 'react-router-dom';

const AgencyDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('vehicles');
  const [vehicles, setVehicles] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'vehicles') {
        const response = await vehicleAPI.getAgencyVehicles();
        setVehicles(response.data.vehicles);
      } else if (activeTab === 'reservations') {
        const response = await reservationAPI.getAgencyReservations();
        setReservations(response.data.reservations);
      } else if (activeTab === 'stats') {
        const response = await agencyAPI.getStats();
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSubmit = async (formData) => {
    try {
      if (selectedVehicle) {
        await vehicleAPI.update(selectedVehicle.id, formData);
      } else {
        await vehicleAPI.create(formData);
      }
      setShowVehicleForm(false);
      setSelectedVehicle(null);
      loadData();
    } catch (error) {
      console.error('Erreur sauvegarde véhicule:', error);
      alert('Erreur lors de la sauvegarde du véhicule');
    }
  };

  const handleVehicleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleForm(true);
  };

  const handleVehicleDelete = async (vehicleId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      try {
        await vehicleAPI.delete(vehicleId);
        loadData();
      } catch (error) {
        console.error('Erreur suppression véhicule:', error);
        alert('Erreur lors de la suppression du véhicule');
      }
    }
  };

  const handleReservationStatusUpdate = async (reservationId, status) => {
    try {
      await reservationAPI.updateStatus(reservationId, status);
      loadData();
    } catch (error) {
      console.error('Erreur mise à jour réservation:', error);
      alert('Erreur lors de la mise à jour de la réservation');
    }
  };

  return (
    <div className="agency-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{user?.agency_name || 'Mon Agence'}</h1>
          <div className="header-actions">
            <span className="user-info">
              {user?.first_name} {user?.last_name} 
              {user?.role === 'super_admin' && ' (Super Admin)'}
              {user?.role === 'admin' && ' (Admin)'}
            </span>
            <button className="logout-btn" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-btn ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveTab('vehicles')}
        >
          Véhicules
        </button>
        <button
          className={`nav-btn ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          Réservations
        </button>
        <button
          className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistiques
        </button>
        <button
          className={`nav-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => navigate('/messages')}
        >
          Messages
        </button>
        {user?.isAdmin && (
            <button
            className={`nav-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Membres
          </button>
          
        )}
      </nav>

      <main className="dashboard-content">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : (
          <>
            {activeTab === 'vehicles' && (
              <div className="vehicles-section">
                <div className="section-header">
                  <h2>Gestion des véhicules</h2>
                  <button
                    className="add-btn"
                    onClick={() => {
                      setSelectedVehicle(null);
                      setShowVehicleForm(true);
                    }}
                  >
                    + Ajouter un véhicule
                  </button>
                </div>

                {showVehicleForm ? (
                  <VehicleForm
                    vehicle={selectedVehicle}
                    onSubmit={handleVehicleSubmit}
                    onCancel={() => {
                      setShowVehicleForm(false);
                      setSelectedVehicle(null);
                    }}
                  />
                ) : (
                  <VehicleList
                    vehicles={vehicles}
                    onEdit={handleVehicleEdit}
                    onDelete={handleVehicleDelete}
                  />
                )}
              </div>
            )}

            {activeTab === 'reservations' && (
              <div className="reservations-section">
                <h2>Gestion des réservations</h2>
                <ReservationList
                  reservations={reservations}
                  onStatusUpdate={handleReservationStatusUpdate}
                  isAgency={true}
                />
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <AgencyStats stats={stats} />
            )}

            {activeTab === 'members' && user?.isAdmin && (
              <AgencyMembers />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AgencyDashboard;
