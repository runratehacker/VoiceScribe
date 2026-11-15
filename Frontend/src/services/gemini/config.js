import { API_BASE_URL } from '../../config';


const geminiModel = "models/gemini-3.1-flash-live-preview";


const getTokenApiUrl = () => `${API_BASE_URL}/api/live/token`;


const maxRetries = 3;
const reconnectTime = 1000;

const tokenRefreshBuffer = 5 * 60 * 1000;

const voiceName = "Aoede";
const temperature = 0.2;
const maxOutputTokens = 2048;

const resEveryNQuestions = 5;

const buildWsUrl = (token) => {
  return (
    "wss://generativelanguage.googleapis.com/ws/" +
    "google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained" +
    `?access_token=${encodeURIComponent(token)}`
  );
};

// System prompt 

const buildSetupMessage = (systemPromptText, tools, { sessionHandle } = {}) => {

  const setupMessage = {

    setup: {

      model: geminiModel,

      systemInstruction: {
        parts: [{ text: systemPromptText }],
      },

      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
        },

        temperature: temperature,
        maxOutputTokens: maxOutputTokens,
        thinkingConfig: {
          thinkingLevel: "LOW",
        },

      },

      tools,

      sessionResumption: sessionHandle ? { handle: sessionHandle } : {},

      realtimeInputConfig: {

        automaticActivityDetection: {
          startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
          endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
          silenceDurationMs: 1000,
          prefixPaddingMs: 200,
        }

      }
    },
  };

  return setupMessage;
};

export {
  geminiModel,
  getTokenApiUrl,
  maxRetries,
  reconnectTime,
  tokenRefreshBuffer,
  voiceName,
  temperature,
  maxOutputTokens,
  resEveryNQuestions,
  buildWsUrl,
  buildSetupMessage,
};
