# BrainrotsMarket v3 - Panel Admin

Panel d'administration web pour BrainrotsMarket v3.

## Structure

```
public/
├── index.html          # Page principale (SPA)
├── 404.html           # Page d'erreur pour GitHub Pages
├── .nojekyll          # Désactiver Jekyll pour GitHub Pages
├── css/
│   └── style.css      # Styles Dark Purple
└── js/
    ├── app.js         # Application principale
    ├── api.js         # Client API REST
    ├── ui.js          # Gestion de l'interface
    ├── charts.js      # Graphiques Chart.js
    └── utils.js       # Fonctions utilitaires
```

## Hébergement sur GitHub Pages

### Configuration

1. Allez dans les paramètres du repository GitHub
2. Allez à "Pages" dans le menu de gauche
3. Sélectionnez "Deploy from a branch"
4. Choisissez la branche `main` et le dossier `public`
5. Cliquez sur "Save"

### URL

Votre panel sera accessible à: `https://votre-username.github.io/brainrotsmarket/`

## Développement Local

### Serveur Express

Le serveur Express sert les fichiers statiques depuis ce dossier `public/`.

```bash
npm run dev
```

Accédez à: `http://localhost:3000`

### Authentification

Le panel nécessite un mot de passe admin. Celui-ci est stocké localement dans le navigateur.

### API

Le panel communique avec l'API Express via les endpoints:
- `/api/brainrots`
- `/api/giveaways`
- `/api/crypto`
- `/api/stats`
- `/api/health`

## Fonctionnalités

- 📊 Dashboard avec statistiques
- 🧠 Gestion des Brainrots
- 🎁 Gestion des Giveaways
- 💱 Convertisseur Crypto
- 📈 Graphiques en temps réel
- 🔐 Authentification par mot de passe

## Technologies

- HTML5
- CSS3 (Dark Purple Theme)
- JavaScript Vanilla
- Chart.js pour les graphiques
- Fetch API pour les requêtes HTTP

## Notes

- Le panel est une Single Page Application (SPA)
- Les données sont stockées en localStorage pour la session
- Les prix crypto sont rafraîchis toutes les 30 secondes
- Le design est responsive et mobile-friendly
