/**
 * Repository pour les Brainrots
 * Gère l'accès aux données des brainrots
 */

const BaseRepository = require('./baseRepository');
const db = require('../connection');
const logger = require('../../core/logger');
const { DatabaseError } = require('../../core/errors');

class BrainrotRepository extends BaseRepository {
  constructor() {
    super('brainrots');
  }

  /**
   * Récupère tous les brainrots d'un serveur
   */
  async findByServerId(serverId) {
    try {
      const results = await db.query(
        'SELECT * FROM brainrots WHERE server_id = ? ORDER BY rarity, name',
        [serverId]
      );

      return results.map(br => ({
        ...br,
        traits: br.traits ? JSON.parse(br.traits) : []
      }));
    } catch (error) {
      logger.error('Erreur findByServerId brainrots:', error);
      throw new DatabaseError('Failed to fetch brainrots');
    }
  }

  /**
   * Récupère les brainrots par rareté
   */
  async findByRarity(serverId, rarity) {
    try {
      const results = await db.query(
        'SELECT * FROM brainrots WHERE server_id = ? AND rarity = ? ORDER BY name',
        [serverId, rarity]
      );

      return results.map(br => ({
        ...br,
        traits: br.traits ? JSON.parse(br.traits) : []
      }));
    } catch (error) {
      logger.error('Erreur findByRarity brainrots:', error);
      throw new DatabaseError('Failed to fetch brainrots by rarity');
    }
  }

  /**
   * Récupère les brainrots par mutation
   */
  async findByMutation(serverId, mutation) {
    try {
      const results = await db.query(
        'SELECT * FROM brainrots WHERE server_id = ? AND mutation = ? ORDER BY name',
        [serverId, mutation]
      );

      return results.map(br => ({
        ...br,
        traits: br.traits ? JSON.parse(br.traits) : []
      }));
    } catch (error) {
      logger.error('Erreur findByMutation brainrots:', error);
      throw new DatabaseError('Failed to fetch brainrots by mutation');
    }
  }

  /**
   * Récupère un brainrot par ID avec traits parsés
   */
  async findById(id) {
    try {
      const result = await db.queryOne(
        'SELECT * FROM brainrots WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      return {
        ...result,
        traits: result.traits ? JSON.parse(result.traits) : []
      };
    } catch (error) {
      logger.error('Erreur findById brainrot:', error);
      throw new DatabaseError('Failed to fetch brainrot');
    }
  }

  /**
   * Crée un brainrot
   */
  async create(data) {
    try {
      const {
        server_id,
        name,
        rarity,
        mutation = 'Default',
        incomeRate,
        priceEUR,
        compte = null,
        traits = [],
        quantite = 1
      } = data;

      const result = await db.query(
        `INSERT INTO brainrots 
        (server_id, name, rarity, mutation, incomeRate, priceEUR, compte, traits, quantite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          server_id,
          name,
          rarity,
          mutation,
          incomeRate,
          priceEUR,
          compte,
          JSON.stringify(traits),
          quantite
        ]
      );

      logger.debug(`Brainrot créé: ${name} (${rarity})`);
      return result.insertId;
    } catch (error) {
      logger.error('Erreur création brainrot:', error);
      throw new DatabaseError('Failed to create brainrot');
    }
  }

  /**
   * Met à jour un brainrot
   */
  async update(id, data) {
    try {
      const updates = [];
      const values = [];

      // Construire les colonnes à mettre à jour
      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.rarity !== undefined) {
        updates.push('rarity = ?');
        values.push(data.rarity);
      }
      if (data.mutation !== undefined) {
        updates.push('mutation = ?');
        values.push(data.mutation);
      }
      if (data.incomeRate !== undefined) {
        updates.push('incomeRate = ?');
        values.push(data.incomeRate);
      }
      if (data.priceEUR !== undefined) {
        updates.push('priceEUR = ?');
        values.push(data.priceEUR);
      }
      if (data.compte !== undefined) {
        updates.push('compte = ?');
        values.push(data.compte);
      }
      if (data.traits !== undefined) {
        updates.push('traits = ?');
        values.push(JSON.stringify(data.traits));
      }
      if (data.quantite !== undefined) {
        updates.push('quantite = ?');
        values.push(data.quantite);
      }

      if (updates.length === 0) {
        return false;
      }

      values.push(id);
      const result = await db.query(
        `UPDATE brainrots SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      logger.debug(`Brainrot mis à jour: ID ${id}`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erreur mise à jour brainrot:', error);
      throw new DatabaseError('Failed to update brainrot');
    }
  }

  /**
   * Récupère les statistiques des brainrots
   */
  async getStats(serverId) {
    try {
      const brainrots = await this.findByServerId(serverId);

      const totalBrainrots = brainrots.reduce((sum, br) => sum + (br.quantite || 1), 0);
      const totalValue = brainrots.reduce((sum, br) => sum + br.priceEUR, 0);

      const byRarity = {};
      brainrots.forEach(br => {
        byRarity[br.rarity] = (byRarity[br.rarity] || 0) + (br.quantite || 1);
      });

      return {
        totalBrainrots,
        totalValue,
        uniqueTypes: brainrots.length,
        byRarity
      };
    } catch (error) {
      logger.error('Erreur stats brainrots:', error);
      throw new DatabaseError('Failed to fetch brainrot stats');
    }
  }
}

module.exports = new BrainrotRepository();
