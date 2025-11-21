/**
 * Module API - BrainrotsMarket v3
 * Gère tous les appels API REST
 */

const API_BASE = '/api';

/**
 * Classe pour gérer les appels API
 */
class APIClient {
  constructor() {
    this.baseURL = API_BASE;
    this.password = localStorage.getItem('password') || '';
  }

  /**
   * Effectue une requête HTTP
   */
  async request(endpoint, method = 'GET', data = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Ajouter l'authentification
      if (this.password) {
        options.headers['Authorization'] = `Bearer ${this.password}`;
      }

      if (data) {
        options.body = JSON.stringify(data);
      }

      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, options);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Non authentifié - Session expirée');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erreur API [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Définit le mot de passe d'authentification
   */
  setPassword(password) {
    this.password = password;
    localStorage.setItem('password', password);
  }

  /**
   * Récupère le mot de passe stocké
   */
  getPassword() {
    return this.password;
  }

  /**
   * Efface l'authentification
   */
  clearAuth() {
    this.password = '';
    localStorage.removeItem('password');
  }

  // ===== BRAINROTS =====

  /**
   * Récupère tous les brainrots d'un serveur
   */
  async getBrainrots(serverId) {
    return this.request(`/brainrots/${serverId}`);
  }

  /**
   * Récupère un brainrot spécifique
   */
  async getBrainrot(serverId, id) {
    return this.request(`/brainrots/${serverId}/${id}`);
  }

  /**
   * Crée un nouveau brainrot
   */
  async createBrainrot(serverId, data) {
    return this.request(`/brainrots/${serverId}`, 'POST', data);
  }

  /**
   * Modifie un brainrot
   */
  async updateBrainrot(serverId, id, data) {
    return this.request(`/brainrots/${serverId}/${id}`, 'PUT', data);
  }

  /**
   * Supprime un brainrot
   */
  async deleteBrainrot(serverId, id) {
    return this.request(`/brainrots/${serverId}/${id}`, 'DELETE');
  }

  // ===== GIVEAWAYS =====

  /**
   * Récupère tous les giveaways d'un serveur
   */
  async getGiveaways(serverId) {
    return this.request(`/giveaways/${serverId}`);
  }

  /**
   * Récupère un giveaway spécifique
   */
  async getGiveaway(serverId, id) {
    return this.request(`/giveaways/${serverId}/${id}`);
  }

  /**
   * Crée un nouveau giveaway
   */
  async createGiveaway(serverId, data) {
    return this.request(`/giveaways/${serverId}`, 'POST', data);
  }

  /**
   * Modifie un giveaway
   */
  async updateGiveaway(serverId, id, data) {
    return this.request(`/giveaways/${serverId}/${id}`, 'PUT', data);
  }

  /**
   * Supprime un giveaway
   */
  async deleteGiveaway(serverId, id) {
    return this.request(`/giveaways/${serverId}/${id}`, 'DELETE');
  }

  // ===== CRYPTO =====

  /**
   * Récupère tous les prix crypto
   */
  async getCryptoPrices() {
    return this.request('/crypto/prices');
  }

  /**
   * Convertit entre deux devises
   */
  async convertCrypto(amount, from, to) {
    return this.request('/crypto/convert', 'POST', { amount, from, to });
  }

  // ===== STATS =====

  /**
   * Récupère les statistiques d'un serveur
   */
  async getStats(serverId) {
    return this.request(`/stats/${serverId}`);
  }

  /**
   * Récupère l'état de santé du système
   */
  async getHealth() {
    return this.request('/health');
  }
}

// Exporter une instance unique
const api = new APIClient();
