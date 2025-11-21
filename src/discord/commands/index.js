/**
 * Index centralisé des commandes Discord
 * Exporte toutes les commandes et fournit une fonction de chargement
 * Intègre le CommandHandler pour le traitement centralisé
 */

const brainrotCommands = require('./brainrot');
const giveawayCommands = require('./giveaway');
const logger = require('../../core/logger');
const commandHandler = require('../handlers/commandHandler');
const listCommandHandlers = require('../handlers/listCommandHandlers');

/**
 * Tableau de toutes les commandes
 */
const allCommands = [
  ...brainrotCommands,
  ...giveawayCommands
];

/**
 * Charge toutes les commandes dans le client Discord et le CommandHandler
 * @param {Client} client - Client Discord
 * @returns {Promise<Array>} Tableau des commandes chargées
 */
async function loadCommands(client) {
  try {
    logger.info(`Chargement de ${allCommands.length} commandes...`);
    
    // Créer une collection pour stocker les commandes dans le client
    if (!client.commands) {
      client.commands = new Map();
    }
    
    // Ajouter chaque commande à la collection du client et au CommandHandler
    allCommands.forEach(command => {
      if (!command.data || !command.execute) {
        logger.warn(`Commande invalide: ${command.data?.name || 'unknown'}`);
        return;
      }
      
      // Ajouter au client (pour compatibilité)
      client.commands.set(command.data.name, command);
      
      // Ajouter au CommandHandler
      commandHandler.register(command.data.name, command);
      
      logger.debug(`Commande chargée: ${command.data.name}`);
    });
    
    // Register list command button handlers
    client.handlers = client.handlers || new Map();
    client.handlers.set('list_rarity', listCommandHandlers.handleRarityButton);
    client.handlers.set('list_mutation', listCommandHandlers.handleMutationButton);
    client.handlers.set('list_traits', listCommandHandlers.handleTraitsButton);
    client.handlers.set('list_price', listCommandHandlers.handlePriceButton);
    client.handlers.set('list_revenue', listCommandHandlers.handleRevenueButton);
    client.handlers.set('list_alphabetic', listCommandHandlers.handleAlphabeticButton);
    client.handlers.set('list_next', listCommandHandlers.handleNextButton);
    client.handlers.set('list_prev', listCommandHandlers.handlePrevButton);
    client.handlers.set('list_page_info', () => {}); // No-op for page info button
    
    logger.debug('List command button handlers registered');
    
    logger.info(`✅ ${client.commands.size} commandes chargées avec succès`);
    return allCommands;
  } catch (error) {
    logger.error('Erreur lors du chargement des commandes:', error);
    throw error;
  }
}

/**
 * Récupère une commande par son nom
 * @param {string} name - Nom de la commande
 * @returns {Object|null} La commande ou null si non trouvée
 */
function getCommand(name) {
  return allCommands.find(cmd => cmd.data.name === name) || null;
}

/**
 * Récupère toutes les commandes
 * @returns {Array} Tableau de toutes les commandes
 */
function getAllCommands() {
  return allCommands;
}

/**
 * Récupère les données SlashCommand de toutes les commandes
 * Utile pour enregistrer les commandes auprès de Discord
 * @returns {Array} Tableau des données SlashCommand
 */
function getCommandsData() {
  return allCommands.map(cmd => cmd.data);
}

// Exporter les fonctions et commandes
module.exports = {
  allCommands,
  loadCommands,
  getCommand,
  getAllCommands,
  getCommandsData,
  commandHandler
};
