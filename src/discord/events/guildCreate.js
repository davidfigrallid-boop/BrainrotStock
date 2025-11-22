/**
 * Événement guildCreate - déclenché quand le bot rejoint un serveur
 */

const logger = require('../../core/logger');
const db = require('../../database/connection');

module.exports = {
  name: 'guildCreate',
  once: false,
  async execute(guild) {
    try {
      logger.info(`Bot a rejoint le serveur: ${guild.name} (${guild.id})`);
      
      // Vérifier si le serveur existe déjà
      const existing = await db.queryOne(
        'SELECT id FROM servers WHERE id = ?',
        [guild.id]
      );
      
      if (!existing) {
        // Créer une entrée pour le serveur
        await db.query(
          'INSERT INTO servers (id, name) VALUES (?, ?)',
          [guild.id, guild.name]
        );
        logger.info(`Serveur enregistré: ${guild.name} (${guild.id})`);
      } else {
        logger.debug(`Serveur déjà enregistré: ${guild.name} (${guild.id})`);
      }
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement du serveur:', error);
    }
  }
};
