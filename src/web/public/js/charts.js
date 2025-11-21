/**
 * Module Charts - BrainrotsMarket v3
 * Gère les graphiques et visualisations
 */

/**
 * Classe pour gérer les graphiques
 */
class ChartManager {
  constructor() {
    this.charts = {};
    this.chartColors = {
      primary: '#7c3aed',
      accent: '#a78bfa',
      light: '#ddd6fe',
      success: '#22c55e',
      warning: '#eab308',
      danger: '#ef4444',
      info: '#3b82f6'
    };
  }

  /**
   * Initialise Chart.js avec la palette dark purple
   */
  initChartDefaults() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded');
      return;
    }

    Chart.defaults.color = '#c4b5fd';
    Chart.defaults.borderColor = '#4a0080';
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  }

  /**
   * Crée un graphique en camembert pour la distribution par rareté
   */
  createRarityChart(stats) {
    try {
      const canvas = document.getElementById('rarity-chart');
      if (!canvas) {
        console.warn('Canvas rarity-chart not found');
        return;
      }

      // Détruire le graphique existant
      if (this.charts.rarity) {
        this.charts.rarity.destroy();
      }

      const byRarity = stats.byRarity || {};
      const labels = Object.keys(byRarity);
      const data = Object.values(byRarity);

      // Couleurs par rareté
      const rarityColors = {
        'Common': '#6b7280',
        'Rare': '#3b82f6',
        'Epic': '#a855f7',
        'Legendary': '#f59e0b'
      };

      const backgroundColors = labels.map(label => rarityColors[label] || this.chartColors.primary);

      this.charts.rarity = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColors,
            borderColor: '#0f0015',
            borderWidth: 2,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#e9d5ff',
                padding: 15,
                font: {
                  size: 12,
                  weight: '500'
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 0, 21, 0.9)',
              titleColor: '#a78bfa',
              bodyColor: '#e9d5ff',
              borderColor: '#7c3aed',
              borderWidth: 1,
              padding: 12,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Erreur création graphique rareté:', error);
    }
  }

  /**
   * Crée un graphique en barres pour les prix crypto
   */
  createCryptoChart(prices) {
    try {
      const canvas = document.getElementById('crypto-chart');
      if (!canvas) {
        console.warn('Canvas crypto-chart not found');
        return;
      }

      // Détruire le graphique existant
      if (this.charts.crypto) {
        this.charts.crypto.destroy();
      }

      const symbols = Object.keys(prices);
      const values = symbols.map(symbol => {
        const price = prices[symbol];
        // Gérer les deux formats: objet avec price_eur ou nombre direct
        return typeof price === 'object' ? (price.price_eur || 0) : (price || 0);
      });

      // Couleurs dégradées pour les cryptos
      const cryptoColors = [
        '#f7931a', // BTC - Orange
        '#627eea', // ETH - Bleu
        '#14f195', // SOL - Vert
        '#26a17b', // USDT - Vert foncé
        '#f7931a'  // LTC - Orange
      ];

      this.charts.crypto = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: symbols,
          datasets: [{
            label: 'Prix en EUR',
            data: values,
            backgroundColor: cryptoColors.slice(0, symbols.length),
            borderColor: '#7c3aed',
            borderWidth: 1,
            borderRadius: 6,
            hoverBackgroundColor: '#a78bfa'
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: '#e9d5ff',
                padding: 15,
                font: {
                  size: 12,
                  weight: '500'
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 0, 21, 0.9)',
              titleColor: '#a78bfa',
              bodyColor: '#e9d5ff',
              borderColor: '#7c3aed',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: function(context) {
                  const value = context.parsed.x || 0;
                  return `${Utils.formatCurrency(value, 'EUR')}`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: '#c4b5fd',
                font: {
                  size: 11
                },
                callback: function(value) {
                  return Utils.formatCurrency(value, 'EUR');
                }
              },
              grid: {
                color: 'rgba(124, 58, 237, 0.1)',
                drawBorder: false
              }
            },
            y: {
              ticks: {
                color: '#c4b5fd',
                font: {
                  size: 12,
                  weight: '500'
                }
              },
              grid: {
                display: false,
                drawBorder: false
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Erreur création graphique crypto:', error);
    }
  }

  /**
   * Met à jour tous les graphiques
   */
  updateCharts(stats, prices) {
    try {
      this.initChartDefaults();

      if (stats && stats.byRarity) {
        this.createRarityChart(stats);
      }

      if (prices && Object.keys(prices).length > 0) {
        this.createCryptoChart(prices);
      }
    } catch (error) {
      console.error('Erreur mise à jour graphiques:', error);
    }
  }

  /**
   * Détruit tous les graphiques
   */
  destroyAll() {
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = {};
  }
}

// Exporter une instance unique
const chartManager = new ChartManager();
