/**
 * BrainrotFormatter - Formats brainrot data for display
 * Handles price formatting, income rate formatting, and rarity colors
 */

const NumberParser = require('../parsers/NumberParser');
const { getRarityColor, isValidRarity } = require('../enums');

class BrainrotFormatter {
  /**
   * Format a price with abbreviations
   * @param {number} price - The price in EUR
   * @returns {string} Formatted price (e.g., "1M EUR", "500k EUR")
   */
  static formatPrice(price) {
    if (typeof price !== 'number' || price < 0) {
      throw new Error('Price must be a non-negative number');
    }

    const formatted = NumberParser.format(price);
    return `${formatted} EUR`;
  }

  /**
   * Format income rate (money per second)
   * @param {number} incomeRate - Income rate in currency per second
   * @returns {string} Formatted income rate (e.g., "100/s", "1.5k/s")
   */
  static formatIncomeRate(incomeRate) {
    if (typeof incomeRate !== 'number' || incomeRate < 0) {
      throw new Error('Income rate must be a non-negative number');
    }

    const formatted = NumberParser.format(incomeRate);
    return `${formatted}/s`;
  }

  /**
   * Get the color for a rarity
   * @param {string} rarity - The rarity level
   * @returns {string} Hex color code (e.g., "#FFD700")
   * @throws {Error} If rarity is invalid
   */
  static getRarityColor(rarity) {
    if (!isValidRarity(rarity)) {
      throw new Error(`Invalid rarity: "${rarity}"`);
    }
    return getRarityColor(rarity);
  }

  /**
   * Format a complete brainrot for display
   * @param {Object} brainrot - The brainrot object
   * @returns {string} Formatted brainrot string
   */
  static formatBrainrot(brainrot) {
    if (!brainrot || typeof brainrot !== 'object') {
      throw new Error('Brainrot must be a valid object');
    }

    const { name, rarity, mutation, price, incomeRate, traits } = brainrot;

    if (!name) {
      throw new Error('Brainrot must have a name');
    }

    const formattedPrice = this.formatPrice(price || 0);
    const formattedIncome = this.formatIncomeRate(incomeRate || 0);
    const traitsStr = traits && traits.length > 0 ? ` [${traits.join(', ')}]` : '';

    return `**${name}** - ${formattedPrice} - ${formattedIncome} - ${mutation || 'Default'}${traitsStr}`;
  }
}

module.exports = BrainrotFormatter;
