/**
 * Service de gestion des brainrots
 * Opérations CRUD et logique métier
 */

const logger = require('../config/logger');
const db = require('./database');
const { parsePrice, formatPrice } = require('../utils/helpers');

class BrainrotsService {
    /**
     * Récupère tous les brainrots d'un serveur
     */
    async getAll(serverId) {
        try {
            const brainrots = await db.query(
                'SELECT * FROM brainrots WHERE server_id = ? ORDER BY rarity, name',
                [serverId]
            );
            
            return brainrots.map(br => ({
                ...br,
                traits: br.traits ? JSON.parse(br.traits) : []
            }));
        } catch (error) {
            logger.error('Erreur getAll brainrots:', error);
            throw error;
        }
    }

    /**
     * Récupère un brainrot par ID
     */
    async getById(id) {
        try {
            const brainrot = await db.queryOne(
                'SELECT * FROM brainrots WHERE id = ?',
                [id]
            );
            
            if (brainrot) {
                brainrot.traits = brainrot.traits ? JSON.parse(brainrot.traits) : [];
            }
            
            return brainrot;
        } catch (error) {
            logger.error('Erreur getById brainrot:', error);
            throw error;
        }
    }

    /**
     * Crée un nouveau brainrot
     */
    async create(serverId, data) {
        try {
            const {
                name,
                rarity,
                mutation = 'Default',
                incomeRate,
                priceEur,
                compte = null,
                traits = [],
                quantite = 1
            } = data;

            const incomeRateNum = parsePrice(incomeRate);
            const priceEurNum = parsePrice(priceEur);

            if (isNaN(incomeRateNum) || isNaN(priceEurNum)) {
                throw new Error('Prix ou revenu invalide');
            }

            const result = await db.query(
                `INSERT INTO brainrots 
                (server_id, name, rarity, mutation, income_rate, price_eur, compte, traits, quantite)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    serverId,
                    name,
                    rarity,
                    mutation,
                    incomeRateNum,
                    priceEurNum,
                    compte,
                    JSON.stringify(traits),
                    quantite
                ]
            );

            logger.info(`Brainrot créé: ${name} (${rarity})`);
            return result.insertId;
        } catch (error) {
            logger.error('Erreur création brainrot:', error);
            throw error;
        }
    }

    /**
     * Met à jour un brainrot
     */
    async update(id, data) {
        try {
            const updates = [];
            const values = [];

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
                updates.push('income_rate = ?');
                values.push(parsePrice(data.incomeRate));
            }
            if (data.priceEur !== undefined) {
                updates.push('price_eur = ?');
                values.push(parsePrice(data.priceEur));
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
            await db.query(
                `UPDATE brainrots SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            logger.info(`Brainrot mis à jour: ID ${id}`);
            return true;
        } catch (error) {
            logger.error('Erreur mise à jour brainrot:', error);
            throw error;
        }
    }

    /**
     * Supprime un brainrot
     */
    async delete(id) {
        try {
            const result = await db.query(
                'DELETE FROM brainrots WHERE id = ?',
                [id]
            );

            logger.info(`Brainrot supprimé: ID ${id}`);
            return result.affectedRows > 0;
        } catch (error) {
            logger.error('Erreur suppression brainrot:', error);
            throw error;
        }
    }

    /**
     * Ajoute un trait à un brainrot
     */
    async addTrait(id, trait) {
        try {
            const brainrot = await this.getById(id);
            if (!brainrot) throw new Error('Brainrot non trouvé');

            const traits = brainrot.traits || [];
            if (!traits.includes(trait)) {
                traits.push(trait);
                await this.update(id, { traits });
            }

            return true;
        } catch (error) {
            logger.error('Erreur ajout trait:', error);
            throw error;
        }
    }

    /**
     * Retire un trait d'un brainrot
     */
    async removeTrait(id, trait) {
        try {
            const brainrot = await this.getById(id);
            if (!brainrot) throw new Error('Brainrot non trouvé');

            const traits = (brainrot.traits || []).filter(t => t !== trait);
            await this.update(id, { traits });

            return true;
        } catch (error) {
            logger.error('Erreur retrait trait:', error);
            throw error;
        }
    }

    /**
     * Récupère les statistiques des brainrots
     */
    async getStats(serverId) {
        try {
            const brainrots = await this.getAll(serverId);
            
            const totalBrainrots = brainrots.reduce((sum, br) => sum + (br.quantite || 1), 0);
            const totalValue = brainrots.reduce((sum, br) => sum + br.price_eur, 0);
            
            const byRarity = {};
            brainrots.forEach(br => {
                byRarity[br.rarity] = (byRarity[br.rarity] || 0) + (br.quantite || 1);
            });

            return {
                totalBrainrots,
                totalValue,
                totalValueFormatted: formatPrice(totalValue),
                uniqueTypes: brainrots.length,
                byRarity
            };
        } catch (error) {
            logger.error('Erreur stats brainrots:', error);
            throw error;
        }
    }
}

module.exports = new BrainrotsService();
