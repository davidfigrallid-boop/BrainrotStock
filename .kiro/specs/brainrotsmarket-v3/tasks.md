# Implementation Plan - BrainrotsMarket v3

## Phase 1 : Infrastructure de Base

- [x] 1. Initialiser le projet et structure de base





  - Créer le dossier `brainrotsmarket-v3` à la racine
  - Initialiser `package.json` avec dépendances (discord.js, express, mysql2, axios, helmet, cors, body-parser, express-rate-limit)
  - Créer `.env.example` avec toutes les variables requises
  - Créer `.gitignore` approprié
  - _Requirements: 1.1, 1.2_

- [x] 2. Mettre en place le système de configuration et logging

  - Créer `src/core/config.js` pour centraliser les variables d'environnement
  - Créer `src/core/logger.js` avec niveaux de log (info, warn, error, debug)
  - Créer `src/core/errors.js` avec classes d'erreurs personnalisées
  - Implémenter la rotation des logs quotidienne
  - _Requirements: 1.3, 1.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 3. Initialiser la connexion à la base de données

  - Créer `src/database/connection.js` avec pool MySQL
  - Implémenter la gestion des connexions et erreurs
  - Tester la connexion au démarrage
  - _Requirements: 7.1, 7.2_

- [x] 4. Créer les migrations de base de données

  - Créer `src/database/migrations.js` avec schéma complet
  - Implémenter les tables : servers, brainrots, giveaways, crypto_prices
  - Ajouter les index sur les colonnes clés
  - Ajouter les timestamps (created_at, updated_at)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

## Phase 2 : Couche Données (Repositories)

- [x] 5. Implémenter le Repository Pattern

  - Créer `src/database/repositories/baseRepository.js` avec méthodes communes
  - Implémenter les méthodes CRUD génériques
  - _Requirements: 1.5_

- [x] 6. Créer le BrainrotRepository

  - Créer `src/database/repositories/brainrotRepository.js`
  - Implémenter findAll, findById, create, update, delete
  - Implémenter les méthodes spécifiques (findByRarity, findByMutation, etc.)
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. Créer le GiveawayRepository

  - Créer `src/database/repositories/giveawayRepository.js`
  - Implémenter findAll, findById, findByMessageId, create, update, delete
  - Implémenter findExpired pour les giveaways terminés
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 8. Créer le CryptoRepository


  - Créer `src/database/repositories/cryptoRepository.js`
  - Implémenter findBySymbol, create, update, findAll
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

## Phase 3 : Couche Métier (Services)

- [x] 9. Créer le BrainrotService





  - Créer `src/services/brainrotService.js`
  - Implémenter getAll, getById, create, update, delete
  - Implémenter addTrait, removeTrait
  - Implémenter getStats (total, valeur, répartition)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 10. Créer le GiveawayService





  - Créer `src/services/giveawayService.js`
  - Implémenter getAll, getById, create, update, delete
  - Implémenter addParticipant, endGiveaway, rerollWinners
  - Implémenter selectWinners (sélection aléatoire)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 11. Créer le CryptoService





  - Créer `src/services/cryptoService.js`
  - Implémenter getPriceEur, fetchFromCoinGecko
  - Implémenter convertEurToCrypto, convertCryptoToEur
  - Implémenter caching (5 minutes)
  - Implémenter getAllPrices, refreshAllPrices
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 12. Créer l'index centralisé des services





  - Créer `src/services/index.js`
  - Exporter tous les services
  - _Requirements: 1.5_

## Phase 4 : Bot Discord

- [x] 13. Initialiser le client Discord





  - Créer `src/discord/bot.js` avec client Discord
  - Implémenter l'initialisation et la connexion
  - Implémenter les événements (ready, interactionCreate)
  - _Requirements: 1.1, 1.2_

- [x] 14. Créer les commandes Brainrot





  - Créer `src/discord/commands/brainrot.js`
  - Implémenter les commandes : list, addbrainrot, removebrainrot, updatebrainrot, addtrait, removetrait, showcompte, stats
  - Utiliser le builder SlashCommandBuilder
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 15. Créer les commandes Giveaway




  - Créer `src/discord/commands/giveaway.js`
  - Implémenter les commandes : giveaway, gend, greroll, glist
  - Utiliser le builder SlashCommandBuilder
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 16. Créer l'index des commandes





  - Créer `src/discord/commands/index.js`
  - Exporter toutes les commandes
  - Implémenter la fonction de chargement des commandes
  - _Requirements: 1.5_

- [x] 17. Créer le CommandHandler





  - Créer `src/discord/handlers/commandHandler.js`
  - Implémenter la logique de traitement des commandes slash
  - Router vers les services appropriés
  - Gérer les erreurs et répondre à l'utilisateur
  - _Requirements: 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 18. Créer le ButtonHandler





  - Créer `src/discord/handlers/buttonHandler.js`
  - Implémenter la logique de traitement des clics de boutons
  - Gérer les boutons de participation aux giveaways
  - _Requirements: 3.2_

- [x] 19. Créer l'index des handlers




  - Créer `src/discord/handlers/index.js`
  - Exporter tous les handlers
  - _Requirements: 1.5_

- [x] 20. Créer les événements Discord





  - Créer `src/discord/events/ready.js` pour l'événement ready
  - Créer `src/discord/events/interactionCreate.js` pour les interactions
  - Créer `src/discord/events/index.js` pour exporter les événements
  - _Requirements: 1.1, 1.2_

## Phase 5 : Serveur Web et API REST

- [x] 21. Initialiser le serveur Express





  - Créer `src/web/server.js` avec configuration Express
  - Implémenter les middlewares (helmet, cors, body-parser, rate-limit)
  - Configurer les routes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.8_

- [x] 22. Créer les middlewares





  - Créer `src/web/middleware/auth.js` pour l'authentification
  - Créer `src/web/middleware/errorHandler.js` pour la gestion des erreurs
  - Créer `src/web/middleware/index.js` pour exporter les middlewares
  - _Requirements: 6.6, 6.7_

- [x] 23. Créer les routes API Brainrots





  - Créer `src/web/routes/brainrots.js`
  - Implémenter GET /api/brainrots/:serverId
  - Implémenter POST /api/brainrots/:serverId
  - Implémenter PUT /api/brainrots/:serverId/:id
  - Implémenter DELETE /api/brainrots/:serverId/:id
  - _Requirements: 6.1_

- [x] 24. Créer les routes API Giveaways





  - Créer `src/web/routes/giveaways.js`
  - Implémenter GET /api/giveaways/:serverId
  - Implémenter POST /api/giveaways/:serverId
  - Implémenter PUT /api/giveaways/:serverId/:id
  - Implémenter DELETE /api/giveaways/:serverId/:id
  - _Requirements: 6.2_

- [x] 25. Créer les routes API Crypto




  - Créer `src/web/routes/crypto.js`
  - Implémenter GET /api/crypto/prices
  - Implémenter POST /api/crypto/convert
  - _Requirements: 6.3_

- [x] 26. Créer les routes API Stats et Health




  - Créer `src/web/routes/stats.js`
  - Implémenter GET /api/stats/:serverId
  - Implémenter GET /api/health
  - _Requirements: 6.4, 6.5_

- [x] 27. Créer l'index des routes





  - Créer `src/web/routes/index.js`
  - Exporter toutes les routes
  - _Requirements: 1.5_

## Phase 6 : Frontend Dark Purple

- [x] 28. Créer la structure HTML




  - Créer `public/index.html`
  - Implémenter la structure de base (header, nav, main, footer)
  - Ajouter les sections pour brainrots, giveaways, crypto
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 29. Créer les styles Dark Purple





  - Créer `public/css/style.css`
  - Implémenter la palette dark purple exclusive
  - Implémenter le responsive design (mobile, tablet, desktop)
  - Implémenter les composants (cards, buttons, forms, tables)
  - _Requirements: 5.1, 5.6_

- [x] 30. Créer la logique frontend





  - Créer `public/js/app.js` pour la logique principale
  - Créer `public/js/api.js` pour les appels API
  - Créer `public/js/ui.js` pour la manipulation du DOM
  - Créer `public/js/utils.js` pour les fonctions utilitaires
  - Implémenter l'authentification simple
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.7_

- [x] 31. Implémenter le dashboard





  - Afficher les statistiques principales (total brainrots, valeur, giveaways actifs)
  - Afficher les prix crypto en temps réel
  - Implémenter les graphiques/charts
  - _Requirements: 5.2_

- [x] 32. Implémenter la gestion des Brainrots





  - Créer le formulaire d'ajout de brainrot
  - Créer la liste des brainrots avec filtrage
  - Créer le formulaire de modification
  - Implémenter la suppression
  - _Requirements: 5.3_

- [x] 33. Implémenter la gestion des Giveaways





  - Créer le formulaire de création de giveaway
  - Créer la liste des giveaways
  - Implémenter la modification et suppression
  - _Requirements: 5.4_

- [x] 34. Implémenter l'affichage des prix Crypto





  - Créer un tableau des prix crypto
  - Implémenter la conversion EUR ↔ Crypto
  - Rafraîchir les prix en temps réel
  - _Requirements: 5.5_

## Phase 7 : Point d'Entrée et Intégration

- [x] 35. Créer le point d'entrée principal





  - Créer `src/app.js`
  - Initialiser les modules dans l'ordre correct (config → database → services → discord → web)
  - Implémenter la gestion des erreurs globales
  - Implémenter l'arrêt gracieux
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

-

- [x] 36. Créer le fichier d'entrée racine


  - Créer `app.js` à la racine
  - Importer et lancer `src/app.js`
  - _Requirements: 1.1_

- [x] 37. Configurer les scripts npm









  - Ajouter `npm start` pour la production
  - Ajouter `npm run dev` pour le développement (nodemon)
  - Ajouter `npm run lint` pour le linting
  - _Requirements: 1.1_

## Phase 8 : Documentation et Finalisation


- [x] 38. Créer la documentation




  - Créer `README.md` complet avec installation, configuration, utilisation
  - Documenter les endpoints API
  - Documenter les commandes Discord
  - Documenter les variables d'environnement
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
-

- [x] 39. Créer le fichier `.env.example`




  - Lister toutes les variables d'environnement requises
  - Ajouter des commentaires explicatifs
  - _Requirements: 1.1_


- [x] 40. Tester l'intégration complète




  - Tester le démarrage de l'application
  - Tester les commandes Discord
  - Tester les endpoints API
  - Tester l'interface web
  - Tester la conversion crypto
  - Tester les giveaways
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_
