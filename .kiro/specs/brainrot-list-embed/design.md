# Design Document - Brainrot List Embed

## Overview

La commande `/list` affiche tous les brainrots enregistrés dans un embed Discord formaté par rareté. Le système agrège les brainrots identiques et les affiche avec leurs informations complètes (mutations, traits, revenu, prix EUR et crypto).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Discord Interaction                       │
│                    (/list command)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              BrainrotService.getAll()                        │
│         (Récupère tous les brainrots du serveur)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           ListCommandHandler.buildListEmbed()               │
│  (Agrège, trie et formate les brainrots pour l'embed)      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              EmbedBuilder (Discord.js)                       │
│         (Crée l'embed avec formatage final)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Discord Channel Message                         │
│         (Affiche l'embed à l'utilisateur)                   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. ListCommandHandler

**Responsabilité**: Gérer la logique de la commande `/list` et construire l'embed.

**Méthodes principales**:

- `buildListEmbed(brainrots: Array): EmbedBuilder`
  - Agrège les brainrots identiques
  - Trie par rareté puis alphabétiquement
  - Formate chaque brainrot avec ses informations
  - Retourne un EmbedBuilder prêt à être envoyé

- `aggregateBrainrots(brainrots: Array): Array`
  - Regroupe les brainrots identiques
  - Ajoute un compteur de quantité
  - Retourne la liste agrégée

- `groupByRarity(brainrots: Array): Object`
  - Groupe les brainrots par rareté
  - Retourne un objet avec rareté comme clé

- `formatBrainrotLine(brainrot: Object): String`
  - Formate une ligne de brainrot
  - Format: `NomBrainrot [Mutations] {Traits}\n├ Income: X/s\n├ Prix: X€ (Y CRYPTO)`

### 2. BrainrotFormatter (existant)

**Utilisation**:
- `formatPrice(price: number): string` - Formate les prix avec abréviations (k, M, B, etc.)
- `formatIncomeRate(rate: number): string` - Formate le revenu avec /s
- `getRarityColor(rarity: string): string` - Retourne la couleur hex de la rareté

### 3. Enums (existant)

**Utilisation**:
- `RARITY_EMOJIS` - Mapping rareté → emoji coloré
- `RARITY_ORDER` - Ordre de tri des raretés
- `RARITY_COLORS` - Couleurs hex des raretés

## Data Models

### Brainrot Object

```javascript
{
  id: number,
  server_id: string,
  name: string,
  rarity: string,           // Common, Rare, Epic, Legendary, Mythical, Brainrot God, Secret, OG
  mutation: string,         // Default, Gold, Diamond, Rainbow, etc.
  traits: string[],         // [Bloodmoon, Taco, Galactic, ...]
  incomeRate: number,       // EUR/s
  priceEUR: number,         // Prix en EUR
  priceCrypto: {            // Prix en différentes cryptos
    BTC: number,
    ETH: number,
    ...
  },
  compte: string | null,    // Compte associé (optionnel)
  quantite: number          // Quantité (après agrégation)
}
```

### Embed Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Color: #f5e000 (Jaune)                                      │
├─────────────────────────────────────────────────────────────┤
│ Description:                                                 │
│                                                              │
│ # ⬜ Common                                                  │
│                                                              │
│ ```                                                          │
│ BrainrotExemple [Mutations] {Trait1, Trait2}               │
│ ├ Income: 100/s                                             │
│ ├ Prix: 1M€ (0.0001 BTC)                                   │
│                                                              │
│ BrainrotExemple2 [Gold] {Trait1}                           │
│ ├ Income: 500/s                                             │
│ ├ Prix: 5M€ (0.0005 BTC)                                   │
│ ```                                                          │
│                                                              │
│ # 🌈 Brainrot God                                           │
│                                                              │
│ ```                                                          │
│ BrainrotLegendaire [Diamond] {Trait1, Trait2, Trait3}     │
│ ├ Income: 10k/s                                             │
│ ├ Prix: 100M€ (0.005 BTC)                                  │
│ ```                                                          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Footer: "Brainrot Market [FR] | Refreshing in 5 min"       │
│ Timestamp: [Heure actuelle]                                 │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling

### Cas d'erreur gérés

1. **Aucun brainrot trouvé**
   - Affiche un embed avec le message "Aucun brainrot enregistré"
   - Couleur: #f5e000 (même couleur)

2. **Erreur de récupération des données**
   - Affiche un message d'erreur: "❌ Une erreur est survenue lors de la récupération des brainrots."
   - Log l'erreur complète

3. **Données manquantes**
   - Prix crypto non disponible → affiche "N/A"
   - Traits vides → n'affiche pas la section traits
   - Mutation vide → n'affiche pas la section mutations

## Testing Strategy

### Tests unitaires

1. **aggregateBrainrots()**
   - Teste l'agrégation de brainrots identiques
   - Teste le compteur de quantité
   - Teste les brainrots différents (ne doivent pas être agrégés)

2. **groupByRarity()**
   - Teste le groupement par rareté
   - Teste l'ordre des raretés
   - Teste les raretés vides

3. **formatBrainrotLine()**
   - Teste le formatage avec tous les champs
   - Teste le formatage sans traits
   - Teste le formatage sans mutation
   - Teste le formatage avec quantité > 1

4. **buildListEmbed()**
   - Teste la création de l'embed avec brainrots
   - Teste la création de l'embed sans brainrots
   - Teste les propriétés de l'embed (couleur, footer, timestamp)

### Tests d'intégration

1. Teste la commande `/list` complète
2. Teste l'affichage correct dans Discord
3. Teste la gestion des erreurs

## Implementation Notes

### Points clés

1. **Agrégation**: Les brainrots identiques (même nom, rareté, mutations, traits, compte) doivent être regroupés avec un compteur de quantité.

2. **Tri**: 
   - Primaire: par rareté (ordre défini dans les enums)
   - Secondaire: alphabétiquement par nom

3. **Formatage du prix crypto**: 
   - Utiliser le format approprié selon la magnitude (exponential pour très petit, 8 décimales pour petit, etc.)

4. **Gestion des cas limites**:
   - Pas de brainrots → afficher un message approprié
   - Données manquantes → utiliser des valeurs par défaut ou "N/A"

5. **Performance**: 
   - L'agrégation et le tri doivent être efficaces même avec beaucoup de brainrots
   - Limiter la taille de l'embed si nécessaire (Discord a une limite de 4096 caractères par description)

### Fichiers à modifier/créer

1. **src/discord/handlers/listCommandHandlers.js** (créer ou modifier)
   - Implémenter la logique de construction de l'embed

2. **src/discord/commands/brainrot.js** (modifier)
   - Mettre à jour la commande `/list` pour utiliser le nouveau handler

3. **src/core/enums.js** (vérifier/compléter)
   - Vérifier que les mappings rareté → emoji et rareté → couleur existent

4. **Tests** (créer)
   - Ajouter des tests unitaires pour les fonctions de formatage
