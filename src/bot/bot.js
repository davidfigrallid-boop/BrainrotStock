/**
 * BrainrotsMarket Bot Principal
 * Gestion complète du bot Discord avec commandes, handlers et événements
 */

require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const logger = require('../config/logger');
const { createCommands } = require('../config/commands');

class BrainrotsBot {
    constructor() {
        this.client = new Client({
            intents: [GatewayIntentBits.Guilds]
        });
        
        this.commands = new Map();
        this.handlers = new Map();
        this.config = {
            token: process.env.DISCORD_TOKEN,
            clientId: process.env.CLIENT_ID,
            guildId: process.env.GUILD_ID
        };
    }

    /**
     * Initialise le bot
     */
    async initialize() {
        try {
            logger.info('Initialisation du bot BrainrotsMarket...');
            
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
            logger.error('Erreur lors de l\'initialisation du bot:', error);
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
            
            await rest.put(
                Routes.applicationGuildCommands(this.config.clientId, this.config.guildId),
                { body: commandsData }
            );
            
            logger.success('Commandes enregistrées auprès de Discord');
        } catch (error) {
            logger.error('Erreur lors de l\'enregistrement des commandes:', error);
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
        // Implémentation des handlers de commandes
    }

    /**
     * Traite un clic de bouton
     */
    async handleButton(interaction) {
        logger.info(`Bouton cliqué: ${interaction.customId} par ${interaction.user.tag}`);
        // Implémentation des handlers de boutons
    }

    /**
     * Démarre le bot
     */
    start() {
        this.initialize();
    }
}

module.exports = BrainrotsBot;
