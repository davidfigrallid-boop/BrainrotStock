# Design Document - BrainrotsMarket v3

## Overview

BrainrotsMarket v3 est une refonte architecturale complète du système de gestion de marketplace de Brainrots. Le design se concentre sur la modulabilité, l'absence de dépendances circulaires, et une interface web moderne en dark purple.

L'architecture suit le pattern **Repository + Service + Handler** pour une séparation claire des responsabilités et une meilleure testabilité.

## Architecture

### Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Entry Point                  │
│                        (app.js)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │  Core   │      │Database │      │Services │
   │ Config  │      │  Layer  │      │  Layer  │
   │ Logger  │      │Repos    │      │Business │
   │ Errors  │      │Queries  │      │ Logic   │
   └────┬────┘      └────┬────┘      └────┬────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ Discord │      │   Web   │      │Database │
   │   Bot   │      │  Server │      │ MySQL   │
   │Commands │      │   API   │      │         │
   │Handlers │      │Frontend │      │         │
   └─────────┘      └─────────┘      └─────────┘
```

### Flux de Données

```
Discord User
    │
    ├─→ Slash Command
    │       │
    │       ▼
    │   Command Handler
    │       │
    │       ▼
    │   Service Layer
    │       │
    │       ▼
    │   Repository Layer
    │       │
    │       ▼
    │   MySQL Database
    │       │
    │       ▼ (Response)
    │   Service Layer
    │       │
    │       ▼
    │   Discord Embed/Message
    │
Web User
    │
    ├─→ HTTP Request
    │       │
    │       ▼
    │   Express Route
    │       │
    │       ▼
    │   Middleware (Auth, Validation)
    │       │
    │       ▼
    │   Service Layer
    │       │
    │       ▼
    │   Repository Layer
    │       │
    │       ▼
    │   MySQL Database
    │       │
    │       ▼ (Response)
    │   Service Layer
    │       │
    │       ▼
    │   JSON Response
```

## Components and Interfaces

### 1. Core Module (`src/core/`)

**Responsabilité:** Configuration centralisée, logging, gestion des erreurs

**Fichiers:**
- `config.js` : Variables d'environnement et configuration
- `logger.js` : Logger structuré avec niveaux (info, warn, error, debug)
- `errors.js` : Classes d'erreurs personnalisées

**Interfaces:**
```javascript
// Logger
logger.info(message, context?)
logger.warn(message, context?)
logger.error(message, error?)
logger.debug(message, context?)

// Config
config.discord.token
config.database.url
config.web.port
config.admin.password
```

### 2. Database Module (`src/database/`)

**Responsabilité:** Accès aux données via le pattern Repository

**Fichiers:**
- `connection.js` : Pool MySQL
- `migrations.js` : Schéma DB
- `repositories/brainrotRepository.js` : CRUD Brainrots
- `repositories/giveawayRepository.js` : CRUD Giveaways
- `repositories/cryptoRepository.js` : CRUD Crypto Prices

**Interfaces:**
```javascript
// Repository Pattern
await brainrotRepository.findAll(serverId)
await brainrotRepository.findById(id)
await brainrotRepository.create(data)
await brainrotRepository.update(id, data)
await brainrotRepository.delete(id)
```

### 3. Services Module (`src/services/`)

**Responsabilité:** Logique métier et orchestration

**Fichiers:**
- `brainrotService.js` : Logique métier Brainrots
- `giveawayService.js` : Logique métier Giveaways
- `cryptoService.js` : Logique métier Crypto
- `index.js` : Export centralisé

**Interfaces:**
```javascript
// Services
await brainrotService.getAll(serverId)
await brainrotService.create(serverId, data)
await brainrotService.addTrait(id, trait)
await giveawayService.selectWinners(participants, count)
await cryptoService.convertEurToCrypto(amount, symbol)
```

### 4. Discord Module (`src/discord/`)

**Responsabilité:** Bot Discord, commandes, handlers, événements

**Fichiers:**
- `bot.js` : Client Discord
- `commands/brainrot.js` : Commandes brainrot
- `commands/giveaway.js` : Commandes giveaway
- `handlers/commandHandler.js` : Traitement des commandes
- `handlers/buttonHandler.js` : Traitement des boutons
- `events/ready.js` : Événement ready
- `events/interactionCreate.js` : Événement interaction

**Interfaces:**
```javascript
// Commands
{
  name: 'addbrainrot',
  description: 'Ajoute un brainrot',
  options: [...]
}

// Handlers
await commandHandler.handle(interaction)
await buttonHandler.handle(interaction)
```

### 5. Web Module (`src/web/`)

**Responsabilité:** Serveur Express, API REST, Frontend

**Fichiers:**
- `server.js` : Configuration Express
- `middleware/auth.js` : Authentification
- `middleware/errorHandler.js` : Gestion des erreurs
- `routes/brainrots.js` : Routes API brainrots
- `routes/giveaways.js` : Routes API giveaways
- `routes/crypto.js` : Routes API crypto
- `public/index.html` : Frontend
- `public/css/style.css` : Styles dark purple
- `public/js/app.js` : Logique frontend

**Interfaces:**
```javascript
// Routes
GET /api/brainrots/:serverId
POST /api/brainrots/:serverId
PUT /api/brainrots/:serverId/:id
DELETE /api/brainrots/:serverId/:id

GET /api/giveaways/:serverId
POST /api/giveaways/:serverId

GET /api/crypto/prices
POST /api/crypto/convert

GET /api/stats/:serverId
GET /api/health
```

## Data Models

### Brainrot
```javascript
{
  id: number,
  server_id: string,
  name: string,
  rarity: string,           // Common, Rare, Epic, Legendary
  mutation: string,         // Default, Shiny, etc.
  incomeRate: number,       // Revenu en EUR
  priceEUR: number,         // Prix en EUR
  priceCrypto: number,      // Prix en crypto
  compte: string,           // Compte associé
  traits: string[],         // Array de traits
  quantite: number,         // Quantité
  created_at: timestamp,
  updated_at: timestamp
}
```

### Giveaway
```javascript
{
  id: number,
  server_id: string,
  messageId: string,
  channelId: string,
  prize: string,
  winners_count: number,
  endTime: number,          // Timestamp
  ended: boolean,
  winners: string[],        // Array d'IDs utilisateurs
  participants: string[],   // Array d'IDs utilisateurs
  created_at: timestamp
}
```

### Crypto Price
```javascript
{
  id: number,
  crypto: string,           // BTC, ETH, SOL, USDT, LTC
  price_eur: number,
  price_usd: number,
  updated_at: timestamp
}
```

## Error Handling

### Stratégie d'Erreurs

1. **Erreurs de Validation** : Retourner 400 Bad Request
2. **Erreurs d'Authentification** : Retourner 401 Unauthorized
3. **Erreurs de Ressource** : Retourner 404 Not Found
4. **Erreurs Serveur** : Retourner 500 Internal Server Error
5. **Erreurs de Rate Limit** : Retourner 429 Too Many Requests

### Classes d'Erreurs Personnalisées

```javascript
class ValidationError extends Error {}
class AuthenticationError extends Error {}
class NotFoundError extends Error {}
class DatabaseError extends Error {}
class ExternalAPIError extends Error {}
```

## Testing Strategy

### Niveaux de Test

1. **Unit Tests** : Tester les services et repositories isolément
2. **Integration Tests** : Tester l'interaction entre modules
3. **API Tests** : Tester les endpoints REST
4. **Discord Tests** : Tester les commandes Discord

### Outils

- Jest pour les unit tests
- Supertest pour les API tests
- Mock Discord.js pour les tests Discord

## Security Considerations

1. **Authentification** : Token Discord ou password simple
2. **Rate Limiting** : 100 requêtes par 15 minutes
3. **CORS** : Configurable via variables d'environnement
4. **Helmet** : Headers de sécurité HTTP
5. **Validation** : Validation des inputs côté serveur
6. **Logs** : Pas de données sensibles dans les logs

## Deployment

### Variables d'Environnement Requises

```
DISCORD_TOKEN=xxx
CLIENT_ID=xxx
GUILD_ID=xxx
MYSQLHOST=xxx
MYSQLPORT=3306
MYSQLUSER=xxx
MYSQLPASSWORD=xxx
MYSQLDATABASE=brainrots
MYSQL_PUBLIC_URL=mysql://user:pass@host:port/db
PORT=3000
LOG_LEVEL=info
NODE_ENV=production
ADMIN_PASSWORD=xxx
CORS_ORIGIN=http://localhost:3000
```

### Plateforme

- Railway pour l'hébergement
- MySQL sur Railway
- Node.js 18+

## Performance Considerations

1. **Caching** : Cache des prix crypto (5 minutes)
2. **Database Indexes** : Index sur server_id, rarity, endTime
3. **Connection Pooling** : Pool MySQL avec 10 connexions
4. **Rate Limiting** : Prévention des abus
5. **Lazy Loading** : Chargement des données à la demande
