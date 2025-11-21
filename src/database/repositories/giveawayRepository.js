/**
 * Repository pour les Giveaways
 * Gère l'accès aux données des giveaways
 */

const BaseRepository = require('./baseRepository');
const db = require('../connection');
const logger = require('../../core/logger');
const { DatabaseError } = require('../../core/errors');

class GiveawayRepository extends BaseRepository {
  constructor() {
    super('giveaways');
  }

  /**
   * Récupère tous les giveaways d'un serveur
   */
  async findByServerId(serverId, onlyActive = false) {
    try {
      let sql = 'SELECT * FROM giveaways WHERE server_id = ?';
      const values = [serverId];

      if (onlyActive) {
        sql += ' AND ended = FALSE AND endTime > ?';
        values.push(Date.now());
      }

      sql += ' ORDER BY created_at DESC';

      const results = await db.query(sql, values);

      return results.map(ga => ({
        ...ga,
        winners: ga.winners ? JSON.parse(ga.winners) : [],
        participants: ga.participants ? JSON.parse(ga.participants) : []
      }));
    } catch (error) {
      logger.error('Erreur findByServerId giveaways:', error);
      throw new DatabaseError('Failed to fetch giveaways');
    }
  }

  /**
   * Récupère un giveaway par ID
   */
  async findById(id) {
    try {
      const result = await db.queryOne(
        'SELECT * FROM giveaways WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      return {
        ...result,
        winners: result.winners ? JSON.parse(result.winners) : [],
        participants: result.participants ? JSON.parse(result.participants) : []
      };
    } catch (error) {
      logger.error('Erreur findById giveaway:', error);
      throw new DatabaseError('Failed to fetch giveaway');
    }
  }

  /**
   * Récupère un giveaway par messageId
   */
  async findByMessageId(messageId) {
    try {
      const result = await db.queryOne(
        'SELECT * FROM giveaways WHERE messageId = ?',
        [messageId]
      );

      if (!result) {
        return null;
      }

      return {
        ...result,
        winners: result.winners ? JSON.parse(result.winners) : [],
        participants: result.participants ? JSON.parse(result.participants) : []
      };
    } catch (error) {
      logger.error('Erreur findByMessageId giveaway:', error);
      throw new DatabaseError('Failed to fetch giveaway by message ID');
    }
  }

  /**
   * Crée un giveaway
   */
  async create(data) {
    try {
      const {
        server_id,
        messageId,
        channelId,
        prize,
        winners_count = 1,
        endTime,
        participants = []
      } = data;

      const result = await db.query(
        `INSERT INTO giveaways 
        (server_id, messageId, channelId, prize, winners_count, endTime, participants)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          server_id,
          messageId,
          channelId,
          prize,
          winners_count,
          endTime,
          JSON.stringify(participants)
        ]
      );

      logger.debug(`Giveaway créé: ${prize} (${winners_count} gagnants)`);
      return result.insertId;
    } catch (error) {
      logger.error('Erreur création giveaway:', error);
      throw new DatabaseError('Failed to create giveaway');
    }
  }

  /**
   * Met à jour un giveaway
   */
  async update(id, data) {
    try {
      const updates = [];
      const values = [];

      if (data.prize !== undefined) {
        updates.push('prize = ?');
        values.push(data.prize);
      }
      if (data.winners_count !== undefined) {
        updates.push('winners_count = ?');
        values.push(data.winners_count);
      }
      if (data.endTime !== undefined) {
        updates.push('endTime = ?');
        values.push(data.endTime);
      }
      if (data.ended !== undefined) {
        updates.push('ended = ?');
        values.push(data.ended);
      }
      if (data.winners !== undefined) {
        updates.push('winners = ?');
        values.push(JSON.stringify(data.winners));
      }
      if (data.participants !== undefined) {
        updates.push('participants = ?');
        values.push(JSON.stringify(data.participants));
      }
      if (data.chosen_winner_id !== undefined) {
        updates.push('chosen_winner_id = ?');
        values.push(data.chosen_winner_id);
      }
      if (data.is_rigged !== undefined) {
        updates.push('is_rigged = ?');
        values.push(data.is_rigged);
      }

      if (updates.length === 0) {
        return false;
      }

      values.push(id);
      const result = await db.query(
        `UPDATE giveaways SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      logger.debug(`Giveaway mis à jour: ID ${id}`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erreur mise à jour giveaway:', error);
      throw new DatabaseError('Failed to update giveaway');
    }
  }

  /**
   * Récupère les giveaways expirés
   */
  async findExpired() {
    try {
      const now = Date.now();
      const results = await db.query(
        'SELECT * FROM giveaways WHERE ended = FALSE AND endTime <= ?',
        [now]
      );

      return results.map(ga => ({
        ...ga,
        winners: ga.winners ? JSON.parse(ga.winners) : [],
        participants: ga.participants ? JSON.parse(ga.participants) : []
      }));
    } catch (error) {
      logger.error('Erreur findExpired giveaways:', error);
      throw new DatabaseError('Failed to fetch expired giveaways');
    }
  }

  /**
   * Ajoute un participant
   */
  async addParticipant(id, userId) {
    try {
      const giveaway = await this.findById(id);
      if (!giveaway) {
        return false;
      }

      const participants = giveaway.participants || [];
      if (!participants.includes(userId)) {
        participants.push(userId);
        await this.update(id, { participants });
      }

      return true;
    } catch (error) {
      logger.error('Erreur ajout participant:', error);
      throw new DatabaseError('Failed to add participant');
    }
  }

  /**
   * Retire un participant
   */
  async removeParticipant(id, userId) {
    try {
      const giveaway = await this.findById(id);
      if (!giveaway) {
        return false;
      }

      const participants = (giveaway.participants || []).filter(p => p !== userId);
      await this.update(id, { participants });

      return true;
    } catch (error) {
      logger.error('Erreur retrait participant:', error);
      throw new DatabaseError('Failed to remove participant');
    }
  }
}

module.exports = new GiveawayRepository();
