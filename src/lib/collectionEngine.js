// Collection Engine Frontend Implementation
// Handles the 24-hour collection system with Charge Meter and Electric Hammer effects

import { deviceFingerprint } from './deviceFingerprint';
import { t } from './i18n';

export class CollectionEngine {
  constructor() {
    this.isCollecting = false;
    this.collectionTimer = null;
    this.chargeMeterInterval = null;
    this.userAssets = [];
    this.economyState = null;
  }

  // Initialize collection engine
  async initialize(userId) {
    this.userId = userId;
    await this.loadUserData();
    this.startChargeMeter();
  }

  // Load user data and assets
  async loadUserData() {
    try {
      // Get user assets from Supabase
      const { data: assets, error } = await supabase
        .from('user_assets')
        .select(`
          *,
          assets (
            name,
            type,
            base_rate,
            risk_level,
            market_sensitivity,
            volatility_index
          )
        `)
        .eq('user_id', this.userId)
        .eq('status', 'active');

      if (error) throw error;
      this.userAssets = assets;

      // Get economy state
      const { data: economy, error: econError } = await supabase
        .from('economy_state')
        .select('*')
        .single();

      if (econError) throw econError;
      this.economyState = economy;

    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  // Calculate current collection progress
  calculateCollectionProgress() {
    const now = new Date();
    let totalProfit = 0;
    let maxProfit = 0;
    let isPaused = false;

    this.userAssets.forEach(asset => {
      const lastCollection = new Date(asset.last_collection_time);
      const hoursPassed = (now - lastCollection) / (1000 * 60 * 60);
      
      // Cap at 24 hours for calculation
      const billableHours = Math.min(24, hoursPassed);
      const maxHours = 24;

      // Calculate dynamic rate
      const dynamicRate = this.calculateDynamicRate(asset);
      
      totalProfit += billableHours * dynamicRate;
      maxProfit += maxHours * dynamicRate;

      // Check if paused
      if (hoursPassed > 24) {
        isPaused = true;
      }
    });

    const progressPercent = maxProfit > 0 ? (totalProfit / maxProfit) * 100 : 0;

    return {
      totalProfit,
      maxProfit,
      progressPercent,
      isPaused,
      hoursPassed: this.userAssets.length > 0 ? 
        (now - new Date(this.userAssets[0].last_collection_time)) / (1000 * 60 * 60) : 0
    };
  }

  // Calculate dynamic rate based on risk, market, and season
  calculateDynamicRate(asset) {
    const baseRate = asset.assets.base_rate;
    const riskBonus = 1 + (this.userRiskScore * 0.02);
    const marketEffect = this.economyState.market_demand_index;
    const seasonEffect = this.economyState.season_modifier;
    const volatilityRandom = (Math.random() * 0.06) - 0.03; // -3% to +3%

    return baseRate * riskBonus * marketEffect * seasonEffect * (1 + volatilityRandom);
  }

  // Start charge meter animation
  startChargeMeter() {
    if (this.chargeMeterInterval) {
      clearInterval(this.chargeMeterInterval);
    }

    this.chargeMeterInterval = setInterval(() => {
      const progress = this.calculateCollectionProgress();
      this.updateChargeMeterUI(progress);
    }, 1000); // Update every second
  }

  // Update charge meter UI
  updateChargeMeterUI(progress) {
    const chargeMeter = document.getElementById('charge-meter');
    const collectButton = document.getElementById('collect-button');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');

    if (!chargeMeter || !collectButton || !progressText || !progressBar) return;

    // Update progress bar
    progressBar.style.width = `${progress.progressPercent}%`;
    
    // Update text
    progressText.textContent = `${progress.progressPercent.toFixed(1)}%`;
    
    // Update button styles based on progress
    const chargeMeterStyles = this.getChargeMeterStyles(progress.progressPercent);
    
    Object.assign(collectButton.style, chargeMeterStyles);
    
    // Update button text
    if (progress.isPaused) {
      collectButton.textContent = t('resume');
      collectButton.disabled = false;
    } else {
      collectButton.textContent = t('collect');
      collectButton.disabled = false;
    }
  }

  // Get charge meter styles based on progress
  getChargeMeterStyles(progressPercent) {
    const { getChargeMeterStyles } = require('./ThemeContext').useTheme();
    
    // This would be called from a component with theme context
    // For now, return basic styles
    let styles = {
      background: '#202020',
      border: '2px solid #333333',
      color: '#ffffff',
      transition: 'all 0.3s ease'
    };

    if (progressPercent > 70) {
      styles = {
        ...styles,
        border: '2px solid #00f3ff',
        boxShadow: '0 0 15px #00f3ff',
        animation: 'pulse 2s infinite'
      };
    }

    if (progressPercent >= 100) {
      styles = {
        ...styles,
        border: '3px solid #ff0055',
        boxShadow: '0 0 20px #ff0055, 0 0 30px #ffd700',
        animation: 'shake 0.5s infinite'
      };
    }

    return styles;
  }

  // Perform collection with Electric Hammer effects
  async collectEarnings() {
    if (this.isCollecting) return;

    this.isCollecting = true;
    const collectButton = document.getElementById('collect-button');
    
    if (collectButton) {
      collectButton.disabled = true;
      collectButton.textContent = t('processing');
    }

    try {
      // Get device fingerprint for security
      const deviceHash = await deviceFingerprint.generateFingerprint();

      // Call backend collection function
      const { data, error } = await supabase
        .rpc('collect_user_earnings', {
          user_id: this.userId,
          current_device_hash: deviceHash
        });

      if (error) {
        throw error;
      }

      if (data.success) {
        // Trigger Electric Hammer animation
        await this.triggerElectricHammer(data.credited);
        
        // Update UI
        this.loadUserData();
        this.updateBalanceUI(data.credited);
        
        // Show success toast
        this.showSuccessToast(`${t('success')}: +${data.credited.toFixed(2)} ${t('coins')}`);
      } else {
        throw new Error(data.message || 'Collection failed');
      }

    } catch (error) {
      console.error('Collection failed:', error);
      this.showErrorToast(t('collection_failed'));
    } finally {
      this.isCollecting = false;
      if (collectButton) {
        collectButton.disabled = false;
        collectButton.textContent = t('collect');
      }
    }
  }

  // Trigger Electric Hammer animation
  async triggerElectricHammer(amount) {
    const collectButton = document.getElementById('collect-button');
    if (!collectButton) return;

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }

    // Electric Hammer animation
    collectButton.style.transform = 'rotate(-30deg) scale(1.1)';
    collectButton.style.transition = 'all 0.5s ease-out';

    // Create particle effects
    this.createParticleEffects(collectButton, amount);

    // Sound effects
    this.playSoundEffect('coin_chime');

    // Reset button position
    setTimeout(() => {
      collectButton.style.transform = 'rotate(0deg) scale(1)';
    }, 500);
  }

  // Create particle effects
  createParticleEffects(element, amount) {
    const rect = element.getBoundingClientRect();
    const container = document.body;

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.left = `${rect.left + rect.width / 2}px`;
      particle.style.top = `${rect.top + rect.height / 2}px`;
      particle.style.width = '8px';
      particle.style.height = '8px';
      particle.style.background = '#00f3ff';
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '10000';
      particle.style.transition = 'all 1s ease-out';

      // Random direction
      const angle = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 100;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      container.appendChild(particle);

      // Animate
      setTimeout(() => {
        particle.style.transform = `translate(${vx}px, ${vy}px)`;
        particle.style.opacity = '0';
        particle.style.background = '#ffd700';
      }, 10);

      // Remove after animation
      setTimeout(() => {
        container.removeChild(particle);
      }, 1000);
    }
  }

  // Play sound effects
  playSoundEffect(type) {
    if (!window.AudioContext && !window.webkitAudioContext) return;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    if (type === 'coin_chime') {
      this.playCoinChime(audioCtx);
    } else if (type === 'electric_spark') {
      this.playElectricSpark(audioCtx);
    }
  }

  // Play coin chime sound
  playCoinChime(audioCtx) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  }

  // Play electric spark sound
  playElectricSpark(audioCtx) {
    const bufferSize = audioCtx.sampleRate * 0.1; // 0.1 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noise.start();
    noise.stop(audioCtx.currentTime + 0.1);
  }

  // Update balance UI
  updateBalanceUI(amount) {
    const balanceElement = document.getElementById('balance-display');
    if (balanceElement) {
      const currentBalance = parseFloat(balanceElement.dataset.balance || 0);
      const newBalance = currentBalance + amount;
      balanceElement.dataset.balance = newBalance;
      balanceElement.textContent = `${newBalance.toFixed(2)} ${t('coins')}`;
      
      // Animate balance change
      balanceElement.style.color = '#00f3ff';
      setTimeout(() => {
        balanceElement.style.color = '';
      }, 1000);
    }
  }

  // Show success toast
  showSuccessToast(message) {
    // This would integrate with your toast system
    console.log('Success:', message);
  }

  // Show error toast
  showErrorToast(message) {
    // This would integrate with your toast system
    console.error('Error:', message);
  }

  // Stop collection engine
  stop() {
    if (this.chargeMeterInterval) {
      clearInterval(this.chargeMeterInterval);
      this.chargeMeterInterval = null;
    }
    this.isCollecting = false;
  }
}

// Export singleton instance
export const collectionEngine = new CollectionEngine();

// Utility functions for easy use
export const initializeCollectionEngine = async (userId) => {
  return await collectionEngine.initialize(userId);
};

export const performCollection = async () => {
  return await collectionEngine.collectEarnings();
};

// Alias for backward compatibility
export const collectEarnings = performCollection;

export default collectionEngine;