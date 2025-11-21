/**
 * Requêtes SQL réutilisables
 * Centralise les requêtes pour faciliter la maintenance
 */

const QUERIES = {
    // ═══════════════════════════════════════════════════════════
    // SERVERS
    // ═══════════════════════════════════════════════════════════
    
    servers: {
        create: `INSERT INTO servers (id, name) VALUES (?, ?)`,
        getById: `SELECT * FROM servers WHERE id = ?`,
        getAll: `SELECT * FROM servers`,
        update: `UPDATE servers SET name = ?, prefix = ? WHERE id = ?`,
        delete: `DELETE FROM servers WHERE id = ?`
    },

    // ═══════════════════════════════════════════════════════════
    // BRAINROTS
    // ═══════════════════════════════════════════════════════════
    
    brainrots: {
        getAll: `SELECT * FROM brainrots WHERE server_id = ? ORDER BY rarity, name`,
        getById: `SELECT * FROM brainrots WHERE id = ?`,
        getByName: `SELECT * FROM brainrots WHERE server_id = ? AND name = ?`,
        getByRarity: `SELECT * FROM brainrots WHERE server_id = ? AND rarity = ?`,
        getByMutation: `SELECT * FROM brainrots WHERE server_id = ? AND mutation = ?`,
        getByCompte: `SELECT * FROM brainrots WHERE server_id = ? AND compte = ?`,
        
        create: `INSERT INTO brainrots 
                (server_id, name, rarity, mutation, income_rate, price_eur, compte, traits, quantite)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        
        update: `UPDATE brainrots SET 
                name = COALESCE(?, name),
                rarity = COALESCE(?, rarity),
                mutation = COALESCE(?, mutation),
                income_rate = COALESCE(?, income_rate),
                price_eur = COALESCE(?, price_eur),
                compte = COALESCE(?, compte),
                traits = COALESCE(?, traits),
                quantite = COALESCE(?, quantite)
                WHERE id = ?`,
        
        delete: `DELETE FROM brainrots WHERE id = ?`,
        deleteByServer: `DELETE FROM brainrots WHERE server_id = ?`,
        
        stats: `SELECT 
                COUNT(*) as total,
                SUM(quantite) as totalQuantite,
                SUM(price_eur) as totalValue,
                rarity
                FROM brainrots 
                WHERE server_id = ? 
                GROUP BY rarity`,
        
        totalValue: `SELECT SUM(price_eur * quantite) as total FROM brainrots WHERE server_id = ?`
    },

    // ═══════════════════════════════════════════════════════════
    // GIVEAWAYS
    // ═══════════════════════════════════════════════════════════
    
    giveaways: {
        getAll: `SELECT * FROM giveaways WHERE server_id = ? ORDER BY created_at DESC`,
        getActive: `SELECT * FROM giveaways WHERE server_id = ? AND ended = FALSE AND end_time > ? ORDER BY end_time ASC`,
        getEnded: `SELECT * FROM giveaways WHERE server_id = ? AND ended = TRUE ORDER BY created_at DESC`,
        getById: `SELECT * FROM giveaways WHERE id = ?`,
        getByMessageId: `SELECT * FROM giveaways WHERE message_id = ?`,
        getExpired: `SELECT * FROM giveaways WHERE ended = FALSE AND end_time <= ?`,
        
        create: `INSERT INTO giveaways 
                (server_id, message_id, channel_id, prize, winners_count, end_time, participants)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
        
        addParticipant: `UPDATE giveaways SET participants = ? WHERE id = ?`,
        
        end: `UPDATE giveaways SET ended = TRUE, winners = ? WHERE id = ?`,
        
        delete: `DELETE FROM giveaways WHERE id = ?`,
        deleteByServer: `DELETE FROM giveaways WHERE server_id = ?`,
        
        countActive: `SELECT COUNT(*) as count FROM giveaways WHERE server_id = ? AND ended = FALSE AND end_time > ?`,
        countEnded: `SELECT COUNT(*) as count FROM giveaways WHERE server_id = ? AND ended = TRUE`
    },

    // ═══════════════════════════════════════════════════════════
    // CRYPTO PRICES
    // ═══════════════════════════════════════════════════════════
    
    cryptoPrices: {
        getAll: `SELECT * FROM crypto_prices`,
        getByCrypto: `SELECT * FROM crypto_prices WHERE crypto = ?`,
        
        upsert: `INSERT INTO crypto_prices (crypto, price_eur, price_usd)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                price_eur = ?, 
                price_usd = ?,
                updated_at = CURRENT_TIMESTAMP`,
        
        delete: `DELETE FROM crypto_prices WHERE crypto = ?`,
        
        getOldest: `SELECT * FROM crypto_prices ORDER BY updated_at ASC LIMIT 1`,
        
        needsRefresh: `SELECT * FROM crypto_prices WHERE updated_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
    }
};

module.exports = QUERIES;
