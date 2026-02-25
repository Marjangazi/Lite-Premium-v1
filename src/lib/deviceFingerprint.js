// Device Fingerprinting System for Anti-Fraud Protection
// Combines User-Agent, Screen Resolution, and IP Address for unique device identification

export class DeviceFingerprint {
  constructor() {
    this.fingerprint = null;
    this.isSupported = this.checkSupport();
  }

  // Check if required APIs are supported
  checkSupport() {
    return 'crypto' in window && 'subtle' in window.crypto;
  }

  // Get screen resolution details
  getScreenInfo() {
    return {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight
    };
  }

  // Get browser information
  getBrowserInfo() {
    const nav = navigator;
    return {
      userAgent: nav.userAgent,
      language: nav.language,
      platform: nav.platform,
      cookieEnabled: nav.cookieEnabled,
      onLine: nav.onLine,
      doNotTrack: nav.doNotTrack,
      hardwareConcurrency: nav.hardwareConcurrency || 'unknown',
      maxTouchPoints: nav.maxTouchPoints || 0
    };
  }

  // Get timezone information
  getTimezoneInfo() {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset()
    };
  }

  // Get canvas fingerprint
  getCanvasFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Draw something on canvas to get fingerprint
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device Fingerprint', 2, 2);
    ctx.fillStyle = 'rgb(255,0,255)';
    ctx.fillRect(125, 1, 60, 20);
    
    return canvas.toDataURL();
  }

  // Get WebGL fingerprint
  getWebGLFingerprint() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return null;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      };
    }
    
    return {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER)
    };
  }

  // Get audio context fingerprint
  getAudioFingerprint() {
    return new Promise((resolve) => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const analyser = audioCtx.createAnalyser();
        const gainNode = audioCtx.createGain();
        const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);

        const distortion = audioCtx.createWaveShaper();
        const distortionCurve = new Float32Array(65536);
        for (let i = 0; i < 65536; i++) {
          const x = i * 2 / 65536 - 1;
          distortionCurve[i] = (3 + x * 2) * x * (1 - Math.abs(x)) / 3;
        }
        distortion.curve = distortionCurve;
        distortion.oversample = '4x';

        const whiteNoise = audioCtx.createBufferSource();
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        gainNode.gain.value = 0;
        whiteNoise.connect(distortion);
        distortion.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        scriptProcessor.connect(audioCtx.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;
        oscillator.connect(audioCtx.destination);

        resolve({
          sampleRate: audioCtx.sampleRate,
          currentTime: audioCtx.currentTime
        });
      } catch (error) {
        resolve(null);
      }
    });
  }

  // Generate hash using Web Crypto API
  async generateHash(data) {
    if (!this.isSupported) {
      // Fallback to simple string hash if crypto API not available
      return this.simpleHash(JSON.stringify(data));
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Simple hash function for fallback
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // Generate complete device fingerprint
  async generateFingerprint() {
    if (this.fingerprint) {
      return this.fingerprint;
    }

    const screenInfo = this.getScreenInfo();
    const browserInfo = this.getBrowserInfo();
    const timezoneInfo = this.getTimezoneInfo();
    const canvasFingerprint = this.getCanvasFingerprint();
    const webglFingerprint = this.getWebGLFingerprint();
    const audioFingerprint = await this.getAudioFingerprint();

    const fingerprintData = {
      screen: screenInfo,
      browser: browserInfo,
      timezone: timezoneInfo,
      canvas: canvasFingerprint,
      webgl: webglFingerprint,
      audio: audioFingerprint
    };

    this.fingerprint = await this.generateHash(fingerprintData);
    return this.fingerprint;
  }

  // Store fingerprint in localStorage
  async storeFingerprint() {
    const fingerprint = await this.generateFingerprint();
    localStorage.setItem('device_fingerprint', fingerprint);
    return fingerprint;
  }

  // Get stored fingerprint
  getStoredFingerprint() {
    return localStorage.getItem('device_fingerprint');
  }

  // Validate device fingerprint
  async validateFingerprint() {
    const currentFingerprint = await this.generateFingerprint();
    const storedFingerprint = this.getStoredFingerprint();

    if (!storedFingerprint) {
      // First time user, store fingerprint
      await this.storeFingerprint();
      return { isValid: true, isNewDevice: true };
    }

    const isValid = currentFingerprint === storedFingerprint;
    
    if (!isValid) {
      // Device mismatch detected
      this.logSecurityEvent('device_mismatch', {
        current: currentFingerprint,
        stored: storedFingerprint
      });
    }

    return { isValid, isNewDevice: false };
  }

  // Log security events
  logSecurityEvent(eventType, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      details,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };

    // Store in localStorage
    const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('security_logs', JSON.stringify(logs));

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', logEntry);
    }
  }

  // Clear stored fingerprint (for logout)
  clearFingerprint() {
    localStorage.removeItem('device_fingerprint');
  }

  // Get security logs
  getSecurityLogs() {
    return JSON.parse(localStorage.getItem('security_logs') || '[]');
  }

  // Check for suspicious activity patterns
  async checkSuspiciousActivity() {
    const logs = this.getSecurityLogs();
    const recentLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const now = new Date();
      return (now - logTime) < 15 * 60 * 1000; // Last 15 minutes
    });

    const mismatchCount = recentLogs.filter(log => log.eventType === 'device_mismatch').length;
    
    return {
      isSuspicious: mismatchCount > 3,
      mismatchCount,
      recentEvents: recentLogs.length
    };
  }
}

// Create singleton instance
export const deviceFingerprint = new DeviceFingerprint();

// Utility functions for easy use
export const getDeviceFingerprint = async () => {
  return await deviceFingerprint.generateFingerprint();
};

// Alias for backward compatibility
export const generateDeviceFingerprint = getDeviceFingerprint;

export const validateDevice = async () => {
  return await deviceFingerprint.validateFingerprint();
};

export const clearDeviceFingerprint = () => {
  deviceFingerprint.clearFingerprint();
};

export const checkSuspiciousActivity = async () => {
  return await deviceFingerprint.checkSuspiciousActivity();
};

// Device fingerprint middleware for API calls
export const deviceFingerprintMiddleware = async (request) => {
  const fingerprint = await getDeviceFingerprint();
  
  // Add fingerprint to request headers
  request.headers = {
    ...request.headers,
    'X-Device-Fingerprint': fingerprint
  };

  return request;
};

// Export for use in components
export default deviceFingerprint;