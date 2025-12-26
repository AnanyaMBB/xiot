/**
 * React hook for Pi multimedia features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import piMultimediaService from '../services/piMultimedia';

/**
 * Hook for managing Pi multimedia connections
 * @param {string} piUrl - Base URL of Pi multimedia server
 */
export function usePiMultimedia(piUrl = null) {
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState(null);
  
  const connectionCheckInterval = useRef(null);

  // Set Pi URL when provided
  useEffect(() => {
    if (piUrl) {
      piMultimediaService.setPiUrl(piUrl);
    }
  }, [piUrl]);

  // Check connection status periodically (only when not obviously disconnected)
  useEffect(() => {
    let lastConnectedState = false;
    let failedAttempts = 0;
    const MAX_FAILED_BEFORE_SLOW = 3;
    
    const checkConnection = async () => {
      try {
        const connected = await piMultimediaService.checkConnection();
        setIsConnected(connected);
        
        if (connected) {
          failedAttempts = 0;
          if (!videoUrl) {
            setVideoUrl(piMultimediaService.getVideoUrl());
          }
        } else {
          failedAttempts++;
        }
        lastConnectedState = connected;
      } catch {
        setIsConnected(false);
        failedAttempts++;
      }
    };

    // Initial check
    checkConnection();
    
    // Dynamic interval - check less frequently if consistently offline
    const scheduleNextCheck = () => {
      const interval = failedAttempts >= MAX_FAILED_BEFORE_SLOW ? 30000 : 10000;
      connectionCheckInterval.current = setTimeout(() => {
        checkConnection().then(scheduleNextCheck);
      }, interval);
    };
    
    scheduleNextCheck();

    return () => {
      if (connectionCheckInterval.current) {
        clearTimeout(connectionCheckInterval.current);
      }
    };
  }, [piUrl]);

  // Start video stream
  const startVideo = useCallback(() => {
    setVideoUrl(piMultimediaService.getVideoUrl());
    setIsVideoPlaying(true);
    setError(null);
  }, []);

  // Stop video stream
  const stopVideo = useCallback(() => {
    setVideoUrl('');
    setIsVideoPlaying(false);
  }, []);

  // Start listening to Pi audio
  const startAudio = useCallback(() => {
    try {
      piMultimediaService.startAudioPlayback();
      setIsAudioPlaying(true);
      setError(null);
    } catch (err) {
      setError('Failed to start audio playback');
      console.error(err);
    }
  }, []);

  // Stop listening to Pi audio
  const stopAudio = useCallback(() => {
    piMultimediaService.stopAudioPlayback();
    setIsAudioPlaying(false);
  }, []);

  // Start push-to-talk
  const startPushToTalk = useCallback(async () => {
    try {
      const success = await piMultimediaService.startPushToTalk();
      setIsPushToTalkActive(success);
      if (!success) {
        setError('Failed to start push-to-talk');
      } else {
        setError(null);
      }
      return success;
    } catch (err) {
      setError('Push-to-talk error');
      console.error(err);
      return false;
    }
  }, []);

  // Stop push-to-talk
  const stopPushToTalk = useCallback(() => {
    piMultimediaService.stopPushToTalk();
    setIsPushToTalkActive(false);
  }, []);

  // Send LCD command
  const sendLcdCommand = useCallback(async (text, color = 'WHITE', alarm = false) => {
    try {
      const success = await piMultimediaService.sendLcdCommand(text, color, alarm);
      if (!success) {
        setError('Failed to send LCD command');
      } else {
        setError(null);
      }
      return success;
    } catch (err) {
      setError('LCD command error');
      console.error(err);
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      piMultimediaService.stopAudioPlayback();
      piMultimediaService.stopPushToTalk();
    };
  }, []);

  return {
    // Connection status
    isConnected,
    error,
    
    // Video
    videoUrl,
    isVideoPlaying,
    startVideo,
    stopVideo,
    
    // Audio (Pi -> Interface)
    isAudioPlaying,
    startAudio,
    stopAudio,
    
    // Push-to-talk (Interface -> Pi)
    isPushToTalkActive,
    startPushToTalk,
    stopPushToTalk,
    
    // LCD control
    sendLcdCommand,
  };
}

export default usePiMultimedia;

