/**
 * Événement ready - déclenché quand le bot est prêt
 */

const logger = require('../../core/logger');
const commands = require('../commands');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.success(`Bot prêt! Connecté en tant que ${client.user.tag}`);
    logger.info(`Nombre de serveurs: ${client.guilds.cache.size}`);
    
    // Enregistrer les commandes slash auprès de Discord
    try {
      const commandsData = commands.getCommandsData();
      if (commandsData && commandsData.length > 0) {
        await client.bot.registerSlashCommands(commandsData);
      }
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement des commandes slash', error);
    }
    
    // Définir le statut du bot
    client.user.setActivity('les Brainrots 🧠', { type: 'WATCHING' });
  }
};
