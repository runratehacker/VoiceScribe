// Boiler plate code for audio playback

// Browser microphone - Float32Array
// Gemini - Int16Array
// Internet - Base64

// Gemini sends the res in chunks in // this function 
// takes that chucks and plays them to the user 

// Functions inside it helps in seamless voice playback and interaction


import { useRef, useCallback, useEffect } from 'react';
import { base64ToInt16, int16ToFloat32 } from '../utils/audioUtils';

export const useAudioPlayback = () => {
  const playbackCtxRef = useRef(null);
  const playbackQueueRef = useRef([]);
  const isPlaybackActiveRef = useRef(false);
  const currentPlaybackSourceRef = useRef(null);
  // Store playNextChunk in a ref to avoid stale closure in src.onended
  const playNextChunkRef = useRef(null);

  const ensurePlaybackContext = useCallback(() => {
    if (!playbackCtxRef.current || playbackCtxRef.current.state === "closed") {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
    }
    return playbackCtxRef.current;
  }, []);

  const playNextChunk = useCallback(async () => {
    if (isPlaybackActiveRef.current) return;
    if (playbackQueueRef.current.length === 0) return;

    isPlaybackActiveRef.current = true;

    try {
      const ctx = ensurePlaybackContext();
      // Browsers require user gesture before audio context starts. Resume if suspended.
      if (ctx.state === "suspended") await ctx.resume();

      const float32 = playbackQueueRef.current.shift();
      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      currentPlaybackSourceRef.current = src;

      // Use ref to avoid stale closure — always calls the latest version
      src.onended = () => {
        currentPlaybackSourceRef.current = null;
        isPlaybackActiveRef.current = false;
        playNextChunkRef.current?.();
      };

      src.start(0);
    } catch (e) {
      console.error("Playback error:", e);
      isPlaybackActiveRef.current = false;
      currentPlaybackSourceRef.current = null;
    }
  }, [ensurePlaybackContext]);

  // Keep the ref in sync with the latest function instance
  useEffect(() => {
    playNextChunkRef.current = playNextChunk;
  }, [playNextChunk]);

  const enqueueAudio = useCallback((b64) => {
    const int16 = base64ToInt16(b64);
    const float32 = int16ToFloat32(int16);
    playbackQueueRef.current.push(float32);
    // Trigger playback — safe to call even if already playing
    playNextChunkRef.current?.();
  }, []);

  const stopPlayback = useCallback(() => {
    playbackQueueRef.current = [];
    isPlaybackActiveRef.current = false;

    if (currentPlaybackSourceRef.current) {
      try { currentPlaybackSourceRef.current.stop(); } catch { }
      currentPlaybackSourceRef.current = null;
    }

    if (playbackCtxRef.current && playbackCtxRef.current.state !== "closed") {
      playbackCtxRef.current.close();
      playbackCtxRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  return { enqueueAudio, stopPlayback };
};

