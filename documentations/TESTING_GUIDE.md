# 🧪 Guide de test - Nouvelles fonctionnalités

## Prérequis

1. ✅ Migrations SQL exécutées (voir `EXECUTE_MIGRATIONS.md`)
2. ✅ Serveur backend démarré : `cd backend && npm start`
3. ✅ Frontend démarré : `cd frontend && npm start`
4. ✅ Connecté avec un compte **Admin** ou **Super Admin** d'agence

---

## 📄 Fonctionnalité 1 : Upload PDF pour les conditions d'utilisation des véhicules

### Objectif
Permettre aux agences de télécharger un PDF contenant les conditions d'utilisation spécifiques à chaque véhicule (rédigées par leur avocat par exemple).

### Test 1.1 : Créer un véhicule avec un PDF

1. **Se connecter** en tant qu'Admin/Super Admin d'agence
2. **Aller sur** le Dashboard Agence
3. **Cliquer** sur l'onglet "Véhicules"
4. **Cliquer** sur "+ Ajouter un véhicule"
5. **Remplir** tous les champs obligatoires du formulaire
6. **Scroller** jusqu'à la section "Conditions d'utilisation (PDF)"
7. **Cliquer** sur "Choisir un PDF"
8. **Sélectionner** un fichier PDF (max 10 MB)
9. **Vérifier** que le nom du fichier apparaît avec un bouton "Supprimer"
10. **Soumettre** le formulaire
11. **Vérifier** le succès de la création

### Test 1.2 : Modifier le PDF d'un véhicule existant

1. **Cliquer** sur "Modifier" pour un véhicule existant
2. **Remplacer** le PDF (ou en ajouter un si aucun n'existe)
3. **Sauvegarder**
4. **Vérifier** la mise à jour

### Test 1.3 : Visualiser le PDF côté client

1. **Se déconnecter** et **naviguer** sur la page publique
2. **Rechercher** le véhicule créé/modifié
3. **Ouvrir** la page de détails du véhicule
4. **Scroller** jusqu'à "📋 Conditions de location de l'agence"
5. **Vérifier** la présence du bouton "📄 Télécharger les conditions (PDF)"
6. **Cliquer** sur le bouton
7. **Vérifier** que le PDF s'ouvre dans un nouvel onglet

### ✅ Résultats attendus
- ✓ Le PDF est bien uploadé lors de la création/modification
- ✓ Le fichier est stocké dans `backend/uploads/vehicles/terms/`
- ✓ Le bouton de téléchargement est visible sur la page de détails
- ✓ Le PDF s'ouvre correctement dans le navigateur
- ✓ Message d'erreur si fichier > 10 MB
- ✓ Message d'erreur si le fichier n'est pas un PDF

---

## ⚙️ Fonctionnalité 2 : Profil complet de l'agence

### Objectif
Permettre aux agences de gérer leur profil complet : logo, description, liens de paiement, site web, conditions générales.

### Test 2.1 : Accéder au profil de l'agence

1. **Se connecter** en tant qu'Admin/Super Admin d'agence
2. **Aller** sur le Dashboard Agence
3. **Cliquer** sur l'onglet "⚙️ Profil"
4. **Vérifier** l'affichage de la page de profil

### Test 2.2 : Uploader un logo

1. **Dans la section Logo**, cliquer sur "Choisir une image"
2. **Sélectionner** une image (JPG, PNG, max 5 MB)
3. **Vérifier** l'aperçu du logo immédiatement
4. **Cliquer** sur "💾 Enregistrer les modifications"
5. **Vérifier** le message de succès
6. **Recharger** la page
7. **Vérifier** que le logo est bien conservé

### Test 2.3 : Modifier les informations générales

1. **Modifier** les champs suivants :
   - Nom de l'agence
   - Email de contact
   - Téléphone
   - Site web (ex: https://mon-agence.fr)
   - Adresse complète
   - Description de l'agence
2. **Sauvegarder**
3. **Vérifier** la mise à jour

### Test 2.4 : Ajouter des liens de paiement

1. **Dans la section "Liens de paiement"**, ajouter :
   - **PayPal** : lien de paiement PayPal (ex: https://paypal.me/mon-agence)
   - **Stripe** : lien de paiement Stripe
   - **Autre** : tout autre lien de paiement
2. **Sauvegarder**
3. **Vérifier** que les liens sont enregistrés

### Test 2.5 : Uploader les conditions générales en PDF

1. **Dans la section "Conditions de location"**, saisir du texte dans le textarea
2. **Cliquer** sur "Choisir un PDF" pour les conditions générales
3. **Sélectionner** un PDF (max 10 MB)
4. **Vérifier** que le lien "Voir le PDF actuel" apparaît
5. **Sauvegarder**
6. **Cliquer** sur "Voir le PDF actuel" pour vérifier l'accès

### Test 2.6 : Vérifier la persistance des données

1. **Se déconnecter** puis **se reconnecter**
2. **Revenir** sur l'onglet Profil
3. **Vérifier** que toutes les modifications sont bien conservées :
   - Logo affiché
   - Tous les champs texte remplis
   - PDF toujours accessible

### ✅ Résultats attendus
- ✓ Le logo est affiché avec un aperçu en temps réel
- ✓ Le logo est stocké dans `backend/uploads/agencies/logos/`
- ✓ Les informations de profil sont mises à jour en base de données
- ✓ Les liens de paiement sont enregistrés correctement
- ✓ Le PDF des conditions générales est stocké dans `backend/uploads/agencies/terms/`
- ✓ Le PDF est téléchargeable depuis le lien "Voir le PDF actuel"
- ✓ Messages d'erreur pour fichiers trop lourds ou mauvais format
- ✓ Toutes les données persistent après rechargement/reconnexion

---

## 🐛 Tests négatifs

### Test N.1 : Fichiers trop volumineux
- **Tenter** d'uploader une image > 5 MB pour le logo
- **Tenter** d'uploader un PDF > 10 MB
- **Vérifier** les messages d'erreur appropriés

### Test N.2 : Mauvais formats de fichiers
- **Tenter** d'uploader un fichier .txt comme logo
- **Tenter** d'uploader un fichier .docx comme PDF
- **Vérifier** les messages d'erreur

### Test N.3 : Champs vides
- **Vider** tous les champs et sauvegarder
- **Vérifier** que les champs obligatoires sont bien validés

---

## 📊 Vérification en base de données

### Vérifier les données véhicules
```sql
SELECT id, brand, model, terms_pdf 
FROM vehicles 
WHERE terms_pdf IS NOT NULL;
```

### Vérifier les données agences
```sql
SELECT 
  id, 
  name, 
  logo, 
  description,
  payment_link_paypal,
  payment_link_stripe,
  payment_link_other,
  rental_conditions_pdf,
  website
FROM agencies;
```

---

## 📂 Vérification des fichiers uploadés

### Structure attendue
```
backend/uploads/
├── vehicles/
│   ├── images/           (existant)
│   └── terms/            (nouveau)
│       └── [fichiers PDF uploadés]
└── agencies/
    ├── logos/            (nouveau)
    │   └── [logos uploadés]
    └── terms/            (nouveau)
        └── [PDFs conditions générales]
```

### Commande pour vérifier
```bash
# Windows PowerShell
Get-ChildItem -Path "e:\Perso\RentFlow-V2\backend\uploads\" -Recurse -File

# Ou via l'explorateur de fichiers
explorer e:\Perso\RentFlow-V2\backend\uploads\
```

---

## 🎯 Checklist finale

- [ ] Migration 1 exécutée (`vehicles.terms_pdf`)
- [ ] Migration 2 exécutée (`agencies` profil complet)
- [ ] Backend redémarré
- [ ] Frontend redémarré
- [ ] Test création véhicule avec PDF réussi
- [ ] Test modification véhicule PDF réussi
- [ ] Test visualisation PDF côté client réussi
- [ ] Test upload logo agence réussi
- [ ] Test modification profil agence réussi
- [ ] Test ajout liens de paiement réussi
- [ ] Test upload PDF conditions générales réussi
- [ ] Vérification persistance données réussie
- [ ] Tests négatifs réussis
- [ ] Vérification BDD réussie
- [ ] Vérification fichiers uploadés réussie

---

## ℹ️ Notes importantes

1. **Permissions** : Seuls les Admin et Super Admin d'agence peuvent accéder au profil
2. **Tailles maximales** : 
   - Images (logo) : **5 MB**
   - PDFs : **10 MB**
3. **Formats acceptés** :
   - Logo : JPG, JPEG, PNG, GIF, WEBP
   - PDFs : application/pdf uniquement
4. **URL des fichiers** : `http://localhost:5000/uploads/...`

---

## 🆘 Dépannage

### Le PDF ne se télécharge pas
- Vérifier que le fichier existe dans `backend/uploads/vehicles/terms/` ou `backend/uploads/agencies/terms/`
- Vérifier les permissions du dossier `uploads`
- Vérifier dans la console du navigateur s'il y a des erreurs

### Le logo ne s'affiche pas
- Vérifier la console navigateur pour les erreurs 404
- Vérifier que le chemin est correct : `http://localhost:5000/uploads/agencies/logos/...`
- Vérifier que le serveur backend serve bien le dossier `uploads`

### Erreur "Cannot POST"
- Vérifier que les routes sont bien configurées dans `backend/routes/`
- Vérifier que le middleware multer est bien appliqué
- Redémarrer le serveur backend
