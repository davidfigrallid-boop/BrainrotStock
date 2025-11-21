/**
 * Service de gestion des giveaways
 * Opérations CRUD et logique métier
 */

const logger = require('../config/logger');
const db = require('./database');

class GiveawaysService {
    /**
     * Récupère tous les giveaways d'un serveur
     */
    async getAll(serverId, onlyActive = false) {
        try {
            let sql = 'SELECT * FROM giveaways WHERE server_id = ?';
            const values = [serverId];

            if (onlyActive) {
                sql += ' AND ended = FALSE AND endTime > ?';
                values.push(Date.now());
            }

            sql += ' ORDER BY created_at DESC';

            const giveaways = await db.query(sql, values);
            
            return giveaways.map(ga => ({
                ...ga,
                winners: ga.winners ? JSON.parse(ga.winners) : [],
                participants: ga.participants ? JSON.parse(ga.participants) : []
            }));
        } catch (error) {
            logger.error('Erreur getAll giveaways:', error);
            throw error;
        }
    }

    /**
     * Récupère un giveaway par ID
     */
    async getById(id) {
        try {
            const giveaway = await db.queryOne(
                'SELECT * FROM giveaways WHERE id = ?',
                [id]
            );
            
            if (giveaway) {
                giveaway.winners = giveaway.winners ? JSON.parse(giveaway.winners) : [];
                giveaway.participants = giveaway.participants ? JSON.parse(giveaway.participants) : [];
            }
            
            return giveaway;
        } catch (error) {
            logger.error('Erreur getById giveaway:', error);
            throw error;
        }
    }

    /**
     * Récupère un giveaway par message ID
     */
    async getByMessageId(messageId) {
        try {
            const giveaway = await db.queryOne(
                'SELECT * FROM giveaways WHERE messageId = ?',
                [messageId]
            );
            
            if (giveaway) {
                giveaway.winners = giveaway.winners ? JSON.parse(giveaway.winners) : [];
                giveaway.participants = giveaway.participants ? JSON.parse(giveaway.participants) : [];
            }
            
            return giveaway;
        } catch (error) {
            logger.error('Erreur getByMessageId giveaway:', error);
            throw error;
        }
    }

    /**
     * Crée un nouveau giveaway
     */
    async create(serverId, data) {
        try {
            const {
                messageId,
                channelId,
                prize,
                winnersCount = 1,
                endTime,
                forcedWinner = null
            } = data;

            const participants = forcedWinner ? [forcedWinner] : [];

            const result = await db.query(
                `INSERT INTO giveaways 
                (server_id, messageId, channelId, prize, winners_count, endTime, participants)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    serverId,
                    messageId,
                    channelId,
                    prize,
                    winnersCount,
                    endTime,
                    JSON.stringify(participants)
                ]
            );

            logger.info(`Giveaway créé: ${prize} (${winnersCount} gagnants)`);
            return result.insertId;
        } catch (error) {
            logger.error('Erreur création giveaway:', error);
            throw error;
        }
    }

    /**
     * Ajoute un participant au giveaway
     */
    async addParticipant(giveawayId, userId) {
        try {
            const giveaway = await this.getById(giveawayId);
            if (!giveaway) throw new Error('Giveaway non trouvé');

            const participants = giveaway.participants || [];
            if (!participants.includes(userId)) {
                participants.push(userId);
                await db.query(
                    'UPDATE giveaways SET participants = ? WHERE id = ?',
                    [JSON.stringify(participants), giveawayId]
                );
            }

            return true;
        } catch (error) {
            logger.error('Erreur ajout participant:', error);
            throw error;
        }
    }

    /**
     * Termine un giveaway et sélectionne les gagnants
     */
    async endGiveaway(giveawayId, winners = null) {
        try {
            const giveaway = await this.getById(giveawayId);
            if (!giveaway) throw new Error('Giveaway non trouvé');

            let selectedWinners = winners;
            
            if (!selectedWinners) {
                const participants = giveaway.participants || [];
                selectedWinners = this.selectWinners(
                    participants,
                    giveaway.winners_count
                );
            }

            await db.query(
                'UPDATE giveaways SET ended = TRUE, winners = ? WHERE id = ?',
                [JSON.stringify(selectedWinners), giveawayId]
            );

            logger.info(`Giveaway terminé: ${giveaway.prize} - Gagnants: ${selectedWinners.join(', ')}`);
            return selectedWinners;
        } catch (error) {
            logger.error('Erreur fin giveaway:', error);
            throw error;
        }
    }

    /**
     * Sélectionne aléatoirement les gagnants
     */
    selectWinners(participants, count) {
        if (!participants || participants.length === 0) {
            return [];
        }

        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, participants.length));
    }

    /**
     * Reroll les gagnants d'un giveaway
     */
    async rerollWinners(giveawayId) {
        try {
            const giveaway = await this.getById(giveawayId);
            if (!giveaway) throw new Error('Giveaway non trouvé');

            const newWinners = this.selectWinners(
                giveaway.participants,
                giveaway.winnersCount || giveaway.winners_count
            );

            await db.query(
                'UPDATE giveaways SET winners = ? WHERE id = ?',
                [JSON.stringify(newWinners), giveawayId]
            );

            logger.info(`Giveaway reroll: ${giveaway.prize} - Nouveaux gagnants: ${newWinners.join(', ')}`);
            return newWinners;
        } catch (error) {
            logger.error('Erreur reroll giveaway:', error);
            throw error;
        }
    }

    /**
     * Supprime un giveaway
     */
    async delete(id) {
        try {
            const result = await db.query(
                'DELETE FROM giveaways WHERE id = ?',
                [id]
            );

            logger.info(`Giveaway supprimé: ID ${id}`);
            return result.affectedRows > 0;
        } catch (error) {
            logger.error('Erreur suppression giveaway:', error);
            throw error;
        }
    }

    /**
     * Récupère les giveaways qui doivent se terminer
     */
    async getExpiredGiveaways() {
        try {
            const now = Date.now();
            const giveaways = await db.query(
                'SELECT * FROM giveaways WHERE ended = FALSE AND endTime <= ?',
                [now]
            );

            return giveaways.map(ga => ({
                ...ga,
                winners: ga.winners ? JSON.parse(ga.winners) : [],
                participants: ga.participants ? JSON.parse(ga.participants) : []
            }));
        } catch (error) {
            logger.error('Erreur getExpiredGiveaways:', error);
            throw error;
        }
    }
}

module.exports = new GiveawaysService();
