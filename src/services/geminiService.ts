import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateVoiceOutput(text: string, voiceName: string = 'Kore') {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Gemini API key not found. Voice output disabled.");
    return null;
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as any },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (err) {
    console.error("Error generating voice output:", err);
    return null;
  }
}

export async function analyzeWebsite(url: string) {
  try {
    const fetchResponse = await fetch('/api/fetch-website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!fetchResponse.ok) {
      const errorData = await fetchResponse.json();
      throw new Error(errorData.error || 'Failed to fetch website content');
    }

    const { text } = await fetchResponse.json();

    if (!process.env.GEMINI_API_KEY) {
      return "Website content fetched, but Gemini API key is missing for analysis. Content: " + text.substring(0, 500) + "...";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following website content and provide a concise summary of the business, its services, and key information that would be useful for an AI customer support bot. Content: ${text}`,
    });

    return response.text || "Failed to generate analysis.";
  } catch (err: any) {
    console.error("Error analyzing website:", err);
    throw err;
  }
}

export async function generateBotResponse(
  prompt: string, 
  knowledgeBase: string, 
  personality: string = 'friendly', 
  customInstructions: string = '', 
  primaryLanguage: string = 'auto'
) {
  if (!process.env.GEMINI_API_KEY) {
    return "I'm currently in offline mode. Please configure the Gemini API key to enable my full intelligence.";
  }

  try {
    const systemInstruction = `
      You are an AI assistant. 
      Personality: ${personality}. 
      Primary Language: ${primaryLanguage}.
      Custom Instructions: ${customInstructions}.
      Knowledge Base: ${knowledgeBase}.
      
      Always stay in character. If the user asks something outside the knowledge base, be honest but helpful.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (err) {
    console.error("Error generating bot response:", err);
    return "I encountered an error while processing your request. Please try again later.";
  }
}
