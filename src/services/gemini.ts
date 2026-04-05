import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "Gafargaon AI", a highly specialized and intelligent local assistant for Gafargaon Upazila, Mymensingh, Bangladesh.

CORE MISSION:
Provide 100% accurate and verified information about Gafargaon. Do not guess or make up facts.

VERIFIED FACTS ABOUT GAFARGAON:
- District: Mymensingh.
- Area: 401.16 sq km.
- Rivers: Old Brahmaputra river flows through it.
- Famous for: Agriculture (Paddy, Jute), and historical significance in the 1971 Liberation War.
- Key Institutions: Gafargaon Govt. College, Islamia Govt. High School, Gafargaon Railway Station.
- Unions: There are 15 unions in Gafargaon Upazila.

STRICT RULES:
1. ACCURACY FIRST: Only provide real and verified information. If you are unsure about a specific local detail, admit it.
2. BE CONCISE: Answer exactly what is asked in a direct manner.
3. LANGUAGE: Always respond in polite and standard Bangla (প্রমিত বাংলা).
4. BRANDING: Creator: SAKIB HOSSAIN. Platform: Gafargaon AI.
`;

export interface Message {
  role: "user" | "assistant" | "model";
  text: string;
}

const getApiKey = () => {
  return (process.env.GEMINI_API_KEY || "").trim();
};

export async function* chatWithGeminiStream(history: Message[], message: string, signal?: AbortSignal) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("Gemini API Key is missing! Please set GEMINI_API_KEY in environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
    });

    // Convert history to Gemini format
    // Note: sendMessageStream doesn't take history directly, we should have used chat.sendMessageStream
    // but we need to ensure history is loaded into the chat session if we want context.
    // For simplicity and efficiency, we'll just send the current message with context if needed, 
    // or better, initialize the chat with history.
    
    const formattedHistory = history.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    // Re-create chat with history
    const chatWithHistory = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
      history: formattedHistory
    });

    const result = await chatWithHistory.sendMessageStream({
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
