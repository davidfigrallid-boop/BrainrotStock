/**
 * Configuration centralisée de l'application
 */

require('dotenv').config();

const config = {
    // Discord
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.CLIENT_ID,
        guildId: process.env.GUILD_ID
    },

    // Base de données
    database: {
        host: process.env.MYSQLHOST || 'localhost',
        port: parseInt(process.env.MYSQLPORT || '3306'),
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE || 'brainrots',
        url: process.env.MYSQL_PUBLIC_URL
    },

    // API Server
    api: {
        port: parseInt(process.env.API_PORT || '3001'),
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    },

    // Web Panel
    web: {
        port: parseInt(process.env.PORT || '3000')
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        useFile: process.env.LOG_FILE === 'true'
    },

    // Admin
    admin: {
        password: process.env.ADMIN_PASSWORD || 'Azerty123_'
    }
};

module.exports = config;
