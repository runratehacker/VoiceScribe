// Utils for audio processing

// Boilerplate code to convert audio in diffrent formats

// Browser microphone - Float32Array
// Gemini - Int16Array
// Internet - Base64

// mathematical operations for conversions between these formats 


export const floatTo16BitPCM = (float32Array) => {
  const out = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
};

export const downsampleTo16k = (buffer, inputSampleRate) => {
  const targetRate = 16000;
  if (inputSampleRate === targetRate) return buffer;

  const ratio = inputSampleRate / targetRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      sum += buffer[i];
      count++;
    }
    result[offsetResult] = sum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
};

export const int16ToBase64 = (int16Array) => {
  const u8 = new Uint8Array(int16Array.buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < u8.length; i += chunkSize) {
    binary += String.fromCharCode(...u8.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

export const base64ToInt16 = (b64) => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
};

export const int16ToFloat32 = (int16) => {
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
  return float32;
};
