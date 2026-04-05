import { HfInference } from "@huggingface/inference";

const SYSTEM_INSTRUCTION = `
You are "Gafargaon AI", a highly specialized and intelligent local assistant for Gafargaon Upazila, Mymensingh, Bangladesh.

CORE MISSION:
Provide accurate, concise, and direct information about Gafargaon. 

STRICT RULES:
1. BE CONCISE: Do not talk too much. Answer exactly what is asked.
2. NO HALLUCINATION: Only provide real and verified information. If you don't know, say you don't know.
3. LANGUAGE: Always respond in polite and standard Bangla (প্রমিত বাংলা).
4. BRANDING: Creator: SAKIB HOSSAIN. Platform: Gafargaon AI.
`;

export interface Message {
  role: "user" | "assistant" | "model";
  text: string;
}

const getApiKey = () => {
  // Try Vite env first, then fallback to global process if available (for local dev)
  const key = (import.meta.env.VITE_HF_TOKEN as string) || 
              (import.meta.env.VITE_GEMINI_API_KEY as string) || 
              (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "");
  return (key || "").trim();
};

const hf = new HfInference(getApiKey());

export async function* chatWithGeminiStream(history: Message[], message: string, signal?: AbortSignal) {
  try {
    const token = getApiKey();
    if (!token) {
      throw new Error("API token is missing! Please set VITE_HF_TOKEN in Vercel environment variables.");
    }

    const stream = hf.chatCompletionStream({
      model: "Qwen/Qwen2.5-7B-Instruct", // Very reliable chat model on HF
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...history.map(m => ({
          role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
          content: m.text
        })),
        { role: "user", content: message }
      ],
      max_tokens: 1024,
      temperature: 0.4,
    });

    for await (const chunk of stream) {
      if (signal?.aborted) break;
      if (chunk.choices && chunk.choices.length > 0) {
        const content = chunk.choices[0].delta.content || "";
        yield content;
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') return;
    console.error("Hugging Face error:", error);
    // If primary fails, try a smaller model as fallback
    try {
      const fallbackStream = hf.chatCompletionStream({
        model: "HuggingFaceH4/zephyr-7b-beta", // Reliable fallback chat model
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          ...history.map(m => ({
            role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
            content: m.text
          })),
          { role: "user", content: message }
        ],
        max_tokens: 512,
      });

      for await (const chunk of fallbackStream) {
        if (signal?.aborted) break;
        if (chunk.choices && chunk.choices.length > 0) {
          const content = chunk.choices[0].delta.content || "";
          yield content;
        }
      }
    } catch (fallbackError: any) {
      throw error;
    }
  }
}
