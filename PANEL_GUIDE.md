# 📊 Guide du Panel Admin - BrainrotsMarket

## Vue d'ensemble

Le panel admin est une interface web complète pour gérer tous les aspects de BrainrotsMarket :
- Gestion des brainrots (CRUD)
- Gestion des giveaways
- Conversion crypto en temps réel
- Statistiques et dashboard

## 🚀 Accès au panel

```
http://localhost:3000
```

Sur Railway :
```
https://votre-app.railway.app
```

## 📋 Fonctionnalités

### 1. Dashboard
- **Statistiques en temps réel** :
  - Total de brainrots
  - Valeur totale en EUR
  - Types uniques
  - Giveaways actifs
- **Répartition par rareté** : Graphique visuel

### 2. Gestion des Brainrots
- **Ajouter** : Créer un nouveau brainrot avec tous les paramètres
- **Modifier** : Éditer les propriétés d'un brainrot existant
- **Supprimer** : Retirer un brainrot
- **Filtrer** : Par nom, rareté, mutation
- **Traits** : Ajouter/retirer des traits

**Paramètres disponibles** :
- Nom (obligatoire)
- Rareté (Common, Rare, Epic, Legendary, Mythic, Brainrot God, Secret, OG)
- Mutation (Default, Gold, Diamond, Rainbow, Lava, etc.)
- Prix EUR (format: 1000, 1k, 1M, 1B)
- Revenu/seconde (format: 100, 1k, 1M, 1B)
- Compte (optionnel)
- Quantité (défaut: 1)
- Traits (optionnel, séparés par des virgules)

### 3. Gestion des Giveaways
- **Créer** : Nouveau giveaway avec durée et nombre de gagnants
- **Terminer** : Arrêter immédiatement et sélectionner les gagnants
- **Reroll** : Resélectionner les gagnants
- **Lister** : Voir les giveaways actifs et terminés

**Paramètres** :
- Prix (description du prix)
- Durée (format: 1min, 1h, 1j, 1sem, 1m, 1an)
- Nombre de gagnants (défaut: 1)

### 4. Convertisseur Crypto
- **Conversion EUR → Crypto** : Convertir un montant EUR en crypto
- **Prix en temps réel** : Affichage des prix actuels
- **Cryptos supportées** : BTC, ETH, SOL, USDT, LTC

### 5. Paramètres
- Informations sur l'application
- Liens vers la documentation
- État de l'API

## 🎨 Interface

### Sidebar
- Navigation principale
- Sélection du serveur
- Indicateur d'état API

### Header
- Titre de la page actuelle
- Indicateur de connexion API

### Contenu principal
- Affichage dynamique selon la page sélectionnée
- Responsive design (mobile, tablette, desktop)

## 🔐 Authentification

Le panel utilise le token Discord du bot pour l'authentification API.

**Configuration** :
```javascript
// Dans le localStorage
localStorage.setItem('api_token', 'VOTRE_DISCORD_TOKEN');
```

## 📱 Responsive Design

Le panel s'adapte à tous les écrans :
- **Desktop** : Layout complet avec sidebar
- **Tablette** : Navigation horizontale
- **Mobile** : Navigation en haut

## 🎯 Cas d'usage

### Ajouter un brainrot
1. Aller à "Brainrots"
2. Cliquer sur "+ Ajouter"
3. Remplir le formulaire
4. Cliquer sur "Sauvegarder"

### Créer un giveaway
1. Aller à "Giveaways"
2. Cliquer sur "+ Créer"
3. Entrer le prix et la durée
4. Cliquer sur "Créer"

### Convertir EUR en crypto
1. Aller à "Crypto"
2. Entrer le montant EUR
3. Sélectionner la crypto
4. Cliquer sur "Convertir"

## 🔧 Personnalisation

### Couleurs
Modifier les variables CSS dans `src/web/public/css/style.css` :

```css
:root {
    --primary: #667eea;
    --secondary: #764ba2;
    --success: #4caf50;
    /* ... */
}
```

### Raretés
Ajouter/modifier les raretés dans `src/utils/constants.js` :

```javascript
const RARITY_COLORS = {
    'Common': '⬜',
    'Rare': '🟦',
    // ...
};
```

## 📊 Données affichées

### Brainrots
- Nom
- Rareté (avec badge coloré)
- Mutation
- Prix EUR
- Revenu/seconde
- Quantité
- Actions (modifier, supprimer)

### Giveaways
- Prix
- Nombre de gagnants
- Participants
- État (actif/terminé)
- Actions (terminer, reroll)

### Statistiques
- Total brainrots
- Valeur totale
- Types uniques
- Répartition par rareté

## 🐛 Troubleshooting

### Le panel ne charge pas
- Vérifier que le serveur web est démarré
- Vérifier le port (défaut: 3000)
- Vérifier la console du navigateur pour les erreurs

### Les données ne s'affichent pas
- Sélectionner un serveur
- Vérifier que le token API est configuré
- Vérifier la connexion à la base de données

### Les conversions crypto ne fonctionnent pas
- Vérifier la connexion Internet
- Vérifier que CoinGecko est accessible
- Vérifier les logs du serveur

## 📈 Améliorations futures

- [ ] Graphiques avancés
- [ ] Export/Import de données
- [ ] Historique des modifications
- [ ] Notifications en temps réel
- [ ] Gestion des permissions par rôle
- [ ] Thème sombre
- [ ] Recherche avancée

## 📞 Support

Pour toute question ou problème :
1. Consulter les logs : `npm run dev`
2. Vérifier la documentation : `README.md`
3. Vérifier l'API : `GET /api/health`

## 🎉 Conclusion

Le panel admin offre une interface complète et intuitive pour gérer BrainrotsMarket sans utiliser les commandes Discord. Profitez de la meilleure expérience utilisateur !
