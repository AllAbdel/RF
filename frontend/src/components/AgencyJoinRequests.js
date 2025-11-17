import React, { useState, useEffect } from 'react';
import { agencyAPI } from '../services/api';
import '../styles/AgencyJoinRequests.css';
import '../styles/AgencyJoinRequests.css';

const AgencyJoinRequests = ({ onRefresh }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await agencyAPI.getJoinRequests();
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId, action) => {
    try {
      await agencyAPI.handleJoinRequest(requestId, action);
      alert(action === 'accept' ? 'Demande acceptée !' : 'Demande refusée');
      loadRequests();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erreur traitement demande:', error);
      alert('Erreur lors du traitement de la demande');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="no-requests">
        <p>Aucune demande d'adhésion en attente</p>
      </div>
    );
  }

  return (
    <div className="join-requests">
      <h3>Demandes d'adhésion ({requests.length})</h3>
      <div className="requests-list">
        {requests.map((request) => (
          <div key={request.id} className="request-card">
            <div className="request-info">
              <h4>{request.first_name} {request.last_name}</h4>
              <p><strong>Email:</strong> {request.email}</p>
              <p><strong>Téléphone:</strong> {request.phone}</p>
              <p className="request-date">
                Demande envoyée le {new Date(request.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="request-actions">
              <button
                className="accept-btn"
                onClick={() => handleRequest(request.id, 'accept')}
              >
                Accepter
              </button>
              <button
                className="reject-btn"
                onClick={() => handleRequest(request.id, 'reject')}
              >
                Refuser
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgencyJoinRequests;
