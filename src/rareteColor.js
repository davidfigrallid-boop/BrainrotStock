// Web: associer une class CSS à chaque rareté
const RARETE_COLORS = {
  commun: "#cccccc",
  rare: "#3466f6",
  epic: "#a716e7",
  mythique: "#eca741",
  divin: "#fafc65",
};

// Pour affichage Discord Terminal: Chalk ou custom codes Discord
function colorText(text, rarete, isWeb = false) {
  if (isWeb) {
    // Example: return `<span style="color:${RARETE_COLORS[rarete] || 'black'}">${text}</span>`;
    return `<span class="rarete-${rarete}">${text}</span>`;
  }
  // Discord embeds : couleur dans champ
  return `**${text}**`;
}

module.exports = { RARETE_COLORS, colorText };