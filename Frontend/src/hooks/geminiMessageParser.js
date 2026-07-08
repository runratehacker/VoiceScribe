
// Helper functions to read and understand the raw data Gemini sends over the WebSocket



// Converts the raw network data from Gemini into a normal JSON object

export const parseWsMessage = async (rawData) => {
  let raw = rawData;
  try {
    if (raw instanceof Blob) {
      raw = await raw.text();
    } else if (raw instanceof ArrayBuffer) {
      raw = new TextDecoder().decode(raw);
    }
    return JSON.parse(raw);
  } catch (e) {
    console.log("WS message parse failed:", rawData);
    return null;
  }
};


// The different types of messages Gemini can send us

export const MSG_TYPES = {
  SESSION_HANDLE: 'sessionHandle',   // Gemini gave us an ID to remember this conversation
  SETUP_COMPLETE: 'setupComplete',   // Gemini is ready to start listening
  MODEL_OUTPUT: 'modelOutput',       // Gemini is speaking or sending text
  TOOL_CALL: 'toolCall',             // Gemini wants us to do something (like fill a form)
  UNKNOWN: 'unknown',                // We don't know what this is
};


// Looks at the message and figures out what kind of message it is.
// This keeps our main WebSocket code clean and easy to read.

export const categorizeMessage = (msg) => {
  // 1) Gemini sent a conversation ID
  if (msg.sessionResumptionUpdate?.newHandle) {
    return {
      type: MSG_TYPES.SESSION_HANDLE,
      data: msg.sessionResumptionUpdate.newHandle,
    };
  }

  // 2) Gemini is ready
  if (msg.setupComplete) {
    return { type: MSG_TYPES.SETUP_COMPLETE, data: null };
  }

  // 3) Gemini replied with text or audio
  const parts = msg?.serverContent?.modelTurn?.parts;
  if (Array.isArray(parts)) {
    const textParts = parts
      .map((p) => p?.text)
      .filter(Boolean)
      .join("");

    const audioParts = parts.filter((p) => p?.inlineData);

    if (textParts || audioParts.length > 0) {
      return {
        type: MSG_TYPES.MODEL_OUTPUT,
        data: { textParts, audioParts },
      };
    }
  }

  // 4) Gemini wants to trigger a tool
  const functionCalls = msg?.toolCall?.functionCalls;
  if (Array.isArray(functionCalls) && functionCalls.length > 0) {
    return { type: MSG_TYPES.TOOL_CALL, data: functionCalls };
  }

  // 5) Catch-all for weird messages
  return { type: MSG_TYPES.UNKNOWN, data: msg };
};
