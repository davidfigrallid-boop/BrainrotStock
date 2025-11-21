/**
 * Configuration centralisée de l'application
 * Toutes les variables d'environnement sont injectées par Railway
 */

const config = {
    // Discord
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.CLIENT_ID,
        guildId: process.env.GUILD_ID
    },

    // Base de données MySQL (Railway)
    database: {
        // Utiliser MYSQL_PUBLIC_URL si disponible (Railway), sinon variables individuelles
        url: process.env.MYSQL_PUBLIC_URL,
        host: process.env.MYSQLHOST || 'localhost',
        port: parseInt(process.env.MYSQLPORT || '3306'),
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE || 'brainrots'
    },

    // Serveur Web
    web: {
        port: parseInt(process.env.PORT || '3000'),
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        useFile: process.env.LOG_FILE === 'true'
    },

    // Admin
    admin: {
        password: process.env.ADMIN_PASSWORD || 'Azerty123_'
    },

    // Environnement
    env: process.env.NODE_ENV || 'development'
};

module.exports = config;
