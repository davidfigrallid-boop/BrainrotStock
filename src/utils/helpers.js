/**
 * Fonctions utilitaires réutilisables
 */

const { PRICE_ABBREVIATIONS, DURATION_MULTIPLIERS } = require('./constants');

// ═══════════════════════════════════════════════════════════
// PRIX
// ═══════════════════════════════════════════════════════════

/**
 * Parse un prix abrégé (1k, 1M, 1B, etc.)
 * @param {string|number} str - Prix à parser
 * @returns {number} - Prix en nombre
 */
function parsePrice(str) {
    if (typeof str === 'number') return str;
    const match = /^([\d.]+)\s*([a-zA-Z]+)?$/.exec(str.trim());
    if (!match) return NaN;
    const [, num, suf] = match;
    return parseFloat(num) * (PRICE_ABBREVIATIONS[suf] || 1);
}

/**
 * Formate un prix en notation abrégée
 * @param {number} num - Prix à formater
 * @returns {string} - Prix formaté
 */
function formatPrice(num) {
    if (isNaN(num) || num === null) return 'N/A';
    if (num >= 1e15) return (num / 1e15).toFixed(2) + "Qa";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9)  return (num / 1e9).toFixed(2)  + "B";
    if (num >= 1e6)  return (num / 1e6).toFixed(2)  + "M";
    if (num >= 1e3)  return (num / 1e3).toFixed(2)  + "k";
    return num.toFixed(2);
}

/**
 * Formate un prix crypto avec précision appropriée
 * @param {number} price - Prix crypto
 * @returns {string} - Prix formaté
 */
function formatCryptoPrice(price) {
    if (!price || price === null) return 'N/A';
    
    if (price < 0.000001) {
        return price.toExponential(4);
    } else if (price < 0.01) {
        return price.toFixed(8);
    } else if (price < 1) {
        return price.toFixed(6);
    } else {
        return price.toFixed(4);
    }
}

// ═══════════════════════════════════════════════════════════
// DURÉES
// ═══════════════════════════════════════════════════════════

/**
 * Parse une durée abrégée (1min, 1h, 1j, etc.)
 * @param {string} durationStr - Durée à parser
 * @returns {number|null} - Durée en minutes ou null si invalide
 */
function parseDuration(durationStr) {
    const match = /^(\d+)\s*(min|h|j|sem|m|an)$/.exec(durationStr.toLowerCase().trim());
    
    if (!match) {
        return null;
    }
    
    const [, amount, unit] = match;
    const value = parseInt(amount);
    
    return value * DURATION_MULTIPLIERS[unit];
}

/**
 * Formate une durée en texte lisible
 * @param {number} milliseconds - Durée en millisecondes
 * @returns {string} - Durée formatée
 */
function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}j`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}min`;
    return `${seconds}s`;
}

// ═══════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Valide une liste de traits
 * @param {string[]} traits - Traits à valider
 * @param {string[]} validTraits - Liste des traits valides
 * @returns {object} - { valid: boolean, invalid: string[] }
 */
function validateTraits(traits, validTraits) {
    const invalid = traits.filter(t => !validTraits.includes(t));
    return {
        valid: invalid.length === 0,
        invalid
    };
}

/**
 * Valide une mutation
 * @param {string} mutation - Mutation à valider
 * @param {string[]} validMutations - Liste des mutations valides
 * @returns {boolean}
 */
function validateMutation(mutation, validMutations) {
    return validMutations.includes(mutation);
}

/**
 * Valide une rareté
 * @param {string} rarity - Rareté à valider
 * @param {object} rarityOrder - Objet avec les raretés valides
 * @returns {boolean}
 */
function validateRarity(rarity, rarityOrder) {
    return rarity in rarityOrder;
}

// ═══════════════════════════════════════════════════════════
// AGRÉGATION
// ═══════════════════════════════════════════════════════════

/**
 * Agrège les brainrots identiques
 * @param {array} brainrotsList - Liste des brainrots
 * @returns {array} - Brainrots agrégés
 */
function aggregateBrainrots(brainrotsList) {
    const aggregated = [];
    
    for (const br of brainrotsList) {
        const existing = aggregated.find(item =>
            item.name === br.name &&
            item.rarity === br.rarity &&
            item.compte === br.compte &&
            item.mutation === br.mutation &&
            JSON.stringify(item.traits) === JSON.stringify(br.traits)
        );
        
        if (existing) {
            existing.quantite = (existing.quantite || 1) + (br.quantite || 1);
        } else {
            aggregated.push({ ...br, quantite: br.quantite || 1 });
        }
    }
    
    return aggregated;
}

// ═══════════════════════════════════════════════════════════
// TRI
// ═══════════════════════════════════════════════════════════

/**
 * Trie les brainrots par rareté
 * @param {array} brainrotsList - Liste des brainrots
 * @param {object} rarityOrder - Ordre des raretés
 * @returns {array} - Brainrots triés
 */
function sortBrainrotsByRarity(brainrotsList, rarityOrder) {
    return [...brainrotsList].sort((a, b) => {
        const rarityA = rarityOrder[a.rarity] || 999;
        const rarityB = rarityOrder[b.rarity] || 999;
        
        if (rarityA !== rarityB) {
            return rarityA - rarityB;
        }
        
        return a.name.localeCompare(b.name);
    });
}

/**
 * Trie les brainrots par prix EUR
 * @param {array} brainrotsList - Liste des brainrots
 * @returns {array} - Brainrots triés
 */
function sortBrainrotsByPrice(brainrotsList) {
    return [...brainrotsList].sort((a, b) => {
        const priceA = parsePrice(a.priceEUR);
        const priceB = parsePrice(b.priceEUR);
        return priceB - priceA;
    });
}

/**
 * Trie les brainrots par income
 * @param {array} brainrotsList - Liste des brainrots
 * @returns {array} - Brainrots triés
 */
function sortBrainrotsByIncome(brainrotsList) {
    return [...brainrotsList].sort((a, b) => {
        const incomeA = parsePrice(a.incomeRate);
        const incomeB = parsePrice(b.incomeRate);
        return incomeB - incomeA;
    });
}

// ═══════════════════════════════════════════════════════════
// GROUPEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Groupe les brainrots par rareté
 * @param {array} brainrotsList - Liste des brainrots
 * @returns {object} - Brainrots groupés par rareté
 */
function groupByRarity(brainrotsList) {
    const grouped = {};
    brainrotsList.forEach(br => {
        if (!grouped[br.rarity]) {
            grouped[br.rarity] = [];
        }
        grouped[br.rarity].push(br);
    });
    return grouped;
}

/**
 * Groupe les brainrots par mutation
 * @param {array} brainrotsList - Liste des brainrots
 * @returns {object} - Brainrots groupés par mutation
 */
function groupByMutation(brainrotsList) {
    const grouped = {};
    brainrotsList.forEach(br => {
        const mutation = br.mutation || 'Sans mutation';
        if (!grouped[mutation]) {
            grouped[mutation] = [];
        }
        grouped[mutation].push(br);
    });
    return grouped;
}

/**
 * Groupe les brainrots par trait
 * @param {array} brainrotsList - Liste des brainrots
 * @returns {object} - Brainrots groupés par trait
 */
function groupByTrait(brainrotsList) {
    const grouped = {};
    brainrotsList.forEach(br => {
        const traits = br.traits || [];
        if (traits.length === 0) {
            if (!grouped['Sans trait']) {
                grouped['Sans trait'] = [];
            }
            grouped['Sans trait'].push(br);
        } else {
            traits.forEach(trait => {
                if (!grouped[trait]) {
                    grouped[trait] = [];
                }
                grouped[trait].push(br);
            });
        }
    });
    return grouped;
}

/**
 * Groupe les brainrots par compte
 * @param {array} brainrotsList - Liste des brainrots
 * @returns {object} - Brainrots groupés par compte
 */
function groupByCompte(brainrotsList) {
    const grouped = {};
    brainrotsList.forEach(br => {
        const compte = br.compte || 'Sans compte';
        if (!grouped[compte]) {
            grouped[compte] = [];
        }
        grouped[compte].push(br);
    });
    return grouped;
}

// ═══════════════════════════════════════════════════════════
// STATISTIQUES
// ═══════════════════════════════════════════════════════════

/**
 * Calcule les statistiques des brainrots
 * @param {array} brainrotsList - Liste des brainrots
 * @returns {object} - Statistiques
 */
function calculateStats(brainrotsList) {
    const aggregated = aggregateBrainrots(brainrotsList);
    
    const totalBrainrots = aggregated.reduce((sum, br) => sum + (br.quantite || 1), 0);
    const totalValue = brainrotsList.reduce((sum, br) => sum + parsePrice(br.priceEUR), 0);
    
    const byRarity = {};
    aggregated.forEach(br => {
        byRarity[br.rarity] = (byRarity[br.rarity] || 0) + (br.quantite || 1);
    });
    
    return {
        totalBrainrots,
        totalValue,
        uniqueTypes: aggregated.length,
        byRarity
    };
}

module.exports = {
    parsePrice,
    formatPrice,
    formatCryptoPrice,
    parseDuration,
    formatDuration,
    validateTraits,
    validateMutation,
    validateRarity,
    aggregateBrainrots,
    sortBrainrotsByRarity,
    sortBrainrotsByPrice,
    sortBrainrotsByIncome,
    groupByRarity,
    groupByMutation,
    groupByTrait,
    groupByCompte,
    calculateStats
};
