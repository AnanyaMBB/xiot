/**
 * Pi Multimedia Service
 * Handles video streaming, bidirectional audio, and LCD control
 */

// Default Pi server URL - can be overridden via environment variable
const DEFAULT_PI_URL = import.meta.env.VITE_PI_SERVER_URL || 'http://192.168.137.110:8080';

class PiMultimediaService {
  constructor() {
    this.piUrl = DEFAULT_PI_URL;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioSocket = null;
    this.isRecording = false;
    this.audioElement = null;
    this.mqttClient = null;
  }

  /**
   * Set the Pi server URL
   * @param {string} url - Base URL of the Pi multimedia server
   */
  setPiUrl(url) {
    this.piUrl = url.replace(/\/$/, ''); // Remove trailing slash
    console.log('[Pi] Server URL set to:', this.piUrl);
  }

  /**
   * Get video stream URL
   * @returns {string} MJPEG video stream URL
   */
  getVideoUrl() {
    return `${this.piUrl}/video`;
  }

  /**
   * Get audio stream URL (Pi -> Interface)
   * @returns {string} MP3 audio stream URL
   */
  getAudioUrl() {
    return `${this.piUrl}/audio`;
  }

  /**
   * Get WebSocket URL for audio input (Interface -> Pi)
   * @returns {string} WebSocket URL
   */
  getAudioWebSocketUrl() {
    const wsUrl = this.piUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${wsUrl}/ws/audio`;
  }

  /**
   * Start playing audio from Pi
   * @returns {HTMLAudioElement} Audio element
   */
  startAudioPlayback() {
    if (this.audioElement) {
      this.audioElement.pause();
    }

    this.audioElement = new Audio(this.getAudioUrl());
    this.audioElement.crossOrigin = 'anonymous';
    
    this.audioElement.addEventListener('error', (e) => {
      console.error('[Pi Audio] Playback error:', e);
    });

    this.audioElement.addEventListener('playing', () => {
      console.log('[Pi Audio] Playback started');
    });

    this.audioElement.play().catch(err => {
      console.error('[Pi Audio] Failed to start playback:', err);
    });

    return this.audioElement;
  }

  /**
   * Stop audio playback
   */
  stopAudioPlayback() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
      console.log('[Pi Audio] Playback stopped');
    }
  }

  /**
   * Start push-to-talk (recording and sending audio to Pi)
   * @returns {Promise<boolean>} Success status
   */
  async startPushToTalk() {
    if (this.isRecording) {
      console.warn('[Pi Audio] Already recording');
      return false;
    }

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Connect WebSocket to Pi
      this.audioSocket = new WebSocket(this.getAudioWebSocketUrl());
      
      this.audioSocket.onopen = () => {
        console.log('[Pi Audio] WebSocket connected for push-to-talk');
      };

      this.audioSocket.onerror = (err) => {
        console.error('[Pi Audio] WebSocket error:', err);
      };

      this.audioSocket.onclose = () => {
        console.log('[Pi Audio] WebSocket closed');
      };

      // Wait for WebSocket to open
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
        this.audioSocket.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };
        this.audioSocket.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('WebSocket connection failed'));
        };
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.audioSocket?.readyState === WebSocket.OPEN) {
          this.audioSocket.send(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording with small time slices for low latency
      this.mediaRecorder.start(100); // 100ms chunks
      this.isRecording = true;
      console.log('[Pi Audio] Push-to-talk started');
      return true;

    } catch (err) {
      console.error('[Pi Audio] Failed to start push-to-talk:', err);
      this.stopPushToTalk();
      return false;
    }
  }

  /**
   * Stop push-to-talk
   */
  stopPushToTalk() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;

    if (this.audioSocket) {
      this.audioSocket.close();
      this.audioSocket = null;
    }

    this.isRecording = false;
    console.log('[Pi Audio] Push-to-talk stopped');
  }

  /**
   * Send LCD display command via backend API
   * @param {string} text - Text to display
   * @param {string} color - Background color (RED, GREEN, BLUE, WHITE, etc.)
   * @param {boolean} alarm - Enable alarm mode
   * @returns {Promise<boolean>} Success status
   */
  async sendLcdCommand(text, color = 'WHITE', alarm = false) {
    try {
      // Send via backend API which will publish to MQTT
      const response = await fetch('/api/lcd/command/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, color, alarm })
      });

      if (response.ok) {
        console.log('[Pi LCD] Command sent:', { text, color, alarm });
        return true;
      } else {
        console.error('[Pi LCD] Command failed:', response.status);
        return false;
      }
    } catch (err) {
      console.error('[Pi LCD] Error sending command:', err);
      return false;
    }
  }

  /**
   * Check if Pi server is reachable
   * @returns {Promise<boolean>} Connection status
   */
  async checkConnection() {
    try {
      const response = await fetch(`${this.piUrl}/health`, {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
const piMultimediaService = new PiMultimediaService();

export default piMultimediaService;

