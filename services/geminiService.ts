import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, ImageSize } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

/**
 * Chat with Gemini using gemini-3-pro-preview
 */
export const sendChatMessage = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are a helpful and witty assistant inside a 'Paper Toss' game. Keep your responses concise, encouraging, or playfully snarky about the user's throwing skills.",
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I'm speechless!";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Oops, my brain circuit tripped. Try again?";
  }
};

/**
 * Generate a background image using gemini-3-pro-image-preview
 */
export const generateGameBackground = async (prompt: string, size: ImageSize): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: `A realistic, high-quality background scene for a paper toss game. The view is from a desk looking outwards. ${prompt}. Ensure the center area is relatively clear for a trash bin.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: size, // 1K, 2K, or 4K
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};