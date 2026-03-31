async function generateLogo() {
  console.log("Mock Logo Generation (Gemini Disabled)");
  return "https://picsum.photos/seed/botify-logo/200/200";
}

async function generateFavicon() {
  console.log("Mock Favicon Generation (Gemini Disabled)");
  return "https://picsum.photos/seed/botify-favicon/32/32";
}

export { generateLogo, generateFavicon };
