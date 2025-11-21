/**
 * Client Discord et initialisation du bot
 * Gère la connexion, les événements et l'enregistrement des commandes
 */

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('../core/config');
const logger = require('../core/logger');
const events = require('./events');

class DiscordBot {
  constructor() {
    // Créer le client Discord avec les intents nécessaires
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
      ]
    });

    // Collections pour les commandes et les handlers
    this.client.commands = new Collection();
    this.client.handlers = new Collection();

    // Référence au bot pour les handlers
    this.client.bot = this;

    // Enregistrer les événements
    this.registerEvents();
  }

  /**
   * Enregistre les événements Discord depuis les fichiers d'événements
   */
  registerEvents() {
    // Charger et enregistrer l'événement ready
    if (events.ready) {
      const readyEvent = events.ready;
      if (readyEvent.once) {
        this.client.once(readyEvent.name, (...args) => readyEvent.execute(...args));
      } else {
        this.client.on(readyEvent.name, (...args) => readyEvent.execute(...args));
      }
      logger.debug(`Événement enregistré: ${readyEvent.name}`);
    }

    // Charger et enregistrer l'événement interactionCreate
    if (events.interactionCreate) {
      const interactionEvent = events.interactionCreate;
      this.client.on(interactionEvent.name, (...args) => interactionEvent.execute(...args));
      logger.debug(`Événement enregistré: ${interactionEvent.name}`);
    }

    // Événement error - erreurs du client
    this.client.on('error', (error) => {
      logger.error('Erreur Discord client', error);
    });

    // Événement warn - avertissements
    this.client.on('warn', (warning) => {
      logger.warn('Avertissement Discord', warning);
    });
  }

  /**
   * Enregistre une commande slash
   */
  registerCommand(command) {
    if (!command.data || !command.execute) {
      logger.warn('Commande invalide: manque data ou execute');
      return;
    }

    this.client.commands.set(command.data.name, command);
    logger.debug(`Commande enregistrée: ${command.data.name}`);
  }

  /**
   * Enregistre un handler de bouton
   */
  registerButtonHandler(customId, handler) {
    if (typeof handler !== 'function') {
      logger.warn(`Handler invalide pour le bouton: ${customId}`);
      return;
    }

    this.client.handlers.set(customId, handler);
    logger.debug(`Handler de bouton enregistré: ${customId}`);
  }

  /**
   * Connecte le bot à Discord
   */
  async connect() {
    try {
      logger.info('Connexion au serveur Discord...');
      await this.client.login(config.discord.token);
      logger.success('Bot connecté avec succès');
      return this.client;
    } catch (error) {
      logger.error('Erreur de connexion au serveur Discord', error);
      throw error;
    }
  }

  /**
   * Déconnecte le bot
   */
  async disconnect() {
    try {
      logger.info('Déconnexion du serveur Discord...');
      await this.client.destroy();
      logger.success('Bot déconnecté');
    } catch (error) {
      logger.error('Erreur lors de la déconnexion', error);
      throw error;
    }
  }

  /**
   * Obtient le client Discord
   */
  getClient() {
    return this.client;
  }

  /**
   * Obtient une guild par ID
   */
  getGuild() {
    return this.client.guilds.cache.get(config.discord.guildId);
  }

  /**
   * Enregistre les commandes slash auprès de Discord
   */
  async registerSlashCommands(commands) {
    try {
      const guild = this.getGuild();
      
      if (!guild) {
        logger.error('Guild non trouvée', { guildId: config.discord.guildId });
        return;
      }

      logger.info(`Enregistrement de ${commands.length} commandes slash...`);
      
      // Filtrer les commandes valides et convertir en JSON
      const validCommands = commands
        .filter(cmd => cmd && cmd.toJSON)
        .map(cmd => cmd.toJSON());
      
      if (validCommands.length === 0) {
        logger.warn('Aucune commande valide à enregistrer');
        return;
      }
      
      await guild.commands.set(validCommands);
      
      logger.success(`${validCommands.length} commandes slash enregistrées`);
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement des commandes slash', error);
      throw error;
    }
  }
}

module.exports = DiscordBot;
