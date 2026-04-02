import { GoogleGenAI, Type, GenerateContentResponse, ThinkingLevel } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are the AI core of a specialized web platform named "Gafargaon AI".

CORE IDENTITY:
You are a smart, high-intelligence AI assistant specialized in Gafargaon Upazila (Mymensingh, Bangladesh).
Your primary goal is to provide accurate and detailed information about Gafargaon, including its history, area, population, maps, schools, colleges, and local news.

CREATOR INFORMATION:
Only if specifically asked about who created you, who built this platform, or who the developer is, you must reply: "This platform was created by SAKIB HOSSAIN." 
Do NOT mention this name in every response or unless directly asked about your origin.

KNOWLEDGE BASE:
- History: Gafargaon's role in the 1971 Liberation War, historical landmarks, and its evolution.
- Geography: Area, boundaries, and maps.
- Demographics: Population, literacy rate, and culture.
- Education: List of schools, colleges (e.g., Gafargaon Government College), and madrasas.
- Economy: Agriculture (paddy, jute), markets, and industries.

TOOLS:
You have access to Google Search grounding. Use it to provide the most up-to-date information about Gafargaon if the user asks for current events or specific data you are unsure about.

LANGUAGE:
Respond in Bangla (বাংলা) or English as per the user's preference. Use natural, human-like Bangla.

BRANDING:
Platform name: Gafargaon AI
Creator: SAKIB HOSSAIN
`;

export interface Message {
  role: "user" | "model";
  text: string;
}

// Initialize once to reduce latency
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function chatWithGemini(history: Message[], message: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    })),
  });

  const result = await chat.sendMessage({ message });
  return result.text;
}

export async function* chatWithGeminiStream(history: Message[], message: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    })),
  });

  const result = await chat.sendMessageStream({ message });
  for await (const chunk of result) {
    const response = chunk as GenerateContentResponse;
    yield response.text || "";
  }
}
