import { API_BASE_URL } from '../config';

// Settings and constants for the Gemini Live connection


// The Gemini model we're connecting to
export const GEMINI_MODEL = "models/gemini-3.1-flash-live-preview";

// Where we get our temporary access tokens
export const getTokenApiUrl = (model) => `${API_BASE_URL}/api/live/token?model=${encodeURIComponent(model)}`;

// How many times and how fast to retry if the connection drops
export const MAX_RECONNECT_RETRIES = 3;
export const BASE_RECONNECT_DELAY_MS = 1000; // 1s → 2s → 4s exponential backoff

// Grab a new token 5 minutes before the old one dies
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

// Voice and AI behavior settings
export const VOICE_NAME = "Aoede";
export const TEMPERATURE = 0.2;
export const MAX_OUTPUT_TOKENS = 2048;

// Context window compression — keeps long sessions alive without hitting the token limit.
// The API starts compressing (dropping oldest turns) once the context reaches COMPRESSION_TRIGGER_TOKENS.
// After compression, it retains only COMPRESSION_TARGET_TOKENS worth of history.
// System instructions are always preserved regardless of compression.
export const COMPRESSION_TRIGGER_TOKENS = 9000; // Start compressing at ~15k tokens
export const COMPRESSION_TARGET_TOKENS = 6500;  // Keep ~8k tokens after compression

// How many questions Gemini answers before we hard-reset the session for a clean context window.
// Lower = fresher context, more reconnect overhead. Set to 0 to disable.
export const SESSION_RESET_EVERY_N_QUESTIONS = 2;


// Creates the full WebSocket URL using our token

export const buildWsUrl = (token) => {
  return (
    "wss://generativelanguage.googleapis.com/ws/" +
    "google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained" +
    `?access_token=${encodeURIComponent(token)}`
  );
};


// Builds the very first message we send to Gemini with instructions and tools
// System prompt 

export const buildSetupMessage = (systemPromptText, tools, { sessionHandle, isReconnect } = {}) => {
  const setupMessage = {
    setup: {
      model: GEMINI_MODEL,
      systemInstruction: {
        parts: [{ text: systemPromptText }],
      },
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } },
        },
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        thinkingConfig: {
          thinkingLevel: "low", // Ask Gemini to think more deeply about its responses
          // thinkingbudget : 2048  is not supported in gemini 3.1 flash live preview
        },
      },
      tools,
      contextWindowCompression: {
        triggerTokens: COMPRESSION_TRIGGER_TOKENS,
        slidingWindow: {
          targetTokens: COMPRESSION_TARGET_TOKENS,
        },
      },
      realtimeInputConfig: {
        automaticActivityDetection: {
          startOfSpeechSensitivity: "START_SENSITIVITY_LOW",   // Don't trigger on tiny noises
          endOfSpeechSensitivity: "END_SENSITIVITY_LOW",       // Wait longer before assuming user stopped
          silenceDurationMs: 1000,    // 1 sec of silence before Gemini responds
          prefixPaddingMs: 200,       // Capture 300ms before speech starts (prevents clipping)
        }
      }
    },
  };

  if (sessionHandle) {
    setupMessage.setup.sessionResumption = {
      sessionHandle: sessionHandle
    };
  }

  return setupMessage;
};
