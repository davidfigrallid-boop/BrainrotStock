/**
 * Application Frontend - BrainrotsMarket v3
 * Gère l'interface utilisateur et les appels API
 */

// État de l'application
const app = {
  serverId: 'default',
  authenticated: false,
  brainrots: [],
  giveaways: [],
  cryptoPrices: {},
  refreshInterval: null
};

/**
 * Initialise l'authentification
 */
async function initAuth() {
  const password = api.getPassword();
  
  if (!password) {
    // Afficher un modal d'authentification
    ui.showModal('Authentification', `
      <form id="auth-form" class="form-row">
        <div class="form-group">
          <label>Mot de passe admin *</label>
          <input type="password" id="auth-password" placeholder="Entrez le mot de passe" required autofocus>
        </div>
      </form>
    `, [
      {
        label: 'Se connecter',
        type: 'primary',
        onclick: 'handleLogin()'
      }
    ]);
    return false;
  }

  app.authenticated = true;
  return true;
}

/**
 * Gère la connexion
 */
async function handleLogin() {
  const passwordInput = document.getElementById('auth-password');
  const password = passwordInput?.value;

  if (!password) {
    ui.showNotification('Veuillez entrer un mot de passe', 'error');
    return;
  }

  api.setPassword(password);
  ui.closeModal();
  app.authenticated = true;

  // Charger les données
  await loadAllData();
}

/**
 * Gère la déconnexion
 */
function handleLogout() {
  ui.confirm('Êtes-vous sûr de vouloir vous déconnecter?', 'logout()', '');
}

/**
 * Déconnecte l'utilisateur
 */
function logout() {
  api.clearAuth();
  app.authenticated = false;
  clearInterval(app.refreshInterval);
  location.reload();
}

/**
 * Charge toutes les données
 */
async function loadAllData() {
  try {
    ui.showNotification('Chargement des données...', 'info', 2000);
    
    await Promise.all([
      loadDashboard(),
      loadBrainrots(),
      loadGiveaways(),
      loadCryptoPrices()
    ]);

    ui.showNotification('Données chargées avec succès', 'success', 2000);
  } catch (error) {
    console.error('Erreur chargement données:', error);
    ui.showNotification('Erreur lors du chargement des données', 'error');
  }
}

/**
 * Charge les statistiques du dashboard
 */
async function loadDashboard() {
  try {
    const stats = await api.getStats(app.serverId);
    ui.updateStats(stats);
    
    // Charger les prix crypto pour le graphique
    const prices = await api.getCryptoPrices();
    
    // Mettre à jour les graphiques
    chartManager.updateCharts(stats, prices);
  } catch (error) {
    console.error('Erreur chargement dashboard:', error);
  }
}

/**
 * Charge la liste des brainrots
 */
async function loadBrainrots() {
  try {
    const container = document.getElementById('brainrots-list');
    ui.showLoading(container);
    
    app.brainrots = await api.getBrainrots(app.serverId);
    ui.renderBrainrotsList(container, app.brainrots, 'editBrainrot', 'deleteBrainrot');
  } catch (error) {
    console.error('Erreur chargement brainrots:', error);
    ui.showError(document.getElementById('brainrots-list'), 'Erreur lors du chargement des brainrots');
  }
}

/**
 * Charge la liste des giveaways
 */
async function loadGiveaways() {
  try {
    const container = document.getElementById('giveaways-list');
    ui.showLoading(container);
    
    app.giveaways = await api.getGiveaways(app.serverId);
    ui.renderGiveawaysList(container, app.giveaways, 'editGiveaway', 'deleteGiveaway');
  } catch (error) {
    console.error('Erreur chargement giveaways:', error);
    ui.showError(document.getElementById('giveaways-list'), 'Erreur lors du chargement des giveaways');
  }
}

/**
 * Charge les prix crypto
 */
async function loadCryptoPrices() {
  try {
    const container = document.getElementById('prices-list');
    ui.showLoading(container);
    
    app.cryptoPrices = await api.getCryptoPrices();
    ui.renderCryptoPrices(container, app.cryptoPrices);
  } catch (error) {
    console.error('Erreur chargement prix crypto:', error);
    ui.showError(document.getElementById('prices-list'), 'Erreur lors du chargement des prix');
  }
}

/**
 * Ajoute un brainrot
 */
function addBrainrot() {
  const form = ui.createBrainrotForm();
  
  ui.showModal('Ajouter un Brainrot', form, [
    {
      label: 'Annuler',
      type: 'secondary',
      onclick: 'ui.closeModal()'
    },
    {
      label: 'Créer',
      type: 'primary',
      onclick: 'submitBrainrot()'
    }
  ]);
}

/**
 * Soumet le formulaire de brainrot
 */
async function submitBrainrot() {
  if (!ui.validateForm('brainrot-form')) {
    ui.showNotification('Veuillez remplir tous les champs requis', 'error');
    return;
  }

  const data = ui.getFormData('brainrot-form');

  try {
    // Trouver et désactiver le bouton de soumission
    const submitBtn = document.querySelector('.modal-footer .btn-primary');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    }

    await api.createBrainrot(app.serverId, data);
    ui.closeModal();
    ui.showNotification('Brainrot créé avec succès', 'success');
    await loadBrainrots();
    await loadDashboard();
  } catch (error) {
    console.error('Erreur création brainrot:', error);
    ui.showNotification('Erreur lors de la création du brainrot: ' + error.message, 'error');
  } finally {
    const submitBtn = document.querySelector('.modal-footer .btn-primary');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

/**
 * Édite un brainrot
 */
async function editBrainrot(id) {
  try {
    const brainrot = app.brainrots.find(b => b.id === id);
    if (!brainrot) {
      ui.showNotification('Brainrot non trouvé', 'error');
      return;
    }

    const form = ui.createBrainrotForm(brainrot);
    
    ui.showModal('Modifier le Brainrot', form, [
      {
        label: 'Annuler',
        type: 'secondary',
        onclick: 'ui.closeModal()'
      },
      {
        label: 'Mettre à jour',
        type: 'primary',
        onclick: `submitBrainrotUpdate(${id})`
      }
    ]);
  } catch (error) {
    console.error('Erreur édition brainrot:', error);
    ui.showNotification('Erreur lors de l\'édition du brainrot', 'error');
  }
}

/**
 * Soumet la mise à jour d'un brainrot
 */
async function submitBrainrotUpdate(id) {
  if (!ui.validateForm('brainrot-form')) {
    ui.showNotification('Veuillez remplir tous les champs requis', 'error');
    return;
  }

  const data = ui.getFormData('brainrot-form');

  try {
    // Trouver et désactiver le bouton de soumission
    const submitBtn = document.querySelector('.modal-footer .btn-primary');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    }

    await api.updateBrainrot(app.serverId, id, data);
    ui.closeModal();
    ui.showNotification('Brainrot mis à jour avec succès', 'success');
    await loadBrainrots();
    await loadDashboard();
  } catch (error) {
    console.error('Erreur mise à jour brainrot:', error);
    ui.showNotification('Erreur lors de la mise à jour du brainrot: ' + error.message, 'error');
  } finally {
    const submitBtn = document.querySelector('.modal-footer .btn-primary');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

/**
 * Supprime un brainrot
 */
async function deleteBrainrot(id) {
  ui.confirm(
    'Êtes-vous sûr de vouloir supprimer ce brainrot?',
    `confirmDeleteBrainrot(${id})`,
    ''
  );
}

/**
 * Confirme la suppression d'un brainrot
 */
async function confirmDeleteBrainrot(id) {
  try {
    await api.deleteBrainrot(app.serverId, id);
    ui.showNotification('Brainrot supprimé avec succès', 'success');
    await loadBrainrots();
    await loadDashboard();
  } catch (error) {
    console.error('Erreur suppression brainrot:', error);
    ui.showNotification('Erreur lors de la suppression du brainrot', 'error');
  }
}

/**
 * Ajoute un giveaway
 */
function addGiveaway() {
  const form = ui.createGiveawayForm();
  
  ui.showModal('Créer un Giveaway', form, [
    {
      label: 'Annuler',
      type: 'secondary',
      onclick: 'ui.closeModal()'
    },
    {
      label: 'Créer',
      type: 'primary',
      onclick: 'submitGiveaway(null)'
    }
  ]);
}

/**
 * Soumet le formulaire de giveaway
 */
async function submitGiveaway(giveawayId = null) {
  if (!ui.validateForm('giveaway-form')) {
    ui.showNotification('Veuillez remplir tous les champs requis', 'error');
    return;
  }

  const data = ui.getFormData('giveaway-form');

  try {
    // Trouver et désactiver le bouton de soumission
    const submitBtn = document.querySelector('.modal-footer .btn-primary');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    }

    if (giveawayId) {
      await api.updateGiveaway(app.serverId, giveawayId, data);
      ui.showNotification('Giveaway mis à jour avec succès', 'success');
    } else {
      await api.createGiveaway(app.serverId, data);
      ui.showNotification('Giveaway créé avec succès', 'success');
    }

    ui.closeModal();
    await loadGiveaways();
    await loadDashboard();
  } catch (error) {
    console.error('Erreur giveaway:', error);
    ui.showNotification('Erreur lors de l\'opération: ' + error.message, 'error');
  } finally {
    const submitBtn = document.querySelector('.modal-footer .btn-primary');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

/**
 * Édite un giveaway
 */
async function editGiveaway(id) {
  try {
    const giveaway = app.giveaways.find(g => g.id === id);
    if (!giveaway) {
      ui.showNotification('Giveaway non trouvé', 'error');
      return;
    }

    const form = ui.createGiveawayForm(giveaway);
    
    ui.showModal('Modifier le Giveaway', form, [
      {
        label: 'Annuler',
        type: 'secondary',
        onclick: 'ui.closeModal()'
      },
      {
        label: 'Mettre à jour',
        type: 'primary',
        onclick: `submitGiveaway(${id})`
      }
    ]);
  } catch (error) {
    console.error('Erreur édition giveaway:', error);
    ui.showNotification('Erreur lors de l\'édition du giveaway', 'error');
  }
}

/**
 * Supprime un giveaway
 */
async function deleteGiveaway(id) {
  ui.confirm(
    'Êtes-vous sûr de vouloir supprimer ce giveaway?',
    `confirmDeleteGiveaway(${id})`,
    ''
  );
}

/**
 * Confirme la suppression d'un giveaway
 */
async function confirmDeleteGiveaway(id) {
  try {
    await api.deleteGiveaway(app.serverId, id);
    ui.showNotification('Giveaway supprimé avec succès', 'success');
    await loadGiveaways();
    await loadDashboard();
  } catch (error) {
    console.error('Erreur suppression giveaway:', error);
    ui.showNotification('Erreur lors de la suppression du giveaway', 'error');
  }
}

/**
 * Convertit les cryptos
 */
async function convertCrypto() {
  try {
    const amount = parseFloat(document.getElementById('crypto-amount').value);
    const from = document.getElementById('crypto-from').value;
    const to = document.getElementById('crypto-to').value;

    if (!amount || amount <= 0) {
      ui.showNotification('Veuillez entrer un montant valide', 'error');
      return;
    }

    if (from === to) {
      ui.showNotification('Sélectionnez deux devises différentes', 'error');
      return;
    }

    const result = await api.convertCrypto(amount, from, to);
    
    const resultDiv = document.getElementById('crypto-result');
    const formattedAmount = amount.toFixed(from === 'EUR' ? 2 : 8);
    const formattedResult = result.result.toFixed(to === 'EUR' ? 2 : 8);
    resultDiv.innerHTML = `
      <div class="conversion-result">
        <p><strong>${formattedAmount} ${from}</strong> = <strong>${formattedResult} ${to}</strong></p>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.5rem;">
          Taux: 1 ${from} = ${(result.result / amount).toFixed(8)} ${to}
        </p>
      </div>
    `;
  } catch (error) {
    console.error('Erreur conversion:', error);
    ui.showNotification('Erreur lors de la conversion', 'error');
  }
}

/**
 * Rafraîchit les prix crypto
 */
async function refreshCryptoPrices() {
  try {
    const container = document.getElementById('prices-list');
    const btn = document.getElementById('refresh-crypto-btn');
    
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⟳ Rafraîchissement...';
    }

    app.cryptoPrices = await api.getCryptoPrices();
    ui.renderCryptoPrices(container, app.cryptoPrices);
    ui.showNotification('Prix crypto rafraîchis', 'success', 2000);
  } catch (error) {
    console.error('Erreur rafraîchissement prix crypto:', error);
    ui.showNotification('Erreur lors du rafraîchissement des prix', 'error');
  } finally {
    const btn = document.getElementById('refresh-crypto-btn');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⟳ Rafraîchir';
    }
  }
}

/**
 * Attache les event listeners
 */
function attachEventListeners() {
  // Boutons d'ajout
  document.getElementById('add-brainrot-btn')?.addEventListener('click', addBrainrot);
  document.getElementById('add-giveaway-btn')?.addEventListener('click', addGiveaway);

  // Conversion crypto
  document.getElementById('convert-btn')?.addEventListener('click', convertCrypto);

  // Rafraîchissement crypto
  document.getElementById('refresh-crypto-btn')?.addEventListener('click', refreshCryptoPrices);

  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const section = document.querySelector(href);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/**
 * Initialise l'application
 */
async function init() {
  try {
    // Initialiser les graphiques
    chartManager.initChartDefaults();

    // Vérifier l'authentification
    const authenticated = await initAuth();
    if (!authenticated) {
      return;
    }

    // Attacher les event listeners
    attachEventListeners();

    // Charger les données initiales
    await loadAllData();

    // Rafraîchir les données toutes les 30 secondes
    app.refreshInterval = setInterval(() => {
      loadDashboard();
      loadCryptoPrices();
    }, 30000);

  } catch (error) {
    console.error('Erreur initialisation:', error);
    ui.showNotification('Erreur lors de l\'initialisation de l\'application', 'error');
  }
}

// Démarrer l'application au chargement
document.addEventListener('DOMContentLoaded', init);
