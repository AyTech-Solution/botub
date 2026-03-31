let currentUtterance: SpeechSynthesisUtterance | null = null;

export async function speak(
  text: string, 
  voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore', 
  volume: number = 1,
  onStart?: () => void,
  onEnd?: () => void
) {
  try {
    // Stop previous playback
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    
    // Simple mapping of Gemini voices to browser voices
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Try to find a good voice based on the requested name
      const preferredVoice = voices.find(v => 
        v.name.toLowerCase().includes(voice.toLowerCase()) || 
        v.name.toLowerCase().includes('google') ||
        v.name.toLowerCase().includes('female')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    // Set some defaults for a more "AI-like" sound
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      console.error("SpeechSynthesisUtterance error", event);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
    currentUtterance = utterance;
    return true;
  } catch (error) {
    console.error("Native TTS Error:", error);
    if (onEnd) onEnd();
  }
  return false;
}
