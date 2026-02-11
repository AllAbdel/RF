import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { siteAdminAPI } from '../services/api';
import Header from '../components/Header';
import { FaBuilding, FaEnvelope, FaPhone, FaMapMarkerAlt, FaImage, FaPaperPlane, FaClock, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import '../styles/CreateAgencyPage.css';

const CreateAgencyPage = () => {
  const { user } = useAuth();
  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    agency_name: '',
    agency_email: '',
    agency_phone: '',
    agency_address: '',
    agency_description: ''
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    checkExistingRequest();
  }, []);

  const checkExistingRequest = async () => {
    try {
      const res = await siteAdminAPI.getMyAgencyRequest();
      if (res.data.request) {
        setExistingRequest(res.data.request);
      }
    } catch (err) {
      // Pas de demande existante, c'est OK
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.agency_name.trim()) {
      setError('Le nom de l\'agence est requis');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (val.trim()) data.append(key, val.trim());
      });
      if (logo) data.append('logo', logo);

      await siteAdminAPI.submitAgencyRequest(data);
      setSuccess(true);
      checkExistingRequest();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="create-agency-page">
          <div className="create-agency-loading">Chargement...</div>
        </div>
      </>
    );
  }

  // Si l'utilisateur a déjà une demande
  if (existingRequest) {
    return (
      <>
        <Header />
        <div className="create-agency-page">
          <div className="existing-request-card">
            <div className={`request-status-banner status-${existingRequest.status}`}>
              {existingRequest.status === 'pending' && <><FaClock /> Demande en cours d'examen</>}
              {existingRequest.status === 'approved' && <><FaCheck /> Demande approuvée</>}
              {existingRequest.status === 'rejected' && <><FaTimes /> Demande refusée</>}
            </div>

            <div className="existing-request-details">
              <h2>{existingRequest.agency_name}</h2>
              <p className="request-date-info">Soumise le {new Date(existingRequest.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

              {existingRequest.status === 'pending' && (
                <div className="info-box">
                  <FaInfoCircle />
                  <p>Votre demande est en attente de validation par un administrateur. Vous serez notifié une fois la décision prise.</p>
                </div>
              )}

              {existingRequest.status === 'approved' && (
                <div className="info-box success">
                  <FaCheck />
                  <p>Votre agence a été créée ! Reconnectez-vous pour accéder à votre espace agence.</p>
                </div>
              )}

              {existingRequest.status === 'rejected' && (
                <>
                  <div className="info-box error">
                    <FaTimes />
                    <p>Votre demande a été refusée.</p>
                  </div>
                  {existingRequest.admin_notes && (
                    <div className="admin-notes-box">
                      <strong>Raison :</strong> {existingRequest.admin_notes}
                    </div>
                  )}
                </>
              )}

              <div className="request-summary">
                {existingRequest.agency_email && <p><FaEnvelope /> {existingRequest.agency_email}</p>}
                {existingRequest.agency_phone && <p><FaPhone /> {existingRequest.agency_phone}</p>}
                {existingRequest.agency_address && <p><FaMapMarkerAlt /> {existingRequest.agency_address}</p>}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Formulaire de création
  if (success) {
    return (
      <>
        <Header />
        <div className="create-agency-page">
          <div className="success-card">
            <FaCheck className="success-icon" />
            <h2>Demande envoyée !</h2>
            <p>Votre demande de création d'agence a été soumise avec succès. Un administrateur l'examinera prochainement.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="create-agency-page">
        <div className="create-agency-header">
          <FaBuilding className="page-icon" />
          <h1>Créer une agence</h1>
          <p>Remplissez le formulaire ci-dessous pour soumettre votre demande de création d'agence. Un administrateur examinera votre demande.</p>
        </div>

        <form className="create-agency-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="agency_name"><FaBuilding /> Nom de l'agence *</label>
            <input
              type="text"
              id="agency_name"
              name="agency_name"
              value={formData.agency_name}
              onChange={handleChange}
              placeholder="Ex: AutoLoc Premium"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="agency_email"><FaEnvelope /> Email de l'agence</label>
              <input
                type="email"
                id="agency_email"
                name="agency_email"
                value={formData.agency_email}
                onChange={handleChange}
                placeholder="contact@monagence.fr"
              />
            </div>
            <div className="form-group">
              <label htmlFor="agency_phone"><FaPhone /> Téléphone</label>
              <input
                type="tel"
                id="agency_phone"
                name="agency_phone"
                value={formData.agency_phone}
                onChange={handleChange}
                placeholder="01 23 45 67 89"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="agency_address"><FaMapMarkerAlt /> Adresse</label>
            <input
              type="text"
              id="agency_address"
              name="agency_address"
              value={formData.agency_address}
              onChange={handleChange}
              placeholder="123 Rue de la Location, 75001 Paris"
            />
          </div>

          <div className="form-group">
            <label htmlFor="agency_description">Description de l'agence</label>
            <textarea
              id="agency_description"
              name="agency_description"
              value={formData.agency_description}
              onChange={handleChange}
              placeholder="Décrivez votre agence, vos services, votre zone d'activité..."
              rows="4"
            />
          </div>

          <div className="form-group logo-group">
            <label><FaImage /> Logo de l'agence</label>
            <div className="logo-upload-area">
              {logoPreview ? (
                <div className="logo-preview">
                  <img src={logoPreview} alt="Aperçu logo" />
                  <button type="button" className="remove-logo" onClick={() => { setLogo(null); setLogoPreview(null); }}>
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <label className="upload-label" htmlFor="logo-input">
                  <FaImage />
                  <span>Cliquez pour ajouter un logo</span>
                </label>
              )}
              <input
                type="file"
                id="logo-input"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            <FaPaperPlane /> {submitting ? 'Envoi en cours...' : 'Soumettre la demande'}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateAgencyPage;
