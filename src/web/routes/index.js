/**
 * Index centralisé des routes API
 * Exporte toutes les routes pour utilisation dans le serveur Express
 */

const brainrotsRoutes = require('./brainrots');
const giveawaysRoutes = require('./giveaways');
const cryptoRoutes = require('./crypto');
const statsRoutes = require('./stats');
const healthRoutes = require('./health');

/**
 * Enregistre toutes les routes sur l'application Express
 * @param {Express} app - Instance Express
 */
function registerRoutes(app) {
  // Routes Brainrots
  app.use('/api/brainrots', brainrotsRoutes);

  // Routes Giveaways
  app.use('/api/giveaways', giveawaysRoutes);

  // Routes Crypto
  app.use('/api/crypto', cryptoRoutes);

  // Routes Stats
  app.use('/api/stats', statsRoutes);

  // Routes Health (pas d'authentification requise)
  app.use('/api/health', healthRoutes);
}

module.exports = {
  registerRoutes,
  brainrotsRoutes,
  giveawaysRoutes,
  cryptoRoutes,
  statsRoutes,
  healthRoutes
};
