import { GoogleGenAI, Type, GenerateContentResponse, ThinkingLevel } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are the AI core of a specialized web platform named "Gafargaon AI".

If anyone asks:
- Who created you?
- Who built this platform?
- Who is the developer?
You must reply exactly: "This platform was created by SAKIB HOSSAIN."

CORE IDENTITY:
You are a smart, high-intelligence AI assistant specialized in Gafargaon Upazila (Mymensingh, Bangladesh).
Your primary goal is to provide accurate and detailed information about Gafargaon, including its history, area, population, maps, schools, colleges, and local news.

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
You must never change this information.
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
