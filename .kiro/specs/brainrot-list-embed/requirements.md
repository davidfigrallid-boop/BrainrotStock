# Requirements Document - Brainrot List Embed

## Introduction

Cette feature implémente la commande `/list` qui affiche tous les brainrots enregistrés dans un embed Discord formaté par catégories (rareté). L'embed doit afficher les brainrots de manière lisible avec leurs informations principales (mutations, traits, revenu, prix). Si aucun brainrot n'existe, l'embed doit quand même s'afficher avec un message approprié.

## Glossary

- **Brainrot**: Entité représentant un personnage/NFT avec des propriétés (nom, rareté, mutations, traits, prix, revenu)
- **Rareté**: Niveau de rareté du brainrot (Common, Uncommon, Rare, Epic, Legendary, Mythical, Brainrot God, Secret, OG)
- **Mutation**: Type de mutation appliquée au brainrot (Default, Gold, Diamond, Rainbow, etc.)
- **Traits**: Caractéristiques additionnelles du brainrot (Bloodmoon, Taco, Galactic, etc.)
- **Embed**: Message Discord formaté avec titre, description, couleur et champs
- **Agrégation**: Regroupement des brainrots identiques avec comptage de quantité
- **Catégorie**: Groupement des brainrots par rareté pour l'affichage

## Requirements

### Requirement 1: Affichage de la liste des brainrots

**User Story:** En tant qu'utilisateur, je veux voir tous mes brainrots enregistrés dans un embed formaté, afin de visualiser rapidement mon inventaire.

#### Acceptance Criteria

1. WHEN l'utilisateur exécute la commande `/list`, THE bot SHALL récupérer tous les brainrots du serveur depuis la base de données
2. WHEN des brainrots existent, THE bot SHALL afficher un embed contenant les brainrots groupés par rareté
3. WHEN aucun brainrot n'existe, THE bot SHALL afficher un embed avec un message indiquant qu'il n'y en a pas
4. WHILE affichant les brainrots, THE bot SHALL inclure pour chaque brainrot: nom, mutations, traits, revenu/s, prix EUR et prix crypto
5. WHERE les brainrots sont identiques (même nom, rareté, mutations, traits, compte), THE bot SHALL les agréger avec un compteur de quantité

### Requirement 2: Formatage de l'embed par rareté

**User Story:** En tant qu'utilisateur, je veux que les brainrots soient organisés par rareté dans l'embed, afin de les trouver facilement.

#### Acceptance Criteria

1. WHEN l'embed est généré, THE bot SHALL grouper les brainrots par rareté
2. WHEN affichant chaque groupe de rareté, THE bot SHALL utiliser un emoji coloré correspondant à la rareté (⬜ Common, 🟦 Rare, 🟪 Epic, 🌈 Brainrot God, ⭐ OG, etc.)
3. WHEN affichant les brainrots d'une rareté, THE bot SHALL les trier alphabétiquement par nom
4. WHILE affichant les brainrots, THE bot SHALL utiliser le format: `NomBrainrot [Mutations] {Trait1, Trait2, ...}` suivi de `├ Income: X/s` et `├ Prix: X€ (Y CRYPTO)`
5. WHERE une rareté n'a aucun brainrot, THE bot SHALL ne pas afficher cette catégorie

### Requirement 3: Propriétés de l'embed

**User Story:** En tant qu'utilisateur, je veux que l'embed soit bien formaté avec une couleur, un footer et un timestamp, afin qu'il soit professionnel et informatif.

#### Acceptance Criteria

1. WHEN l'embed est créé, THE bot SHALL définir la couleur de l'embed à #f5e000 (jaune)
2. WHEN l'embed est créé, THE bot SHALL ajouter un footer avec le texte "Brainrot Market [FR] | Refreshing in 5 min"
3. WHEN l'embed est créé, THE bot SHALL ajouter un timestamp actuel
4. WHEN l'embed est créé, THE bot SHALL utiliser la description pour afficher les brainrots formatés
5. WHERE l'embed contient plusieurs catégories, THE bot SHALL utiliser des champs séparés pour chaque rareté

### Requirement 4: Gestion des cas limites

**User Story:** En tant qu'utilisateur, je veux que la commande gère correctement les cas où il n'y a pas de brainrots ou des données manquantes.

#### Acceptance Criteria

1. IF aucun brainrot n'existe sur le serveur, THEN THE bot SHALL afficher un embed avec le message "Aucun brainrot enregistré"
2. IF un brainrot n'a pas de traits, THEN THE bot SHALL afficher l'embed sans la section traits
3. IF un brainrot n'a pas de mutation, THEN THE bot SHALL afficher l'embed sans la section mutations
4. IF le prix crypto n'est pas disponible, THEN THE bot SHALL afficher "N/A" à la place du prix
5. IF la quantité d'un brainrot agrégé est supérieure à 1, THEN THE bot SHALL afficher "x[quantité]" après le nom
