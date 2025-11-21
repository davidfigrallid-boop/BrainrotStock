/**
 * TimeParser - Converts time abbreviations to milliseconds
 * Supports: s (seconds), min (minutes), h (hours), j (days), sem (weeks), m (months), an (years)
 */

class TimeParser {
  // Time unit conversions to milliseconds
  static TIME_UNITS = {
    s: 1000,
    sec: 1000,
    second: 1000,
    seconds: 1000,
    min: 60 * 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    h: 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    j: 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    sem: 7 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    m: 30 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
    an: 365 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
    years: 365 * 24 * 60 * 60 * 1000,
  };

  /**
   * Parse a time abbreviation string to milliseconds
   * @param {string} input - Time abbreviation (e.g., "1h", "30min", "2j")
   * @returns {number} Time in milliseconds
   * @throws {Error} If input is invalid
   */
  static parse(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('Input must be a non-empty string');
    }

    const trimmed = input.trim().toLowerCase();
    
    // Match pattern: number followed by unit
    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/);
    
    if (!match) {
      throw new Error(`Invalid time format: "${input}". Expected format: number + unit (e.g., "1h", "30min")`);
    }

    const [, numberStr, unit] = match;
    const number = parseFloat(numberStr);

    if (number <= 0) {
      throw new Error('Time value must be greater than 0');
    }

    if (!this.TIME_UNITS[unit]) {
      const validUnits = Object.keys(this.TIME_UNITS)
        .filter((u, i, arr) => arr.indexOf(u) === i)
        .slice(0, 10)
        .join(', ');
      throw new Error(`Unknown time unit: "${unit}". Valid units: ${validUnits}, ...`);
    }

    return Math.round(number * this.TIME_UNITS[unit]);
  }

  /**
   * Format milliseconds to a human-readable time abbreviation
   * @param {number} ms - Time in milliseconds
   * @returns {string} Formatted time (e.g., "1h", "30min")
   */
  static format(ms) {
    if (typeof ms !== 'number' || ms < 0) {
      throw new Error('Input must be a non-negative number');
    }

    const units = [
      { name: 'an', ms: 365 * 24 * 60 * 60 * 1000 },
      { name: 'm', ms: 30 * 24 * 60 * 60 * 1000 },
      { name: 'sem', ms: 7 * 24 * 60 * 60 * 1000 },
      { name: 'j', ms: 24 * 60 * 60 * 1000 },
      { name: 'h', ms: 60 * 60 * 1000 },
      { name: 'min', ms: 60 * 1000 },
      { name: 's', ms: 1000 },
    ];

    for (const unit of units) {
      if (ms >= unit.ms) {
        const value = Math.round((ms / unit.ms) * 100) / 100;
        return `${value}${unit.name}`;
      }
    }

    return '0s';
  }
}

module.exports = TimeParser;
