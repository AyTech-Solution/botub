export async function speak(
  text: string, 
  voice: any = 'Kore', 
  volume: number = 1,
  onStart?: () => void,
  onEnd?: () => void
) {
  // Voice output strictly disabled by user request
  console.log("TTS Triggered (Disabled):", text);
  return false;
}
