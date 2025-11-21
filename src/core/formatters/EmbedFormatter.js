/**
 * EmbedFormatter - Creates formatted Discord embeds for different categories
 * Handles embed creation for brainrot listings by rarity, mutation, traits, price, and revenue
 */

const BrainrotFormatter = require('./BrainrotFormatter');
const { getRarityColor, isValidRarity } = require('../enums');

class EmbedFormatter {
  /**
   * Create a base embed with common properties
   * @param {string} title - Embed title
   * @param {string} description - Embed description
   * @param {string} color - Hex color code
   * @returns {Object} Discord embed object
   */
  static createBaseEmbed(title, description, color = '#808080') {
    return {
      title,
      description,
      color: this.hexToDecimal(color),
      timestamp: new Date().toISOString(),
      footer: {
        text: 'BrainrotsMarket v3',
      },
    };
  }

  /**
   * Convert hex color to decimal for Discord
   * @param {string} hex - Hex color code (e.g., "#FFD700")
   * @returns {number} Decimal color value
   */
  static hexToDecimal(hex) {
    const cleanHex = hex.replace('#', '');
    return parseInt(cleanHex, 16);
  }

  /**
   * Create an embed for brainrots grouped by rarity
   * @param {Array} brainrots - Array of brainrot objects
   * @returns {Object} Discord embed object
   */
  static createRarityEmbed(brainrots) {
    if (!Array.isArray(brainrots)) {
      throw new Error('Brainrots must be an array');
    }

    const embed = this.createBaseEmbed(
      '🧠 Brainrots Shop - Par Rareté',
      'Brainrots groupés par niveau de rareté',
      '#808080'
    );

    // Group brainrots by rarity
    const grouped = this.groupByRarity(brainrots);
    const fields = [];

    // Define rarity order for consistent display
    const rarityOrder = ['OG', 'Secret', 'Brainrot God', 'Mythical', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

    for (const rarity of rarityOrder) {
      const items = grouped[rarity];
      if (!items || items.length === 0) continue;

      // Sort by price descending
      const sorted = [...items].sort((a, b) => (b.priceEUR || 0) - (a.priceEUR || 0));
      const emoji = this.getRarityEmoji(rarity);
      const value = sorted
        .map((b) => `• ${BrainrotFormatter.formatBrainrot(b)}`)
        .join('\n');

      fields.push({
        name: `${emoji} ${rarity} (${items.length})`,
        value: value || 'Aucun brainrot',
        inline: false,
      });
    }

    embed.fields = fields;
    return embed;
  }

  /**
   * Create an embed for brainrots grouped by mutation
   * @param {Array} brainrots - Array of brainrot objects
   * @returns {Object} Discord embed object
   */
  static createMutationEmbed(brainrots) {
    if (!Array.isArray(brainrots)) {
      throw new Error('Brainrots must be an array');
    }

    const embed = this.createBaseEmbed(
      '🧠 Brainrots Shop - Par Mutation',
      'Brainrots groupés par type de mutation',
      '#808080'
    );

    // Group brainrots by mutation
    const grouped = this.groupByMutation(brainrots);
    const fields = [];

    // Define mutation order for consistent display
    const mutationOrder = ['Radioactive', 'Yin-Yang', 'Galaxy', 'Lava', 'Candy', 'Bloodrot', 'Rainbow', 'Diamond', 'Gold', 'Default'];

    for (const mutation of mutationOrder) {
      const items = grouped[mutation];
      if (!items || items.length === 0) continue;

      // Sort by price descending
      const sorted = [...items].sort((a, b) => (b.priceEUR || 0) - (a.priceEUR || 0));
      const emoji = this.getMutationEmoji(mutation);
      const value = sorted
        .map((b) => `• ${BrainrotFormatter.formatBrainrot(b)}`)
        .join('\n');

      fields.push({
        name: `${emoji} ${mutation} (${items.length})`,
        value: value || 'Aucun brainrot',
        inline: false,
      });
    }

    embed.fields = fields;
    return embed;
  }

  /**
   * Create an embed for brainrots grouped by traits
   * @param {Array} brainrots - Array of brainrot objects
   * @returns {Object} Discord embed object
   */
  static createTraitsEmbed(brainrots) {
    if (!Array.isArray(brainrots)) {
      throw new Error('Brainrots must be an array');
    }

    const embed = this.createBaseEmbed(
      '🧠 Brainrots Shop - Par Traits',
      'Brainrots groupés par traits',
      '#808080'
    );

    // Group brainrots by traits
    const grouped = this.groupByTraits(brainrots);
    const fields = [];

    // Sort traits alphabetically for consistent display
    const sortedTraits = Object.keys(grouped).sort();

    for (const trait of sortedTraits) {
      const items = grouped[trait];
      if (!items || items.length === 0) continue;

      // Sort by price descending
      const sorted = [...items].sort((a, b) => (b.priceEUR || 0) - (a.priceEUR || 0));
      const emoji = this.getTraitEmoji(trait);
      const value = sorted
        .map((b) => `• ${BrainrotFormatter.formatBrainrot(b)}`)
        .join('\n');

      fields.push({
        name: `${emoji} ${trait} (${items.length})`,
        value: value || 'Aucun brainrot',
        inline: false,
      });
    }

    embed.fields = fields;
    return embed;
  }

  /**
   * Create an embed for brainrots sorted by price
   * @param {Array} brainrots - Array of brainrot objects
   * @returns {Object} Discord embed object
   */
  static createPriceEmbed(brainrots) {
    if (!Array.isArray(brainrots)) {
      throw new Error('Brainrots must be an array');
    }

    const embed = this.createBaseEmbed(
      '🧠 Brainrots Shop - Par Prix',
      'Brainrots triés par prix décroissant',
      '#808080'
    );

    // Sort by price descending
    const sorted = [...brainrots].sort((a, b) => (b.priceEUR || 0) - (a.priceEUR || 0));

    const value = sorted
      .map((b, i) => `${i + 1}. ${BrainrotFormatter.formatBrainrot(b)}`)
      .join('\n');

    embed.fields = [
      {
        name: 'Classement par Prix',
        value: value || 'Aucun brainrot',
        inline: false,
      },
    ];

    return embed;
  }

  /**
   * Create an embed for brainrots sorted by revenue (income rate)
   * @param {Array} brainrots - Array of brainrot objects
   * @returns {Object} Discord embed object
   */
  static createRevenueEmbed(brainrots) {
    if (!Array.isArray(brainrots)) {
      throw new Error('Brainrots must be an array');
    }

    const embed = this.createBaseEmbed(
      '🧠 Brainrots Shop - Par Revenue',
      'Brainrots triés par revenue décroissant',
      '#808080'
    );

    // Sort by income rate descending
    const sorted = [...brainrots].sort((a, b) => (b.incomeRate || 0) - (a.incomeRate || 0));

    const value = sorted
      .map((b, i) => `${i + 1}. ${BrainrotFormatter.formatBrainrot(b)}`)
      .join('\n');

    embed.fields = [
      {
        name: 'Classement par Revenue',
        value: value || 'Aucun brainrot',
        inline: false,
      },
    ];

    return embed;
  }

  /**
   * Create an embed for brainrots sorted alphabetically
   * @param {Array} brainrots - Array of brainrot objects
   * @returns {Object} Discord embed object
   */
  static createAlphabeticalEmbed(brainrots) {
    if (!Array.isArray(brainrots)) {
      throw new Error('Brainrots must be an array');
    }

    const embed = this.createBaseEmbed(
      '🧠 Brainrots Shop - Alphabétique',
      'Brainrots triés alphabétiquement',
      '#808080'
    );

    // Sort alphabetically
    const sorted = [...brainrots].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const value = sorted
      .map((b, i) => `${i + 1}. ${BrainrotFormatter.formatBrainrot(b)}`)
      .join('\n');

    embed.fields = [
      {
        name: 'Classement Alphabétique',
        value: value || 'Aucun brainrot',
        inline: false,
      },
    ];

    return embed;
  }

  /**
   * Group brainrots by rarity
   * @param {Array} brainrots - Array of brainrot objects
   * @returns {Object} Grouped brainrots
   */
  static groupByRarity(brainrots) {
    return brainrots.reduce((acc, brainrot) => {
      const rarity = brainrot.rarity || 'Common';
      if (!acc[rarity]) {
        acc[rarity] = [];
      }
      acc[rarity].push(brainrot);
      return acc;
    }, {});
  }

  /**
   * Group brainrots by mutation
   * @param {Array} brainrots - Array of brainrot objects
   * @returns {Object} Grouped brainrots
   */
  static groupByMutation(brainrots) {
    return brainrots.reduce((acc, brainrot) => {
      const mutation = brainrot.mutation || 'Default';
      if (!acc[mutation]) {
        acc[mutation] = [];
      }
      acc[mutation].push(brainrot);
      return acc;
    }, {});
  }

  /**
   * Group brainrots by traits
   * @param {Array} brainrots - Array of brainrot objects
   * @returns {Object} Grouped brainrots by trait
   */
  static groupByTraits(brainrots) {
    const grouped = {};

    brainrots.forEach((brainrot) => {
      const traits = brainrot.traits || [];
      if (traits.length === 0) {
        if (!grouped['No Traits']) {
          grouped['No Traits'] = [];
        }
        grouped['No Traits'].push(brainrot);
      } else {
        traits.forEach((trait) => {
          if (!grouped[trait]) {
            grouped[trait] = [];
          }
          grouped[trait].push(brainrot);
        });
      }
    });

    return grouped;
  }

  /**
   * Get emoji for rarity
   * @param {string} rarity - The rarity level
   * @returns {string} Emoji representation
   */
  static getRarityEmoji(rarity) {
    const emojiMap = {
      'Common': '⚪',
      'Uncommon': '🟢',
      'Rare': '🔵',
      'Epic': '🟣',
      'Legendary': '🟡',
      'Mythical': '🟠',
      'Brainrot God': '🔴',
      'Secret': '⬛',
      'OG': '🟨',
    };
    return emojiMap[rarity] || '❓';
  }

  /**
   * Get emoji for mutation
   * @param {string} mutation - The mutation type
   * @returns {string} Emoji representation
   */
  static getMutationEmoji(mutation) {
    const emojiMap = {
      'Default': '⚪',
      'Gold': '🟨',
      'Diamond': '💎',
      'Rainbow': '🌈',
      'Bloodrot': '🩸',
      'Candy': '🍬',
      'Lava': '🌋',
      'Galaxy': '🌌',
      'Yin-Yang': '☯️',
      'Radioactive': '☢️',
    };
    return emojiMap[mutation] || '❓';
  }

  /**
   * Get emoji for trait
   * @param {string} trait - The trait name
   * @returns {string} Emoji representation
   */
  static getTraitEmoji(trait) {
    const emojiMap = {
      'Flying': '🦅',
      'Electric': '⚡',
      'Fire': '🔥',
      'Water': '💧',
      'Grass': '🌿',
      'Ice': '❄️',
      'Psychic': '🧠',
      'Dragon': '🐉',
      'Dark': '🌑',
      'Fairy': '✨',
      'Steel': '⚙️',
      'Poison': '☠️',
      'Ground': '🪨',
      'Rock': '🪨',
      'Bug': '🐛',
      'Ghost': '👻',
      'Normal': '⭕',
      'Fighting': '👊',
      'No Traits': '❌',
    };
    return emojiMap[trait] || '❓';
  }
}

module.exports = EmbedFormatter;
