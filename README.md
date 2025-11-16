# 🧠 Brainrot Discord Bot

Bot Discord pour gérer une base de données de Brainrots avec conversion crypto en temps réel.

## ✨ Fonctionnalités

- **Gestion des Brainrots** : Ajout, suppression, mise à jour d'items
- **Mutations multiples** : Chaque brainrot peut avoir plusieurs mutations
- **Agrégation automatique** : Les brainrots identiques sont regroupés avec un compteur (x2, x3, etc.)
- **Prix abrégés** : Support des formats 1k, 1M, 1B, 1T, 1Qa
- **Conversion crypto** : 15 cryptos supportées avec mise à jour automatique
- **Système de comptes** : Assignez des brainrots à des comptes spécifiques
- **Auto-refresh** : Liste mise à jour toutes les 5 minutes

## 🚀 Installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd brainrot-discord-bot
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine :
```env
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
GUILD_ID=votre_guild_id
```

Pour obtenir ces valeurs :
- Allez sur https://discord.com/developers/applications
- Créez une application ou sélectionnez-en une existante
- `CLIENT_ID` : Dans "General Information" → Application ID
- `DISCORD_TOKEN` : Dans "Bot" → Token (Reset Token si nécessaire)
- `GUILD_ID` : Activez le mode développeur dans Discord, clic droit sur votre serveur → Copier l'identifiant du serveur

4. **Inviter le bot sur votre serveur**

URL d'invitation (remplacez CLIENT_ID) :
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=2147485696&scope=bot%20applications.commands
```

5. **Lancer le bot**
```bash
npm start
```

## 📋 Commandes

### `/list`
Affiche la liste complète des brainrots triée par rareté.

### `/addbrainrot`
Ajoute un nouveau brainrot.

**Paramètres :**
- `name` : Nom du brainrot
- `rarity` : Rareté (Common, Rare, Epic, Legendary, Mythic, Brainrot God, Secret, OG)
- `income_rate` : Revenu par seconde (ex: `100`, `1k`, `1.5M`, `2B`)
- `price_eur` : Prix en euros (ex: `50`, `1k`, `1.5M`)
- `mutations` (optionnel) : Mutations séparées par des virgules (ex: `Fire, Ice, Dark`)
- `compte` (optionnel) : Nom du compte
- `valeur` (optionnel) : Nombre de brainrots identiques (défaut: 1)

**Exemple :**
```
/addbrainrot name:Skibidi rarity:Epic income_rate:1.5M price_eur:500k mutations:Fire,Ice compte:Main valeur:3
```

### `/removebrainrot`
Supprime un brainrot.

**Paramètres :**
- `name` : Nom du brainrot
- `mutations` (optionnel) : Pour identifier un brainrot spécifique si plusieurs ont le même nom

### `/updatebrainrot`
Met à jour un brainrot existant.

**Paramètres :**
- `name` : Nom du brainrot à modifier
- `mutations_filter` (optionnel) : Pour identifier le brainrot
- `income_rate` (optionnel) : Nouveau revenu
- `new_mutations` (optionnel) : Nouvelles mutations
- `price_eur` (optionnel) : Nouveau prix
- `compte` (optionnel) : Nouveau compte
- `valeur` (optionnel) : Nouvelle valeur

### `/setcrypto`
Change la crypto d'affichage et recalcule tous les prix.

**Cryptos supportées :**
BTC, ETH, SOL, XRP, USDT, BNB, USDC, ADA, DOGE, TRX, AVAX, DOT, MATIC, LTC, SHIB

### `/refresh`
Force la mise à jour de la liste et recalcule les prix crypto.

### `/showcompte`
Affiche les brainrots groupés par compte (admin uniquement).

## 🎨 Raretés

- **Common** : Gris (#CCCCCC)
- **Rare** : Bleu (#3466F6)
- **Epic** : Violet (#A716E7)
- **Legendary** : Orange (#ECA741)
- **Mythic** : Rouge (#FC6565)
- **Brainrot God** : Jaune (#FAFC65)
- **Secret** : Cyan (#00FFFF)
- **OG** : Rose (#FF1493)

## 🔧 Fonctionnalités techniques

### Agrégation automatique
Les brainrots avec le même nom, les mêmes mutations, la même rareté et le même compte sont automatiquement agrégés. Au lieu d'afficher plusieurs lignes identiques, le bot affiche `x3` à côté du nom.

### Cache API CoinGecko
Pour éviter le rate limiting (10-50 req/min), le bot :
- Cache les prix pendant 5 minutes
- Fait une seule requête pour toutes les cryptos
- Retourne le cache en cas d'erreur API

### Format de prix
Vous pouvez écrire les prix de manière abrégée :
- `1k` = 1,000
- `1M` = 1,000,000
- `1B` = 1,000,000,000
- `1T` = 1,000,000,000,000
- `1Qa` = 1,000,000,000,000,000

## 📁 Structure des fichiers

```
brainrot-discord-bot/
├── index.js              # Bot principal
├── cryptoConverter.js    # Gestion API CoinGecko
├── brainrots.json        # Base de données (auto-créé)
├── config.json           # Configuration (auto-créé)
├── package.json
├── .env                  # Variables d'environnement (à créer)
└── .env.example          # Exemple de configuration
```

## 🐛 Dépannage

**Le bot ne démarre pas**
- Vérifiez que le fichier `.env` existe et contient les bonnes valeurs
- Vérifiez que le token est valide

**Les prix crypto affichent "N/A"**
- Utilisez `/refresh` pour forcer la mise à jour
- Vérifiez votre connexion internet
- L'API CoinGecko peut être temporairement indisponible

**Les commandes n'apparaissent pas**
- Attendez quelques minutes (les commandes de guilde sont instantanées, les globales prennent jusqu'à 1h)
- Vérifiez que le bot a les permissions nécessaires

## 📝 Licence

MIT
