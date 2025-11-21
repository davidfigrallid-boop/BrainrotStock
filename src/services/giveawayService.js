/**
 * Service pour les Giveaways
 * Contient la logique métier pour la gestion des giveaways
 */

const giveawayRepository = require('../database/repositories/giveawayRepository');
const logger = require('../core/logger');
const { ValidationError, NotFoundError } = require('../core/errors');

class GiveawayService {
  /**
   * Récupère tous les giveaways d'un serveur
   * @param {string} serverId - ID du serveur Discord
   * @param {boolean} onlyActive - Si true, retourne seulement les giveaways actifs
   * @returns {Promise<Array>} Liste des giveaways
   */
  async getAll(serverId, onlyActive = false) {
    try {
      if (!serverId) {
        throw new ValidationError('serverId is required');
      }

      const giveaways = await giveawayRepository.findByServerId(serverId, onlyActive);
      logger.debug(`Récupération de ${giveaways.length} giveaways pour le serveur ${serverId}`);
      return giveaways;
    } catch (error) {
      logger.error('Erreur getAll giveaways:', error);
      throw error;
    }
  }

  /**
   * Récupère un giveaway par ID
   * @param {number} id - ID du giveaway
   * @returns {Promise<Object>} Giveaway trouvé
   */
  async getById(id) {
    try {
      if (!id) {
        throw new ValidationError('id is required');
      }

      const giveaway = await giveawayRepository.findById(id);
      if (!giveaway) {
        throw new NotFoundError('Giveaway', id);
      }

      logger.debug(`Giveaway récupéré: ${giveaway.prize} (ID: ${id})`);
      return giveaway;
    } catch (error) {
      logger.error('Erreur getById giveaway:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau giveaway
   * @param {string} serverId - ID du serveur Discord
   * @param {Object} data - Données du giveaway
   * @returns {Promise<number>} ID du giveaway créé
   */
  async create(serverId, data) {
    try {
      // Validation des données requises
      if (!serverId) {
        throw new ValidationError('serverId is required');
      }
      if (!data.messageId) {
        throw new ValidationError('messageId is required', 'messageId');
      }
      if (!data.channelId) {
        throw new ValidationError('channelId is required', 'channelId');
      }
      if (!data.prize) {
        throw new ValidationError('prize is required', 'prize');
      }
      if (!data.endTime) {
        throw new ValidationError('endTime is required', 'endTime');
      }

      // Validation des valeurs numériques
      if (typeof data.endTime !== 'number' || data.endTime <= 0) {
        throw new ValidationError('endTime must be a positive number', 'endTime');
      }

      const winnersCount = data.winners_count || 1;
      if (typeof winnersCount !== 'number' || winnersCount < 1) {
        throw new ValidationError('winners_count must be at least 1', 'winners_count');
      }

      // Vérifier que endTime est dans le futur
      if (data.endTime <= Date.now()) {
        throw new ValidationError('endTime must be in the future', 'endTime');
      }

      const giveawayData = {
        server_id: serverId,
        messageId: data.messageId,
        channelId: data.channelId,
        prize: data.prize,
        winners_count: winnersCount,
        endTime: data.endTime,
        participants: []
      };

      const id = await giveawayRepository.create(giveawayData);
      logger.info(`Giveaway créé: ${data.prize} (${winnersCount} gagnants) - ID: ${id}`);
      return id;
    } catch (error) {
      logger.error('Erreur création giveaway:', error);
      throw error;
    }
  }

  /**
   * Met à jour un giveaway
   * @param {number} id - ID du giveaway
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<boolean>} Succès de la mise à jour
   */
  async update(id, data) {
    try {
      if (!id) {
        throw new ValidationError('id is required');
      }

      // Vérifier que le giveaway existe
      const giveaway = await giveawayRepository.findById(id);
      if (!giveaway) {
        throw new NotFoundError('Giveaway', id);
      }

      // Validation des données si fournies
      if (data.endTime !== undefined) {
        if (typeof data.endTime !== 'number' || data.endTime <= 0) {
          throw new ValidationError('endTime must be a positive number', 'endTime');
        }
      }

      if (data.winners_count !== undefined) {
        if (typeof data.winners_count !== 'number' || data.winners_count < 1) {
          throw new ValidationError('winners_count must be at least 1', 'winners_count');
        }
      }

      const updateData = {};
      if (data.prize !== undefined) updateData.prize = data.prize;
      if (data.winners_count !== undefined) updateData.winners_count = data.winners_count;
      if (data.endTime !== undefined) updateData.endTime = data.endTime;
      if (data.ended !== undefined) updateData.ended = data.ended;
      if (data.winners !== undefined) updateData.winners = Array.isArray(data.winners) ? data.winners : [];
      if (data.participants !== undefined) updateData.participants = Array.isArray(data.participants) ? data.participants : [];

      const success = await giveawayRepository.update(id, updateData);
      if (success) {
        logger.info(`Giveaway mis à jour: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('Erreur mise à jour giveaway:', error);
      throw error;
    }
  }

  /**
   * Supprime un giveaway
   * @param {number} id - ID du giveaway
   * @returns {Promise<boolean>} Succès de la suppression
   */
  async delete(id) {
    try {
      if (!id) {
        throw new ValidationError('id is required');
      }

      // Vérifier que le giveaway existe
      const giveaway = await giveawayRepository.findById(id);
      if (!giveaway) {
        throw new NotFoundError('Giveaway', id);
      }

      const success = await giveawayRepository.delete(id);
      if (success) {
        logger.info(`Giveaway supprimé: ${giveaway.prize} (ID: ${id})`);
      }
      return success;
    } catch (error) {
      logger.error('Erreur suppression giveaway:', error);
      throw error;
    }
  }

  /**
   * Ajoute un participant au giveaway
   * @param {number} id - ID du giveaway
   * @param {string} userId - ID de l'utilisateur Discord
   * @returns {Promise<boolean>} Succès de l'ajout
   */
  async addParticipant(id, userId) {
    try {
      if (!id) {
        throw new ValidationError('id is required');
      }
      if (!userId || typeof userId !== 'string') {
        throw new ValidationError('userId must be a non-empty string', 'userId');
      }

      const giveaway = await giveawayRepository.findById(id);
      if (!giveaway) {
        throw new NotFoundError('Giveaway', id);
      }

      // Vérifier que le giveaway n'est pas terminé
      if (giveaway.ended) {
        throw new ValidationError('Cannot add participant to an ended giveaway');
      }

      // Vérifier que le giveaway n'a pas expiré
      if (giveaway.endTime <= Date.now()) {
        throw new ValidationError('Giveaway has expired');
      }

      const success = await giveawayRepository.addParticipant(id, userId);
      if (success) {
        logger.debug(`Participant ajouté au giveaway ID ${id}: ${userId}`);
      }
      return success;
    } catch (error) {
      logger.error('Erreur ajout participant:', error);
      throw error;
    }
  }

  /**
   * Sélectionne aléatoirement les gagnants du giveaway
   * @param {Array<string>} participants - Liste des IDs des participants
   * @param {number} count - Nombre de gagnants à sélectionner
   * @returns {Array<string>} Liste des IDs des gagnants
   */
  selectWinners(participants, count) {
    try {
      if (!Array.isArray(participants) || participants.length === 0) {
        throw new ValidationError('participants must be a non-empty array', 'participants');
      }

      if (typeof count !== 'number' || count < 1) {
        throw new ValidationError('count must be at least 1', 'count');
      }

      // Limiter le nombre de gagnants au nombre de participants
      const winnersCount = Math.min(count, participants.length);

      // Créer une copie du tableau et mélanger
      const shuffled = [...participants].sort(() => Math.random() - 0.5);

      // Retourner les premiers winnersCount éléments
      const winners = shuffled.slice(0, winnersCount);

      logger.debug(`Gagnants sélectionnés: ${winners.length} gagnants parmi ${participants.length} participants`);
      return winners;
    } catch (error) {
      logger.error('Erreur sélection gagnants:', error);
      throw error;
    }
  }

  /**
   * Termine un giveaway et sélectionne les gagnants
   * @param {number} id - ID du giveaway
   * @returns {Promise<Object>} Giveaway terminé avec les gagnants
   */
  async endGiveaway(id) {
    try {
      if (!id) {
        throw new ValidationError('id is required');
      }

      const giveaway = await giveawayRepository.findById(id);
      if (!giveaway) {
        throw new NotFoundError('Giveaway', id);
      }

      // Vérifier que le giveaway n'est pas déjà terminé
      if (giveaway.ended) {
        throw new ValidationError('Giveaway is already ended');
      }

      // Sélectionner les gagnants
      const winners = this.selectWinners(giveaway.participants, giveaway.winners_count);

      // Mettre à jour le giveaway
      await giveawayRepository.update(id, {
        ended: true,
        winners
      });

      logger.info(`Giveaway terminé: ID ${id}, ${winners.length} gagnants sélectionnés`);

      return {
        ...giveaway,
        ended: true,
        winners
      };
    } catch (error) {
      logger.error('Erreur fin giveaway:', error);
      throw error;
    }
  }

  /**
   * Resélectionne les gagnants d'un giveaway terminé
   * @param {number} id - ID du giveaway
   * @returns {Promise<Object>} Giveaway avec les nouveaux gagnants
   */
  async rerollWinners(id) {
    try {
      if (!id) {
        throw new ValidationError('id is required');
      }

      const giveaway = await giveawayRepository.findById(id);
      if (!giveaway) {
        throw new NotFoundError('Giveaway', id);
      }

      // Vérifier que le giveaway est terminé
      if (!giveaway.ended) {
        throw new ValidationError('Cannot reroll winners for an active giveaway');
      }

      // Sélectionner les nouveaux gagnants
      const winners = this.selectWinners(giveaway.participants, giveaway.winners_count);

      // Mettre à jour le giveaway
      await giveawayRepository.update(id, { winners });

      logger.info(`Gagnants resélectionnés: ID ${id}, ${winners.length} nouveaux gagnants`);

      return {
        ...giveaway,
        winners
      };
    } catch (error) {
      logger.error('Erreur resélection gagnants:', error);
      throw error;
    }
  }
}

module.exports = new GiveawayService();
