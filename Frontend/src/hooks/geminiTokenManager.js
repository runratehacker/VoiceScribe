// Manages getting and refreshing temporary access tokens
// This makes sure the connection doesn't randomly die during a long exam

import { useRef, useCallback } from 'react';
import axios from 'axios';
import { getTokenApiUrl, TOKEN_REFRESH_BUFFER_MS, GEMINI_MODEL } from './geminiConfig';

export const useGeminiToken = () => {
  const tokenRef = useRef(null);                  // The actual token string
  const tokenExpiryRef = useRef(null);            // When the token dies
  const tokenRefreshTimerRef = useRef(null);      // Timer to fetch a new token
  const tokenLimitsRef = useRef({ inputTokenLimit: 2000000, outputTokenLimit: 8192 }); // Default fallback limits

  // Asks our backend for a brand new token
  const fetchToken = useCallback(async () => {

    const { data } = await axios.get(getTokenApiUrl(GEMINI_MODEL.replace('models/', '')));

    if (!data?.token) throw new Error("Ephemeral token missing from backend response");
    tokenRef.current = data.token;
    
    if (data.inputTokenLimit) {
      tokenLimitsRef.current = {
        inputTokenLimit: data.inputTokenLimit,
        outputTokenLimit: data.outputTokenLimit
      };
    }

    // Save when it expires so we know when to grab the next one
    if (data.expireTime) {
      tokenExpiryRef.current = new Date(data.expireTime);
    }
    return data.token;
  }, []);

  // Sets an alarm to refresh the token 5 minutes before it dies
  const scheduleTokenRefresh = useCallback(() => {
    // Stop any old timers so we don't fetch twice
    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = null;
    }

    if (!tokenExpiryRef.current) return;

    const msUntilExpiry = tokenExpiryRef.current.getTime() - Date.now();
    const refreshIn = Math.max(msUntilExpiry - TOKEN_REFRESH_BUFFER_MS, 0);

    console.log(`Token refresh scheduled in ${Math.round(refreshIn / 1000)}s (expires in ${Math.round(msUntilExpiry / 1000)}s)`);

    tokenRefreshTimerRef.current = setTimeout(async () => {
      try {
        console.log("Proactively refreshing ephemeral token...");
        await fetchToken();
        // Do it all over again for the new token
        scheduleTokenRefresh();
        console.log("Token refreshed successfully. New expiry:", tokenExpiryRef.current?.toISOString());
      } catch (err) {
        console.error("Token refresh failed:", err);
        // We'll just try again next time
      }
    }, refreshIn);
  }, [fetchToken]);


  // Stops the automatic token fetching
  const clearTokenRefreshTimer = useCallback(() => {
    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = null;
    }
  }, []);

  return {
    tokenRef,
    tokenLimitsRef,
    fetchToken,
    scheduleTokenRefresh,
    clearTokenRefreshTimer,
  };
};
