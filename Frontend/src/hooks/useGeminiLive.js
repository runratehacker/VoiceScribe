
// Main hook that handles the WebSocket connection between our app and Gemini.
// We split the logic into smaller files (like geminiConfig, geminiTools, etc.) to keep this clean.

import { useState, useRef, useCallback, useEffect } from 'react';
import { geminiTools } from './geminiTools';
import { getSetupPrompt, getCompletionPrompt } from './geminiPrompts';
import { processToolCalls } from './geminiToolHandlers';
import { buildWsUrl, buildSetupMessage, MAX_RECONNECT_RETRIES, BASE_RECONNECT_DELAY_MS } from './geminiConfig';
import { useGeminiToken } from './geminiTokenManager';
import { parseWsMessage, categorizeMessage, MSG_TYPES } from './geminiMessageParser';

export const useGeminiLive = ({ onFieldFilled, onFieldReset, onAudioReceived, formFields, currentKey, onNextQuestion, onPrevQuestion, onGoToQuestion }) => {
  const [wsState, setWsState] = useState("idle"); // "idle" | "connecting" | "connected" | "ready" | "reconnecting" | "error"
  const [messages, setMessages] = useState([]);
  const [tokenStats, setTokenStats] = useState({
    contextSize: { prompt: 0, response: 0, total: 0 },
    billedTokens: { prompt: 0, response: 0, total: 0 },
    limits: { inputTokenLimit: 2000000, outputTokenLimit: 8192 },
    contextPercentage: 0
  });

  const liveWsRef = useRef(null);
  const isLiveReadyRef = useRef(false);
  const sessionHandleRef = useRef(null);

  // Keep track of connection attempts and timers
  const userDisconnectedRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const connectPromiseRef = useRef({ resolve: null, reject: null });

  // Manage our temporary access tokens so they don't expire mid-exam
  const { tokenRef, tokenLimitsRef, fetchToken, scheduleTokenRefresh, clearTokenRefreshTimer } = useGeminiToken();

  // Store the latest form data in a ref so the WebSocket doesn't use old data
  const stateRef = useRef({ formFields, currentKey });
  useEffect(() => {
    stateRef.current = { formFields, currentKey };
  }, [formFields, currentKey]);

  // The actual logic that opens the WebSocket and handles messages
  const _connectInternal = useCallback(({ isReconnect = false, resolve, reject }) => {
    const wsUrl = buildWsUrl(tokenRef.current);

    liveWsRef.current = new WebSocket(wsUrl);
    if (!isReconnect) {
      setWsState("connecting");
    }

    // When connected, immediately send Gemini its instructions and tools
    liveWsRef.current.onopen = () => {
      setWsState("connected");
      console.log(`Live WS ${isReconnect ? 're' : ''}connected`);

      const systemPrompt = getSetupPrompt(
        stateRef.current.formFields ?? formFields,
        stateRef.current.currentKey
      );

      const setupMessage = buildSetupMessage(systemPrompt, geminiTools, {
        sessionHandle: sessionHandleRef.current,
        isReconnect,
      });

      liveWsRef.current.send(JSON.stringify(setupMessage));
    };

    // Handle any message Gemini sends back
    liveWsRef.current.onmessage = async (event) => {

      const msg = await parseWsMessage(event.data);
      if (!msg) return;

      const { type, data } = categorizeMessage(msg);

      switch (type) {
        // Save the session ID in case we need to reconnect later
        case MSG_TYPES.SESSION_HANDLE:
          sessionHandleRef.current = data;
          console.log("Saved session handle:", data);
          break;

        // Setup is done, so we can start sending audio
        case MSG_TYPES.SETUP_COMPLETE:
          isLiveReadyRef.current = true;
          reconnectAttemptRef.current = 0;
          setWsState("ready");
          if (isReconnect) {
            console.log("Session resumed successfully after reconnection");
          } else {
            console.log("✅ Brand new session started successfully!");
          }
          if (resolve) resolve();
          else if (connectPromiseRef.current.resolve) {
            connectPromiseRef.current.resolve();
            connectPromiseRef.current = { resolve: null, reject: null };
          }
          break;

        // Gemini sent us audio or text to play back
        case MSG_TYPES.MODEL_OUTPUT: {
          const { textParts, audioParts } = data;

          if (textParts) {
            setMessages((prev) => [...prev, { role: "AI", text: textParts }]);
          }

          for (const p of audioParts) {
            const mime = p.inlineData?.mimeType || "";
            const audioData = p.inlineData?.data;
            if (audioData && mime.startsWith("audio/pcm")) {
              if (onAudioReceived) {
                onAudioReceived(audioData);
              }
            }
          }
          break;
        }

        // Gemini wants to use one of our tools (like filling a field or going to the next question)
        case MSG_TYPES.TOOL_CALL: {
          const toolResponses = processToolCalls(data, stateRef, {
            onFieldFilled,
            onFieldReset,
            onNextQuestion,
            onPrevQuestion,
            onGoToQuestion,
            setMessages,
          });

          if (toolResponses.length > 0 && liveWsRef.current?.readyState === WebSocket.OPEN) {
            liveWsRef.current.send(JSON.stringify({
              toolResponse: { functionResponses: toolResponses },
            }));
          }
          break;
        }

        case MSG_TYPES.TOKEN_USAGE: {
          setTokenStats((prev) => {
            // Include total if provided by the API, otherwise calculate it
            const total = data.totalTokenCount ||
              (data.promptTokenCount || 0) + (data.responseTokenCount || 0) + (data.cachedContentTokenCount || 0);

            const newContext = {
              promptTokenCount: data.promptTokenCount || 0,
              cachedContentTokenCount: data.cachedContentTokenCount || 0,
              responseTokenCount: data.responseTokenCount || 0,
              toolUsePromptTokenCount: data.toolUsePromptTokenCount || 0,
              thoughtsTokenCount: data.thoughtsTokenCount || 0,
              totalTokenCount: total,
              promptTokensDetails: data.promptTokensDetails || [],
              cacheTokensDetails: data.cacheTokensDetails || [],
              responseTokensDetails: data.responseTokensDetails || [],
              toolUsePromptTokensDetails: data.toolUsePromptTokensDetails || [],
            };

            const newBilled = {
              prompt: prev.billedTokens.prompt + newContext.promptTokenCount,
              response: prev.billedTokens.response + newContext.responseTokenCount,
              total: prev.billedTokens.total + total,
            };

            const limits = tokenLimitsRef.current;
            const contextPercentage = limits.inputTokenLimit > 0
              ? Number(((total / limits.inputTokenLimit) * 100).toFixed(4))
              : 0;

            // Log a detailed analytics block to the browser console
            console.log(`📊 Gemini Token Analytics (Used: ${contextPercentage}%)`);

            // Extract just the numerical counts for a clean table
            const tableData = {
              "Prompt Tokens": newContext.promptTokenCount,
              "Cached Content Tokens": newContext.cachedContentTokenCount,
              "Response Tokens": newContext.responseTokenCount,
              "Tool Use Prompt Tokens": newContext.toolUsePromptTokenCount,
              "Thoughts Tokens": newContext.thoughtsTokenCount,
              "Total Tokens (This Turn)": newContext.totalTokenCount,
              "Context Limit": limits.inputTokenLimit,
            };

            console.table(tableData);

            // Log the detailed arrays separately so they don't mess up the table format
            console.log("Prompt Details:", newContext.promptTokensDetails);
            console.log("Cache Details:", newContext.cacheTokensDetails);
            console.log("Response Details:", newContext.responseTokensDetails);
            console.log("Tool Use Prompt Details:", newContext.toolUsePromptTokensDetails);

            return { contextSize: newContext, billedTokens: newBilled, limits, contextPercentage };
          });
          break;
        }

        default:
          console.log("Unhandled Live message:", msg);
      }
    };

    // Handle socket errors
    liveWsRef.current.onerror = (e) => {
      console.log("Live WS error", e);
      // We only reject here if this is our very first attempt connecting
      if (!isReconnect && reject) {
        setWsState("error");
        reject(e);
      }
    };

    // If the socket closes, try to figure out why and reconnect if needed
    liveWsRef.current.onclose = (e) => {
      isLiveReadyRef.current = false;
      console.log("Live WS closed", e.code, e.reason);

      // If the user manually clicked stop, just stay disconnected
      if (userDisconnectedRef.current) {
        setWsState("idle");
        return;
      }

      // If Google rejected our old session ID, clear it so we can start fresh
      if (sessionHandleRef.current && (!isReconnect || reconnectAttemptRef.current === 0)) {
        console.warn("Session resumption failed (handle rejected). Clearing session and trying fresh.");
        sessionHandleRef.current = null;
      }

      // Try to auto-reconnect since it wasn't the user's fault
      console.log(`Unexpected WebSocket close (code: ${e.code}). Will attempt reconnection...`);
      attemptReconnect();
    };
  }, [onFieldFilled, onFieldReset, onAudioReceived, onNextQuestion, onPrevQuestion, onGoToQuestion, formFields, tokenRef]);

  // Tries to reconnect automatically if the connection drops
  const attemptReconnect = useCallback(async () => {
    if (userDisconnectedRef.current) return;

    if (reconnectAttemptRef.current >= MAX_RECONNECT_RETRIES) {
      console.error(`Max reconnection retries (${MAX_RECONNECT_RETRIES}) reached. Giving up.`);
      setWsState("error");
      setMessages((prev) => [
        ...prev,
        { role: "AI", text: "⚠️ Connection lost. Please click the mic button to reconnect." },
      ]);

      if (connectPromiseRef.current.reject) {
        connectPromiseRef.current.reject(new Error("Max retries reached"));
        connectPromiseRef.current = { resolve: null, reject: null };
      }
      return;
    }

    reconnectAttemptRef.current += 1;
    const attempt = reconnectAttemptRef.current;
    const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s

    console.log(`Reconnection attempt ${attempt}/${MAX_RECONNECT_RETRIES} in ${delay}ms...`);
    setWsState("reconnecting");

    reconnectTimerRef.current = setTimeout(async () => {
      try {
        // Grab a new token just in case the old one expired
        await fetchToken();
        scheduleTokenRefresh();

        // Try connecting again
        _connectInternal({ isReconnect: true, resolve: null, reject: null });
      } catch (err) {
        console.error(`Reconnection attempt ${attempt} failed:`, err);
        if (reconnectAttemptRef.current < MAX_RECONNECT_RETRIES) {
          attemptReconnect();
        } else {
          setWsState("error");
          setMessages((prev) => [
            ...prev,
            { role: "AI", text: "⚠️ Connection lost. Please click the mic button to reconnect." },
          ]);
          if (connectPromiseRef.current.reject) {
            connectPromiseRef.current.reject(err);
            connectPromiseRef.current = { resolve: null, reject: null };
          }
        }
      }
    }, delay);
  }, [fetchToken, scheduleTokenRefresh, _connectInternal]);

  // Connects to Gemini. This is called when the user clicks the mic button.
  const connect = useCallback(() => {
    return new Promise(async (resolve, reject) => {
      try {
        // Save these so we can resolve them later if we have to auto-reconnect
        connectPromiseRef.current = { resolve, reject };

        // Reset our retry counters and tokens
        userDisconnectedRef.current = false;
        reconnectAttemptRef.current = 0;
        setTokenStats({
          contextSize: { prompt: 0, response: 0, total: 0 },
          billedTokens: { prompt: 0, response: 0, total: 0 },
          limits: tokenLimitsRef.current,
          contextPercentage: 0
        });

        // Get a fresh token
        await fetchToken();
        scheduleTokenRefresh();

        _connectInternal({ isReconnect: false, resolve, reject });
      } catch (err) {
        console.error("Gemini connection error:", err);
        setWsState("error");
        reject(err);
        connectPromiseRef.current = { resolve: null, reject: null };
      }
    });
  }, [fetchToken, scheduleTokenRefresh, _connectInternal]);

  // Stops everything. Called when the user clicks stop or leaves the page.
  const disconnect = useCallback(() => {
    // Let the app know the user did this on purpose so it doesn't try to reconnect
    userDisconnectedRef.current = true;

    // Stop any pending reconnection attempts
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Stop refreshing the token in the background
    clearTokenRefreshTimer();

    // Reset the retry count
    reconnectAttemptRef.current = 0;

    if (liveWsRef.current && liveWsRef.current.readyState === WebSocket.OPEN) {
      try {
        liveWsRef.current.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      } catch { }
    }

    isLiveReadyRef.current = false;

    if (liveWsRef.current && (liveWsRef.current.readyState === WebSocket.OPEN || liveWsRef.current.readyState === WebSocket.CONNECTING)) {
      liveWsRef.current.close(1000, "User stopped");
    }
    liveWsRef.current = null;
    setWsState("idle");
  }, [clearTokenRefreshTimer]);

  // Sends microphone audio data to Gemini
  const sendAudioChunk = useCallback((base64Pcm16) => {
    if (!isLiveReadyRef.current) return;
    if (!liveWsRef.current || liveWsRef.current.readyState !== WebSocket.OPEN) return;

    liveWsRef.current.send(JSON.stringify({
      realtimeInput: {
        audio: {
          mimeType: "audio/pcm",
          data: base64Pcm16,
        },
      },
    }));
  }, []);

  // Sends a hidden text message to remind Gemini of its instructions
  // const sendSystemReminder = useCallback(() => {
  //   if (!isLiveReadyRef.current || !liveWsRef.current || liveWsRef.current.readyState !== WebSocket.OPEN) return;

  //   liveWsRef.current.send(JSON.stringify({
  //     clientContent: {
  //       turns: [
  //         {
  //           role: "user",
  //           parts: [{ text: getSystemReminderPrompt(formFields, stateRef.current.currentKey) }],
  //         },
  //       ],
  //       turnComplete: true,
  //     },
  //   }));
  // }, [formFields]);

  // Fire the reminder every 3 minutes so Gemini stays on track
  // useEffect(() => {
  //   let intervalId;
  //   if (wsState === "ready") {
  //     intervalId = setInterval(() => {
  //       sendSystemReminder();
  //     }, 3 * 60 * 1000); // 3 minutes
  //   }
  //   return () => {
  //     if (intervalId) clearInterval(intervalId);
  //   };
  // }, [wsState, sendSystemReminder]);

  // Tells Gemini the exam is over so it can say goodbye

  const sendCompletionMessage = useCallback(() => {
    if (!isLiveReadyRef.current || !liveWsRef.current || liveWsRef.current.readyState !== WebSocket.OPEN) return;

    liveWsRef.current.send(JSON.stringify({
      clientContent: {
        turns: [
          {
            role: "user",
            parts: [{ text: getCompletionPrompt() }],
          },
        ],
        turnComplete: true,
      },
    }));
  }, []);

  // Cleanup everything when this component unmounts
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      clearTokenRefreshTimer();
      disconnect();
    };
  }, [disconnect, clearTokenRefreshTimer]);

  return { connect, disconnect, sendAudioChunk, sendCompletionMessage, messages, wsState, tokenStats };
};

export default useGeminiLive;
