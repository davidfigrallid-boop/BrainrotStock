# Requirements Document - BrainrotsMarket v3

## Introduction

BrainrotsMarket v3 est une refonte complète du bot Discord de gestion de marketplace de Brainrots. Le projet vise à corriger les bugs d'incompatibilité de la v2, à refactoriser l'architecture pour une meilleure modulabilité, et à créer une interface web moderne en dark purple. Le système maintient les mêmes fonctionnalités (gestion des brainrots, giveaways, conversion crypto) mais avec une base de code robuste et maintenable.

## Glossary

- **Brainrot** : Créature/NFT gérée dans la marketplace avec raretés, mutations et traits
- **Giveaway** : Tirage au sort avec sélection automatique de gagnants
- **Crypto** : Conversion EUR ↔ Crypto (BTC, ETH, SOL, USDT, LTC) en temps réel
- **Repository** : Couche d'accès aux données (pattern Repository)
- **Service** : Couche métier contenant la logique applicative
- **Handler** : Fonction traitant les interactions Discord
- **Dark Purple** : Palette de couleurs exclusive (nuances de violet/pourpre)
- **Modulabilité** : Capacité à ajouter/retirer des features sans casser le code existant

## Requirements

### Requirement 1 : Architecture Modulaire et Sans Dépendances Circulaires

**User Story:** En tant que développeur, je veux une architecture claire et modulaire, afin que je puisse ajouter/modifier des features sans créer de bugs d'incompatibilité.

#### Acceptance Criteria

1. WHEN l'application démarre, THE système SHALL initialiser les modules dans l'ordre correct (config → database → services → discord → web)
2. WHILE le code s'exécute, THE système SHALL éviter toute dépendance circulaire entre modules
3. WHERE un nouveau service est ajouté, THE système SHALL permettre son intégration sans modifier les services existants
4. IF une erreur survient dans un module, THEN THE système SHALL isoler l'erreur et empêcher la propagation aux autres modules
5. THE système SHALL exporter tous les services via un fichier index.js centralisé pour faciliter les imports

### Requirement 2 : Gestion Complète des Brainrots

**User Story:** En tant qu'administrateur, je veux gérer complètement les brainrots (créer, modifier, supprimer, ajouter des traits), afin de maintenir la marketplace à jour.

#### Acceptance Criteria

1. WHEN un administrateur exécute `/addbrainrot`, THE système SHALL créer un brainrot avec nom, rareté, mutation, revenu et prix EUR
2. WHEN un administrateur exécute `/updatebrainrot`, THE système SHALL modifier les propriétés du brainrot sans affecter les autres
3. WHEN un administrateur exécute `/removebrainrot`, THE système SHALL supprimer le brainrot et ses traits associés
4. WHEN un administrateur exécute `/addtrait`, THE système SHALL ajouter un trait au brainrot sans dupliquer
5. WHEN un administrateur exécute `/removetrait`, THE système SHALL retirer un trait du brainrot
6. WHEN un administrateur exécute `/list`, THE système SHALL afficher tous les brainrots avec filtrage par rareté/mutation
7. WHEN un administrateur exécute `/stats`, THE système SHALL calculer et afficher les statistiques (total, valeur, répartition par rareté)

### Requirement 3 : Gestion Complète des Giveaways

**User Story:** En tant qu'administrateur, je veux créer et gérer des giveaways, afin de récompenser les membres de la communauté.

#### Acceptance Criteria

1. WHEN un administrateur exécute `/giveaway`, THE système SHALL créer un giveaway avec prix, nombre de gagnants et durée
2. WHEN un utilisateur clique sur le bouton de participation, THE système SHALL l'ajouter à la liste des participants
3. WHEN le giveaway se termine, THE système SHALL sélectionner aléatoirement les gagnants
4. WHEN un administrateur exécute `/gend`, THE système SHALL terminer manuellement un giveaway
5. WHEN un administrateur exécute `/greroll`, THE système SHALL resélectionner les gagnants
6. WHEN un administrateur exécute `/glist`, THE système SHALL afficher tous les giveaways actifs et terminés

### Requirement 4 : Conversion Crypto en Temps Réel

**User Story:** En tant qu'utilisateur, je veux convertir les prix EUR en crypto et vice-versa, afin de connaître la valeur réelle des brainrots.

#### Acceptance Criteria

1. WHEN l'API reçoit une requête de conversion EUR→Crypto, THE système SHALL récupérer le prix depuis CoinGecko et convertir
2. WHEN l'API reçoit une requête de conversion Crypto→EUR, THE système SHALL récupérer le prix et convertir
3. WHILE le système fonctionne, THE système SHALL mettre en cache les prix pendant 5 minutes
4. WHEN le cache expire, THE système SHALL rafraîchir les prix depuis l'API
5. IF l'API CoinGecko est indisponible, THEN THE système SHALL utiliser les prix en cache ou en base de données

### Requirement 5 : Interface Web Dark Purple Complète

**User Story:** En tant qu'utilisateur, je veux une interface web moderne et intuitive en dark purple, afin de gérer facilement la marketplace.

#### Acceptance Criteria

1. THE interface SHALL utiliser exclusivement une palette dark purple (nuances de violet/pourpre)
2. WHEN l'utilisateur accède au site, THE interface SHALL afficher un dashboard avec les statistiques principales
3. WHEN l'utilisateur navigue, THE interface SHALL permettre la gestion des brainrots (CRUD)
4. WHEN l'utilisateur navigue, THE interface SHALL permettre la gestion des giveaways (CRUD)
5. WHEN l'utilisateur navigue, THE interface SHALL afficher les prix crypto en temps réel
6. THE interface SHALL être responsive et fonctionner sur mobile/tablet/desktop
7. THE interface SHALL avoir une authentification simple (token/password)

### Requirement 6 : API REST Complète et Sécurisée

**User Story:** En tant que développeur, je veux une API REST complète et sécurisée, afin d'intégrer le système avec d'autres applications.

#### Acceptance Criteria

1. THE API SHALL exposer des endpoints pour brainrots (GET, POST, PUT, DELETE)
2. THE API SHALL exposer des endpoints pour giveaways (GET, POST, PUT, DELETE)
3. THE API SHALL exposer des endpoints pour crypto (GET prices, POST convert)
4. THE API SHALL exposer un endpoint de statistiques (GET /api/stats)
5. THE API SHALL exposer un endpoint de santé (GET /api/health)
6. WHEN une requête est reçue, THE API SHALL valider l'authentification (sauf /health)
7. WHEN une erreur survient, THE API SHALL retourner un code HTTP approprié et un message d'erreur structuré
8. WHILE le système fonctionne, THE API SHALL appliquer un rate limiting pour éviter les abus

### Requirement 7 : Base de Données Robuste et Migrée

**User Story:** En tant qu'administrateur, je veux une base de données bien structurée et migrée, afin d'assurer la persistance et l'intégrité des données.

#### Acceptance Criteria

1. WHEN l'application démarre, THE système SHALL exécuter les migrations automatiquement
2. THE base de données SHALL avoir des tables pour servers, brainrots, giveaways, crypto_prices
3. THE base de données SHALL avoir des index sur les colonnes fréquemment interrogées
4. WHEN une donnée est créée/modifiée, THE système SHALL enregistrer les timestamps (created_at, updated_at)
5. IF une migration échoue, THEN THE système SHALL afficher un message d'erreur clair et arrêter l'application

### Requirement 8 : Logging Structuré et Traçabilité

**User Story:** En tant qu'administrateur, je veux des logs structurés et traçables, afin de déboguer les problèmes et monitorer l'application.

#### Acceptance Criteria

1. THE système SHALL enregistrer tous les événements importants (démarrage, commandes, erreurs)
2. THE système SHALL utiliser des niveaux de log (info, warn, error, debug)
3. WHEN une erreur survient, THE système SHALL enregistrer la stack trace complète
4. WHILE le système fonctionne, THE système SHALL écrire les logs dans des fichiers avec rotation quotidienne
5. THE logs SHALL inclure des timestamps et des contextes pour faciliter le débogage
