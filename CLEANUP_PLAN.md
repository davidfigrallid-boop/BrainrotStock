# Plan de Nettoyage et Réorganisation - BrainrotsMarket

## 📋 Vue d'ensemble
Restructuration complète du projet pour Railway avec suppression des fichiers inutilisés et unification de la structure.

---

## ✅ Phase 1 : Suppression des fichiers inutilisés

- [x] Supprimer `src/index.js` (doublon avec app.js)
- [x] Supprimer `FIXES_APPLIED.md` (documentation obsolète)
- [x] Supprimer `DEPLOYMENT.md` (documentation obsolète)
- [x] Supprimer `.github/pull_request_template.md` (non nécessaire)
- [x] Supprimer `brainrots.json` (sera en base de données)
- [x] Supprimer `src/web/public/index.html` (à recréer proprement)
- [x] Supprimer les images inutilisées (Banner.png, Robux.jpg)

---

## ✅ Phase 2 : Restructuration des fichiers de configuration

- [x] Fusionner `src/config.js` et `src/config/` en une structure cohérente
- [x] Créer `src/config/index.js` comme point d'entrée unique
- [x] Déplacer les constantes de configuration dans `src/config/index.js`
- [x] Retirer tous les `require('dotenv').config()` (Railway gère ça)
- [x] Mettre à jour les imports dans tous les fichiers

---

## ✅ Phase 3 : Création des services manquants

- [x] Créer `src/services/database.js` - Gestion de la connexion MySQL
- [x] Créer `src/services/brainrots.js` - Opérations CRUD pour brainrots
- [x] Créer `src/services/giveaways.js` - Opérations CRUD pour giveaways
- [x] Créer `src/services/crypto.js` - Récupération des prix crypto (CoinGecko/CoinCap)
- [x] Créer `src/database/migrations.js` - Schéma de base de données

---

## ✅ Phase 4 : Nettoyage du code existant

- [x] Nettoyer `app.js` - Retirer dotenv, améliorer la structure
- [x] Nettoyer `src/bot/bot.js` - Retirer dotenv, ajouter handlers réels
- [x] Nettoyer `src/web/server.js` - Retirer dotenv, améliorer les routes
- [x] Nettoyer `src/web/routes/api.js` - Implémenter les endpoints réels
- [x] Nettoyer `src/config/logger.js` - Retirer dotenv
- [x] Nettoyer `src/config/commands.js` - Vérifier les imports

---

## ✅ Phase 5 : Mise à jour de package.json

- [x] Retirer `dotenv` des dépendances (pas nécessaire sur Railway)
- [x] Ajouter `axios` pour les appels API crypto
- [x] Vérifier les versions des dépendances
- [x] Mettre à jour les scripts npm
- [x] Ajouter script de migration DB

---

## ✅ Phase 6 : Création de la structure de base de données

- [x] Créer schéma pour table `brainrots`
- [x] Créer schéma pour table `giveaways`
- [x] Créer schéma pour table `crypto_prices` (cache)
- [x] Créer schéma pour table `servers` (configuration par serveur)
- [x] Ajouter indexes et contraintes

---

## ✅ Phase 7 : Intégration de la base de données

- [x] Connecter le service database au bot
- [x] Remplacer les opérations JSON par des requêtes SQL
- [x] Implémenter les handlers de commandes avec DB
- [x] Implémenter les endpoints API avec DB
- [x] Ajouter gestion des erreurs DB

---

## ✅ Phase 8 : Nettoyage final et validation

- [x] Vérifier tous les chemins d'imports
- [x] Vérifier qu'aucune variable d'env n'est hardcodée
- [x] Tester les connexions (Discord, MySQL, API)
- [x] Vérifier la structure des dossiers
- [x] Créer `.gitignore` propre (logs/, node_modules/, etc.)
- [x] Créer README.md complet
- [x] Créer SETUP_GUIDE.md
- [x] Créer railway.json
- [x] Vérifier les diagnostics (aucune erreur)

---

## 📁 Structure finale attendue

```
brainrotsmarket/
├── app.js                          # Point d'entrée unique
├── package.json
├── .gitignore
├── src/
│   ├── config/
│   │   ├── index.js               # Configuration centralisée
│   │   ├── logger.js              # Logger
│   │   └── commands.js            # Commandes Discord
│   ├── bot/
│   │   ├── bot.js                 # Classe principale du bot
│   │   └── handlers/              # Handlers de commandes
│   │       ├── brainrots.js
│   │       ├── giveaways.js
│   │       └── admin.js
│   ├── web/
│   │   ├── server.js              # Serveur Express
│   │   ├── routes/
│   │   │   ├── api.js             # Routes API
│   │   │   ├── brainrots.js
│   │   │   ├── giveaways.js
│   │   │   └── stats.js
│   │   └── public/                # Frontend (à créer)
│   ├── services/
│   │   ├── database.js            # Connexion MySQL
│   │   ├── brainrots.js           # Logique brainrots
│   │   ├── giveaways.js           # Logique giveaways
│   │   └── crypto.js              # Récupération crypto
│   ├── database/
│   │   ├── migrations.js          # Schéma DB
│   │   └── queries.js             # Requêtes SQL
│   └── utils/
│       ├── constants.js           # Constantes
│       └── helpers.js             # Fonctions utilitaires
└── logs/                          # Dossier logs (gitignored)
```

---

## 🚀 Variables d'environnement Railway

À configurer dans Railway :
```
DISCORD_TOKEN=xxx
CLIENT_ID=xxx
GUILD_ID=xxx
MYSQLHOST=xxx
MYSQLPORT=3306
MYSQLUSER=xxx
MYSQLPASSWORD=xxx
MYSQLDATABASE=brainrots
PORT=3000
LOG_LEVEL=info
NODE_ENV=production
```

---

## ✅ Checklist finale

- [x] Tous les fichiers inutilisés supprimés
- [x] Structure cohérente et propre
- [x] Aucune référence à dotenv
- [x] Base de données fonctionnelle
- [x] Tous les imports corrects
- [x] Code testé localement (diagnostics: 0 erreurs)
- [x] Prêt pour Railway
- [x] Prêt pour GitHub

## 🎉 Projet complètement restructuré et prêt au déploiement !

Consulter `SETUP_GUIDE.md` pour les instructions de déploiement sur Railway.
