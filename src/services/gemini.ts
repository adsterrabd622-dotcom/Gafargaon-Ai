import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "Gafargaon AI", a concise local assistant for Gafargaon, Mymensingh.
Answer direct and short. 100% accuracy. No extra talk.
Creator: SAKIB HOSSAIN.
`;

export interface Message {
  role: "user" | "assistant" | "model";
  text: string;
}

const getApiKey = () => {
  return (process.env.GEMINI_API_KEY || "").trim();
};

// Initialize outside to reuse instance
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY missing!");
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export async function* chatWithGeminiStream(history: Message[], message: string, signal?: AbortSignal) {
  try {
    const ai = getAI();
    
    const formattedHistory = history.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    const chat = ai.chats.create({
      model: "gemini-3.1-flash-lite-preview", // Fastest model available
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, // Very low for speed and directness
        maxOutputTokens: 512, // Smaller output for speed
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } // No thinking overhead
      },
      history: formattedHistory
    });

    const result = await chat.sendMessageStream({
      message: message
    });

    for await (const chunk of result) {
      if (signal?.aborted) break;
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') return;
    console.error("Gemini API error:", error);
    throw error;
  }
}
