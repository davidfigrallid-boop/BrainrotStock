/**
 * Système de logging centralisé
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('./index');

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

const LOG_COLORS = {
    DEBUG: '\x1b[36m',    // Cyan
    INFO: '\x1b[32m',     // Vert
    WARN: '\x1b[33m',     // Jaune
    ERROR: '\x1b[31m',    // Rouge
    RESET: '\x1b[0m'      // Reset
};

const LOG_EMOJIS = {
    DEBUG: '🔍',
    INFO: 'ℹ️',
    WARN: '⚠️',
    ERROR: '❌'
};

class Logger {
    constructor(options = {}) {
        this.level = LOG_LEVELS[options.level?.toUpperCase() || config.logging.level.toUpperCase()] || LOG_LEVELS.INFO;
        this.useFile = options.useFile !== undefined ? options.useFile : config.logging.useFile;
        this.logDir = options.logDir || path.join(__dirname, '../../logs');
        this.logFile = path.join(this.logDir, `bot-${new Date().toISOString().split('T')[0]}.log`);
    }

    async ensureLogDir() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
        } catch (error) {
            console.error('Erreur création dossier logs:', error);
        }
    }

    formatTimestamp() {
        return new Date().toISOString().replace('T', ' ').split('.')[0];
    }

    formatMessage(level, message, data = null) {
        const timestamp = this.formatTimestamp();
        const emoji = LOG_EMOJIS[level] || '';
        const color = LOG_COLORS[level] || '';
        const reset = LOG_COLORS.RESET;

        let output = `${color}${emoji} [${timestamp}] ${level}${reset} ${message}`;
        
        if (data) {
            output += `\n${JSON.stringify(data, null, 2)}`;
        }

        return output;
    }

    async writeToFile(message) {
        if (!this.useFile) return;

        try {
            await this.ensureLogDir();
            await fs.appendFile(this.logFile, message + '\n', 'utf8');
        } catch (error) {
            console.error('Erreur écriture fichier log:', error);
        }
    }

    async log(level, message, data = null) {
        if (LOG_LEVELS[level] < this.level) return;

        const formatted = this.formatMessage(level, message, data);
        console.log(formatted);

        if (this.useFile) {
            const plainMessage = `[${this.formatTimestamp()}] ${level} ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
            await this.writeToFile(plainMessage);
        }
    }

    debug(message, data = null) {
        return this.log('DEBUG', message, data);
    }

    info(message, data = null) {
        return this.log('INFO', message, data);
    }

    warn(message, data = null) {
        return this.log('WARN', message, data);
    }

    error(message, data = null) {
        return this.log('ERROR', message, data);
    }

    success(message, data = null) {
        const timestamp = this.formatTimestamp();
        const output = `✅ [${timestamp}] SUCCESS ${message}`;
        console.log(output);

        if (this.useFile) {
            this.writeToFile(`[${timestamp}] SUCCESS ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
        }
    }

    database(message, data = null) {
        const timestamp = this.formatTimestamp();
        const output = `📡 [${timestamp}] DATABASE ${message}`;
        console.log(output);

        if (this.useFile) {
            this.writeToFile(`[${timestamp}] DATABASE ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
        }
    }

    api(message, data = null) {
        const timestamp = this.formatTimestamp();
        const output = `🌐 [${timestamp}] API ${message}`;
        console.log(output);

        if (this.useFile) {
            this.writeToFile(`[${timestamp}] API ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
        }
    }

    crypto(message, data = null) {
        const timestamp = this.formatTimestamp();
        const output = `💰 [${timestamp}] CRYPTO ${message}`;
        console.log(output);

        if (this.useFile) {
            this.writeToFile(`[${timestamp}] CRYPTO ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
        }
    }
}

// Instance globale
const logger = new Logger();

module.exports = logger;
