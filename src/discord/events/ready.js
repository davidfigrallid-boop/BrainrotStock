/**
 * Événement ready - déclenché quand le bot est prêt
 */

const logger = require('../../core/logger');
const commands = require('../commands');
const db = require('../../database/connection');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.success(`Bot prêt! Connecté en tant que ${client.user.tag}`);
    logger.info(`Nombre de serveurs: ${client.guilds.cache.size}`);
    
    // Enregistrer tous les serveurs existants
    try {
      for (const guild of client.guilds.cache.values()) {
        const existing = await db.queryOne(
          'SELECT id FROM servers WHERE id = ?',
          [guild.id]
        );
        
        if (!existing) {
          await db.query(
            'INSERT INTO servers (id, name) VALUES (?, ?)',
            [guild.id, guild.name]
          );
          logger.debug(`Serveur enregistré au démarrage: ${guild.name} (${guild.id})`);
        }
      }
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement des serveurs au démarrage:', error);
    }
    
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
