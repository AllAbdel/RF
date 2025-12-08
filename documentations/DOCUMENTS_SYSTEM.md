# 📄 Système de Génération de Documents - Guide d'Installation et d'Utilisation

## ✅ Ce qui a été créé

### Backend

1. **Base de données**
   - Fichier: `backend/migration_documents.sql`
   - Tables créées:
     - `documents`: Stocke les références aux documents générés (factures, reçus, contrats)
     - `contract_signatures`: Stocke les signatures électroniques avec date, IP et image
     - Ajout de `contract_signed` dans la table `reservations`

2. **Générateur de PDF**
   - Fichier: `backend/utils/pdfGenerator.js`
   - 3 fonctions principales:
     - `generateInvoice()`: Facture professionnelle avec en-tête agence, détails client, tableau des prestations
     - `generateReceipt()`: Reçu de paiement avec montant en grand format
     - `generateContract()`: Contrat de location complet avec conditions, adresses, zones de signature

3. **Contrôleur de documents**
   - Fichier: `backend/controllers/documentController.js`
   - Endpoints:
     - `createInvoice()`: Génère une facture pour une réservation
     - `createReceipt()`: Génère un reçu de paiement
     - `createContract()`: Génère un contrat de location
     - `signContract()`: Enregistre la signature électronique d'un contrat
     - `getDocuments()`: Récupère tous les documents d'une réservation

4. **Routes API**
   - Fichier: `backend/routes/documents.js`
   - Routes:
     - `POST /api/documents/generate-invoice/:reservation_id`
     - `POST /api/documents/generate-receipt/:reservation_id`
     - `POST /api/documents/generate-contract/:reservation_id`
     - `POST /api/documents/sign-contract/:document_id`
     - `GET /api/documents/reservation/:reservation_id`
     - `GET /api/documents/download/:document_id`

5. **Intégration serveur**
   - Modification: `backend/server.js`
   - Ajout de la route `/api/documents`

6. **Packages installés**
   - `pdfkit`: Génération de fichiers PDF
   - `signature_pad`: Capture de signatures électroniques

### Frontend

1. **Service API**
   - Modification: `frontend/src/services/api.js`
   - Nouveau service: `documentAPI` avec toutes les méthodes d'interaction

2. **Composant DocumentViewer**
   - Fichier: `frontend/src/components/DocumentViewer.js`
   - Affiche la liste des documents d'une réservation
   - Boutons pour générer/télécharger les documents
   - Bouton pour signer le contrat (clients uniquement)
   - Indicateur de signature pour les contrats signés

3. **Styles DocumentViewer**
   - Fichier: `frontend/src/styles/DocumentViewer.css`
   - Design moderne avec icônes et animations
   - Responsive mobile

4. **Composant ContractSignature**
   - Fichier: `frontend/src/components/ContractSignature.js`
   - Page dédiée à la signature de contrat
   - Canvas interactif pour dessiner la signature
   - Boutons: Effacer, Annuler, Valider
   - Avertissement légal

5. **Styles ContractSignature**
   - Fichier: `frontend/src/styles/ContractSignature.css`
   - Interface épurée et professionnelle
   - Canvas stylisé avec bordure interactive

6. **Intégration dans les réservations**
   - Modification: `frontend/src/components/MyReservations.js`
   - Ajout du bouton "Voir documents" pour chaque réservation
   - Affichage/masquage du DocumentViewer
   
   - Modification: `frontend/src/components/ReservationList.js`
   - Même système pour l'interface agence

7. **Mise à jour des styles**
   - `frontend/src/styles/MyReservations.css`: Ajout du style pour `.documents-btn`
   - `frontend/src/styles/ReservationList.css`: Même ajout

8. **Routing**
   - Modification: `frontend/src/App.js`
   - Nouvelle route: `/sign-contract/:documentId` (protégée, clients uniquement)

9. **Packages installés**
   - `signature_pad`: Bibliothèque de capture de signature

---

## 🔧 Installation et Configuration

### Étape 1: Exécuter la migration SQL

Ouvrez MySQL et exécutez:

```sql
SOURCE E:/Perso/RentFlow-V2/backend/migration_documents.sql;
```

Vérifiez que les tables sont créées:

```sql
SHOW TABLES;
DESCRIBE documents;
DESCRIBE contract_signatures;
DESCRIBE reservations; -- Doit avoir la colonne contract_signed
```

### Étape 2: Redémarrer le serveur backend

```powershell
cd backend
npm start
```

Le serveur devrait démarrer sans erreurs.

### Étape 3: Redémarrer le serveur frontend

```powershell
cd frontend
npm start
```

---

## 📋 Utilisation

### Pour les Agences

1. **Générer une facture**
   - Aller dans l'onglet "Réservations"
   - Cliquer sur "📄 Voir documents" pour une réservation
   - Cliquer sur "✨ Générer" à côté de "Facture"
   - La facture est créée et peut être téléchargée

2. **Générer un reçu**
   - Même processus que pour la facture
   - Utile après confirmation de paiement

3. **Générer un contrat**
   - Même processus
   - Le contrat doit être signé par le client avant le début de la location

4. **Télécharger les documents**
   - Cliquer sur "📥 Télécharger" pour obtenir le PDF

### Pour les Clients

1. **Consulter les documents**
   - Aller dans "Mes réservations"
   - Cliquer sur "📄 Voir documents"
   - Les documents générés par l'agence apparaissent

2. **Signer le contrat**
   - Si un contrat a été généré et n'est pas encore signé
   - Cliquer sur "✍️ Signer"
   - Dessiner votre signature sur le canvas
   - Cliquer sur "✓ Valider la signature"
   - Le contrat est marqué comme signé (✅)

3. **Télécharger les documents**
   - Cliquer sur "📥 Télécharger" pour chaque document

---

## 🔒 Sécurité et Conformité

- ✅ Les signatures sont stockées avec:
  - L'ID de l'utilisateur
  - L'horodatage précis
  - L'adresse IP du signataire
  - L'image de la signature en base64

- ✅ Contrôles d'accès:
  - Seules les agences peuvent générer des documents
  - Seuls les clients concernés peuvent signer leurs contrats
  - Chaque utilisateur ne voit que ses propres documents

- ✅ Validations:
  - Un document ne peut être généré qu'une seule fois par type/réservation
  - Un contrat ne peut être signé qu'une seule fois
  - La signature ne peut être effacée après validation

---

## 📁 Structure des fichiers générés

Les PDF sont stockés dans:
```
backend/uploads/documents/
├── invoice_FAC-2024-000001.pdf
├── receipt_REC-2024-000001.pdf
└── contract_CTR-2024-000001.pdf
```

Format des numéros de documents:
- Factures: `FAC-YYYY-NNNNNN`
- Reçus: `REC-YYYY-NNNNNN`
- Contrats: `CTR-YYYY-NNNNNN`

---

## 🐛 Dépannage

### Erreur: "Cannot read property 'agency_id' of undefined"
- Vérifiez que l'utilisateur est bien connecté et est membre d'une agence
- Vérifiez le token JWT dans localStorage

### Erreur: "Table 'documents' doesn't exist"
- Exécutez la migration SQL (étape 1)

### Les PDF ne se génèrent pas
- Vérifiez que le dossier `backend/uploads/documents` existe
- Vérifiez les permissions d'écriture
- Consultez les logs du backend pour les erreurs

### La signature ne fonctionne pas sur mobile
- Assurez-vous que le CSS inclut `touch-action: none` sur le canvas
- Vérifiez que signature_pad est bien importé

---

## ✨ Fonctionnalités futures possibles

- [ ] Envoi automatique des documents par email
- [ ] Signature électronique pour l'agence (double signature)
- [ ] Génération automatique des documents selon le statut de réservation
- [ ] Archivage automatique après X mois
- [ ] Personnalisation des templates de documents par agence
- [ ] Ajout de QR codes pour vérification des documents
- [ ] Traduction des documents en plusieurs langues
- [ ] Export groupé de tous les documents d'une période

---

## 📝 Notes importantes

- Les PDF sont générés en français avec le format de date DD/MM/YYYY
- Les montants sont affichés avec le symbole € et 2 décimales
- Les conditions de location de l'agence sont automatiquement incluses dans les contrats
- Les adresses de récupération et de dépôt sont affichées dans les documents si renseignées

