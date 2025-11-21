/**
 * Application Panel Admin BrainrotsMarket
 * Gestion complète des brainrots et giveaways
 */

class AdminPanel {
    constructor() {
        this.currentServerId = null;
        this.currentPage = 'dashboard';
        this.apiToken = this.getApiToken();
        this.init();
    }

    /**
     * Initialise l'application
     */
    async init() {
        this.setupEventListeners();
        await this.checkApiStatus();
        await this.loadServers();
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchPage(e.target.closest('.nav-item').dataset.page));
        });

        // Sélection du serveur
        document.getElementById('server-select').addEventListener('change', (e) => {
            this.currentServerId = e.target.value;
            this.loadPageData();
        });

        // Brainrots
        document.getElementById('btn-add-brainrot').addEventListener('click', () => this.openBrainrotModal());
        document.getElementById('form-brainrot').addEventListener('submit', (e) => this.saveBrainrot(e));
        document.getElementById('btn-modal-cancel').addEventListener('click', () => this.closeBrainrotModal());
        document.querySelector('#modal-brainrot .modal-close').addEventListener('click', () => this.closeBrainrotModal());

        // Giveaways
        document.getElementById('btn-add-giveaway').addEventListener('click', () => this.openGiveawayModal());
        document.getElementById('form-giveaway').addEventListener('submit', (e) => this.saveGiveaway(e));
        document.getElementById('btn-modal-cancel-giveaway').addEventListener('click', () => this.closeGiveawayModal());
        document.querySelector('#modal-giveaway .modal-close').addEventListener('click', () => this.closeGiveawayModal());

        // Filtres
        document.getElementById('filter-name').addEventListener('input', () => this.filterBrainrots());
        document.getElementById('filter-rarity').addEventListener('change', () => this.filterBrainrots());
        document.getElementById('filter-mutation').addEventListener('change', () => this.filterBrainrots());

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Crypto
        document.getElementById('btn-convert').addEventListener('click', () => this.convertCrypto());
        document.getElementById('btn-refresh-prices').addEventListener('click', () => this.loadCryptoPrices());
    }

    /**
     * Récupère le token API
     */
    getApiToken() {
        // En production, le token devrait être stocké de manière sécurisée
        return localStorage.getItem('api_token') || '';
    }

    /**
     * Effectue une requête API
     */
    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiToken}`
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`/api${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            this.showNotification('Erreur API', 'error');
            throw error;
        }
    }

    /**
     * Vérifie l'état de l'API
     */
    async checkApiStatus() {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                document.getElementById('api-status').classList.add('online');
                document.getElementById('api-status-text').textContent = 'En ligne';
            }
        } catch (error) {
            document.getElementById('api-status-text').textContent = 'Hors ligne';
        }
    }

    /**
     * Charge la liste des serveurs
     */
    async loadServers() {
        try {
            // Récupérer les serveurs depuis le bot (à implémenter dans l'API)
            // Pour maintenant, on utilise un placeholder
            const select = document.getElementById('server-select');
            
            // Exemple de serveurs (à remplacer par un appel API réel)
            const servers = [
                { id: '123456789', name: 'Mon Serveur' },
                { id: '987654321', name: 'Serveur Test' }
            ];

            servers.forEach(server => {
                const option = document.createElement('option');
                option.value = server.id;
                option.textContent = server.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Erreur chargement serveurs:', error);
        }
    }

    /**
     * Change de page
     */
    switchPage(page) {
        // Mettre à jour la navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Mettre à jour la page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(`page-${page}`).classList.add('active');

        // Mettre à jour le titre
        const titles = {
            dashboard: 'Dashboard',
            brainrots: 'Gestion des Brainrots',
            giveaways: 'Gestion des Giveaways',
            crypto: 'Convertisseur Crypto',
            settings: 'Paramètres'
        };
        document.getElementById('page-title').textContent = titles[page];

        this.currentPage = page;
        this.loadPageData();
    }

    /**
     * Charge les données de la page actuelle
     */
    async loadPageData() {
        if (!this.currentServerId) {
            this.showNotification('Veuillez sélectionner un serveur', 'warning');
            return;
        }

        switch (this.currentPage) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'brainrots':
                await this.loadBrainrots();
                break;
            case 'giveaways':
                await this.loadGiveaways();
                break;
            case 'crypto':
                await this.loadCryptoPrices();
                break;
        }
    }

    /**
     * Charge le dashboard
     */
    async loadDashboard() {
        try {
            const stats = await this.apiCall(`/stats/${this.currentServerId}`);
            
            document.getElementById('stat-total-brainrots').textContent = stats.data.totalBrainrots;
            document.getElementById('stat-total-value').textContent = stats.data.totalValueFormatted;
            document.getElementById('stat-unique-types').textContent = stats.data.uniqueTypes;
            document.getElementById('stat-active-giveaways').textContent = stats.data.activeGiveaways;

            // Afficher la répartition par rareté
            const rarityChart = document.getElementById('rarity-chart');
            rarityChart.innerHTML = '';
            
            for (const [rarity, count] of Object.entries(stats.data.byRarity)) {
                const item = document.createElement('div');
                item.className = 'rarity-item';
                item.innerHTML = `
                    <div class="rarity-item-name">${rarity}</div>
                    <div class="rarity-item-count">${count}</div>
                `;
                rarityChart.appendChild(item);
            }
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
        }
    }

    /**
     * Charge les brainrots
     */
    async loadBrainrots() {
        try {
            const response = await this.apiCall(`/brainrots/${this.currentServerId}`);
            const brainrots = response.data;

            const tbody = document.getElementById('brainrots-table-body');
            tbody.innerHTML = '';

            if (brainrots.length === 0) {
                tbody.innerHTML = '<tr class="empty-state"><td colspan="7">Aucun brainrot</td></tr>';
                return;
            }

            brainrots.forEach(br => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${br.name}</td>
                    <td><span class="rarity-badge ${br.rarity.toLowerCase().replace(' ', '-')}">${br.rarity}</span></td>
                    <td>${br.mutation}</td>
                    <td>${this.formatPrice(br.price_eur)}</td>
                    <td>${this.formatPrice(br.income_rate)}</td>
                    <td>${br.quantite}</td>
                    <td>
                        <button class="btn btn-small" onclick="adminPanel.editBrainrot(${br.id})">✏️</button>
                        <button class="btn btn-small btn-danger" onclick="adminPanel.deleteBrainrot(${br.id})">🗑️</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Erreur chargement brainrots:', error);
        }
    }

    /**
     * Filtre les brainrots
     */
    filterBrainrots() {
        const name = document.getElementById('filter-name').value.toLowerCase();
        const rarity = document.getElementById('filter-rarity').value;
        const mutation = document.getElementById('filter-mutation').value;

        document.querySelectorAll('#brainrots-table-body tr').forEach(row => {
            if (row.classList.contains('empty-state')) return;

            const cells = row.querySelectorAll('td');
            const rowName = cells[0].textContent.toLowerCase();
            const rowRarity = cells[1].textContent;
            const rowMutation = cells[2].textContent;

            const matchName = rowName.includes(name);
            const matchRarity = !rarity || rowRarity.includes(rarity);
            const matchMutation = !mutation || rowMutation.includes(mutation);

            row.style.display = (matchName && matchRarity && matchMutation) ? '' : 'none';
        });
    }

    /**
     * Ouvre le modal d'ajout de brainrot
     */
    openBrainrotModal() {
        document.getElementById('modal-title').textContent = 'Ajouter un Brainrot';
        document.getElementById('form-brainrot').reset();
        document.getElementById('modal-brainrot').classList.add('active');
    }

    /**
     * Ferme le modal de brainrot
     */
    closeBrainrotModal() {
        document.getElementById('modal-brainrot').classList.remove('active');
    }

    /**
     * Sauvegarde un brainrot
     */
    async saveBrainrot(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            rarity: formData.get('rarity'),
            mutation: formData.get('mutation'),
            priceEur: formData.get('priceEur'),
            incomeRate: formData.get('incomeRate'),
            compte: formData.get('compte'),
            quantite: parseInt(formData.get('quantite')),
            traits: formData.get('traits').split(',').map(t => t.trim()).filter(t => t)
        };

        try {
            await this.apiCall(`/brainrots/${this.currentServerId}`, 'POST', data);
            this.showNotification('Brainrot créé avec succès', 'success');
            this.closeBrainrotModal();
            await this.loadBrainrots();
        } catch (error) {
            console.error('Erreur sauvegarde brainrot:', error);
        }
    }

    /**
     * Supprime un brainrot
     */
    async deleteBrainrot(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce brainrot ?')) return;

        try {
            await this.apiCall(`/brainrots/${this.currentServerId}/${id}`, 'DELETE');
            this.showNotification('Brainrot supprimé', 'success');
            await this.loadBrainrots();
        } catch (error) {
            console.error('Erreur suppression brainrot:', error);
        }
    }

    /**
     * Charge les giveaways
     */
    async loadGiveaways() {
        try {
            const response = await this.apiCall(`/giveaways/${this.currentServerId}`);
            const giveaways = response.data;

            const active = giveaways.filter(g => !g.ended && g.end_time > Date.now());
            const ended = giveaways.filter(g => g.ended);

            this.displayGiveaways(active, 'active-giveaways');
            this.displayGiveaways(ended, 'ended-giveaways');
        } catch (error) {
            console.error('Erreur chargement giveaways:', error);
        }
    }

    /**
     * Affiche les giveaways
     */
    displayGiveaways(giveaways, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (giveaways.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">Aucun giveaway</p>';
            return;
        }

        giveaways.forEach(ga => {
            const card = document.createElement('div');
            card.className = 'giveaway-card';
            card.innerHTML = `
                <h4>🎁 ${ga.prize}</h4>
                <div class="giveaway-info">
                    <span>Gagnants: ${ga.winners_count}</span>
                    <span>Participants: ${ga.participants?.length || 0}</span>
                </div>
                <div class="giveaway-actions">
                    <button class="btn btn-small btn-primary" onclick="adminPanel.endGiveaway(${ga.id})">Terminer</button>
                    <button class="btn btn-small" onclick="adminPanel.rerollGiveaway(${ga.id})">Reroll</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    /**
     * Ouvre le modal de création de giveaway
     */
    openGiveawayModal() {
        document.getElementById('form-giveaway').reset();
        document.getElementById('modal-giveaway').classList.add('active');
    }

    /**
     * Ferme le modal de giveaway
     */
    closeGiveawayModal() {
        document.getElementById('modal-giveaway').classList.remove('active');
    }

    /**
     * Sauvegarde un giveaway
     */
    async saveGiveaway(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = {
            prize: formData.get('prize'),
            duration: formData.get('duration'),
            winnersCount: parseInt(formData.get('winnersCount')),
            messageId: Date.now().toString(),
            channelId: this.currentServerId,
            endTime: Date.now() + this.parseDuration(formData.get('duration')) * 60 * 1000
        };

        try {
            await this.apiCall(`/giveaways/${this.currentServerId}`, 'POST', data);
            this.showNotification('Giveaway créé avec succès', 'success');
            this.closeGiveawayModal();
            await this.loadGiveaways();
        } catch (error) {
            console.error('Erreur sauvegarde giveaway:', error);
        }
    }

    /**
     * Parse une durée
     */
    parseDuration(durationStr) {
        const match = /^(\d+)\s*(min|h|j|sem|m|an)$/.exec(durationStr.toLowerCase().trim());
        if (!match) return 0;

        const [, amount, unit] = match;
        const multipliers = {
            'min': 1,
            'h': 60,
            'j': 60 * 24,
            'sem': 60 * 24 * 7,
            'm': 60 * 24 * 30,
            'an': 60 * 24 * 365
        };

        return parseInt(amount) * (multipliers[unit] || 1);
    }

    /**
     * Termine un giveaway
     */
    async endGiveaway(id) {
        try {
            await this.apiCall(`/giveaways/${this.currentServerId}/${id}`, 'PUT', { ended: true });
            this.showNotification('Giveaway terminé', 'success');
            await this.loadGiveaways();
        } catch (error) {
            console.error('Erreur fin giveaway:', error);
        }
    }

    /**
     * Reroll les gagnants
     */
    async rerollGiveaway(id) {
        try {
            await this.apiCall(`/giveaways/${this.currentServerId}/${id}/reroll`, 'POST');
            this.showNotification('Giveaway reroll', 'success');
            await this.loadGiveaways();
        } catch (error) {
            console.error('Erreur reroll giveaway:', error);
        }
    }

    /**
     * Charge les prix crypto
     */
    async loadCryptoPrices() {
        try {
            const response = await this.apiCall('/crypto/prices');
            const prices = response.data;

            const grid = document.getElementById('prices-grid');
            grid.innerHTML = '';

            for (const [crypto, price] of Object.entries(prices)) {
                const card = document.createElement('div');
                card.className = 'price-card';
                card.innerHTML = `
                    <div class="price-card-name">${crypto}</div>
                    <div class="price-card-value">€${price.toFixed(2)}</div>
                `;
                grid.appendChild(card);
            }
        } catch (error) {
            console.error('Erreur chargement prix crypto:', error);
        }
    }

    /**
     * Convertit EUR en crypto
     */
    async convertCrypto() {
        const amount = parseFloat(document.getElementById('eur-amount').value);
        const crypto = document.getElementById('crypto-select').value;

        if (!amount || amount <= 0) {
            this.showNotification('Montant invalide', 'error');
            return;
        }

        try {
            const response = await this.apiCall('/crypto/convert', 'POST', {
                amount,
                crypto
            });

            const result = response.data;
            const resultDiv = document.getElementById('conversion-result');
            resultDiv.style.display = 'block';
            resultDiv.querySelector('#result-text').textContent = 
                `${amount} EUR = ${result.cryptoAmount.toFixed(8)} ${crypto}`;
        } catch (error) {
            console.error('Erreur conversion:', error);
        }
    }

    /**
     * Change d'onglet
     */
    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tab}`).classList.add('active');
    }

    /**
     * Formate un prix
     */
    formatPrice(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'k';
        return num.toFixed(2);
    }

    /**
     * Affiche une notification
     */
    showNotification(message, type = 'info') {
        // Implémentation simple - à améliorer avec une vraie librairie
        alert(message);
    }
}

// Initialiser l'application
const adminPanel = new AdminPanel();
