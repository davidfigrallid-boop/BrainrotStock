/**
 * Point d'entrée racine de l'application BrainrotsMarket v3
 * Lance l'application principale depuis src/app.js
 */

const app = require('./src/app');

// Lancer l'application
app.initialize().catch((error) => {
  console.error('Erreur fatale lors du démarrage:', error);
  process.exit(1);
});
