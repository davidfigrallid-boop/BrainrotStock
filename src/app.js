/**
 * Point d'entrée principal de l'application
 * Initialise tous les modules dans l'ordre correct:
 * config → database → services → discord → web
 */

const logger = require('./core/logger');
const config = require('./core/config');
const db = require('./database/connection');
const { runMigrations } = require('./database/migrations');
const services = require('./services');
const DiscordBot = require('./discord/bot');
const WebServer = require('./web/server');
const commands = require('./discord/commands');
const handlers = require('./discord/handlers');

class Application {
  constructor() {
    this.bot = null;
    this.webServer = null;
    this.isRunning = false;
  }

  /**
   * Initialise l'application complète
   */
  async initialize() {
    try {
      logger.info('='.repeat(50));
      logger.info('Démarrage de BrainrotsMarket v3');
      logger.info('='.repeat(50));

      // Étape 1: Valider la configuration
      logger.info('Étape 1: Validation de la configuration...');
      config.validateConfig();
      logger.success('Configuration validée');

      // Étape 2: Initialiser la base de données
      logger.info('Étape 2: Initialisation de la base de données...');
      await db.initialize();
      await runMigrations();
      logger.success('Base de données initialisée');

      // Étape 3: Les services sont chargés (pas d'initialisation spéciale requise)
      logger.info('Étape 3: Services chargés');
      logger.debug('Services disponibles:', Object.keys(services));
      logger.success('Services initialisés');

      // Étape 4: Initialiser le bot Discord
      logger.info('Étape 4: Initialisation du bot Discord...');
      this.bot = new DiscordBot();
      
      // Enregistrer les commandes
      if (commands && typeof commands.loadCommands === 'function') {
        const loadedCommands = await commands.loadCommands(this.bot);
        logger.debug(`${loadedCommands.length} commandes enregistrées`);
      }

      // Enregistrer les handlers
      if (handlers && typeof handlers.loadHandlers === 'function') {
        await handlers.loadHandlers(this.bot);
        logger.debug('Handlers enregistrés');
      }

      // Connecter le bot
      await this.bot.connect();
      logger.success('Bot Discord connecté');

      // Étape 5: Initialiser le serveur web
      logger.info('Étape 5: Initialisation du serveur web...');
      this.webServer = new WebServer();
      await this.webServer.start();
      logger.success('Serveur web lancé');

      logger.info('='.repeat(50));
      logger.success('Application démarrée avec succès');
      logger.info('='.repeat(50));

      this.isRunning = true;
      return true;
    } catch (error) {
      logger.error('Erreur lors du démarrage de l\'application', error);
      await this.shutdown();
      throw error;
    }
  }

  /**
   * Arrêt gracieux de l'application
   */
  async shutdown() {
    try {
      logger.info('='.repeat(50));
      logger.info('Arrêt de l\'application...');
      logger.info('='.repeat(50));

      this.isRunning = false;

      // Arrêter le serveur web
      if (this.webServer) {
        logger.info('Arrêt du serveur web...');
        await this.webServer.stop();
        logger.success('Serveur web arrêté');
      }

      // Déconnecter le bot Discord
      if (this.bot) {
        logger.info('Déconnexion du bot Discord...');
        await this.bot.disconnect();
        logger.success('Bot Discord déconnecté');
      }

      // Fermer la connexion à la base de données
      logger.info('Fermeture de la base de données...');
      await db.close();
      logger.success('Base de données fermée');

      logger.info('='.repeat(50));
      logger.success('Application arrêtée proprement');
      logger.info('='.repeat(50));
    } catch (error) {
      logger.error('Erreur lors de l\'arrêt de l\'application', error);
      process.exit(1);
    }
  }

  /**
   * Obtient le statut de l'application
   */
  getStatus() {
    return {
      running: this.isRunning,
      bot: this.bot ? 'connected' : 'disconnected',
      webServer: this.webServer ? 'running' : 'stopped',
      database: db.pool ? 'connected' : 'disconnected'
    };
  }
}

// Créer l'instance de l'application
const app = new Application();

// Gérer les signaux d'arrêt gracieux
process.on('SIGINT', async () => {
  logger.warn('Signal SIGINT reçu');
  await app.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.warn('Signal SIGTERM reçu');
  await app.shutdown();
  process.exit(0);
});

// Gérer les erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Exception non capturée', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesse rejetée non gérée', { reason, promise });
  process.exit(1);
});

module.exports = app;
