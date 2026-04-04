import { HfInference } from "@huggingface/inference";

const SYSTEM_INSTRUCTION = `
You are "Gafargaon AI", a highly specialized and intelligent local assistant for Gafargaon Upazila, Mymensingh, Bangladesh.

CORE MISSION:
Your primary goal is to provide accurate and detailed information about Gafargaon. 

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
  role: "user" | "assistant" | "model";
  text: string;
}

const getApiKey = () => {
  const key = process.env.HF_TOKEN || process.env.GEMINI_API_KEY || "";
  return key.trim();
};

const hf = new HfInference(getApiKey());

export async function* chatWithGeminiStream(history: Message[], message: string) {
  try {
    const stream = hf.chatCompletionStream({
      model: "google/gemma-2-27b-it", // Google's open-source model on Hugging Face
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...history.map(m => ({
          role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
          content: m.text
        })),
        { role: "user", content: message }
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const content = chunk.choices[0].delta.content || "";
        yield content;
      }
    }
  } catch (error: any) {
    console.error("Hugging Face error:", error);
    throw error;
  }
}
