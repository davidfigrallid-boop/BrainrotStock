/**
 * BrainrotsMarket Bot Principal
 * Gestion complète du bot Discord avec commandes, handlers et événements
 */

const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const logger = require('../config/logger');
const config = require('../config');
const { createCommands } = require('../config/commands');
const brainrotsHandlers = require('./handlers/brainrots');
const giveawaysHandlers = require('./handlers/giveaways');

class BrainrotsBot {
    constructor() {
        this.client = new Client({
            intents: [GatewayIntentBits.Guilds]
        });
        
        this.commands = new Map();
        this.handlers = new Map();
        this.config = config.discord;
    }

    /**
     * Initialise le bot
     */
    async initialize() {
        try {
            logger.info('Initialisation du bot BrainrotsMarket...');
            
            // Valider la configuration
            if (!this.config.token) {
                throw new Error('DISCORD_TOKEN manquant');
            }
            if (!this.config.clientId) {
                throw new Error('CLIENT_ID manquant');
            }
            if (!this.config.guildId) {
                throw new Error('GUILD_ID manquant');
            }
            
            // Charger les commandes
            this.loadCommands();
            
            // Enregistrer les commandes Discord
            await this.registerCommands();
            
            // Configurer les événements
            this.setupEvents();
            
            // Connecter le bot
            await this.client.login(this.config.token);
            
            logger.success('Bot démarré avec succès');
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation du bot:', error.message || error);
            process.exit(1);
        }
    }

    /**
     * Charge les commandes slash
     */
    loadCommands() {
        const commands = createCommands();
        commands.forEach(command => {
            this.commands.set(command.name, command);
        });
        logger.info(`${this.commands.size} commandes chargées`);
    }

    /**
     * Enregistre les commandes auprès de Discord
     */
    async registerCommands() {
        try {
            const rest = new REST({ version: '10' }).setToken(this.config.token);
            
            const commandsData = Array.from(this.commands.values()).map(cmd => cmd.toJSON());
            
            logger.info(`Enregistrement de ${commandsData.length} commandes...`);
            console.log('Commandes à enregistrer:', commandsData.length);
            
            // Vérifier chaque commande pour les problèmes
            commandsData.forEach((cmd, idx) => {
                console.log(`[${idx}] ${cmd.name} - Options: ${cmd.options?.length || 0}`);
                if (cmd.options) {
                    cmd.options.forEach((opt, optIdx) => {
                        console.log(`  [${optIdx}] ${opt.name} - Choices: ${opt.choices?.length || 0}`);
                        if (opt.choices && opt.choices.length > 25) {
                            console.warn(`⚠️ ATTENTION: ${cmd.name}.${opt.name} a ${opt.choices.length} choices (max 25)`);
                        }
                    });
                }
            });
            
            // Discord limite à 25 commandes par requête, donc on divise en batches
            const batchSize = 25;
            for (let i = 0; i < commandsData.length; i += batchSize) {
                const batch = commandsData.slice(i, i + batchSize);
                const batchNum = Math.floor(i / batchSize) + 1;
                
                try {
                    console.log(`Envoi batch ${batchNum}...`);
                    await rest.put(
                        Routes.applicationGuildCommands(this.config.clientId, this.config.guildId),
                        { body: batch }
                    );
                    
                    logger.info(`✅ Batch ${batchNum} enregistré (${batch.length} commandes)`);
                } catch (batchError) {
                    console.error(`Erreur batch ${batchNum}:`, batchError);
                    logger.error(`Erreur batch ${batchNum}:`, batchError.message);
                    throw batchError;
                }
            }
            
            logger.success(`${commandsData.length} commandes enregistrées auprès de Discord`);
        } catch (error) {
            console.error('Erreur complète:', error);
            logger.error('Erreur lors de l\'enregistrement des commandes:', error.message || error);
            throw error;
        }
    }

    /**
     * Configure les événements du bot
     */
    setupEvents() {
        this.client.once('clientReady', () => this.onReady());
        this.client.on('interactionCreate', (interaction) => this.onInteraction(interaction));
    }

    /**
     * Événement: Bot prêt
     */
    onReady() {
        logger.success(`✅ Bot connecté en tant que ${this.client.user.tag}`);
        this.client.user.setActivity('🧠 BrainrotsMarket', { type: 'WATCHING' });
    }

    /**
     * Événement: Interaction (commandes slash, boutons, etc.)
     */
    async onInteraction(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                await this.handleCommand(interaction);
            } else if (interaction.isButton()) {
                await this.handleButton(interaction);
            }
        } catch (error) {
            logger.error('Erreur lors du traitement de l\'interaction:', error);
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ Une erreur est survenue', flags: 64 });
            } else {
                await interaction.reply({ content: '❌ Une erreur est survenue', flags: 64 });
            }
        }
    }

    /**
     * Traite une commande slash
     */
    async handleCommand(interaction) {
        const command = this.commands.get(interaction.commandName);
        
        if (!command) {
            await interaction.reply({ content: '❌ Commande non trouvée', flags: 64 });
            return;
        }
        
        logger.info(`Commande exécutée: ${interaction.commandName} par ${interaction.user.tag}`);
        
        try {
            // Handlers brainrots
            switch (interaction.commandName) {
                case 'list':
                    return brainrotsHandlers.handleList(interaction);
                case 'addbrainrot':
                    return brainrotsHandlers.handleAddBrainrot(interaction);
                case 'removebrainrot':
                    return brainrotsHandlers.handleRemoveBrainrot(interaction);
                case 'updatebrainrot':
                    return brainrotsHandlers.handleUpdateBrainrot(interaction);
                case 'addtrait':
                    return brainrotsHandlers.handleAddTrait(interaction);
                case 'removetrait':
                    return brainrotsHandlers.handleRemoveTrait(interaction);
                case 'showcompte':
                    return brainrotsHandlers.handleShowCompte(interaction);
                case 'stats':
                    return brainrotsHandlers.handleStats(interaction);
                
                // Handlers giveaways
                case 'giveaway':
                    return giveawaysHandlers.handleGiveaway(interaction);
                case 'gend':
                    return giveawaysHandlers.handleGiveawayEnd(interaction);
                case 'greroll':
                    return giveawaysHandlers.handleGiveawayReroll(interaction);
                case 'glist':
                    return giveawaysHandlers.handleGiveawayList(interaction);
                
                default:
                    await interaction.reply({ 
                        content: `✅ Commande ${interaction.commandName} en cours de développement...`, 
                        flags: 64 
                    });
            }
        } catch (error) {
            logger.error(`Erreur commande ${interaction.commandName}:`, error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Erreur lors de l\'exécution', flags: 64 });
            }
        }
    }

    /**
     * Traite un clic de bouton
     */
    async handleButton(interaction) {
        logger.info(`Bouton cliqué: ${interaction.customId} par ${interaction.user.tag}`);
        
        try {
            // Les handlers spécifiques seront implémentés dans les phases suivantes
            await interaction.reply({ 
                content: '✅ Bouton en cours de développement...', 
                flags: 64 
            });
        } catch (error) {
            logger.error(`Erreur bouton ${interaction.customId}:`, error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Erreur lors de l\'exécution', flags: 64 });
            }
        }
    }

    /**
     * Démarre le bot
     */
    start() {
        this.initialize();
    }
}

module.exports = BrainrotsBot;
