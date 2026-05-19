export async function analyzeWebsite(url: string) {
  try {
    const fetchResponse = await fetch('/api/analyze-website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!fetchResponse.ok) {
      const respText = await fetchResponse.text().catch(() => 'No response body');
      let errorData;
      try {
        errorData = JSON.parse(respText);
      } catch (e) {
        // Not JSON, likely a platform error (5xx or 404 from Vercel)
        const err = new Error(`Server error (${fetchResponse.status}): ${respText.substring(0, 100)}`);
        throw err;
      }
      const err = new Error(errorData.error || 'Failed to analyze website content');
      (err as any).suggestion = errorData.suggestion;
      throw err;
    }

    const data = await fetchResponse.json().catch(() => {
      throw new Error("Malformed response from server.");
    });
    return data;
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
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        knowledgeBase,
        personality,
        customInstructions,
        primaryLanguage
      })
    });

    if (!response.ok) {
      const respText = await response.text().catch(() => 'No response body');
      let errorData;
      try {
        errorData = JSON.parse(respText);
      } catch (e) {
        throw new Error(`Failed to generate response (${response.status}): ${respText.substring(0, 50)}`);
      }
      throw new Error(errorData.error || 'Chat server error');
    }

    const respText = await response.text();
    try {
      const { text } = JSON.parse(respText);
      return text || "I'm sorry, I couldn't generate a response.";
    } catch (e) {
      throw new Error("Malformed response from search service.");
    }
  } catch (err) {
    console.error("Error generating bot response:", err);
    return "I encountered an error while processing your request. Please try again later.";
  }
}

// Keeping this as a placeholder, would require a backend endpoint for full security
export async function generateVoiceOutput(text: string, voiceName: string = 'Kore') {
  console.warn("Voice output is not yet proxied to backend for security.");
  return null;
}
