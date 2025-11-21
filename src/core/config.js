/**
 * Configuration centralisée de l'application
 * Toutes les variables d'environnement sont injectées ici
 */

require('dotenv').config();

const config = {
  // Discord Configuration
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID
  },

  // Database Configuration (MySQL)
  database: {
    url: process.env.MYSQL_PUBLIC_URL,
    host: process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.MYSQLPORT || '3306', 10),
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE || 'brainrots'
  },

  // Web Server Configuration
  web: {
    port: parseInt(process.env.PORT || '3000', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },

  // Admin Configuration
  admin: {
    password: process.env.ADMIN_PASSWORD || 'Azerty123_'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    useFile: process.env.LOG_FILE === 'true'
  },

  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production'
};

/**
 * Valide la configuration au démarrage
 */
function validateConfig() {
  const required = [
    'discord.token',
    'discord.clientId',
    'discord.guildId',
    'database.password'
  ];

  const errors = [];

  required.forEach(key => {
    const keys = key.split('.');
    let value = config;
    
    for (const k of keys) {
      value = value[k];
      if (!value) {
        errors.push(`Missing required config: ${key}`);
        break;
      }
    }
  });

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

module.exports = config;
module.exports.validateConfig = validateConfig;
