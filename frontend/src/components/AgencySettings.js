import React, { useState, useEffect } from 'react';
import { agencyAPI } from '../services/api';
import '../styles/AgencySettings.css';

const AgencySettings = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    rental_conditions: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await agencyAPI.getStats();
      if (response.data.agency) {
        setFormData({
          name: response.data.agency.name || '',
          phone: response.data.agency.phone || '',
          address: response.data.agency.address || '',
          rental_conditions: response.data.agency.rental_conditions || ''
        });
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await agencyAPI.updateInfo(formData);
      setMessage('Paramètres mis à jour avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      setMessage('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agency-settings">
      <h2>⚙️ Paramètres de l'agence</h2>
      
      {message && (
        <div className={`message ${message.includes('succès') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-section">
          <h3>📋 Conditions de location</h3>
          <p className="form-hint">
            Ces conditions seront affichées sur la page de détails de chaque véhicule. 
            Utilisez une ligne par condition.
          </p>
          
          <div className="form-group">
            <label>Conditions de location</label>
            <textarea
              name="rental_conditions"
              value={formData.rental_conditions}
              onChange={handleChange}
              rows="10"
              placeholder="Exemple:&#10;Le véhicule doit être rendu avec le plein de carburant.&#10;Le véhicule doit être propre à l'intérieur et à l'extérieur.&#10;Tout retard sera facturé au tarif horaire en vigueur.&#10;Les dommages doivent être signalés immédiatement."
            />
          </div>

          <div className="preview-section">
            <h4>Aperçu :</h4>
            <div className="conditions-preview">
              {formData.rental_conditions ? (
                formData.rental_conditions.split('\n').map((condition, index) => (
                  condition.trim() && (
                    <div key={index} className="preview-condition">
                      <span className="preview-bullet">✓</span>
                      <span>{condition.trim()}</span>
                    </div>
                  )
                ))
              ) : (
                <p className="no-conditions">Aucune condition définie</p>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgencySettings;
