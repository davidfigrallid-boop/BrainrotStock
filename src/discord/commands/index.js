/**
 * Index centralisé des commandes Discord
 * Exporte toutes les commandes et fournit une fonction de chargement
 * Intègre le CommandHandler pour le traitement centralisé
 */

const brainrotCommands = require('./brainrot');
const giveawayCommands = require('./giveaway');
const logger = require('../../core/logger');
const commandHandler = require('../handlers/commandHandler');

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
