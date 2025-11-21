/**
 * Enumerations and Constants for BrainrotsMarket v3
 * Defines rarities, mutations, traits, and their associated properties
 */

/**
 * Rarity levels with associated colors for Discord embeds
 * @type {Object}
 */
const RARITIES = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary',
  MYTHICAL: 'Mythical',
  BRAINROT_GOD: 'Brainrot God',
  SECRET: 'Secret',
  OG: 'OG',
};

/**
 * Rarity colors for Discord embeds (hex format)
 * @type {Object}
 */
const RARITY_COLORS = {
  [RARITIES.COMMON]: '#808080',        // Gray
  [RARITIES.UNCOMMON]: '#00FF00',      // Green
  [RARITIES.RARE]: '#0000FF',          // Blue
  [RARITIES.EPIC]: '#9933FF',          // Purple
  [RARITIES.LEGENDARY]: '#FFFF00',     // Yellow
  [RARITIES.MYTHICAL]: '#FF6600',      // Orange
  [RARITIES.BRAINROT_GOD]: '#FF0000',  // Red
  [RARITIES.SECRET]: '#000000',        // Black
  [RARITIES.OG]: '#FFD700',            // Gold
};

/**
 * Mutation types for brainrots (mandatory)
 * @type {Object}
 */
const MUTATIONS = {
  DEFAULT: 'Default',
  GOLD: 'Gold',
  DIAMOND: 'Diamond',
  RAINBOW: 'Rainbow',
  BLOODROT: 'Bloodrot',
  CANDY: 'Candy',
  LAVA: 'Lava',
  GALAXY: 'Galaxy',
  YIN_YANG: 'Yin-Yang',
  RADIOACTIVE: 'Radioactive',
};

/**
 * Available traits for brainrots (optional)
 * Can be extended with custom traits
 * @type {Set}
 */
const AVAILABLE_TRAITS = new Set([
  'Flying',
  'Electric',
  'Fire',
  'Water',
  'Grass',
  'Ice',
  'Psychic',
  'Dragon',
  'Dark',
  'Fairy',
  'Steel',
  'Poison',
  'Ground',
  'Rock',
  'Bug',
  'Ghost',
  'Normal',
  'Fighting',
]);

/**
 * Validator for rarity values
 * @param {string} rarity - The rarity to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidRarity(rarity) {
  return Object.values(RARITIES).includes(rarity);
}

/**
 * Validator for mutation values
 * @param {string} mutation - The mutation to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidMutation(mutation) {
  return Object.values(MUTATIONS).includes(mutation);
}

/**
 * Validator for trait values
 * @param {string} trait - The trait to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidTrait(trait) {
  return AVAILABLE_TRAITS.has(trait);
}

/**
 * Add a custom trait to the available traits
 * @param {string} trait - The trait to add
 * @returns {boolean} True if added, false if already exists
 */
function addCustomTrait(trait) {
  if (!trait || typeof trait !== 'string') {
    throw new Error('Trait must be a non-empty string');
  }

  if (AVAILABLE_TRAITS.has(trait)) {
    return false;
  }

  AVAILABLE_TRAITS.add(trait);
  return true;
}

/**
 * Get all available traits
 * @returns {Array} Array of all available traits
 */
function getAllTraits() {
  return Array.from(AVAILABLE_TRAITS).sort();
}

/**
 * Get the color for a rarity
 * @param {string} rarity - The rarity to get the color for
 * @returns {string} The hex color code
 * @throws {Error} If rarity is invalid
 */
function getRarityColor(rarity) {
  if (!isValidRarity(rarity)) {
    throw new Error(`Invalid rarity: "${rarity}"`);
  }
  return RARITY_COLORS[rarity];
}

module.exports = {
  RARITIES,
  RARITY_COLORS,
  MUTATIONS,
  AVAILABLE_TRAITS,
  isValidRarity,
  isValidMutation,
  isValidTrait,
  addCustomTrait,
  getAllTraits,
  getRarityColor,
};
