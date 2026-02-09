import React, { useState, useEffect } from 'react';
import AddressAutocomplete from './AddressAutocomplete';
import '../styles/VehicleForm.css';

const VehicleForm = ({ vehicle, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    seats: '',
    engine: '',
    tank_capacity: '',
    price_per_hour: '',
    fuel_type: 'essence',
    description: '',
    release_date: '',
    location: '',
    pickup_address: '',
    return_address: '',
    latitude: '',
    longitude: '',
    status: 'available'
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [termsPdf, setTermsPdf] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper pour formater une date en yyyy-MM-dd pour l'input
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (vehicle) {
      setFormData({
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        seats: vehicle.seats || '',
        engine: vehicle.engine || '',
        tank_capacity: vehicle.tank_capacity || '',
        price_per_hour: vehicle.price_per_hour || '',
        fuel_type: vehicle.fuel_type || 'essence',
        description: vehicle.description || '',
        release_date: formatDateForInput(vehicle.release_date),
        location: vehicle.location || '',
        pickup_address: vehicle.pickup_address || '',
        return_address: vehicle.return_address || '',
        latitude: vehicle.latitude || '',
        longitude: vehicle.longitude || '',
        status: vehicle.status || 'available'
      });
      
      // Charger les images existantes
      if (vehicle.images && vehicle.images.length > 0) {
        setExistingImages(vehicle.images);
      }
    }
  }, [vehicle]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddressSelect = (addressData, fieldName) => {
    setFormData(prev => ({
      ...prev,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      // Auto-remplir la localisation avec uniquement la ville (sans le pays)
      location: addressData.location || prev.location
    }));
  };

  const handleReturnAddressSelect = (addressData) => {
    // Pour l'adresse de retour, on ne met à jour que si pas déjà de coordonnées
    // (on garde les coordonnées de l'adresse de récupération par défaut)
    if (!formData.latitude || !formData.longitude) {
      setFormData(prev => ({
        ...prev,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        location: addressData.location || prev.location
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + images.length + files.length;
    if (totalImages > 10) {
      alert('Vous ne pouvez avoir que 10 images maximum au total');
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId) => {
    setExistingImages(existingImages.filter(img => img.id !== imageId));
    setImagesToDelete([...imagesToDelete, imageId]);
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Seuls les fichiers PDF sont autorisés');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier PDF ne doit pas dépasser 10 MB');
        return;
      }
      setTermsPdf(file);
    }
  };

  const removePdf = () => {
    setTermsPdf(null);
  };

  // Helper pour formater une date en yyyy-MM-dd
  const formatDateForSubmit = (dateValue) => {
    if (!dateValue) return '';
    // Si c'est déjà au format yyyy-MM-dd, le retourner tel quel
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    // Sinon, parser et formater
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      let value = formData[key];
      
      // Formater la date au bon format
      if (key === 'release_date' && value) {
        value = formatDateForSubmit(value);
      }
      
      // Ne pas envoyer les valeurs vides/null/undefined pour latitude/longitude
      if ((key === 'latitude' || key === 'longitude')) {
        if (value && value !== '' && value !== 'null' && value !== 'undefined') {
          submitData.append(key, value);
        }
        return;
      }
      // Pour les autres champs, envoyer même si vide
      submitData.append(key, value === null || value === undefined ? '' : value);
    });
    
    // Log pour debug
    console.log('📤 Form data being sent:');
    for (let pair of submitData.entries()) {
      console.log(`  ${pair[0]}: ${pair[1]}`);
    }
    
    images.forEach(image => {
      submitData.append('images', image);
    });

    // Ajouter les IDs des images à supprimer en mode édition
    if (vehicle && imagesToDelete.length > 0) {
      submitData.append('imagesToDelete', JSON.stringify(imagesToDelete));
    }

    // Ajouter le PDF des conditions si présent
    if (termsPdf) {
      submitData.append('terms_pdf', termsPdf);
    }

    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vehicle-form-container">
      <div className="form-header">
        <h2>{vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}</h2>
        <button className="close-btn" onClick={onCancel}>Fermer</button>
      </div>

      <form onSubmit={handleSubmit} className="vehicle-form">
        <div className="form-section">
          <h3>Informations générales</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Marque *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Modèle *</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre de places *</label>
              <input
                type="number"
                name="seats"
                value={formData.seats}
                onChange={handleChange}
                min="1"
                max="50"
                required
              />
            </div>

            <div className="form-group">
              <label>Type de carburant *</label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleChange}
                required
              >
                <option value="essence">Essence</option>
                <option value="diesel">Diesel</option>
                <option value="electrique">Électrique</option>
                <option value="hybride">Hybride</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Caractéristiques techniques</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Moteur</label>
              <input
                type="text"
                name="engine"
                value={formData.engine}
                onChange={handleChange}
                placeholder="Ex: 2.0L Turbo"
              />
            </div>

            <div className="form-group">
              <label>Capacité du réservoir (L)</label>
              <input
                type="number"
                name="tank_capacity"
                value={formData.tank_capacity}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date de sortie</label>
              <input
                type="date"
                name="release_date"
                value={formData.release_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Statut</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="available">Disponible</option>
                <option value="rented">Loué</option>
                <option value="maintenance">En maintenance</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Localisation et prix</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Localisation *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ville, Pays"
                required
              />
            </div>

            <div className="form-group">
              <label>Prix par heure (€) *</label>
              <input
                type="number"
                name="price_per_hour"
                value={formData.price_per_hour}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group address-group">
              <AddressAutocomplete
                label="Adresse de récupération"
                name="pickup_address"
                value={formData.pickup_address}
                onChange={handleChange}
                onSelect={handleAddressSelect}
                placeholder="Rechercher une adresse..."
                required
              />
              {formData.latitude && formData.longitude && (
                <div className="coordinates-info">
                  <span className="coord-badge">
                    📍 {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group address-group">
              <AddressAutocomplete
                label="Adresse de dépôt/retour"
                name="return_address"
                value={formData.return_address}
                onChange={handleChange}
                onSelect={handleReturnAddressSelect}
                placeholder="Rechercher une adresse de retour..."
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Décrivez le véhicule..."
            />
          </div>

          <div className="form-group">
            <label>Conditions d'utilisation (PDF optionnel)</label>
            <p className="form-hint">
              Vous pouvez uploader un PDF personnalisé avec vos conditions d'utilisation
            </p>
            <div className="pdf-upload">
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                id="pdf-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="pdf-input" className="upload-label">
                {termsPdf ? '✓ PDF sélectionné' : 'Choisir un PDF'}
              </label>
              {termsPdf && (
                <div className="pdf-preview">
                  <span className="pdf-name">{termsPdf.name}</span>
                  <button
                    type="button"
                    className="remove-pdf-btn"
                    onClick={removePdf}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Images (max 10)</h3>
          
          {/* Images existantes */}
          {vehicle && existingImages.length > 0 && (
            <div className="existing-images">
              <h4>Images actuelles</h4>
              <div className="image-preview">
                {existingImages.map((image) => (
                  <div key={image.id} className="preview-item">
                    <img 
                      src={`http://localhost:5000${image.image_url}`} 
                      alt="Existing" 
                      onError={(e) => { e.target.src = '/no-image.svg'; }}
                    />
                    <button
                      type="button"
                      className="remove-img-btn"
                      onClick={() => removeExistingImage(image.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload de nouvelles images */}
          <div className="image-upload">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              id="image-input"
            />
            <label htmlFor="image-input" className="upload-label">
              {vehicle ? 'Ajouter des images' : 'Choisir des images'}
            </label>
            <span className="image-count">
              {existingImages.length + images.length}/10 images
            </span>
          </div>

          {/* Prévisualisation des nouvelles images */}
          {images.length > 0 && (
            <div className="new-images">
              <h4>Nouvelles images</h4>
              <div className="image-preview">
                {images.map((image, index) => (
                  <div key={index} className="preview-item">
                    <img src={URL.createObjectURL(image)} alt={`Preview ${index}`} />
                    <button
                      type="button"
                      className="remove-img-btn"
                      onClick={() => removeImage(index)}
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Enregistrement...' : (vehicle ? 'Mettre à jour' : 'Ajouter')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
