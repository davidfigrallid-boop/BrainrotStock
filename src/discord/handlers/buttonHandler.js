/**
 * ButtonHandler - Traitement centralisé des clics de boutons Discord
 * Gère le routage vers les handlers appropriés et la gestion des erreurs
 */

const logger = require('../../core/logger');
const giveawayService = require('../../services/giveawayService');
const { ValidationError, NotFoundError } = require('../../core/errors');

class ButtonHandler {
  constructor() {
    this.handlers = new Map();
    this.registerDefaultHandlers();
  }

  /**
   * Enregistre les handlers de boutons par défaut
   */
  registerDefaultHandlers() {
    // Handler pour les boutons de participation aux giveaways
    this.register('giveaway_join', this.handleGiveawayJoin.bind(this));
  }

  /**
   * Enregistre un handler de bouton
   * @param {string} prefix - Préfixe du customId (ex: 'giveaway_join')
   * @param {Function} handler - Fonction handler
   */
  register(prefix, handler) {
    if (typeof handler !== 'function') {
      logger.warn(`Handler invalide pour le bouton: ${prefix}`);
      return false;
    }

    this.handlers.set(prefix, handler);
    logger.debug(`Handler de bouton enregistré: ${prefix}`);
    return true;
  }

  /**
   * Récupère un handler par son préfixe
   * @param {string} prefix - Préfixe du customId
   * @returns {Function|null} Le handler ou null
   */
  getHandler(prefix) {
    return this.handlers.get(prefix) || null;
  }

  /**
   * Récupère tous les handlers
   * @returns {Array} Tableau de tous les handlers
   */
  getAllHandlers() {
    return Array.from(this.handlers.entries());
  }

  /**
   * Traite une interaction de bouton
   * @param {Interaction} interaction - L'interaction Discord
   * @returns {Promise<void>}
   */
  async handle(interaction) {
    try {
      // Vérifier que c'est un bouton
      if (!interaction.isButton()) {
        logger.warn('ButtonHandler.handle: interaction is not a button');
        return;
      }

      const customId = interaction.customId;
      
      // Extraire le préfixe du customId (ex: 'giveaway_join' de 'giveaway_join_123')
      const prefix = customId.split('_').slice(0, -1).join('_');
      const handler = this.getHandler(prefix);

      // Vérifier que le handler existe
      if (!handler) {
        logger.warn(`Handler de bouton non trouvé: ${customId}`);
        await this.sendError(interaction, `Bouton \`${customId}\` non géré.`);
        return;
      }

      // Logger l'exécution du bouton
      logger.info(`Bouton cliqué: ${customId}`, {
        user: interaction.user.tag,
        userId: interaction.user.id,
        guild: interaction.guild?.name,
        guildId: interaction.guildId
      });

      // Exécuter le handler
      await handler(interaction);

    } catch (error) {
      logger.error(`Erreur lors du traitement du bouton ${interaction.customId}`, error);
      await this.sendError(interaction, 'Une erreur est survenue lors du traitement de votre action.');
    }
  }

  /**
   * Handler pour les boutons de participation aux giveaways
   * @param {Interaction} interaction - L'interaction Discord
   * @returns {Promise<void>}
   */
  async handleGiveawayJoin(interaction) {
    try {
      // Extraire l'ID du giveaway du customId (ex: 'giveaway_join_123' -> '123')
      const giveawayId = parseInt(interaction.customId.split('_').pop());

      if (isNaN(giveawayId)) {
        logger.warn(`ID de giveaway invalide: ${interaction.customId}`);
        await this.sendError(interaction, 'ID de giveaway invalide.');
        return;
      }

      // Ajouter le participant au giveaway
      const success = await giveawayService.addParticipant(giveawayId, interaction.user.id);

      if (success) {
        await this.sendSuccess(interaction, 'Vous avez participé au giveaway! 🎉');
        logger.info(`Participant ajouté au giveaway ${giveawayId}: ${interaction.user.tag}`);
      } else {
        await this.sendError(interaction, 'Impossible d\'ajouter le participant au giveaway.');
      }
    } catch (error) {
      // Gérer les erreurs spécifiques
      if (error instanceof NotFoundError) {
        await this.sendError(interaction, 'Giveaway non trouvé.');
      } else if (error instanceof ValidationError) {
        await this.sendError(interaction, error.message);
      } else {
        logger.error('Erreur handleGiveawayJoin:', error);
        await this.sendError(interaction, 'Une erreur est survenue.');
      }
    }
  }

  /**
   * Envoie un message d'erreur à l'utilisateur
   * @param {Interaction} interaction - L'interaction Discord
   * @param {string} message - Message d'erreur
   * @returns {Promise<void>}
   */
  async sendError(interaction, message) {
    try {
      const errorMessage = {
        content: `❌ ${message}`,
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    } catch (error) {
      logger.error('Erreur lors de l\'envoi du message d\'erreur:', error);
    }
  }

  /**
   * Envoie un message de succès à l'utilisateur
   * @param {Interaction} interaction - L'interaction Discord
   * @param {string} message - Message de succès
   * @returns {Promise<void>}
   */
  async sendSuccess(interaction, message) {
    try {
      const successMessage = {
        content: `✅ ${message}`,
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(successMessage);
      } else {
        await interaction.reply(successMessage);
      }
    } catch (error) {
      logger.error('Erreur lors de l\'envoi du message de succès:', error);
    }
  }

  /**
   * Récupère les statistiques du handler
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      totalHandlers: this.handlers.size,
      handlers: Array.from(this.handlers.keys())
    };
  }
}

// Exporter une instance singleton
module.exports = new ButtonHandler();
