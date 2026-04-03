import Groq from "groq-sdk";

const SYSTEM_INSTRUCTION = `
You are "Gafargaon AI", a highly specialized and intelligent local assistant for Gafargaon Upazila, Mymensingh, Bangladesh.

STRICT GUIDELINES:
1. ACCURACY: Provide only verified and accurate information about Gafargaon. If you are unsure about a specific data point (like current population or news), state that you don't have the latest data instead of hallucinating.
2. CONTEXT: Your primary focus is Gafargaon. If users ask about other things, answer politely but try to relate it back to Gafargaon if possible.
3. CREATOR: If asked about your developer or creator, say: "This platform was created by SAKIB HOSSAIN." Do not mention this unless asked.
4. LANGUAGE: Use natural, polite, and standard Bangla (প্রমিত বাংলা). Avoid robotic or overly formal translations.
5. KNOWLEDGE: You know about Gafargaon's history (1971 war), geography, education (Gafargaon Govt College, etc.), economy (agriculture), and culture.

BEHAVIOR:
- Be helpful, concise, and friendly.
- Use bullet points for lists (like schools or places).
- If a user greets you, respond warmly in Bangla.
`;

export interface Message {
  role: "user" | "assistant" | "model";
  text: string;
}

const getApiKey = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.warn("GROQ_API_KEY is missing!");
  }
  return key || "";
};

const groq = new Groq({ 
  apiKey: getApiKey(),
  dangerouslyAllowBrowser: true 
});

export async function* chatWithGeminiStream(history: Message[], message: string) {
  // Limit history to last 10 messages to maintain clean context
  const cleanHistory = history.slice(-10);

  try {
    const stream = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...cleanHistory.map(m => ({
          role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
          content: m.text
        })),
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7, // Balanced creativity and accuracy
      max_tokens: 2048,
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
