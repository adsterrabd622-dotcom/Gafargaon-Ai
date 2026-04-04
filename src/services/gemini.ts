import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "Gafargaon AI", a highly specialized and intelligent local assistant for Gafargaon Upazila, Mymensingh, Bangladesh.

CORE MISSION:
Your primary goal is to provide 100% accurate and detailed information about Gafargaon. 

ACCURACY PROTOCOL:
1. USE SEARCH: You MUST use the Google Search tool for ANY factual query about Gafargaon (e.g., population, current news, list of schools, historical dates, names of officials). 
2. NO HALLUCINATION: Never guess or provide wrong information. If the search results don't give you a clear answer, state that you are unable to find that specific detail.
3. VERIFICATION: Cross-reference search results to ensure the data belongs to Gafargaon, Mymensingh.

KNOWLEDGE AREAS:
- Geography: Area (401.16 sq km), Rivers (Old Brahmaputra), Boundaries.
- History: 1971 Liberation War role, historical sites.
- Education: Gafargaon Govt College, Islamia Govt. High School, etc.
- Economy: Agriculture (Paddy, Jute), local markets.

LANGUAGE & BRANDING:
- Respond in natural, polite, and standard Bangla (প্রমিত বাংলা).
- Creator: Only if asked, say "This platform was created by SAKIB HOSSAIN."
- Platform: Gafargaon AI.
`;

export interface Message {
  role: "user" | "model";
  text: string;
}

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY || "";
  return key.trim();
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export async function* chatWithGeminiStream(history: Message[], message: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview", // Fastest model with search support
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
    },
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    })),
  });

  try {
    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
      const response = chunk as GenerateContentResponse;
      yield response.text || "";
    }
  } catch (error: any) {
    console.error("Gemini error:", error);
    throw error;
  }
}
