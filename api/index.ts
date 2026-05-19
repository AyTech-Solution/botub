import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import { load } from "cheerio";
import cors from "cors";
import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import multer from "multer";
import https from "https";
// @ts-ignore
import pdf from "pdf-parse";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// --- GEMINI AI CONFIG ---
const ai = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

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
    .replace(/---.*?---/g, '')
    .trim();

  if (!ai) return roughScrapChat(query, cleanKB, personality);

  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 1000,
      }
    });

    const hasKnowledge = cleanKB.length > 20;
    
    // Format history for context
    const historyContext = chatHistory.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

    const systemPrompt = `You are the Official AI Business Assistant. Your primary directive is to be extremely helpful, professional, and warm, representing this business faithfully.
    
BUSINESS KNOWLEDGE (Your actual records):
${hasKnowledge ? cleanKB : 'Greet the user warmly. Explain that you are the business assistant and offer to help with general questions. No specific details are available yet.'}

TONE: ${personality} (Polite, Human-like, Professional)
PREFERENCE: ${primaryLanguage}
CUSTOM INSTRUCTIONS: ${customInstructions}

RESPONSE RULES (STRICT):
1. NO ROBOTIC DISCLAIMERS: Never say "Based on the provided information". Just answer naturally, e.g. "Humare paas ye services hain..." or "As per my records...".
2. MULTILINGUAL: If the user speaks Hindi or Hinglish (e.g. "kahan ho?", "help chahiye"), respond in conversational and polite Hinglish.
3. CONCISE: Keep answers direct and helpful. Don't repeat yourself.
4. IDENTITY: You represent the company. Use "We", "Us", "Our".
5. IF UNKNOWN: Don't guess. Say "I don't have that specific detail yet, but you can reach us at our contact info for more help."
6. NO AI MENTION: Never mention you are an AI or a language model.

CONVERSATION HISTORY:
${historyContext || 'Start of a new conversation'}

USER MESSAGE:
${query}`;

    const response = await model.generateContent(systemPrompt);
    const text = response.response.text();
    
    if (!text || text.length < 2) throw new Error("Empty AI response");
    return text;
  } catch (err) {
    console.error("Gemini Chat Error:", err);
    return roughScrapChat(query, cleanKB, personality);
  }
}

async function geminiAnalyze(text: string, title: string, description: string) {
  if (!ai) return roughScrapAnalysis(text, title, description);
  
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(`Act as an Expert Knowledge Architect & Business Analyst.
Analyze the following raw text extracted from a business website or document. 
Create a highly structured Knowledge Base for a business AI Chatbot.

SOURCE: ${title} (${description})

RAW CONTENT:
${text.substring(0, 20000)}

YOUR TASK:
1. TRANSFORM the raw text into a professional, clear, and comprehensive Knowledge Base.
2. SECTIONS to include: # Overview, # Services & Products, # Pricing, # Contact Details, # FAQs, # Policies.
3. MISSING INFO: Identify what important information is MISSING from the text (e.g., precise pricing, WhatsApp number, specific policies, refund info).

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "knowledgeBase": "Markdown formatted KB content...",
  "missingTips": ["Tip 1: Add your WhatsApp number", "Tip 2: Define your refund policy..."],
  "businessName": "Detected Business Name"
}

RULES:
- Be factual. Do not invent details.
- If pricing isn't found, state "Available on request" in KB but add it to missingTips.
- Use natural, professional language.`);
    
    const responseText = response.response.text();
    // Try to parse JSON from Markdown code block or raw
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("JSON Parse Error on Gemini output:", e);
      }
    }
    
    // Fallback if JSON fails
    return { 
      knowledgeBase: responseText || roughScrapAnalysis(text, title, description),
      missingTips: ["Please verify the and refine the details extracted."],
      businessName: title
    };
  } catch (err) {
    console.error("Gemini Analyze Error:", err);
    return {
      knowledgeBase: roughScrapAnalysis(text, title, description),
      missingTips: ["Manual verification recommended due to scanner interruption."],
      businessName: title
    };
  }
}

// --- API ROUTES ---

const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => res.json({ 
  status: "ok", 
  engine: ai ? "Gemini 1.5 Flash" : "Deterministic SLM",
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
    console.error("Scanner Error:", err.message);
    res.status(500).json({ error: "Scanner Error", suggestion: "Failed to connect. Please paste tech manually." });
  }
});

apiRouter.post("/parse-file", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    let text = "";
    if (file.mimetype === "application/pdf") {
      const data = await pdf(file.buffer);
      text = data.text;
    } else if (file.mimetype === "text/plain" || file.mimetype === "text/markdown") {
      text = file.buffer.toString("utf-8");
    } else {
      return res.status(400).json({ error: "Unsupported file type. Please upload PDF or TXT." });
    }

    if (!text || !text.trim()) {
      return res.status(422).json({ error: "Empty file or no readable text found." });
    }

    // Clean up text (remove excessive newlines/spaces)
    const cleanText = text.replace(/\s\s+/g, ' ').trim();
    
    // Use Gemini to structure the extracted text
    const result = await geminiAnalyze(cleanText.substring(0, 15000), file.originalname, "Uploaded Document Content");
    res.json({ result, title: file.originalname });
  } catch (err) {
    console.error("File Parse Error:", err);
    res.status(500).json({ error: "Failed to parse file. Ensure it's not password protected." });
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

