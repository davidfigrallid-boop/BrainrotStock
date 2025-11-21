/**
 * Module Utils - BrainrotsMarket v3
 * Fonctions utilitaires et helpers
 */

/**
 * Classe pour les utilitaires
 */
class Utils {
  /**
   * Formate une date
   */
  static formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formate un nombre avec séparateurs
   */
  static formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return '-';
    return parseFloat(num).toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Formate une devise
   */
  static formatCurrency(amount, currency = 'EUR') {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Valide une adresse email
   */
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Valide un nombre
   */
  static isValidNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  /**
   * Génère un ID unique
   */
  static generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Délai (pour les promesses)
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Copie du texte dans le presse-papiers
   */
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Erreur copie presse-papiers:', error);
      return false;
    }
  }

  /**
   * Récupère un paramètre d'URL
   */
  static getUrlParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  }

  /**
   * Définit un paramètre d'URL
   */
  static setUrlParam(param, value) {
    const params = new URLSearchParams(window.location.search);
    params.set(param, value);
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  }

  /**
   * Stocke une donnée en localStorage
   */
  static setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Erreur stockage:', error);
      return false;
    }
  }

  /**
   * Récupère une donnée du localStorage
   */
  static getStorage(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Erreur récupération stockage:', error);
      return defaultValue;
    }
  }

  /**
   * Supprime une donnée du localStorage
   */
  static removeStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erreur suppression stockage:', error);
      return false;
    }
  }

  /**
   * Vide le localStorage
   */
  static clearStorage() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erreur vidage stockage:', error);
      return false;
    }
  }

  /**
   * Valide un formulaire
   */
  static validateFormData(data, rules) {
    const errors = {};

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      // Vérifier si requis
      if (rule.required && (!value || value === '')) {
        errors[field] = `${field} est requis`;
        continue;
      }

      // Vérifier le type
      if (rule.type && value) {
        if (rule.type === 'email' && !this.isValidEmail(value)) {
          errors[field] = `${field} n'est pas un email valide`;
        } else if (rule.type === 'number' && !this.isValidNumber(value)) {
          errors[field] = `${field} doit être un nombre`;
        }
      }

      // Vérifier la longueur min
      if (rule.minLength && value && value.length < rule.minLength) {
        errors[field] = `${field} doit avoir au moins ${rule.minLength} caractères`;
      }

      // Vérifier la longueur max
      if (rule.maxLength && value && value.length > rule.maxLength) {
        errors[field] = `${field} ne doit pas dépasser ${rule.maxLength} caractères`;
      }

      // Vérifier la valeur min
      if (rule.min !== undefined && value && parseFloat(value) < rule.min) {
        errors[field] = `${field} doit être au moins ${rule.min}`;
      }

      // Vérifier la valeur max
      if (rule.max !== undefined && value && parseFloat(value) > rule.max) {
        errors[field] = `${field} ne doit pas dépasser ${rule.max}`;
      }
    }

    return Object.keys(errors).length === 0 ? null : errors;
  }

  /**
   * Trie un tableau d'objets
   */
  static sortArray(array, key, ascending = true) {
    return [...array].sort((a, b) => {
      if (a[key] < b[key]) return ascending ? -1 : 1;
      if (a[key] > b[key]) return ascending ? 1 : -1;
      return 0;
    });
  }

  /**
   * Filtre un tableau d'objets
   */
  static filterArray(array, predicate) {
    return array.filter(predicate);
  }

  /**
   * Groupe un tableau d'objets par clé
   */
  static groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {});
  }

  /**
   * Déduplique un tableau
   */
  static unique(array, key = null) {
    if (!key) {
      return [...new Set(array)];
    }
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  /**
   * Fusionne deux objets
   */
  static merge(obj1, obj2) {
    return { ...obj1, ...obj2 };
  }

  /**
   * Clone un objet profondément
   */
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Vérifie si un objet est vide
   */
  static isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }

  /**
   * Obtient les clés d'un objet
   */
  static keys(obj) {
    return Object.keys(obj);
  }

  /**
   * Obtient les valeurs d'un objet
   */
  static values(obj) {
    return Object.values(obj);
  }

  /**
   * Obtient les entrées d'un objet
   */
  static entries(obj) {
    return Object.entries(obj);
  }

  /**
   * Crée un objet à partir d'entrées
   */
  static fromEntries(entries) {
    return Object.fromEntries(entries);
  }

  /**
   * Vérifie si une clé existe dans un objet
   */
  static hasKey(obj, key) {
    return key in obj;
  }

  /**
   * Supprime une clé d'un objet
   */
  static deleteKey(obj, key) {
    const newObj = { ...obj };
    delete newObj[key];
    return newObj;
  }

  /**
   * Renomme une clé d'un objet
   */
  static renameKey(obj, oldKey, newKey) {
    const newObj = { ...obj };
    newObj[newKey] = newObj[oldKey];
    delete newObj[oldKey];
    return newObj;
  }

  /**
   * Sélectionne certaines clés d'un objet
   */
  static pick(obj, keys) {
    return keys.reduce((result, key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  }

  /**
   * Omet certaines clés d'un objet
   */
  static omit(obj, keys) {
    return Object.keys(obj)
      .filter(key => !keys.includes(key))
      .reduce((result, key) => {
        result[key] = obj[key];
        return result;
      }, {});
  }

  /**
   * Convertit un objet en chaîne de requête
   */
  static toQueryString(obj) {
    return Object.entries(obj)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  /**
   * Convertit une chaîne de requête en objet
   */
  static fromQueryString(queryString) {
    const params = new URLSearchParams(queryString);
    const obj = {};
    for (const [key, value] of params) {
      obj[key] = value;
    }
    return obj;
  }

  /**
   * Vérifie si le navigateur est en ligne
   */
  static isOnline() {
    return navigator.onLine;
  }

  /**
   * Obtient l'agent utilisateur
   */
  static getUserAgent() {
    return navigator.userAgent;
  }

  /**
   * Vérifie si c'est un mobile
   */
  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Obtient la langue du navigateur
   */
  static getLanguage() {
    return navigator.language || navigator.userLanguage;
  }

  /**
   * Obtient le fuseau horaire
   */
  static getTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Obtient l'heure actuelle formatée
   */
  static getCurrentTime() {
    return new Date().toLocaleTimeString('fr-FR');
  }

  /**
   * Obtient la date actuelle formatée
   */
  static getCurrentDate() {
    return new Date().toLocaleDateString('fr-FR');
  }

  /**
   * Calcule la différence entre deux dates
   */
  static dateDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Ajoute des jours à une date
   */
  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Obtient le début de la journée
   */
  static getStartOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Obtient la fin de la journée
   */
  static getEndOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }
}

// Exporter la classe
