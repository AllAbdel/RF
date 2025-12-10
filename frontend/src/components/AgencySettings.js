import React, { useState, useEffect } from 'react';
import { agencyAPI } from '../services/api';
import '../styles/AgencySettings.css';

const AgencySettings = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    rental_conditions: '',
    rental_conditions_pdf: null
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
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
          rental_conditions: response.data.agency.rental_conditions || '',
          rental_conditions_pdf: response.data.agency.rental_conditions_pdf || null
        });
        setCurrentPdfUrl(response.data.agency.rental_conditions_pdf);
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

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setMessage('Veuillez sélectionner un fichier PDF');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        setMessage('Le fichier PDF ne doit pas dépasser 5 MB');
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('rental_conditions', formData.rental_conditions);
      
      if (pdfFile) {
        formDataToSend.append('rental_conditions_pdf', pdfFile);
      }

      await agencyAPI.updateInfo(formDataToSend);
      setMessage('Paramètres mis à jour avec succès !');
      setPdfFile(null);
      await loadSettings(); // Recharger pour obtenir la nouvelle URL du PDF
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
            <label>Conditions de location (texte)</label>
            <textarea
              name="rental_conditions"
              value={formData.rental_conditions}
              onChange={handleChange}
              rows="10"
              placeholder="Exemple:&#10;Le véhicule doit être rendu avec le plein de carburant.&#10;Le véhicule doit être propre à l'intérieur et à l'extérieur.&#10;Tout retard sera facturé au tarif horaire en vigueur.&#10;Les dommages doivent être signalés immédiatement."
            />
          </div>

          <div className="form-group">
            <label>Conditions de location (PDF) - Optionnel</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfChange}
              className="file-input"
            />
            {pdfFile && (
              <p className="file-selected">Fichier sélectionné: {pdfFile.name}</p>
            )}
            {currentPdfUrl && (
              <div className="current-pdf">
                <p>PDF actuel:</p>
                <a 
                  href={`http://localhost:5000${currentPdfUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="view-pdf-btn"
                >
                  📄 Voir le PDF actuel
                </a>
              </div>
            )}
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
