/**
 * Service pour les Brainrots
 * Contient la logique métier pour la gestion des brainrots
 */

const brainrotRepository = require('../database/repositories/brainrotRepository');
const logger = require('../core/logger');
const { ValidationError, NotFoundError } = require('../core/errors');

class BrainrotService {
  /**
   * Récupère tous les brainrots d'un serveur
   * @param {string} serverId - ID du serveur Discord
   * @returns {Promise<Array>} Liste des brainrots
   */
  async getAll(serverId) {
    try {
      if (!serverId) {
        throw new ValidationError('serverId is required');
      }

      const brainrots = await brainrotRepository.findByServerId(serverId);
      logger.debug(`Récupération de ${brainrots.length} brainrots pour le serveur ${serverId}`);
      return brainrots;
    } catch (error) {
      logger.error('Erreur getAll brainrots:', error);
      throw error;
    }
  }

  /**
   * Récupère un brainrot par ID
   * @param {number} id - ID du brainrot
   * @returns {Promise<Object>} Brainrot trouvé
   */
  async getById(id) {
    try {
      if (!id) {
        throw new ValidationError('id is required');
      }

      const brainrot = await brainrotRepository.findById(id);
      if (!brainrot) {
        throw new NotFoundError('Brainrot', id);
      }

      logger.debug(`Brainrot récupéré: ${brainrot.name} (ID: ${id})`);
      return brainrot;
    } catch (error) {
      logger.error('Erreur getById brainrot:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau brainrot
   * @param {string} serverId - ID du serveur Discord
   * @param {Object} data - Données du brainrot
   * @returns {Promise<number>} ID du brainrot créé
   */
  async create(serverId, data) {
    try {
      // Validation des données requises
      if (!serverId) {
        throw new ValidationError('serverId is required');
      }
      if (!data.name) {
        throw new ValidationError('name is required', 'name');
      }
      if (!data.rarity) {
        throw new ValidationError('rarity is required', 'rarity');
      }
      if (data.incomeRate === undefined || data.incomeRate === null) {
        throw new ValidationError('incomeRate is required', 'incomeRate');
      }
      if (data.priceEUR === undefined || data.priceEUR === null) {
        throw new ValidationError('priceEUR is required', 'priceEUR');
      }

      // Validation des valeurs numériques
      if (typeof data.incomeRate !== 'number' || data.incomeRate < 0) {
        throw new ValidationError('incomeRate must be a positive number', 'incomeRate');
      }
      if (typeof data.priceEUR !== 'number' || data.priceEUR < 0) {
        throw new ValidationError('priceEUR must be a positive number', 'priceEUR');
      }

      // Validation de la rareté
      const validRarities = ['Common', 'Rare', 'Epic', 'Legendary'];
      if (!validRarities.includes(data.rarity)) {
        throw new ValidationError(`rarity must be one of: ${validRarities.join(', ')}`, 'rarity');
      }

      const brainrotData = {
        server_id: serverId,
        name: data.name,
        rarity: data.rarity,
        mutation: data.mutation || 'Default',
        incomeRate: data.incomeRate,
        priceEUR: data.priceEUR,
        compte: data.compte || null,
        traits: Array.isArray(data.traits) ? data.traits : [],
        quantite: data.quantite || 1
      };

      const id = await brainrotRepository.create(brainrotData);
      logger.info(`Brainrot créé: ${data.name} (${data.rarity}) - ID: ${id}`);
      return id;
    } catch (error) {
      logger.error('Erreur création brainrot:', error);
      throw error;
    }
  }

  /**
   * Met à jour un brainrot
   * @param {number} id - ID du brainrot
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<boolean>} Succès de la mise à jour
   */
  async update(id, data) {
    try {
      if (!id) {
        throw new ValidationError('id is required');
      }

      // Vérifier que le brainrot existe
      const brainrot = await brainrotRepository.findById(id);
      if (!brainrot) {
        throw new NotFoundError('Brainrot', id);
      }

      // Validation des données si fournies
      if (data.rarity) {
        const validRarities = ['Common', 'Rare', 'Epic', 'Legendary'];
        if (!validRarities.includes(data.rarity)) {
          throw new ValidationError(`rarity must be one of: ${validRarities.join(', ')}`, 'rarity');
        }
      }

      if (data.incomeRate !== undefined && (typeof data.incomeRate !== 'number' || data.incomeRate < 0)) {
        throw new ValidationError('incomeRate must be a positive number', 'incomeRate');
      }

      if (data.priceEUR !== undefined && (typeof data.priceEUR !== 'number' || data.priceEUR < 0)) {
        throw new ValidationError('priceEUR must be a positive number', 'priceEUR');
      }

      const updateData = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.rarity !== undefined) updateData.rarity = data.rarity;
      if (data.mutation !== undefined) updateData.mutation = data.mutation;
      if (data.incomeRate !== undefined) updateData.incomeRate = data.incomeRate;
      if (data.priceEUR !== undefined) updateData.priceEUR = data.priceEUR;
      if (data.compte !== undefined) updateData.compte = data.compte;
      if (data.traits !== undefined) updateData.traits = Array.isArray(data.traits) ? data.traits : [];
      if (data.quantite !== undefined) updateData.quantite = data.quantite;

      const success = await brainrotRepository.update(id, updateData);
      if (success) {
        logger.info(`Brainrot mis à jour: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('Erreur mise à jour brainrot:', error);
      throw error;
    }
  }

  /**
   * Supprime un brainrot
   * @param {number} id - ID du brainrot
   * @returns {Promise<boolean>} Succès de la suppression
   */
  async delete(id) {
    try {
      if (!id) {
        throw new ValidationError('id is required');
      }

      // Vérifier que le brainrot existe
      const brainrot = await brainrotRepository.findById(id);
      if (!brainrot) {
        throw new NotFoundError('Brainrot', id);
      }

      const success = await brainrotRepository.delete(id);
      if (success) {
        logger.info(`Brainrot supprimé: ${brainrot.name} (ID: ${id})`);
      }
      return success;
    } catch (error) {
      logger.error('Erreur suppression brainrot:', error);
      throw error;
    }
  }

  /**
   * Ajoute un trait à un brainrot
   * @param {number} id - ID du brainrot
   * @param {string} trait - Trait à ajouter
   * @returns {Promise<boolean>} Succès de l'ajout
   */
  async addTrait(id, trait) {
    try {
      if (!id) {
        throw new ValidationError('id is required');
      }
      if (!trait || typeof trait !== 'string') {
        throw new ValidationError('trait must be a non-empty string', 'trait');
      }

      const brainrot = await brainrotRepository.findById(id);
      if (!brainrot) {
        throw new NotFoundError('Brainrot', id);
      }

      // Vérifier que le trait n'existe pas déjà
      if (brainrot.traits && brainrot.traits.includes(trait)) {
        throw new ValidationError(`Trait "${trait}" already exists for this brainrot`);
      }

      const traits = brainrot.traits || [];
      traits.push(trait);

      const success = await brainrotRepository.update(id, { traits });
      if (success) {
        logger.info(`Trait ajouté au brainrot ID ${id}: ${trait}`);
      }
      return success;
    } catch (error) {
      logger.error('Erreur ajout trait:', error);
      throw error;
    }
  }

  /**
   * Retire un trait d'un brainrot
   * @param {number} id - ID du brainrot
   * @param {string} trait - Trait à retirer
   * @returns {Promise<boolean>} Succès du retrait
   */
  async removeTrait(id, trait) {
    try {
      if (!id) {
        throw new ValidationError('id is required');
      }
      if (!trait || typeof trait !== 'string') {
        throw new ValidationError('trait must be a non-empty string', 'trait');
      }

      const brainrot = await brainrotRepository.findById(id);
      if (!brainrot) {
        throw new NotFoundError('Brainrot', id);
      }

      // Vérifier que le trait existe
      if (!brainrot.traits || !brainrot.traits.includes(trait)) {
        throw new ValidationError(`Trait "${trait}" not found for this brainrot`);
      }

      const traits = brainrot.traits.filter(t => t !== trait);

      const success = await brainrotRepository.update(id, { traits });
      if (success) {
        logger.info(`Trait retiré du brainrot ID ${id}: ${trait}`);
      }
      return success;
    } catch (error) {
      logger.error('Erreur retrait trait:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des brainrots d'un serveur
   * @param {string} serverId - ID du serveur Discord
   * @returns {Promise<Object>} Statistiques des brainrots
   */
  async getStats(serverId) {
    try {
      if (!serverId) {
        throw new ValidationError('serverId is required');
      }

      const stats = await brainrotRepository.getStats(serverId);
      logger.debug(`Stats brainrots récupérées pour le serveur ${serverId}:`, stats);
      return stats;
    } catch (error) {
      logger.error('Erreur récupération stats brainrots:', error);
      throw error;
    }
  }
}

module.exports = new BrainrotService();
