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
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

if (!process.env.GEMINI_API_KEY) {
  console.warn("CRITICAL: GEMINI_API_KEY is missing from environment. AI features will fallback to deterministic engine.");
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

function roughScrapChat(query: string, knowledgeBase: string, personality: string) {
  const lowQuery = query.toLowerCase();
  
  const isHindi = lowQuery.includes('kaise') || lowQuery.includes('kya') || lowQuery.includes('hai') || lowQuery.includes('batao');
  
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
async function geminiChat(query: string, knowledgeBase: string, personality: string, customInstructions: string = '', primaryLanguage: string = 'auto', chatHistory: any[] = []) {
  // Simple cleanup of knowledge base to remove noise
  const cleanKB = (knowledgeBase || '')
    .substring(0, 15000)
    .trim();

  if (!ai) return roughScrapChat(query, cleanKB, personality);

  try {
    const hasKnowledge = cleanKB.length > 20;
    
    // Format history for context
    const historyContext = chatHistory.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content || m.text}`).join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `CONVERSATION HISTORY:
${historyContext || 'New session'}

USER MESSAGE:
${query}`,
      config: {
        systemInstruction: `You are the Official AI Business Ambassador. Your mission is to provide accurate, helpful, and natural responses based on the provided records.

BUSINESS RECORDS (Source of Truth):
${hasKnowledge ? cleanKB : 'No specific records available. Greet the user and ask how you can help.'}

TONE: ${personality}
CUSTOM BRAND GUIDELINES: ${customInstructions || 'None'}

RESPONSE GUIDELINES:
1. NATURAL VOICE: Do not sound like a machine. Avoid "According to the document". Just answer.
2. HINGLISH: If the user speaks Hinglish/Hindi, respond in warm, professional Hinglish. e.g., "Ji haan, hum ye provide karte hain."
3. IDENTITY: You ARE the business team. Use "We", "Us", "Our".
4. ACCURACY: Do not hallucinate. If info isn't in RECORDS, politely say you don't know but offer contact info.`,
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 1000,
      }
    });

    const text = response.text;
    
    if (!text || text.length < 2) throw new Error("Empty AI response");
    return text;
  } catch (err) {
    console.error("Gemini Chat Error:", err);
    return roughScrapChat(query, cleanKB, personality);
  }
}

async function geminiAnalyze(text: string, title: string, description: string) {
  const fallback = roughScrapAnalysis(text, title, description);
  if (!ai || !text) return fallback;
  
  try {
    const response = await ai.models.generateContent({ 
      model: "gemini-3-flash-preview",
      contents: `You are an Expert Business Data Architect. Analyze the raw text and structure it into a perfect Knowledge Base for a Customer Support Bot.

TASK:
1. Extract Company Name, Essential Services, Pricing (if any), Contact Numbers, and FAQs.
2. If info is missing (like specific pricing), mention "Ask for details" but flag it in missingTips.
3. Format as clean, readable Markdown.

OUTPUT JSON FORMAT ONLY:
{
  "knowledgeBase": "Markdown text...",
  "missingTips": ["Tip: Add WhatsApp number"],
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
  } catch (err) {
    console.error("Gemini Analyze Error:", err);
    return fallback;
  }
}

// --- API ROUTES ---

const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => res.json({ 
  status: "ok", 
  engine: ai ? "Gemini 3 Flash Preview" : "Deterministic SLM",
  ai_ready: !!ai
}));

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
  const { prompt, knowledgeBase, personality, customInstructions, primaryLanguage, chatHistory } = req.body;
  try {
    const text = await geminiChat(
      prompt || '', 
      knowledgeBase || '', 
      personality || 'professional', 
      customInstructions || '', 
      primaryLanguage || 'auto',
      chatHistory || []
    );
    res.json({ text });
  } catch (err: any) {
    res.status(500).json({ error: "Execution Fail" });
  }
});

apiRouter.get("/config-status", (req, res) => {
  res.json({ 
    server: "Vercel Production", 
    db: !!process.env.FIREBASE_PROJECT_ID, 
    mail: !!process.env.SMTP_USER,
    ai: !!process.env.GEMINI_API_KEY,
    ai_initialized: !!ai
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

