import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import { load } from "cheerio";
import cors from "cors";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import https from "https";

const app = express();
app.use(cors());
app.use(express.json());

// --- GEMINI AI CONFIG ---
let aiInstance: GoogleGenAI | null = null;
let lastApiKeyUsed: string | undefined = undefined;

function getGeminiClient(): GoogleGenAI | null {
  const currentKey = process.env.GEMINI_API_KEY;
  if (!currentKey) {
    aiInstance = null;
    lastApiKeyUsed = undefined;
    return null;
  }
  
  if (!aiInstance || lastApiKeyUsed !== currentKey) {
    aiInstance = new GoogleGenAI({
      apiKey: currentKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-proxy',
        }
      }
    });
    lastApiKeyUsed = currentKey;
    console.log("✅ Gemini AI Engine initialized/updated with key from environment.");
  }
  
  return aiInstance;
}

// --- MAILING LOGIC (Merged to prevent Vercel import issues) ---
const port = parseInt(process.env.SMTP_PORT || "587");
const isSecure = process.env.SMTP_SECURE === "true" || port === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port,
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false }
});

async function internalSendEmail({ to, subject, text, html }: { to: string; subject: string; text?: string; html?: string }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP credentials missing");
  }
  return await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}

// --- DETERMINISTIC ANALYSIS ENGINE (SLM) ---
function roughScrapAnalysis(text: string, title: string, metaDescription: string): { knowledgeBase: string, missingTips: string[], businessName: string } {
  const safeText = (text || '').replace(/\s\s+/g, ' ').trim();
  
  // Extract patterns efficiently
  const emails = Array.from(safeText.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)).map(m => m[0]);
  const uniqueEmails = [...new Set(emails)];
  const phones = Array.from(safeText.matchAll(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}/g)).map(m => m[0]);
  const uniquePhones = [...new Set(phones)].filter(p => p.length >= 10);

  const pricingMatches = Array.from(safeText.matchAll(/(\$|₹|USD|INR|Rs\.?)\s?\d+(?:\.\d{2})?/gi)).map(m => m[0]);
  const uniquePrices = [...new Set(pricingMatches)].slice(0, 15);

  const sections = safeText.split('\n').filter(l => l.trim().length > 10);
  const coreContent = sections.filter(l => {
    const low = l.toLowerCase();
    return low.includes('service') || low.includes('product') || low.includes('price') || 
           low.includes('offer') || low.includes('about') || low.includes('contact') ||
           low.includes('policy');
  }).slice(0, 40);

  const kb = `
--- BUSINESS KNOWLEDGE BASE ---
BUSINESS: ${title || 'Business'}
ABOUT: ${metaDescription || 'Information provided via manual entry or website scan.'}

KEY DETAILS & SERVICES:
${coreContent.join('\n') || 'Refer to the raw data below for full details.'}

PRICING & OFFERS:
${uniquePrices.join(', ') || 'Inquire for pricing details.'}

CONTACT INFO:
- Emails: ${uniqueEmails.join(', ')}
- Phone: ${uniquePhones.join(', ')}

ADDITIONAL RAW CONTENT:
${safeText.substring(0, 10000)}
  `.trim();

  return {
    knowledgeBase: kb,
    missingTips: uniquePrices.length === 0 ? ["Add specific pricing details"] : [],
    businessName: title || ""
  };
}

function roughScrapChat(query: string, knowledgeBase: string, personality: string, greetingMessage: string = '') {
  const lowQuery = query.toLowerCase().trim();
  
  const isHindi = lowQuery.includes('kaise') || lowQuery.includes('kya') || lowQuery.includes('hai') || lowQuery.includes('batao') || lowQuery.includes('namaste');
  
  // Basic Greeting handling in fallback
  const greetings = ['hi', 'hello', 'hey', 'hello hi', 'greeting', 'greetings', 'hola', 'hi there'];
  if (greetings.includes(lowQuery) || lowQuery.length < 3) {
    if (greetingMessage) return greetingMessage;
    if (isHindi) return "Namaste! Main aapki kya madad kar sakta hoon?";
    return "Hello! I'm your business assistant. How can I help you today?";
  }

  if (!knowledgeBase || knowledgeBase.trim().length < 10) {
    return isHindi 
      ? "Main abhi is business ke baare mein seekh raha hoon. Kripya thodi der baad try karein."
      : "I'm still learning about this business. Please check back in a few minutes!";
  }

  const knowledge = knowledgeBase.toLowerCase();
  
  // Basic keyword matcher for fallback
  if (lowQuery.includes('contact') || lowQuery.includes('phone') || lowQuery.includes('email') || lowQuery.includes('reach')) {
    const lines = knowledgeBase.split('\n').filter(l => l.includes('@') || l.match(/\d{10}/));
    if (lines.length > 0) return (isHindi ? "Aap humse yahan contact kar sakte hain:\n" : "You can reach us at:\n") + lines.slice(0, 3).join('\n');
  }

  if (isHindi) {
    return "Maaf kijiye, mujhe is baare mein zyada jaankari nahi hai. Aap contact info try kar sakte hain ya fir website check karein.";
  }

  return "I'm sorry, I couldn't find a specific answer for that in my current knowledge. Please feel free to ask about our services or contact details.";
}

// --- GEMINI AI ENGINE ---
async function geminiChat(query: string, knowledgeBase: string, personality: string, customInstructions: string = '', primaryLanguage: string = 'auto', chatHistory: any[] = [], greetingMessage: string = '') {
  // Simple cleanup of knowledge base to remove noise
  const cleanKB = (knowledgeBase || '')
    .substring(0, 15000)
    .trim();

  const client = getGeminiClient();
  if (!client) {
    return `⚠️ **GEMINI CONFIGURATION ERROR:** The \`GEMINI_API_KEY\` is not set in your server settings. To use the AI capabilities, please add it in the settings. Fallback answer: ${roughScrapChat(query, cleanKB, personality, greetingMessage)}`;
  }

  try {
    const hasKnowledge = cleanKB.length > 20;
    
    // Format history for context
    const historyContext = chatHistory.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content || m.text}`).join('\n');

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: 'user',
          parts: [{ text: `CONVERSATION HISTORY:
${historyContext || 'New session'}

USER QUERY: ${query}` }]
        }
      ],
      config: {
        systemInstruction: `You are the lead business representative. Your role is to be helpful, professional, and friendly.
      
OFFICIAL BUSINESS RECORDS:
${hasKnowledge ? cleanKB : 'No records yet. Be a friendly greeting bot and tell user you are ready to help once they add some business data.'}

BRAND RULES:
- TONE: ${personality}
- VOICE: Natural, conversational, and human-like. Never mention "records", "database", or "AI".
- LANGUAGE: Mirror the user's language (Hindi, English, or Hinglish).
- IDENTITY: You ARE the company. Use "We", "Us", "Our".
- GREETINGS: Always respond naturally to greetings (such as "Hi", "Hello", "Hey", "How are you?"). ${greetingMessage ? `Always answer greetings using this exact greeting message: "${greetingMessage}"` : 'Do NOT use the fallback message for greetings.'}
- UNKNOWN: If a query asks for specific business info (like pricing, address) that is NOT in the RECORDS, say you don't have that detail yet but offer help with other things or provide contact info if available.
- CUSTOM BRAIN: ${customInstructions || 'None'}`,
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 1000,
      }
    });

    const text = response.text;
    
    if (!text || text.length < 2) throw new Error("Empty AI response");
    return text;
  } catch (err: any) {
    console.error("Gemini Chat Error:", err);
    if (err.message?.includes("leaked") || err.message?.includes("403")) {
      return "⚠️ **SYSTEM ERROR:** Your Gemini API key has been flagged as leaked and is disabled. Please update your key in the App Settings to resume chat.";
    }
    if (err.message?.includes("503") || err.message?.includes("Service Unavailable") || err.message?.includes("high demand")) {
      return "⚠️ **SYSTEM BUSY:** Gemini is currently experiencing high demand. Please try again in a few seconds.";
    }
    return `⚠️ **GEMINI CHAT ERROR:** ${err.message || 'Error occurred during generation'}\n\n*Fallback response:* ${roughScrapChat(query, cleanKB, personality, greetingMessage)}`;
  }
}

async function geminiAnalyze(text: string, title: string, description: string) {
  const fallback = roughScrapAnalysis(text, title, description);
  const client = getGeminiClient();
  if (!client || !text) return fallback;
  
  try {
    // Using gemini-3.5-flash for analysis
    const response = await client.models.generateContent({ 
      model: "gemini-3.5-flash",
      contents: `You are an Expert Business Consultant and Data Architect. Analyze the raw text and structure it into a perfect Knowledge Base.

TASK:
1. Extract Company Name, Essential Services, Pricing, Contact Numbers, WhatsApp, Email, Refund Policy, and FAQs.
2. IMPORTANT: If any of these are MISSING from the text, you MUST list them as specific, actionable tips in "missingTips".
3. Each Tip should be short, like: "WhatsApp number missing", "Pricing for service X is unclear", "Refund policy not found".

OUTPUT JSON FORMAT ONLY:
{
  "knowledgeBase": "Markdown text...",
  "missingTips": ["Tip 1", "Tip 2"],
  "businessName": "Company Name"
}

SOURCE DATA: ${title}
RAW CONTENT: 
${text.substring(0, 10000)}`,
      config: { maxOutputTokens: 2000 }
    });
    
    let rText = response.text || "";

    if (!rText || rText.length < 5) return fallback;
    
    const jsonM = rText.match(/\{[\s\S]*\}/);
    if (jsonM) {
      try {
        const parsed = JSON.parse(jsonM[0]);
        if (parsed.knowledgeBase) return parsed;
      } catch (e) {}
    }
    
    return { 
      knowledgeBase: rText,
      missingTips: ["Please verify details."],
      businessName: title
    };
  } catch (err: any) {
    console.error("Gemini Analyze Error:", err);
    if (err.message?.includes("leaked") || err.message?.includes("403")) {
      return {
        ...fallback,
        missingTips: ["⚠️ [CRITICAL] Your Gemini API key has been reported as leaked and disabled. Please update your API key in Settings."]
      };
    }
    if (err.message?.includes("503") || err.message?.includes("Service Unavailable") || err.message?.includes("high demand")) {
      return {
        ...fallback,
        missingTips: ["⚠️ [BUSY] Gemini is busy. Some structure might be missing. Try again later for full analysis."]
      };
    }
    return fallback;
  }
}

// --- API ROUTES ---

const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  const client = getGeminiClient();
  res.json({ 
    status: "ok", 
    engine: client ? "Gemini 3 Flash Preview" : "Deterministic SLM",
    ai_ready: !!client
  });
});

apiRouter.post("/send-report", async (req, res) => {
  const { email, reportContent, subject } = req.body;
  if (!email || !reportContent) return res.status(400).json({ error: "Missing fields" });
  try {
    await internalSendEmail({ to: email, subject: subject || "Botub Analysis", text: reportContent });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Email Error" });
  }
});

apiRouter.post("/analyze-website", async (req, res) => {
  let { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });
  if (!url.startsWith('http')) url = 'https://' + url;

  console.log(`Cheerio Analysis for: ${url}`);

  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      timeout: 15000,
      httpsAgent: agent,
      validateStatus: () => true
    });

    if (response.status >= 400 || !response.data) {
       return res.status(response.status || 500).json({ 
         error: "Access Restriction", 
         suggestion: "This site is protected. Please manually paste its text below." 
       });
    }

    const html = response.data;
    const $ = load(html);
    
    // Primary Cheerio Text Extraction
    $(`script, style, noscript, iframe, footer, nav, aside, svg, .cookie-banner, .ads`).remove();
    
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || 'Website';
    const description = $('meta[name="description"]').attr('content') || '';
    
    let extractedText = "";
    $('h1, h2, h3, p, li').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10) extractedText += `${text}\n`;
    });

    if (extractedText.length < 200) {
      extractedText = $('body').text().replace(/\s\s+/g, ' ').substring(0, 5000);
    }

    if (extractedText.length < 50) {
      return res.status(422).json({ error: "Empty Content", suggestion: "Scanner couldn't read the page. Manual input needed." });
    }

    console.log(`Extracted ${extractedText.length} characters with Cheerio.`);
    const result = await geminiAnalyze(extractedText, title, description);
    res.json({ result, title, crawledCount: 1 });
  } catch (err: any) {
    console.error("Scanner Error:", err);
    res.status(500).json({ error: "Scanner encountered a critical failure. Please paste info manually." });
  }
});

apiRouter.post("/analyze-text", async (req, res) => {
  const { text, title } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });
  try {
    const result = await geminiAnalyze(text, title || "Manual Entry", "User provided business details");
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: "Analysis failed" });
  }
});

apiRouter.post("/chat", async (req, res) => {
  const { prompt, knowledgeBase, personality, customInstructions, primaryLanguage, chatHistory, greetingMessage } = req.body;
  try {
    const text = await geminiChat(
      prompt || '', 
      knowledgeBase || '', 
      personality || 'professional', 
      customInstructions || '', 
      primaryLanguage || 'auto',
      chatHistory || [],
      greetingMessage || ''
    );
    res.json({ text });
  } catch (err: any) {
    res.status(500).json({ error: "Execution Fail" });
  }
});

apiRouter.get("/config-status", (req, res) => {
  const client = getGeminiClient();
  res.json({ 
    server: "Vercel Production", 
    db: !!process.env.FIREBASE_PROJECT_ID, 
    mail: !!process.env.SMTP_USER,
    ai: !!process.env.GEMINI_API_KEY,
    ai_initialized: !!client
  });
});

// Mount router on both /api and root to handle various Vercel/Local configurations
app.use("/api", apiRouter);
app.use("/", apiRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Runtime Error:", err);
  res.status(500).json({ error: "Platform Runtime Error" });
});

export default app;

