/**
 * CommandHandler - Traitement centralisé des commandes slash Discord
 * Gère le routage vers les services appropriés et la gestion des erreurs
 */

const logger = require('../../core/logger');
const { ValidationError, NotFoundError, AuthenticationError } = require('../../core/errors');

class CommandHandler {
  constructor() {
    this.commands = new Map();
  }

  /**
   * Enregistre une commande
   * @param {string} name - Nom de la commande
   * @param {Object} command - Objet commande avec data et execute
   */
  register(name, command) {
    if (!command.data || !command.execute) {
      logger.warn(`Commande invalide: ${name}`);
      return false;
    }

    this.commands.set(name, command);
    logger.debug(`Commande enregistrée: ${name}`);
    return true;
  }

  /**
   * Enregistre plusieurs commandes
   * @param {Array} commands - Tableau de commandes
   */
  registerMany(commands) {
    if (!Array.isArray(commands)) {
      logger.warn('registerMany: commands must be an array');
      return 0;
    }

    let count = 0;
    commands.forEach(command => {
      if (command.data && command.execute) {
        this.register(command.data.name, command);
        count++;
      }
    });

    logger.info(`${count} commandes enregistrées`);
    return count;
  }

  /**
   * Récupère une commande par son nom
   * @param {string} name - Nom de la commande
   * @returns {Object|null} La commande ou null
   */
  getCommand(name) {
    return this.commands.get(name) || null;
  }

  /**
   * Récupère toutes les commandes
   * @returns {Array} Tableau de toutes les commandes
   */
  getAllCommands() {
    return Array.from(this.commands.values());
  }

  /**
   * Récupère les données SlashCommand de toutes les commandes
   * @returns {Array} Tableau des données SlashCommand
   */
  getCommandsData() {
    return this.getAllCommands().map(cmd => cmd.data);
  }

  /**
   * Traite une interaction de commande slash
   * @param {Interaction} interaction - L'interaction Discord
   * @returns {Promise<void>}
   */
  async handle(interaction) {
    try {
      // Vérifier que c'est une commande slash
      if (!interaction.isChatInputCommand()) {
        logger.warn('CommandHandler.handle: interaction is not a chat input command');
        return;
      }

      const commandName = interaction.commandName;
      const command = this.getCommand(commandName);

      // Vérifier que la commande existe
      if (!command) {
        logger.warn(`Commande non trouvée: ${commandName}`);
        await this.sendError(interaction, `Commande \`${commandName}\` non trouvée.`);
        return;
      }

      // Logger l'exécution de la commande
      logger.info(`Commande exécutée: ${commandName}`, {
        user: interaction.user.tag,
        userId: interaction.user.id,
        guild: interaction.guild?.name,
        guildId: interaction.guildId
      });

      // Exécuter la commande
      await command.execute(interaction);

    } catch (error) {
      logger.error(`Erreur lors du traitement de la commande ${interaction.commandName}`, error);
      await this.sendError(interaction, 'Une erreur est survenue lors de l\'exécution de la commande.');
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
   * Valide les permissions de l'utilisateur
   * @param {Interaction} interaction - L'interaction Discord
   * @param {Array<string>} requiredPermissions - Permissions requises
   * @returns {boolean} True si l'utilisateur a les permissions
   */
  hasPermissions(interaction, requiredPermissions = []) {
    if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
      return true;
    }

    const member = interaction.member;
    if (!member) {
      return false;
    }

    return requiredPermissions.every(permission => 
      member.permissions.has(permission)
    );
  }

  /**
   * Valide les rôles de l'utilisateur
   * @param {Interaction} interaction - L'interaction Discord
   * @param {Array<string>} requiredRoles - IDs des rôles requis
   * @returns {boolean} True si l'utilisateur a au moins un des rôles
   */
  hasRoles(interaction, requiredRoles = []) {
    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      return true;
    }

    const member = interaction.member;
    if (!member) {
      return false;
    }

    return requiredRoles.some(roleId => 
      member.roles.cache.has(roleId)
    );
  }

  /**
   * Valide les options d'une commande
   * @param {Interaction} interaction - L'interaction Discord
   * @param {Array<string>} requiredOptions - Noms des options requises
   * @returns {boolean} True si toutes les options requises sont présentes
   */
  hasRequiredOptions(interaction, requiredOptions = []) {
    if (!Array.isArray(requiredOptions) || requiredOptions.length === 0) {
      return true;
    }

    return requiredOptions.every(optionName => {
      const option = interaction.options.get(optionName);
      return option !== undefined && option !== null;
    });
  }

  /**
   * Récupère les statistiques du handler
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      totalCommands: this.commands.size,
      commands: Array.from(this.commands.keys())
    };
  }
}

// Exporter une instance singleton
module.exports = new CommandHandler();
