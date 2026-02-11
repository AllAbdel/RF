import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { siteAdminAPI } from '../services/api';
import Header from '../components/Header';
import { FaUsers, FaCar, FaBuilding, FaCalendarAlt, FaClock, FaCheck, FaTimes, FaChartBar, FaEye } from 'react-icons/fa';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, requestsRes] = await Promise.all([
        siteAdminAPI.getStats(),
        siteAdminAPI.getAgencyRequests(filter)
      ]);
      setStats(statsRes.data.stats);
      setRequests(requestsRes.data.requests);
    } catch (error) {
      console.error('Erreur chargement données admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Voulez-vous approuver cette demande de création d\'agence ?')) return;
    
    setActionLoading(requestId);
    try {
      await siteAdminAPI.approveRequest(requestId, '');
      loadData();
    } catch (error) {
      console.error('Erreur approbation:', error);
      alert('Erreur lors de l\'approbation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectNotes.trim()) {
      alert('Veuillez fournir une raison du refus');
      return;
    }
    
    setActionLoading(requestId);
    try {
      await siteAdminAPI.rejectRequest(requestId, rejectNotes);
      setShowRejectModal(null);
      setRejectNotes('');
      loadData();
    } catch (error) {
      console.error('Erreur refus:', error);
      alert('Erreur lors du refus');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Header />
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>Panel d'administration</h1>
          <p>Bienvenue, {user?.first_name}</p>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <FaUsers className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">{stats.totalUsers}</span>
                <span className="stat-label">Utilisateurs</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <FaBuilding className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">{stats.totalAgencies}</span>
                <span className="stat-label">Agences</span>
              </div>
            </div>
            <div className="admin-stat-card highlight">
              <FaClock className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">{stats.pendingRequests}</span>
                <span className="stat-label">Demandes en attente</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <FaCar className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">{stats.totalVehicles}</span>
                <span className="stat-label">Véhicules</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <FaCalendarAlt className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">{stats.totalReservations}</span>
                <span className="stat-label">Réservations</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <FaChartBar className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">{stats.totalClients}</span>
                <span className="stat-label">Clients</span>
              </div>
            </div>
          </div>
        )}

        {/* Filtres des demandes */}
        <div className="admin-section">
          <h2>Demandes de création d'agence</h2>
          <div className="admin-filters">
            <button 
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              <FaClock /> En attente
            </button>
            <button 
              className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
              onClick={() => setFilter('approved')}
            >
              <FaCheck /> Approuvées
            </button>
            <button 
              className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilter('rejected')}
            >
              <FaTimes /> Refusées
            </button>
          </div>

          {/* Liste des demandes */}
          {loading ? (
            <div className="admin-loading">Chargement...</div>
          ) : requests.length === 0 ? (
            <div className="admin-empty">
              <p>Aucune demande {filter === 'pending' ? 'en attente' : filter === 'approved' ? 'approuvée' : 'refusée'}</p>
            </div>
          ) : (
            <div className="admin-requests-list">
              {requests.map(request => (
                <div key={request.id} className={`admin-request-card status-${request.status}`}>
                  <div className="request-header">
                    <div className="request-info">
                      <h3>{request.agency_name}</h3>
                      <p className="request-user">
                        Demandé par <strong>{request.first_name} {request.last_name}</strong> ({request.user_email})
                      </p>
                      <p className="request-date">{formatDate(request.created_at)}</p>
                    </div>
                    <span className={`request-status status-${request.status}`}>
                      {request.status === 'pending' ? 'En attente' : request.status === 'approved' ? 'Approuvée' : 'Refusée'}
                    </span>
                  </div>

                  <div className="request-details">
                    {request.agency_email && (
                      <div className="detail-row">
                        <span className="detail-label">Email agence:</span>
                        <span>{request.agency_email}</span>
                      </div>
                    )}
                    {request.agency_phone && (
                      <div className="detail-row">
                        <span className="detail-label">Téléphone:</span>
                        <span>{request.agency_phone}</span>
                      </div>
                    )}
                    {request.agency_address && (
                      <div className="detail-row">
                        <span className="detail-label">Adresse:</span>
                        <span>{request.agency_address}</span>
                      </div>
                    )}
                    {request.agency_description && (
                      <div className="detail-row">
                        <span className="detail-label">Description:</span>
                        <span>{request.agency_description}</span>
                      </div>
                    )}
                    {request.logo_path && (
                      <div className="detail-row">
                        <span className="detail-label">Logo:</span>
                        <img src={`http://localhost:5000${request.logo_path}`} alt="Logo" className="request-logo" />
                      </div>
                    )}
                    {request.admin_notes && (
                      <div className="detail-row admin-notes">
                        <span className="detail-label">Note admin:</span>
                        <span>{request.admin_notes}</span>
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="request-actions">
                      <button
                        className="approve-btn"
                        onClick={() => handleApprove(request.id)}
                        disabled={actionLoading === request.id}
                      >
                        <FaCheck /> {actionLoading === request.id ? 'En cours...' : 'Approuver'}
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => { setShowRejectModal(request.id); setRejectNotes(''); }}
                        disabled={actionLoading === request.id}
                      >
                        <FaTimes /> Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de refus */}
        {showRejectModal && (
          <div className="admin-modal-overlay" onClick={() => setShowRejectModal(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <h3>Refuser la demande</h3>
              <p>Veuillez indiquer la raison du refus :</p>
              <textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                placeholder="Raison du refus..."
                rows="4"
              />
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowRejectModal(null)}>
                  Annuler
                </button>
                <button 
                  className="reject-btn"
                  onClick={() => handleReject(showRejectModal)}
                  disabled={!rejectNotes.trim()}
                >
                  Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
