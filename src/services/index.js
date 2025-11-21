/**
 * Index centralisé des services
 * Exporte tous les services pour faciliter les imports
 */

const brainrotService = require('./brainrotService');
const giveawayService = require('./giveawayService');
const cryptoService = require('./cryptoService');

module.exports = {
  brainrotService,
  giveawayService,
  cryptoService
};
