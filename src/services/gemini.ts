import Groq from "groq-sdk";

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

LANGUAGE:
Respond in Bangla (বাংলা) or English as per the user's preference. Use natural, human-like Bangla.

BRANDING:
Platform name: Gafargaon AI
Creator: SAKIB HOSSAIN
`;

export interface Message {
  role: "user" | "assistant" | "model";
  text: string;
}

const getApiKey = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.warn("GROQ_API_KEY is missing! Falling back to Gemini logic if available.");
  }
  return key || "";
};

const groq = new Groq({ 
  apiKey: getApiKey(),
  dangerouslyAllowBrowser: true 
});

export async function* chatWithGeminiStream(history: Message[], message: string) {
  try {
    const stream = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...history.map(m => ({
          role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
          content: m.text
        })),
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      yield content;
    }
  } catch (error: any) {
    console.error("Groq error:", error);
    throw error;
  }
}
