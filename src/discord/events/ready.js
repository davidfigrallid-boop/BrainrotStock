/**
 * Événement ready - déclenché quand le bot est prêt
 */

const logger = require('../../core/logger');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    logger.success(`Bot prêt! Connecté en tant que ${client.user.tag}`);
    logger.info(`Nombre de serveurs: ${client.guilds.cache.size}`);
    
    // Définir le statut du bot
    client.user.setActivity('les Brainrots 🧠', { type: 'WATCHING' });
  }
};
