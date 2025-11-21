/**
 * Module UI - BrainrotsMarket v3
 * Gère la manipulation du DOM et l'affichage
 */

/**
 * Classe pour gérer l'interface utilisateur
 */
class UIManager {
  constructor() {
    this.modals = {};
    this.notifications = [];
  }

  /**
   * Affiche une notification
   */
  showNotification(message, type = 'info', duration = 3000) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '400px';
    notification.style.animation = 'fadeIn 0.3s ease';

    document.body.appendChild(notification);
    this.notifications.push(notification);

    // Supprimer après la durée
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        notification.remove();
        this.notifications = this.notifications.filter(n => n !== notification);
      }, 300);
    }, duration);
  }

  /**
   * Affiche un modal
   */
  showModal(title, content, buttons = []) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close" onclick="ui.closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          ${buttons.map(btn => `
            <button class="btn btn-${btn.type || 'secondary'}" onclick="${btn.onclick}">
              ${btn.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.currentModal = modal;
    return modal;
  }

  /**
   * Ferme le modal actuel
   */
  closeModal() {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
  }

  /**
   * Affiche un formulaire de confirmation
   */
  confirm(message, onConfirm, onCancel) {
    this.showModal('Confirmation', `<p>${message}</p>`, [
      {
        label: 'Annuler',
        type: 'secondary',
        onclick: `ui.closeModal(); ${onCancel ? onCancel : ''}`
      },
      {
        label: 'Confirmer',
        type: 'primary',
        onclick: `ui.closeModal(); ${onConfirm}`
      }
    ]);
  }

  /**
   * Affiche un spinner de chargement
   */
  showLoading(element) {
    element.innerHTML = '<div class="spinner"></div>';
  }

  /**
   * Affiche un message d'erreur
   */
  showError(element, message) {
    element.innerHTML = `<div class="alert alert-danger">${message}</div>`;
  }

  /**
   * Affiche un message de succès
   */
  showSuccess(element, message) {
    element.innerHTML = `<div class="alert alert-success">${message}</div>`;
  }

  /**
   * Affiche un message vide
   */
  showEmpty(element, message = 'Aucune donnée') {
    element.innerHTML = `<p class="text-muted">${message}</p>`;
  }

  /**
   * Rend une liste de brainrots avec filtrage
   */
  renderBrainrotsList(container, brainrots, onEdit, onDelete) {
    if (!brainrots || brainrots.length === 0) {
      this.showEmpty(container, 'Aucun brainrot trouvé');
      return;
    }

    // Créer le conteneur avec filtres
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    filterContainer.innerHTML = `
      <div class="filter-group">
        <input type="text" id="brainrot-search" placeholder="Rechercher par nom..." class="filter-input">
        <select id="brainrot-rarity-filter" class="filter-select">
          <option value="">Toutes les raretés</option>
          <option value="Common">Common</option>
          <option value="Rare">Rare</option>
          <option value="Epic">Epic</option>
          <option value="Legendary">Legendary</option>
        </select>
      </div>
    `;
    container.innerHTML = '';
    container.appendChild(filterContainer);

    // Créer le conteneur pour la liste
    const listContainer = document.createElement('div');
    listContainer.id = 'brainrot-items-container';
    container.appendChild(listContainer);

    // Fonction pour mettre à jour la liste
    const updateList = () => {
      const searchTerm = document.getElementById('brainrot-search')?.value.toLowerCase() || '';
      const rarityFilter = document.getElementById('brainrot-rarity-filter')?.value || '';

      const filtered = brainrots.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(searchTerm);
        const matchesRarity = !rarityFilter || b.rarity === rarityFilter;
        return matchesSearch && matchesRarity;
      });

      if (filtered.length === 0) {
        listContainer.innerHTML = '<p class="text-muted">Aucun brainrot ne correspond aux critères</p>';
        return;
      }

      listContainer.innerHTML = filtered.map(brainrot => `
        <div class="list-item">
          <div class="list-item-info">
            <h3>${this.escapeHtml(brainrot.name)}</h3>
            <p>
              <span class="badge badge-primary">${brainrot.rarity}</span>
              <span class="badge badge-primary">${brainrot.mutation}</span>
            </p>
            <p>Prix: <strong>${brainrot.priceEUR.toFixed(2)} EUR</strong> | Revenu: <strong>${brainrot.incomeRate.toFixed(2)} EUR</strong></p>
            ${brainrot.traits && brainrot.traits.length > 0 ? `
              <p>Traits: ${brainrot.traits.join(', ')}</p>
            ` : ''}
            ${brainrot.compte ? `<p>Compte: <strong>${this.escapeHtml(brainrot.compte)}</strong></p>` : ''}
            ${brainrot.quantite ? `<p>Quantité: <strong>${brainrot.quantite}</strong></p>` : ''}
          </div>
          <div class="list-item-actions">
            <button class="btn btn-secondary" onclick="${onEdit}(${brainrot.id})">Modifier</button>
            <button class="btn btn-danger" onclick="${onDelete}(${brainrot.id})">Supprimer</button>
          </div>
        </div>
      `).join('');
    };

    // Attacher les event listeners pour les filtres
    setTimeout(() => {
      const searchInput = document.getElementById('brainrot-search');
      const rarityFilter = document.getElementById('brainrot-rarity-filter');
      
      if (searchInput) {
        searchInput.addEventListener('input', updateList);
      }
      if (rarityFilter) {
        rarityFilter.addEventListener('change', updateList);
      }

      // Afficher la liste initiale
      updateList();
    }, 0);
  }

  /**
   * Rend une liste de giveaways
   */
  renderGiveawaysList(container, giveaways, onEdit, onDelete) {
    if (!giveaways || giveaways.length === 0) {
      this.showEmpty(container, 'Aucun giveaway trouvé');
      return;
    }

    // Créer le conteneur avec filtres
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    filterContainer.innerHTML = `
      <div class="filter-group">
        <input type="text" id="giveaway-search" placeholder="Rechercher par prix..." class="filter-input">
        <select id="giveaway-status-filter" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="ended">Terminés</option>
        </select>
      </div>
    `;
    container.innerHTML = '';
    container.appendChild(filterContainer);

    // Créer le conteneur pour la liste
    const listContainer = document.createElement('div');
    listContainer.id = 'giveaway-items-container';
    container.appendChild(listContainer);

    // Fonction pour mettre à jour la liste
    const updateList = () => {
      const searchTerm = document.getElementById('giveaway-search')?.value.toLowerCase() || '';
      const statusFilter = document.getElementById('giveaway-status-filter')?.value || '';

      const filtered = giveaways.filter(g => {
        const matchesSearch = g.prize.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || (statusFilter === 'active' ? !g.ended : g.ended);
        return matchesSearch && matchesStatus;
      });

      if (filtered.length === 0) {
        listContainer.innerHTML = '<p class="text-muted">Aucun giveaway ne correspond aux critères</p>';
        return;
      }

      listContainer.innerHTML = filtered.map(giveaway => {
        const endTime = new Date(giveaway.endTime * 1000);
        const now = new Date();
        const timeRemaining = endTime - now;
        const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

        return `
          <div class="list-item">
            <div class="list-item-info">
              <h3>${this.escapeHtml(giveaway.prize)}</h3>
              <p>
                <span class="badge ${giveaway.ended ? 'badge-danger' : 'badge-success'}">
                  ${giveaway.ended ? '✅ Terminé' : '🔄 Actif'}
                </span>
              </p>
              <p>Gagnants: <strong>${giveaway.winners_count}</strong> | Participants: <strong>${giveaway.participants?.length || 0}</strong></p>
              ${!giveaway.ended && timeRemaining > 0 ? `
                <p>Temps restant: <strong>${hoursRemaining}h ${minutesRemaining}m</strong></p>
              ` : ''}
              ${giveaway.winners && giveaway.winners.length > 0 ? `
                <p>Gagnants: ${giveaway.winners.join(', ')}</p>
              ` : ''}
            </div>
            <div class="list-item-actions">
              <button class="btn btn-secondary" onclick="${onEdit}(${giveaway.id})">Modifier</button>
              <button class="btn btn-danger" onclick="${onDelete}(${giveaway.id})">Supprimer</button>
            </div>
          </div>
        `;
      }).join('');
    };

    // Attacher les event listeners pour les filtres
    setTimeout(() => {
      const searchInput = document.getElementById('giveaway-search');
      const statusFilter = document.getElementById('giveaway-status-filter');
      
      if (searchInput) {
        searchInput.addEventListener('input', updateList);
      }
      if (statusFilter) {
        statusFilter.addEventListener('change', updateList);
      }

      // Afficher la liste initiale
      updateList();
    }, 0);
  }

  /**
   * Rend les prix crypto
   */
  renderCryptoPrices(container, prices) {
    if (!prices || Object.keys(prices).length === 0) {
      this.showEmpty(container, 'Aucun prix disponible');
      return;
    }

    // Créer un tableau des prix
    const pricesArray = Object.entries(prices).map(([symbol, price]) => {
      // Gérer les deux formats: objet avec price_eur ou nombre direct
      const priceEur = typeof price === 'object' ? price.price_eur : price;
      const priceUsd = typeof price === 'object' ? price.price_usd : null;
      
      return {
        symbol,
        priceEur: parseFloat(priceEur) || 0,
        priceUsd: priceUsd ? parseFloat(priceUsd) : null
      };
    }).sort((a, b) => a.symbol.localeCompare(b.symbol));

    container.innerHTML = `
      <table class="crypto-table">
        <thead>
          <tr>
            <th>Crypto</th>
            <th>Prix EUR</th>
            <th>Prix USD</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${pricesArray.map(item => `
            <tr>
              <td class="crypto-symbol">${item.symbol}</td>
              <td class="crypto-price">€${item.priceEur.toFixed(2)}</td>
              <td class="crypto-price">${item.priceUsd ? '$' + item.priceUsd.toFixed(2) : 'N/A'}</td>
              <td>
                <button class="btn btn-sm btn-secondary" onclick="ui.selectCryptoForConversion('${item.symbol}')">
                  Convertir
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Sélectionne une crypto pour la conversion
   */
  selectCryptoForConversion(symbol) {
    const cryptoToSelect = document.getElementById('crypto-to');
    if (cryptoToSelect) {
      cryptoToSelect.value = symbol;
      // Scroller vers le formulaire de conversion
      const converterForm = document.querySelector('.crypto-converter');
      if (converterForm) {
        converterForm.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  /**
   * Crée un formulaire de brainrot
   */
  createBrainrotForm(brainrot = null) {
    return `
      <form id="brainrot-form" class="form-row">
        <div class="form-group">
          <label>Nom *</label>
          <input type="text" name="name" value="${brainrot?.name || ''}" placeholder="Ex: Brainrot Alpha" required>
        </div>
        <div class="form-group">
          <label>Rareté *</label>
          <select name="rarity" required>
            <option value="">Sélectionner...</option>
            <option value="Common" ${brainrot?.rarity === 'Common' ? 'selected' : ''}>Common</option>
            <option value="Rare" ${brainrot?.rarity === 'Rare' ? 'selected' : ''}>Rare</option>
            <option value="Epic" ${brainrot?.rarity === 'Epic' ? 'selected' : ''}>Epic</option>
            <option value="Legendary" ${brainrot?.rarity === 'Legendary' ? 'selected' : ''}>Legendary</option>
          </select>
        </div>
        <div class="form-group">
          <label>Mutation *</label>
          <input type="text" name="mutation" value="${brainrot?.mutation || ''}" placeholder="Ex: Shiny" required>
        </div>
        <div class="form-group">
          <label>Prix EUR</label>
          <input type="number" name="priceEUR" value="${brainrot?.priceEUR || 0}" step="0.01" min="0" placeholder="0.00">
        </div>
        <div class="form-group">
          <label>Revenu EUR</label>
          <input type="number" name="incomeRate" value="${brainrot?.incomeRate || 0}" step="0.01" min="0" placeholder="0.00">
        </div>
        <div class="form-group">
          <label>Compte</label>
          <input type="text" name="compte" value="${brainrot?.compte || ''}" placeholder="Ex: Compte Principal">
        </div>
        <div class="form-group">
          <label>Quantité</label>
          <input type="number" name="quantite" value="${brainrot?.quantite || 1}" min="1" placeholder="1">
        </div>
      </form>
    `;
  }

  /**
   * Crée un formulaire de giveaway
   */
  createGiveawayForm(giveaway = null) {
    const isEdit = !!giveaway;
    
    // Calculer la durée en minutes si c'est une édition
    let durationMinutes = 60;
    if (isEdit && giveaway.endTime) {
      const endTime = new Date(giveaway.endTime * 1000);
      const now = new Date();
      durationMinutes = Math.ceil((endTime - now) / (1000 * 60));
    }

    return `
      <form id="giveaway-form" class="form-row">
        <div class="form-group">
          <label>Prix/Récompense *</label>
          <input type="text" name="prize" value="${giveaway?.prize || ''}" placeholder="Ex: 1000 EUR, Brainrot Rare..." required>
        </div>
        <div class="form-group">
          <label>Nombre de gagnants *</label>
          <input type="number" name="winners_count" value="${giveaway?.winners_count || 1}" min="1" max="100" required>
        </div>
        <div class="form-group">
          <label>Durée (minutes) *</label>
          <input type="number" name="duration" value="${durationMinutes}" min="1" max="10080" placeholder="60" required>
        </div>
        ${isEdit ? `
          <div class="form-group">
            <label>Statut</label>
            <select name="ended" disabled>
              <option value="false" ${!giveaway.ended ? 'selected' : ''}>Actif</option>
              <option value="true" ${giveaway.ended ? 'selected' : ''}>Terminé</option>
            </select>
          </div>
        ` : ''}
      </form>
    `;
  }

  /**
   * Échappe les caractères HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Récupère les données d'un formulaire
   */
  getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return null;

    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      // Convertir les nombres
      if (value === '' || value === null) {
        data[key] = null;
      } else if (!isNaN(value) && value !== '') {
        data[key] = parseFloat(value);
      } else {
        data[key] = value;
      }
    }

    return data;
  }

  /**
   * Valide un formulaire
   */
  validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    return form.checkValidity();
  }

  /**
   * Met à jour les statistiques du dashboard
   */
  updateStats(stats) {
    const elements = {
      'total-brainrots': stats.brainrots?.totalBrainrots || 0,
      'total-value': `${(stats.brainrots?.totalValue || 0).toFixed(2)} EUR`,
      'active-giveaways': stats.giveaways?.active || 0,
      'system-health': '✅ OK'
    };

    for (const [id, value] of Object.entries(elements)) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    }
  }

  /**
   * Affiche/masque un élément
   */
  toggle(elementId, show = null) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (show === null) {
      element.style.display = element.style.display === 'none' ? 'block' : 'none';
    } else {
      element.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * Désactive un bouton
   */
  disableButton(buttonId, disabled = true) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = disabled;
      button.style.opacity = disabled ? '0.5' : '1';
    }
  }
}

// Exporter une instance unique
const ui = new UIManager();
