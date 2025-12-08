import React, { useState, useEffect } from 'react';
import { agencyAPI } from '../services/api';
import '../styles/AgencyProfile.css';

const AgencyProfile = () => {
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    website: '',
    rental_conditions: '',
    payment_link_paypal: '',
    payment_link_stripe: '',
    payment_link_other: ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [termsFile, setTermsFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchAgencyInfo();
  }, []);

  const fetchAgencyInfo = async () => {
    try {
      const response = await agencyAPI.getStats();
      const agencyData = response.data.agency;
      
      setAgency(agencyData);
      setFormData({
        name: agencyData.name || '',
        email: agencyData.email || '',
        phone: agencyData.phone || '',
        address: agencyData.address || '',
        description: agencyData.description || '',
        website: agencyData.website || '',
        rental_conditions: agencyData.rental_conditions || '',
        payment_link_paypal: agencyData.payment_link_paypal || '',
        payment_link_stripe: agencyData.payment_link_stripe || '',
        payment_link_other: agencyData.payment_link_other || ''
      });
      
      if (agencyData.logo) {
        setLogoPreview(`http://localhost:5000${agencyData.logo}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement du profil' });
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Seules les images sont autorisées pour le logo' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Le logo ne doit pas dépasser 5 MB' });
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleTermsChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setMessage({ type: 'error', text: 'Seuls les fichiers PDF sont autorisés' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Le PDF ne doit pas dépasser 10 MB' });
        return;
      }
      setTermsFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const submitData = new FormData();
      
      // Ajouter tous les champs texte
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      // Ajouter les fichiers si présents
      if (logoFile) {
        submitData.append('logo', logoFile);
      }
      if (termsFile) {
        submitData.append('rental_conditions_pdf', termsFile);
      }

      await agencyAPI.updateInfo(submitData);

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      fetchAgencyInfo(); // Recharger les données
      setLogoFile(null);
      setTermsFile(null);
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erreur lors de la mise à jour' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="agency-profile-container">
        <div className="loading">Chargement du profil...</div>
      </div>
    );
  }

  return (
    <div className="agency-profile-container">
      <div className="profile-header">
        <h1>Profil de l'agence</h1>
        <p>Gérez les informations de votre agence</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        {/* Logo */}
        <div className="form-section">
          <h2>Logo de l'agence</h2>
          <div className="logo-upload-section">
            {logoPreview && (
              <div className="logo-preview">
                <img src={logoPreview} alt="Logo agence" />
              </div>
            )}
            <div className="logo-upload-controls">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                id="logo-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="logo-input" className="upload-btn">
                {logoPreview ? 'Changer le logo' : 'Ajouter un logo'}
              </label>
              <p className="upload-hint">Format: JPG, PNG, WEBP (max 5MB)</p>
            </div>
          </div>
        </div>

        {/* Informations générales */}
        <div className="form-section">
          <h2>Informations générales</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Nom de l'agence *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Site web</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Adresse</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
            />
          </div>

          <div className="form-group full-width">
            <label>Description de l'agence</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Présentez votre agence..."
            />
          </div>
        </div>

        {/* Liens de paiement */}
        <div className="form-section">
          <h2>Liens de paiement</h2>
          <p className="section-desc">
            Ajoutez vos liens de paiement pour faciliter les transactions avec vos clients
          </p>
          
          <div className="form-group">
            <label>
              <span className="payment-icon">💳</span> PayPal
            </label>
            <input
              type="url"
              name="payment_link_paypal"
              value={formData.payment_link_paypal}
              onChange={handleChange}
              placeholder="https://paypal.me/votre-lien"
            />
          </div>

          <div className="form-group">
            <label>
              <span className="payment-icon">💰</span> Stripe
            </label>
            <input
              type="url"
              name="payment_link_stripe"
              value={formData.payment_link_stripe}
              onChange={handleChange}
              placeholder="https://buy.stripe.com/votre-lien"
            />
          </div>

          <div className="form-group">
            <label>
              <span className="payment-icon">🔗</span> Autre plateforme
            </label>
            <input
              type="url"
              name="payment_link_other"
              value={formData.payment_link_other}
              onChange={handleChange}
              placeholder="https://votre-autre-lien.com"
            />
          </div>
        </div>

        {/* Conditions de location */}
        <div className="form-section">
          <h2>Conditions de location</h2>
          
          <div className="form-group full-width">
            <label>Conditions texte</label>
            <textarea
              name="rental_conditions"
              value={formData.rental_conditions}
              onChange={handleChange}
              rows="6"
              placeholder="Saisissez vos conditions de location..."
            />
          </div>

          <div className="form-group full-width">
            <label>Conditions en PDF (optionnel)</label>
            <p className="upload-hint">
              Si vous avez un document PDF préparé par un avocat avec vos conditions
            </p>
            <div className="pdf-upload-zone">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleTermsChange}
                id="terms-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="terms-input" className="upload-btn">
                {termsFile ? `✓ ${termsFile.name}` : 'Choisir un PDF'}
              </label>
              {agency?.rental_conditions_pdf && !termsFile && (
                <a 
                  href={`http://localhost:5000${agency.rental_conditions_pdf}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-pdf-link"
                >
                  📄 Voir le PDF actuel
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => window.location.reload()}>
            Annuler
          </button>
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgencyProfile;
