// Utilitaire pour abréviations prix
const PRICE_ABBREVIATIONS = {
  k: 1e3, M: 1e6, B: 1e9, T: 1e12, Qa: 1e15
};

function parsePrice(str) {
  const match = /^([\d.]+)\s*([a-zA-Z]+)?$/.exec(str.trim());
  if (!match) return NaN;
  const [, num, suf] = match;
  return parseFloat(num) * (PRICE_ABBREVIATIONS[suf] || 1);
}

function formatPrice(num) {
  if (num >= 1e15) return (num / 1e15).toFixed(2) + "Qa";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9)  return (num / 1e9).toFixed(2)  + "B";
  if (num >= 1e6)  return (num / 1e6).toFixed(2)  + "M";
  if (num >= 1e3)  return (num / 1e3).toFixed(2)  + "k";
  return num.toString();
}

// Définition du brainrot
class Brainrot {
  constructor({
    name,
    mutations = [],           // array de string
    rarete,                   // string ex: "commun"
    compte = null,            // string ou null
    valeur = 1,               // nombre agrégé
    incomePrice,              // string du type "1M", "500k" etc
    crypto
  }) {
    this.name = name;
    this.mutations = Array.isArray(mutations) ? mutations : [mutations];
    this.rarete = rarete;
    this.compte = compte;
    this.valeur = valeur;
    this.incomePrice = incomePrice;
    this.crypto = crypto;
  }
  // Utilitaire pour l’affichage: name x valeur et mutations
  displayName() {
    return `${this.name} x${this.valeur} [${this.mutations.join(", ")}]`;
  }
  // Affichage du prix formaté
  displayIncomePrice() {
    return formatPrice(parsePrice(this.incomePrice));
  }
}
module.exports = { Brainrot, parsePrice, formatPrice };