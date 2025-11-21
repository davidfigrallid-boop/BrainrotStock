/**
 * Point d'entrée principal de BrainrotsMarket
 * Lance le bot Discord et le serveur web
 */

require('dotenv').config();
const logger = require('./src/config/logger');
const BrainrotsBot = require('./src/bot/bot');
const WebServer = require('./src/web/server');
const config = require('./src/config');

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
        
        // Démarrer le bot Discord
        const bot = new BrainrotsBot();
        bot.start();
        
        // Démarrer le serveur web
        const webServer = new WebServer(config.web.port);
        webServer.start();
        
    } catch (error) {
        logger.error('Erreur lors du démarrage:', error);
        process.exit(1);
    }
}

// Démarrer l'application
start();
