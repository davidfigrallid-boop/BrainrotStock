# Structure du Projet BrainrotsMarket

## Architecture Modulaire

```
brainrot-discord-bot/
├── index.js                    # Point d'entrée principal (simplifié)
├── commands/
│   ├── brainrotCommands.js    # Commandes brainrot market
│   ├── giveawayCommands.js    # Commandes giveaway
│   └── adminCommands.js       # Commandes admin
├── handlers/
│   ├── brainrotHandlers.js    # Handlers brainrot
│   ├── giveawayHandlers.js    # Handlers giveaway
│   └── adminHandlers.js       # Handlers admin
├── utils/
│   ├── constants.js           # Constantes (raretés, mutations, traits)
│   ├── priceUtils.js          # Utilitaires prix
│   ├── embedBuilders.js       # Construction des embeds
│   └── dataManager.js         # Gestion fichiers JSON
├── cryptoConverter.js         # API CoinGecko
├── brainrots.json            # Base de données brainrots
├── giveaways.json            # Base de données giveaways
├── config.json               # Configuration
├── Banner.png                # Banner market
├── Robux.jpg                 # Banner giveaway
└── .env                      # Variables d'environnement
```

## Modules Créés

✅ `utils/constants.js` - Raretés, mutations, traits
✅ `utils/priceUtils.js` - Formatage prix
✅ `commands/brainrotCommands.js` - Définitions commandes brainrot
✅ `commands/giveawayCommands.js` - Définitions commandes giveaway
✅ `commands/adminCommands.js` - Définitions commandes admin

## À Créer

- `handlers/brainrotHandlers.js`
- `handlers/giveawayHandlers.js`
- `handlers/adminHandlers.js`
- `utils/embedBuilders.js`
- `utils/dataManager.js`
- `index.js` (nouveau, simplifié)
