import React, { useState, useEffect } from 'react';
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
    status: 'available'
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

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
        release_date: vehicle.release_date || '',
        location: vehicle.location || '',
        status: vehicle.status || 'available'
      });
    }
  }, [vehicle]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 10) {
      alert('Vous ne pouvez télécharger que 10 images maximum');
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    
    images.forEach(image => {
      submitData.append('images', image);
    });

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
        </div>

        {!vehicle && (
          <div className="form-section">
            <h3>Images (max 10)</h3>
            <div className="image-upload">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                id="image-input"
              />
              <label htmlFor="image-input" className="upload-label">
                Choisir des images
              </label>
              <span className="image-count">{images.length}/10 images sélectionnées</span>
            </div>

            {images.length > 0 && (
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
            )}
          </div>
        )}

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
