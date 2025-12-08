# 📸 Gestion des images de véhicules

## ✅ Problème résolu : Images placeholder

Le problème des images `via.placeholder.com` qui ne chargeaient pas a été résolu. L'application utilise maintenant une image SVG locale (`/no-image.svg`) pour les véhicules sans photo.

## 🎨 Image par défaut

Tous les véhicules sans photo affichent maintenant une image SVG locale avec :
- Design professionnel en dégradé noir/orange
- Icône de véhicule stylisée
- Message "Image non disponible"

## 📤 Comment ajouter des images de véhicules

### Option 1 : Via l'interface (formulaire d'ajout de véhicule)
1. Connectez-vous en tant que membre d'agence
2. Allez dans "Véhicules" → "Ajouter un véhicule"
3. Remplissez le formulaire et **uploadez une photo principale**
4. Vous pouvez ajouter plusieurs photos additionnelles

### Option 2 : Manuellement dans le dossier uploads
1. Placez vos images dans : `backend/uploads/vehicles/[agency_id]/`
2. Format : JPG, PNG (max 5MB recommandé)
3. Nommez-les clairement : `renault-clio-2024.jpg`
4. Mettez à jour la base de données :

```sql
-- Mettre à jour l'image principale d'un véhicule
UPDATE vehicles 
SET primary_image = '/uploads/vehicles/[agency_id]/renault-clio-2024.jpg'
WHERE id = [vehicle_id];

-- Ajouter une image dans la galerie
INSERT INTO vehicle_images (vehicle_id, image_url, display_order)
VALUES ([vehicle_id], '/uploads/vehicles/[agency_id]/renault-clio-2024.jpg', 1);
```

### Option 3 : Script d'import en masse
Créez un script pour importer plusieurs images :

```javascript
// backend/scripts/import-images.js
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function importImages() {
  const imagesDir = path.join(__dirname, '..', 'uploads', 'vehicles', '3');
  const files = fs.readdirSync(imagesDir);
  
  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      const vehicleId = 1; // À adapter
      const imagePath = `/uploads/vehicles/3/${file}`;
      
      await db.query(
        'UPDATE vehicles SET primary_image = ? WHERE id = ?',
        [imagePath, vehicleId]
      );
      
      console.log(`✅ Image ajoutée: ${file} → Véhicule ${vehicleId}`);
    }
  }
}

importImages();
```

## 🔧 Gestion des erreurs d'images

Toutes les images ont maintenant un fallback automatique :
- Si l'image ne charge pas → affiche `/no-image.svg`
- Si `primary_image` est NULL → affiche `/no-image.svg`
- Si le serveur backend est down → affiche `/no-image.svg`

## 📁 Structure des uploads

```
backend/uploads/
├── vehicles/
│   ├── 1/           # Agency ID 1
│   │   ├── vehicle-1-main.jpg
│   │   └── vehicle-1-gallery-1.jpg
│   ├── 2/           # Agency ID 2
│   └── 3/           # Agency ID 3
├── agencies/        # Logos d'agences
└── documents/       # Documents clients (permis, CI)
```

## 🎯 Bonnes pratiques

1. **Taille optimale** : 1200x800px (ratio 3:2)
2. **Format** : JPEG pour les photos, PNG pour les logos
3. **Poids** : < 500KB par image (utilisez TinyPNG pour compresser)
4. **Nommage** : `[marque]-[modele]-[annee]-[numero].jpg`
5. **Image principale** : La plus attractive, vue de 3/4 avant

## 🚀 Amélioration future possible

- Upload multiple avec drag & drop
- Recadrage/redimensionnement automatique
- Compression automatique côté serveur
- CDN pour les images (Cloudinary, AWS S3)
- Watermark automatique avec logo de l'agence
