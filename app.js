/**
 * Point d'entrée principal de BrainrotsMarket
 * Lance le bot Discord et le serveur web
 */

const logger = require('./src/config/logger');
const config = require('./src/config');
const BrainrotsBot = require('./src/bot/bot');
const WebServer = require('./src/web/server');

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promise rejetée non gérée:', { reason, promise });
});

process.on('uncaughtException', (error) => {
    logger.error('Exception non capturée:', error);
    process.exit(1);
});

// Gestion de l'arrêt gracieux
process.on('SIGINT', () => {
    logger.warn('Signal SIGINT reçu, arrêt de l\'application...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.warn('Signal SIGTERM reçu, arrêt de l\'application...');
    process.exit(0);
});

/**
 * Démarre l'application
 */
async function start() {
    try {
        logger.info('🚀 Démarrage de BrainrotsMarket v2.0.0');
        logger.info(`Environnement: ${config.env}`);
        
        // Valider la configuration
        if (!config.discord.token) {
            throw new Error('DISCORD_TOKEN manquant');
        }
        if (!config.discord.clientId) {
            throw new Error('CLIENT_ID manquant');
        }
        if (!config.discord.guildId) {
            throw new Error('GUILD_ID manquant');
        }
        
        logger.info('✅ Configuration Discord validée');
        
        // Initialiser la base de données
        const db = require('./src/services/database');
        await db.initialize();
        
        // Exécuter les migrations
        const { runMigrations } = require('./src/database/migrations');
        await runMigrations();
        
        logger.info('✅ Base de données initialisée');
        
        // Démarrer le bot Discord
        logger.info('Démarrage du bot Discord...');
        const bot = new BrainrotsBot();
        bot.start();
        
        // Démarrer le serveur web
        logger.info('Démarrage du serveur web...');
        const webServer = new WebServer(config.web.port);
        webServer.start();
        
        logger.success('🎉 BrainrotsMarket démarré avec succès !');
        
    } catch (error) {
        logger.error('Erreur lors du démarrage:', error.message || error);
        logger.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Démarrer l'application
start();
