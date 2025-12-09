# 🎯 GUIDE DE TEST - RENTFLOW

## ✅ Changements appliqués

### 1. Mode développement activé
- `NODE_ENV=development` dans `.env`
- **Emails automatiquement vérifiés** (pas besoin d'email SMTP configuré)
- Connexion immédiate après inscription

### 2. Interface corrigée
- Message de succès mieux stylisé
- Plus de chevauchement avec le formulaire
- Bouton de retour visible

### 3. Base de données remplie
- 9 véhicules disponibles
- 3 agences (Paris, Lyon, Marseille)
- 6 comptes de test

## 🧪 Tests à effectuer

### Test 1: Voir les véhicules (sans connexion)
1. Ouvrir http://localhost:3000
2. ✅ Vous devriez voir les 9 véhicules immédiatement

### Test 2: Créer un nouveau compte CLIENT
1. Cliquer sur "Créer votre compte"
2. Sélectionner "Client"
3. Remplir le formulaire
4. ✅ Après soumission → Redirection automatique vers `/client`
5. ✅ Pas de popup d'email (mode dev)

### Test 3: Créer un nouveau compte AGENCE
1. Cliquer sur "Créer votre compte"
2. Sélectionner "Agence"
3. Choisir "Créer une agence"
4. Remplir le formulaire + nom agence
5. ✅ Après soumission → Redirection vers `/agency`

### Test 4: Se connecter avec comptes existants
**Compte Client:**
- Email: `client1@email.fr`
- Mot de passe: `password123`
- ✅ Connexion immédiate

**Compte Agence:**
- Email: `admin@premium-paris.fr`
- Mot de passe: `password123`
- ✅ Connexion immédiate

### Test 5: Rechercher et réserver un véhicule
1. Se connecter avec `client1@email.fr`
2. Rechercher un véhicule (ex: "Tesla")
3. Cliquer sur un véhicule
4. Remplir les dates de réservation
5. ✅ Réservation créée

## 📊 Données de test disponibles

### Véhicules (9 au total)
**Paris (Agence 1):**
- Renault Clio - 15€/h
- Peugeot 3008 - 35€/h
- Tesla Model 3 - 45€/h

**Lyon (Agence 2):**
- Citroën C3 - 18€/h
- Volkswagen Golf - 25€/h
- BMW X3 - 50€/h

**Marseille (Agence 3):**
- Renault Zoe - 20€/h
- Mercedes Classe A - 40€/h
- Audi Q5 - 55€/h

### Comptes Agence
| Email | Agence | Rôle |
|-------|--------|------|
| admin@premium-paris.fr | Location Premium Paris | Super Admin |
| manager@autorent-lyon.fr | Auto Rent Lyon | Super Admin |
| team@express-marseille.fr | Voitures Express | Admin |

### Comptes Client
| Email | Nom |
|-------|-----|
| client1@email.fr | Sophie Lefebvre |
| client2@email.fr | Thomas Dubois |
| client3@email.fr | Emma Laurent |

## 🔧 Si problème persiste

### Backend ne démarre pas ?
```powershell
cd E:\Perso\RentFlow-V2\backend
node server.js
```
Vérifier le message dans le terminal

### Base vide ?
```powershell
cd E:\Perso\RentFlow-V2\backend
node import-test-data.js
```

### MySQL non actif ?
1. Ouvrir XAMPP Control Panel
2. Démarrer MySQL
3. Relancer `.\start-all.ps1`

## 🚀 Commandes utiles

**Démarrer tout (silencieux):**
```powershell
.\start-all.ps1
```

**Arrêter tous les serveurs:**
```powershell
Get-Process -Name node | Stop-Process -Force
```

**Vérifier le backend:**
```powershell
curl http://localhost:5000/api/vehicles
```

**Vérifier la base:**
```powershell
cd backend
node check-db.js
```

## 📝 Notes importantes

1. **Mode développement** : Les emails sont simulés, pas d'envoi réel
2. **Mots de passe** : Tous les comptes de test → `password123`
3. **Politique de mot de passe** : Min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
4. **Tokens JWT** : Expire après 24h, refresh après 7 jours
5. **Rate limiting** : Max 5 tentatives de login par 15 min

---

**Dernière mise à jour** : 9 décembre 2025
