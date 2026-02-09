import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { vehicleAPI, reservationAPI } from '../services/api';
import axios from 'axios';
import VehicleCard from '../components/VehicleCard';
import SearchBar from '../components/SearchBar';
import MyReservations from '../components/MyReservations';
import ClientDocuments from '../components/ClientDocuments';
import Header from '../components/Header';
import '../styles/Client.css';
import { useSearchParams } from 'react-router-dom';


const ClientDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'reservations';
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
    if (activeTab === 'reservations') {
      loadReservations();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSubmitReview = async (reservationId, reviewData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/review',
        {
          reservation_id: reservationId,
          rating: reviewData.rating,
          comment: reviewData.comment
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Avis publié avec succès !');
      loadReservations();
    } catch (error) {
      console.error('Erreur publication avis:', error);
      alert('Erreur lors de la publication de l\'avis');
    }
  };

  return (
    <>
      <Header />
      <div className="client-dashboard no-header">
        <main className="dashboard-content">
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
                  onSubmitReview={handleSubmitReview}
                />
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <ClientDocuments />
          )}
        </main>
      </div>
    </>
  );
};

export default ClientDashboard;
