# Implementation Plan - Brainrot List Embed

- [x] 1. Créer le handler pour la commande /list





  - Créer le fichier `src/discord/handlers/listCommandHandlers.js`
  - Implémenter la fonction `aggregateBrainrots()` pour regrouper les brainrots identiques
  - Implémenter la fonction `groupByRarity()` pour grouper par rareté
  - Implémenter la fonction `formatBrainrotLine()` pour formater chaque ligne de brainrot
  - Implémenter la fonction `buildListEmbed()` qui orchestre tout et retourne un EmbedBuilder
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2. Mettre à jour la commande /list





  - Modifier `src/discord/commands/brainrot.js` pour utiliser le nouveau handler
  - Appeler `buildListEmbed()` avec les brainrots récupérés
  - Gérer le cas où aucun brainrot n'existe
  - Envoyer l'embed à l'utilisateur
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4_

- [x] 3. Vérifier et compléter les enums





  - Vérifier que `RARITY_EMOJIS` existe dans `src/core/enums.js`
  - Vérifier que `RARITY_ORDER` existe et est correct
  - Vérifier que `RARITY_COLORS` existe
  - Ajouter les mappings manquants si nécessaire
  - _Requirements: 2.2, 2.3_

- [x] 4. Écrire les tests unitaires





  - Créer `src/discord/handlers/__tests__/listCommandHandlers.test.js`
  - Tester `aggregateBrainrots()` avec brainrots identiques et différents
  - Tester `groupByRarity()` avec différentes raretés
  - Tester `formatBrainrotLine()` avec tous les cas (avec/sans traits, mutations, quantité)
  - Tester `buildListEmbed()` avec brainrots et sans brainrots
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_
