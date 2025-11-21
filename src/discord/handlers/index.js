/**
 * Handlers Index - Export centralisé de tous les handlers Discord
 * Facilite l'import des handlers dans d'autres modules
 */

const commandHandler = require('./commandHandler');
const buttonHandler = require('./buttonHandler');

module.exports = {
  commandHandler,
  buttonHandler
};
