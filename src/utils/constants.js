/**
 * Constantes globales du projet
 */

// ═══════════════════════════════════════════════════════════
// RARETÉS
// ═══════════════════════════════════════════════════════════

const RARITY_ORDER = {
    'Common': 1,
    'Rare': 2,
    'Epic': 3,
    'Legendary': 4,
    'Mythic': 5,
    'Brainrot God': 6,
    'Secret': 7,
    'OG': 8
};

const RARITY_COLORS = {
    'Common': '⬜',
    'Rare': '🟦',
    'Epic': '🟪',
    'Legendary': '🟧',
    'Mythic': '🟥',
    'Brainrot God': '🌈',
    'Secret': '⬛',
    'OG': '⭐'
};

const RARITY_HEX_COLORS = {
    'Common': 0xCCCCCC,
    'Rare': 0x3466F6,
    'Epic': 0xA716E7,
    'Legendary': 0xECA741,
    'Mythic': 0xFC6565,
    'Brainrot God': 0xFFE600,
    'Secret': 0x00FFFF,
    'OG': 0xFF1493
};

// ═══════════════════════════════════════════════════════════
// MUTATIONS (OBLIGATOIRES)
// ═══════════════════════════════════════════════════════════

const MUTATIONS = [
    'Default', 'Gold', 'Diamond', 'Rainbow', 'Lava',
    'Bloodrot', 'Celestial', 'Candy', 'Galaxy', 'Yin Yang'
];

// ═══════════════════════════════════════════════════════════
// TRAITS (FACULTATIFS)
// ═══════════════════════════════════════════════════════════

const TRAITS = [
    'Bloodmoon', 'Taco', 'Galactic', 'Explosive', 'Bubblegum',
    'Zombie', 'Glitched', 'Claws', 'Fireworks', 'Nyan',
    'Fire', 'Rain', 'Snowy', 'Cometstruck', 'Disco',
    'Water', 'TenB', 'Matteo Hat', 'Brazil Flag', 'Sleep',
    'UFO', 'Mygame43', 'Spider', 'Strawberry', 'Extinct',
    'Paint', 'Sombrero', 'Tie', 'Wizard Hat', 'Indonesia Flag',
    'Meowl', 'Pumpkin', 'R.I.P.'
];

// ═══════════════════════════════════════════════════════════
// CRYPTOS SUPPORTÉES
// ═══════════════════════════════════════════════════════════

const SUPPORTED_CRYPTOS = {
    'BTC': { gecko: 'bitcoin', cap: 'bitcoin' },
    'ETH': { gecko: 'ethereum', cap: 'ethereum' },
    'SOL': { gecko: 'solana', cap: 'solana' },
    'USDT': { gecko: 'tether', cap: 'tether' },
    'LTC': { gecko: 'litecoin', cap: 'litecoin' }
};

// ═══════════════════════════════════════════════════════════
// PRIX ABRÉGÉS
// ═══════════════════════════════════════════════════════════

const PRICE_ABBREVIATIONS = {
    k: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12,
    Qa: 1e15
};

// ═══════════════════════════════════════════════════════════
// DURÉES GIVEAWAY
// ═══════════════════════════════════════════════════════════

const DURATION_MULTIPLIERS = {
    'min': 1,
    'h': 60,
    'j': 60 * 24,
    'sem': 60 * 24 * 7,
    'm': 60 * 24 * 30,
    'an': 60 * 24 * 365
};

// ═══════════════════════════════════════════════════════════
// FICHIERS
// ═══════════════════════════════════════════════════════════

const FILES = {
    BRAINROTS: 'brainrots.json',
    CONFIG: 'config.json',
    GIVEAWAYS: 'giveaways.json',
    BANNER: 'Banner.png',
    ROBUX: 'Robux.jpg'
};

// ═══════════════════════════════════════════════════════════
// INTERVALLES
// ═══════════════════════════════════════════════════════════

const INTERVALS = {
    REFRESH: 5 * 60 * 1000,        // 5 minutes
    GIVEAWAY_CHECK: 10 * 1000,     // 10 secondes
    CACHE_DURATION: 5 * 60 * 1000  // 5 minutes
};

// ═══════════════════════════════════════════════════════════
// COULEURS EMBEDS
// ═══════════════════════════════════════════════════════════

const EMBED_COLORS = {
    PRIMARY: 0xFFE600,      // Jaune
    SUCCESS: 0x00FF00,      // Vert
    ERROR: 0xFF0000,        // Rouge
    INFO: 0x00D9FF,         // Cyan
    WARNING: 0xFFA500,      // Orange
    GOLD: 0xFFD700          // Or
};

module.exports = {
    RARITY_ORDER,
    RARITY_COLORS,
    RARITY_HEX_COLORS,
    MUTATIONS,
    TRAITS,
    SUPPORTED_CRYPTOS,
    PRICE_ABBREVIATIONS,
    DURATION_MULTIPLIERS,
    FILES,
    INTERVALS,
    EMBED_COLORS
};
