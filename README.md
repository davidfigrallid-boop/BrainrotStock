# BrainrotsMarket v2.0.0

Bot Discord complet pour gérer une marketplace de Brainrots avec conversion crypto temps réel et panel admin web.

## 🚀 Fonctionnalités

- **Gestion des Brainrots** : Créer, modifier, supprimer des brainrots avec raretés, mutations et traits
- **Giveaways** : Créer et gérer des giveaways avec sélection automatique des gagnants
- **Conversion Crypto** : Conversion EUR ↔ Crypto en temps réel (BTC, ETH, SOL, USDT, LTC)
- **Panel Admin Web** : Interface web pour gérer les données
- **API REST** : Endpoints pour intégration externe
- **Base de données MySQL** : Stockage persistant sur Railway

## 📋 Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL (hébergé sur Railway)
- Token Discord Bot

## 🔧 Installation

```bash
# Cloner le repo
git clone https://github.com/votre-username/brainrotsmarket.git
cd brainrotsmarket

# Installer les dépendances
npm install
```

## 🌍 Configuration Railway

Configurer les variables d'environnement dans Railway :

```
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
GUILD_ID=votre_guild_id
MYSQLHOST=host_mysql
MYSQLPORT=3306
MYSQLUSER=utilisateur_mysql
MYSQLPASSWORD=mot_de_passe_mysql
MYSQLDATABASE=brainrots
MYSQL_PUBLIC_URL=mysql://user:pass@host:port/db
PORT=3000
LOG_LEVEL=info
NODE_ENV=production
```

## 🚀 Démarrage

```bash
# Mode production
npm start

# Mode développement (avec nodemon)
npm run dev
```

## 📡 API Endpoints

### Brainrots
- `GET /api/brainrots/:serverId` - Récupère tous les brainrots
- `POST /api/brainrots/:serverId` - Crée un brainrot
- `PUT /api/brainrots/:serverId/:brainrotId` - Met à jour un brainrot
- `DELETE /api/brainrots/:serverId/:brainrotId` - Supprime un brainrot

### Giveaways
- `GET /api/giveaways/:serverId` - Récupère tous les giveaways
- `POST /api/giveaways/:serverId` - Crée un giveaway

### Statistiques
- `GET /api/stats/:serverId` - Récupère les stats du serveur

### Crypto
- `GET /api/crypto/prices` - Récupère tous les prix crypto
- `POST /api/crypto/convert` - Convertit EUR en crypto

### Santé
- `GET /api/health` - Vérifier l'état de l'API

## 📁 Structure du projet

```
brainrotsmarket/
├── app.js                          # Point d'entrée
├── package.json
├── .gitignore
├── README.md
├── src/
│   ├── config/
│   │   ├── index.js               # Configuration centralisée
│   │   ├── logger.js              # Logger
│   │   └── commands.js            # Commandes Discord
│   ├── bot/
│   │   └── bot.js                 # Bot Discord
│   ├── web/
│   │   ├── server.js              # Serveur Express
│   │   ├── routes/
│   │   │   └── api.js             # Routes API
│   │   └── public/                # Frontend
│   ├── services/
│   │   ├── database.js            # Connexion MySQL
│   │   ├── brainrots.js           # Logique brainrots
│   │   ├── giveaways.js           # Logique giveaways
│   │   └── crypto.js              # Récupération crypto
│   ├── database/
│   │   └── migrations.js          # Schéma DB
│   └── utils/
│       ├── constants.js           # Constantes
│       └── helpers.js             # Fonctions utilitaires
└── logs/                          # Logs (gitignored)
```

## 🔐 Authentification API

Les endpoints (sauf `/health`) nécessitent une authentification :

```bash
curl -H "Authorization: Bearer YOUR_DISCORD_TOKEN" http://localhost:3000/api/brainrots/123456789
```

## 📝 Commandes Discord

- `/list` - Affiche la liste des brainrots
- `/addbrainrot` - Ajoute un brainrot
- `/removebrainrot` - Supprime un brainrot
- `/updatebrainrot` - Met à jour un brainrot
- `/giveaway` - Crée un giveaway
- `/stats` - Affiche les statistiques

## 🐛 Logs

Les logs sont stockés dans le dossier `logs/` avec le format `bot-YYYY-MM-DD.log`.

## 📄 Licence

MIT

## 👥 Contributeurs

BrainrotsMarket Contributors
