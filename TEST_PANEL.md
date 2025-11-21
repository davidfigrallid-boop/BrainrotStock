# 🧪 Test du Panel Admin

## Vérification des fichiers statiques

### Fichiers CSS
```
GET /css/style.css
```
Doit retourner le fichier CSS avec le header `Content-Type: text/css`

### Fichiers JS
```
GET /js/app.js
```
Doit retourner le fichier JavaScript avec le header `Content-Type: application/javascript`

### HTML
```
GET /
```
Doit retourner le fichier index.html

## Commandes de test

### Vérifier que le serveur démarre
```bash
npm start
```

Vous devriez voir :
```
✅ Connexion MySQL établie
🌐 Panel web lancé sur http://localhost:3000
```

### Tester les fichiers statiques
```bash
# CSS
curl -I http://localhost:3000/css/style.css

# JS
curl -I http://localhost:3000/js/app.js

# HTML
curl -I http://localhost:3000/
```

### Tester l'API
```bash
# Health check
curl http://localhost:3000/api/health

# Devrait retourner :
# {"status":"ok","message":"API BrainrotsMarket fonctionnelle","version":"2.0.0","timestamp":"..."}
```

## Checklist

- [ ] Serveur démarre sans erreur
- [ ] Panel charge sur http://localhost:3000
- [ ] CSS s'applique (couleurs, layout)
- [ ] JavaScript fonctionne (navigation, modals)
- [ ] API répond sur /api/health
- [ ] Sélection de serveur fonctionne
- [ ] Filtres fonctionnent
- [ ] Modals s'ouvrent/ferment
- [ ] Conversion crypto fonctionne

## Troubleshooting

### CSS ne s'applique pas
1. Vérifier que `src/web/public/css/style.css` existe
2. Vérifier les headers HTTP : `Content-Type: text/css`
3. Vérifier la console du navigateur pour les erreurs 404
4. Vider le cache du navigateur (Ctrl+Shift+Delete)

### JavaScript ne fonctionne pas
1. Vérifier que `src/web/public/js/app.js` existe
2. Vérifier la console du navigateur pour les erreurs
3. Vérifier que le fichier n'a pas d'erreurs de syntaxe

### API ne répond pas
1. Vérifier que le serveur est démarré
2. Vérifier le port (défaut: 3000)
3. Vérifier les logs du serveur

## Logs utiles

```bash
# Voir les logs en temps réel
npm run dev

# Voir les logs du serveur
tail -f logs/bot-*.log
```

## Prochaines étapes

1. Configurer le token API
2. Charger les serveurs depuis le bot
3. Tester les opérations CRUD
4. Tester les conversions crypto
