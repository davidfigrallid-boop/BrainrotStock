/**
 * Événement interactionCreate - déclenché pour les commandes slash et boutons
 * Utilise le CommandHandler pour traiter les commandes slash
 */

const logger = require('../../core/logger');
const commandHandler = require('../handlers/commandHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      // Traiter les commandes slash via le CommandHandler
      if (interaction.isChatInputCommand()) {
        await commandHandler.handle(interaction);
        return;
      }

      // Traiter les clics de boutons
      if (interaction.isButton()) {
        const handler = interaction.client.handlers.get(interaction.customId);
        
        if (!handler) {
          logger.warn(`Handler de bouton non trouvé: ${interaction.customId}`);
          return;
        }

        logger.info(`Bouton cliqué: ${interaction.customId}`, {
          user: interaction.user.tag,
          guild: interaction.guild?.name
        });

        try {
          await handler(interaction);
        } catch (error) {
          logger.error(`Erreur lors du traitement du bouton ${interaction.customId}`, error);
          
          const errorMessage = {
            content: '❌ Une erreur est survenue lors du traitement de votre action.',
            ephemeral: true
          };

          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        }
      }
    } catch (error) {
      logger.error('Erreur non gérée dans interactionCreate', error);
    }
  }
};
