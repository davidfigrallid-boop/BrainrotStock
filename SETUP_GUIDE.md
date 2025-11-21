# Guide de Configuration - BrainrotsMarket v2.0.0

## ✅ Nettoyage complété

Le projet a été complètement restructuré et nettoyé :

### Fichiers supprimés
- ❌ `src/index.js` (doublon)
- ❌ `DEPLOYMENT.md` (obsolète)
- ❌ `FIXES_APPLIED.md` (obsolète)
- ❌ `.github/pull_request_template.md` (non nécessaire)
- ❌ `brainrots.json` (données en DB)
- ❌ `src/web/public/index.html` (à recréer)
- ❌ `src/config.js` (fusionné dans src/config/index.js)

### Fichiers créés/modifiés
- ✅ `src/config/index.js` - Configuration centralisée
- ✅ `src/services/database.js` - Gestion MySQL
- ✅ `src/services/brainrots.js` - CRUD brainrots
- ✅ `src/services/giveaways.js` - CRUD giveaways
- ✅ `src/services/crypto.js` - Récupération crypto
- ✅ `src/database/migrations.js` - Schéma DB
- ✅ `src/bot/handlers/brainrots.js` - Handlers commandes
- ✅ `src/bot/handlers/giveaways.js` - Handlers giveaways
- ✅ `app.js` - Point d'entrée unique
- ✅ `README.md` - Documentation
- ✅ `railway.json` - Config Railway

## 🚀 Déploiement sur Railway

### 1. Créer un projet Railway
```bash
railway init
```

### 2. Ajouter une base de données MySQL
```bash
railway add
# Sélectionner MySQL
```

### 3. Configurer les variables d'environnement

Dans le dashboard Railway, ajouter :

```
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
GUILD_ID=votre_guild_id
PORT=3000
LOG_LEVEL=info
NODE_ENV=production
```

Les variables MySQL seront auto-générées par Railway :
- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`
- `MYSQL_PUBLIC_URL` (optionnel, utilisé en priorité)

### 4. Déployer
```bash
railway up
```

## 📋 Checklist avant déploiement

- [ ] Token Discord configuré
- [ ] Client ID et Guild ID configurés
- [ ] MySQL créé sur Railway
- [ ] Variables d'environnement définies
- [ ] Repository GitHub créé
- [ ] Code pushé sur GitHub
- [ ] Railway connecté au repo

## 🔍 Vérification locale

```bash
# Installer les dépendances
npm install

# Vérifier la syntaxe
npm run lint

# Démarrer en dev
npm run dev
```

## 📊 Structure finale

```
brainrotsmarket/
├── app.js                          # Point d'entrée
├── package.json
├── .gitignore
├── README.md
├── SETUP_GUIDE.md
├── railway.json
├── src/
│   ├── config/
│   │   ├── index.js               # Config centralisée
│   │   ├── logger.js              # Logger
│   │   └── commands.js            # Commandes Discord
│   ├── bot/
│   │   ├── bot.js                 # Bot principal
│   │   └── handlers/
│   │       ├── brainrots.js       # Handlers brainrots
│   │       └── giveaways.js       # Handlers giveaways
│   ├── web/
│   │   ├── server.js              # Serveur Express
│   │   ├── routes/
│   │   │   └── api.js             # Routes API
│   │   └── public/                # Frontend (à créer)
│   ├── services/
│   │   ├── database.js            # Connexion MySQL
│   │   ├── brainrots.js           # Service brainrots
│   │   ├── giveaways.js           # Service giveaways
│   │   └── crypto.js              # Service crypto
│   ├── database/
│   │   └── migrations.js          # Schéma DB
│   └── utils/
│       ├── constants.js           # Constantes
│       └── helpers.js             # Helpers
└── logs/                          # Logs (gitignored)
```

## 🔐 Sécurité

- ✅ Pas de .env (variables sur Railway)
- ✅ Authentification API avec token Discord
- ✅ Rate limiting sur les endpoints
- ✅ Helmet pour les headers de sécurité
- ✅ CORS configuré
- ✅ Gestion d'erreurs complète

## 📡 API Endpoints

### Brainrots
- `GET /api/brainrots/:serverId`
- `POST /api/brainrots/:serverId`
- `PUT /api/brainrots/:serverId/:brainrotId`
- `DELETE /api/brainrots/:serverId/:brainrotId`

### Giveaways
- `GET /api/giveaways/:serverId`
- `POST /api/giveaways/:serverId`

### Stats & Crypto
- `GET /api/stats/:serverId`
- `GET /api/crypto/prices`
- `POST /api/crypto/convert`

### Santé
- `GET /api/health`

## 🎮 Commandes Discord

### Brainrots
- `/list` - Liste les brainrots
- `/addbrainrot` - Ajoute un brainrot
- `/removebrainrot` - Supprime un brainrot
- `/updatebrainrot` - Met à jour un brainrot
- `/addtrait` - Ajoute un trait
- `/removetrait` - Retire un trait
- `/showcompte` - Affiche par compte
- `/stats` - Statistiques

### Giveaways
- `/giveaway` - Crée un giveaway
- `/gend` - Termine un giveaway
- `/greroll` - Reroll les gagnants
- `/glist` - Liste les giveaways

## 🐛 Troubleshooting

### Erreur de connexion MySQL
- Vérifier que MySQL est créé sur Railway
- Vérifier les variables d'environnement
- Vérifier que `MYSQL_PUBLIC_URL` est correctement formatée

### Bot ne démarre pas
- Vérifier `DISCORD_TOKEN` et `CLIENT_ID`
- Vérifier les permissions du bot
- Consulter les logs : `npm run dev`

### API ne répond pas
- Vérifier que le serveur web démarre
- Vérifier le port (défaut: 3000)
- Vérifier l'authentification (header Authorization)

## 📞 Support

Pour toute question, consulter :
- README.md - Documentation générale
- Code source - Commentaires détaillés
- Logs - Informations de débogage
