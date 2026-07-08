
// Settings and constants for the Gemini Live connection


// The Gemini model we're connecting to
export const GEMINI_MODEL = "models/gemini-3.1-flash-live-preview";

// Where we get our temporary access tokens
export const TOKEN_API_URL = "http://localhost:8044/api/live/token";

// How many times and how fast to retry if the connection drops
export const MAX_RECONNECT_RETRIES = 3;
export const BASE_RECONNECT_DELAY_MS = 1000; // 1s → 2s → 4s exponential backoff

// Grab a new token 5 minutes before the old one dies
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

// Voice and AI behavior settings
export const VOICE_NAME = "Aoede";
export const TEMPERATURE = 0.2;
export const MAX_OUTPUT_TOKENS = 2048;


// Creates the full WebSocket URL using our token

export const buildWsUrl = (token) => {
  return (
    "wss://generativelanguage.googleapis.com/ws/" +
    "google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained" +
    `?access_token=${encodeURIComponent(token)}`
  );
};


// Builds the very first message we send to Gemini with instructions and tools

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
          thinkingBudget: 2048, // Give the AI more time to think deeply
        },
      },
      tools,
    },
  };

  // If we have an old session ID, tell Gemini to resume that conversation
  if (sessionHandle) {
    // Tell the API we want to resume
    setupMessage.setup.sessionResumption = {
      sessionHandle: sessionHandle
    };
  }

  return setupMessage;
};
