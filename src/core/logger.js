/**
 * Logger structuré avec niveaux de log
 * Supporte les logs en fichier et console
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Niveaux de log
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Couleurs pour la console
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class Logger {
  constructor() {
    this.level = LOG_LEVELS[config.logging.level] || LOG_LEVELS.info;
    this.useFile = config.logging.useFile;
  }

  /**
   * Obtient le fichier log du jour
   */
  getLogFile() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    return path.join(logsDir, `bot-${dateStr}.log`);
  }

  /**
   * Écrit dans le fichier log
   */
  writeToFile(level, message, context) {
    if (!this.useFile) return;

    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      
      fs.appendFileSync(this.getLogFile(), logEntry + contextStr + '\n');
    } catch (error) {
      console.error('Erreur écriture log:', error);
    }
  }

  /**
   * Formate le message pour la console
   */
  formatConsole(level, message, color) {
    const timestamp = new Date().toISOString();
    return `${COLORS.dim}[${timestamp}]${COLORS.reset} ${color}[${level.toUpperCase()}]${COLORS.reset} ${message}`;
  }

  /**
   * Log de niveau DEBUG
   */
  debug(message, context) {
    if (this.level > LOG_LEVELS.debug) return;
    
    console.log(this.formatConsole('debug', message, COLORS.cyan), context || '');
    this.writeToFile('debug', message, context);
  }

  /**
   * Log de niveau INFO
   */
  info(message, context) {
    if (this.level > LOG_LEVELS.info) return;
    
    console.log(this.formatConsole('info', message, COLORS.blue), context || '');
    this.writeToFile('info', message, context);
  }

  /**
   * Log de niveau WARN
   */
  warn(message, context) {
    if (this.level > LOG_LEVELS.warn) return;
    
    console.warn(this.formatConsole('warn', message, COLORS.yellow), context || '');
    this.writeToFile('warn', message, context);
  }

  /**
   * Log de niveau ERROR
   */
  error(message, error) {
    if (this.level > LOG_LEVELS.error) return;
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    
    console.error(this.formatConsole('error', message, COLORS.red), errorMsg);
    if (stack) console.error(COLORS.dim + stack + COLORS.reset);
    
    this.writeToFile('error', message, { error: errorMsg, stack });
  }

  /**
   * Log de succès (info avec emoji)
   */
  success(message, context) {
    if (this.level > LOG_LEVELS.info) return;
    
    console.log(this.formatConsole('success', `✅ ${message}`, COLORS.green), context || '');
    this.writeToFile('success', message, context);
  }

  /**
   * Log spécifique pour la base de données
   */
  database(message, context) {
    if (this.level > LOG_LEVELS.info) return;
    
    console.log(this.formatConsole('database', `🗄️  ${message}`, COLORS.magenta), context || '');
    this.writeToFile('database', message, context);
  }

  /**
   * Log spécifique pour les API
   */
  api(message, context) {
    if (this.level > LOG_LEVELS.info) return;
    
    console.log(this.formatConsole('api', `🌐 ${message}`, COLORS.cyan), context || '');
    this.writeToFile('api', message, context);
  }

  /**
   * Log spécifique pour les crypto
   */
  crypto(message, context) {
    if (this.level > LOG_LEVELS.info) return;
    
    console.log(this.formatConsole('crypto', `💰 ${message}`, COLORS.yellow), context || '');
    this.writeToFile('crypto', message, context);
  }
}

module.exports = new Logger();
