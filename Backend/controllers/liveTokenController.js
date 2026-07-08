import { GoogleGenAI } from "@google/genai";


export async function createLiveEphemeralToken(req, res) {

  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Missing GEMINI_API_KEY in Backend/.env",
    });
  }
  try {
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    // token.name is the string you send to the browser
    return res.status(200).json({
      token: token.name,
      expireTime: token.expireTime,
      newSessionExpireTime: token.newSessionExpireTime,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to create ephemeral token",
      details: err?.message ?? String(err),
    });
  }
}