const mysql = require('mysql2/promise');

let pool = null;
let useDatabase = false;

// Configuration MySQL depuis les variables d'environnement
const dbConfig = {
    host: process.env.MYSQL_HOST || process.env.RAILWAY_PRIVATE_DOMAIN,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

/**
 * Initialise la connexion à la base de données
 */
async function initDatabase() {
    // Vérifier si les variables MySQL sont définies
    if (!dbConfig.host || !dbConfig.password) {
        console.log('⚠️ Variables MySQL non définies, utilisation du système JSON');
        useDatabase = false;
        return false;
    }

    try {
        pool = mysql.createPool(dbConfig);
        
        // Tester la connexion
        const connection = await pool.getConnection();
        console.log('✅ Connexion MySQL établie');
        
        // Créer les tables si elles n'existent pas
        await createTables(connection);
        
        connection.release();
        useDatabase = true;
        return true;
    } catch (error) {
        console.error('❌ Erreur connexion MySQL:', error.message);
        console.log('⚠️ Fallback sur le système JSON');
        useDatabase = false;
        return false;
    }
}

/**
 * Crée les tables nécessaires
 */
async function createTables(connection) {
    // Table brainrots
    await connection.query(`
        CREATE TABLE IF NOT EXISTS brainrots (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            rarity VARCHAR(50) NOT NULL,
            mutation VARCHAR(50) NOT NULL,
            incomeRate VARCHAR(50) NOT NULL,
            priceEUR DECIMAL(20, 2) NOT NULL,
            priceCrypto JSON,
            traits JSON,
            compte VARCHAR(255),
            quantite INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_name (name),
            INDEX idx_rarity (rarity),
            INDEX idx_mutation (mutation)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Table giveaways
    await connection.query(`
        CREATE TABLE IF NOT EXISTS giveaways (
            id INT AUTO_INCREMENT PRIMARY KEY,
            prize VARCHAR(255) NOT NULL,
            endTime BIGINT NOT NULL,
            winners INT DEFAULT 1,
            participants JSON,
            channelId VARCHAR(50) NOT NULL,
            messageId VARCHAR(50),
            ended BOOLEAN DEFAULT FALSE,
            forcedWinner VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ended (ended),
            INDEX idx_messageId (messageId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tables MySQL créées/vérifiées');
}

/**
 * Récupère tous les brainrots
 */
async function getAllBrainrots() {
    if (!useDatabase || !pool) return null;
    
    try {
        const [rows] = await pool.query('SELECT * FROM brainrots ORDER BY id');
        
        // Convertir les données MySQL en format JSON
        return rows.map(row => ({
            name: row.name,
            rarity: row.rarity,
            mutation: row.mutation,
            incomeRate: row.incomeRate,
            priceEUR: parseFloat(row.priceEUR),
            priceCrypto: row.priceCrypto || {},
            traits: row.traits || [],
            compte: row.compte,
            quantite: row.quantite
        }));
    } catch (error) {
        console.error('❌ Erreur lecture brainrots MySQL:', error.message);
        return null;
    }
}

/**
 * Sauvegarde tous les brainrots (remplace tout)
 */
async function saveAllBrainrots(brainrots) {
    if (!useDatabase || !pool) return false;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Supprimer tous les brainrots existants
        await connection.query('DELETE FROM brainrots');
        
        // Insérer les nouveaux brainrots
        if (brainrots.length > 0) {
            const values = brainrots.map(br => [
                br.name,
                br.rarity,
                br.mutation,
                br.incomeRate,
                br.priceEUR,
                JSON.stringify(br.priceCrypto || {}),
                JSON.stringify(br.traits || []),
                br.compte || null,
                br.quantite || 1
            ]);
            
            await connection.query(
                `INSERT INTO brainrots 
                (name, rarity, mutation, incomeRate, priceEUR, priceCrypto, traits, compte, quantite) 
                VALUES ?`,
                [values]
            );
        }
        
        await connection.commit();
        console.log('💾 Brainrots sauvegardés dans MySQL');
        return true;
    } catch (error) {
        await connection.rollback();
        console.error('❌ Erreur sauvegarde brainrots MySQL:', error.message);
        return false;
    } finally {
        connection.release();
    }
}

/**
 * Récupère tous les giveaways
 */
async function getAllGiveaways() {
    if (!useDatabase || !pool) return null;
    
    try {
        const [rows] = await pool.query('SELECT * FROM giveaways ORDER BY id');
        
        return rows.map(row => ({
            prize: row.prize,
            endTime: row.endTime,
            winners: row.winners,
            participants: row.participants || [],
            channelId: row.channelId,
            messageId: row.messageId,
            ended: row.ended,
            forcedWinner: row.forcedWinner
        }));
    } catch (error) {
        console.error('❌ Erreur lecture giveaways MySQL:', error.message);
        return null;
    }
}

/**
 * Sauvegarde tous les giveaways (remplace tout)
 */
async function saveAllGiveaways(giveaways) {
    if (!useDatabase || !pool) return false;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Supprimer tous les giveaways existants
        await connection.query('DELETE FROM giveaways');
        
        // Insérer les nouveaux giveaways
        if (giveaways.length > 0) {
            const values = giveaways.map(g => [
                g.prize,
                g.endTime,
                g.winners,
                JSON.stringify(g.participants || []),
                g.channelId,
                g.messageId,
                g.ended,
                g.forcedWinner || null
            ]);
            
            await connection.query(
                `INSERT INTO giveaways 
                (prize, endTime, winners, participants, channelId, messageId, ended, forcedWinner) 
                VALUES ?`,
                [values]
            );
        }
        
        await connection.commit();
        console.log('💾 Giveaways sauvegardés dans MySQL');
        return true;
    } catch (error) {
        await connection.rollback();
        console.error('❌ Erreur sauvegarde giveaways MySQL:', error.message);
        return false;
    } finally {
        connection.release();
    }
}

/**
 * Ferme la connexion à la base de données
 */
async function closeDatabase() {
    if (pool) {
        await pool.end();
        console.log('🔌 Connexion MySQL fermée');
    }
}

/**
 * Vérifie si la base de données est utilisée
 */
function isDatabaseEnabled() {
    return useDatabase;
}

module.exports = {
    initDatabase,
    getAllBrainrots,
    saveAllBrainrots,
    getAllGiveaways,
    saveAllGiveaways,
    closeDatabase,
    isDatabaseEnabled
};
