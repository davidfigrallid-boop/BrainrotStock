/**
 * Index centralisé des événements Discord
 * Exporte tous les événements pour faciliter les imports
 */

const ready = require('./ready');
const interactionCreate = require('./interactionCreate');

module.exports = {
  ready,
  interactionCreate
};
