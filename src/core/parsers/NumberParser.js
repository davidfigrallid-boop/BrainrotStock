/**
 * NumberParser - Converts number abbreviations to integers
 * Supports: k (thousand), M (million), B (billion), T (trillion), Qa (quadrillion), Qi (quintillion)
 */

class NumberParser {
  // Number unit conversions
  static NUMBER_UNITS = {
    k: 1000,
    thousand: 1000,
    M: 1000000,
    million: 1000000,
    B: 1000000000,
    billion: 1000000000,
    T: 1000000000000,
    trillion: 1000000000000,
    Qa: 1000000000000000,
    quadrillion: 1000000000000000,
    Qi: 1000000000000000000,
    quintillion: 1000000000000000000,
  };

  /**
   * Parse a number abbreviation string to an integer
   * @param {string} input - Number abbreviation (e.g., "1k", "2.5M", "1B")
   * @returns {number} The parsed number as an integer
   * @throws {Error} If input is invalid
   */
  static parse(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('Input must be a non-empty string');
    }

    const trimmed = input.trim();
    
    // Match pattern: number followed by optional unit
    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$/);
    
    if (!match) {
      throw new Error(`Invalid number format: "${input}". Expected format: number + optional unit (e.g., "1k", "2.5M")`);
    }

    const [, numberStr, unit] = match;
    const number = parseFloat(numberStr);

    if (number < 0) {
      throw new Error('Number value must be non-negative');
    }

    // If no unit provided, return the number as is
    if (!unit) {
      return Math.round(number);
    }

    if (!this.NUMBER_UNITS[unit]) {
      const validUnits = Object.keys(this.NUMBER_UNITS)
        .filter((u) => u.length <= 2)
        .join(', ');
      throw new Error(`Unknown number unit: "${unit}". Valid units: ${validUnits}`);
    }

    return Math.round(number * this.NUMBER_UNITS[unit]);
  }

  /**
   * Format a number to an abbreviated string
   * @param {number} num - The number to format
   * @returns {string} Formatted number (e.g., "1k", "2.5M")
   */
  static format(num) {
    if (typeof num !== 'number' || num < 0) {
      throw new Error('Input must be a non-negative number');
    }

    const units = [
      { name: 'Qi', value: 1000000000000000000 },
      { name: 'Qa', value: 1000000000000000 },
      { name: 'T', value: 1000000000000 },
      { name: 'B', value: 1000000000 },
      { name: 'M', value: 1000000 },
      { name: 'k', value: 1000 },
    ];

    for (const unit of units) {
      if (num >= unit.value) {
        const value = Math.round((num / unit.value) * 100) / 100;
        return `${value}${unit.name}`;
      }
    }

    return num.toString();
  }
}

module.exports = NumberParser;
