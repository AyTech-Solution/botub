import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import { load } from "cheerio";
import cors from "cors";
import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import multer from "multer";
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
function roughScrapAnalysis(text: string, title: string, metaDescription: string) {
  const safeText = text || '';
  
  // Extract patterns efficiently
  const emails = Array.from(safeText.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)).map(m => m[0]);
  const uniqueEmails = [...new Set(emails)];

  const phones = Array.from(safeText.matchAll(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}/g)).map(m => m[0]);
  const uniquePhones = [...new Set(phones)].filter(p => p.length >= 10);

  const pricingMatches = Array.from(safeText.matchAll(/(\$\s?\d+(?:\.\d{2})?|\d+\s?USD|\d+\s?INR|\d+\s?Rs|₹\s?\d+)/gi)).map(m => m[0]);
  const uniquePrices = [...new Set(pricingMatches)].slice(0, 10);

  const sections = safeText.split('\n').filter(l => l.trim().length > 5);
  const products = sections.filter(l => {
    const lowLine = l.toLowerCase();
    return lowLine.includes('plan') || lowLine.includes('feature') || 
           lowLine.includes('service') || lowLine.includes('product') ||
           lowLine.includes('pricing') || lowLine.includes('offer');
  }).slice(0, 30);

  return `
BUSINESS NAME: ${title || 'Not specified'}
PROFILE: ${metaDescription || 'No description found.'}

SERVICES/PRODUCTS:
${products.length > 0 ? products.join('\n') : 'Details available in main content.'}

PRICING & OFFERS:
${uniquePrices.length > 0 ? uniquePrices.join(', ') : 'Inquire for pricing details.'}

CONTACT INFO:
- Emails: ${uniqueEmails.join(', ') || 'Contact us through the website'}
- Phones: ${uniquePhones.join(', ') || 'Phone support available'}

ADDITIONAL DETAILS:
${safeText.substring(0, 8000)}
  `.trim();
}

function roughScrapChat(query: string, knowledgeBase: string, personality: string) {
  if (!knowledgeBase || typeof knowledgeBase !== 'string' || knowledgeBase.length < 5) {
    return "I'm still learning about this business. Please check back later.";
  }

  const lowQuery = query.toLowerCase();
  const contactLines = knowledgeBase.split('\n').filter(l => 
    l.toLowerCase().includes('email') || 
    l.toLowerCase().includes('phone') || 
    l.toLowerCase().includes('contact')
  );

  if (lowQuery.includes('contact') && contactLines.length > 0) {
    return "You can reach us at:\n" + contactLines.join('\n');
  }

  return "I'm sorry, I couldn't find a specific answer using my legacy engine. Please ask about our services or try again later.";
}

// --- GEMINI AI ENGINE ---
async function geminiChat(query: string, knowledgeBase: string, personality: string, customInstructions: string = '', primaryLanguage: string = 'auto') {
  // Strip robotic headers from old Slm versions if they exist in knowledgeBase
  const cleanKB = knowledgeBase
    .replace(/--- BOTUB SYSTEM KNOWLEDGE \(SLM GENERATED\) ---/g, '')
    .replace(/INDEXED SERVICES\/PRODUCTS:/g, 'SERVICES:')
    .replace(/INDEXED PRICING\/OFFERS:/g, 'PRICING:')
    .replace(/CONTACT RECORDS:/g, 'CONTACTS:')
    .replace(/KNOWLEDGE RAW DATA:/g, 'ADDITIONAL INFO:')
    .trim();

  if (!ai) return roughScrapChat(query, cleanKB, personality);

  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.85,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    const response = await model.generateContent(`You are an intelligent, helpful, and very human-like AI business assistant.
    
BUSINESS DETAILS:
${cleanKB}

USER'S MESSAGE:
${query}

TONE/PERSONALITY: ${personality}
PRIMARY LANGUAGE: ${primaryLanguage}
CUSTOM INSTRUCTIONS: ${customInstructions}

GUIDELINES:
1. Speak naturally like a human assistant.
2. Use ONLY the provided business details. Be honest if info is missing.
3. Support Hinglish/Hindi naturally if the user uses it.
4. Follow custom instructions strictly.
5. NEVER mention "the data" or "the knowledge base".`);
    
    const text = response.response.text();
    return text || roughScrapChat(query, cleanKB, personality);
  } catch (err) {
    console.error("Gemini Chat Error:", err);
    return roughScrapChat(query, cleanKB, personality);
  }
}

async function geminiAnalyze(text: string, title: string, description: string) {
  if (!ai) return roughScrapAnalysis(text, title, description);

  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(`Act as a professional data analyst. Review the provided website content and create a highly detailed Knowledge Base for a business AI.

SOURCE: ${title} (${description})
CONTENT:
${text.substring(0, 15000)}

GOAL: Extract every detail (Services, Pricing, Contact, FAQ, Hours) into a clean, searchable structure for another AI to use.`);
    return response.response.text() || roughScrapAnalysis(text, title, description);
  } catch (err) {
    console.error("Gemini Analyze Error:", err);
    return roughScrapAnalysis(text, title, description);
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

  try {
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 12000,
      maxRedirects: 8,
      validateStatus: () => true
    });

    if (response.status >= 400 && response.status !== 404) {
      return res.status(response.status).json({ 
        error: "Website restricted access", 
        suggestion: "This website has high security (Cloudflare/Firewall). Please copy the key information from the site and paste it into the details box manually." 
      });
    }

    const $ = load(response.data);
    $(`script, style, noscript, iframe, footer, nav, aside, svg, .sidebar, #sidebar, .footer, #footer, .cookie-banner, .ads, .popup`).remove();
    
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || 'Website';
    const description = $('meta[name="description"]').attr('content') || '';
    
    let mainText = $('main, article, #content, .content, body').text();
    mainText = mainText.replace(/\s\s+/g, ' ').trim();

    if (mainText.length < 50) {
      return res.status(422).json({ 
        error: "Scanning limitation", 
        suggestion: "We couldn't read much text from this URL. It might be an interactive app. Please paste the content manually." 
      });
    }

    const result = await geminiAnalyze(mainText, title, description);
    res.json({ result, title, crawledCount: 1 });
  } catch (err: any) {
    res.status(500).json({ 
      error: "Scanner connection issue", 
      suggestion: "The website blocked the automated AI scanner. Please bypass this by manually pasting the text from your website into the details box."
    });
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

apiRouter.post("/chat", async (req, res) => {
  const { prompt, knowledgeBase, personality, customInstructions, primaryLanguage } = req.body;
  try {
    const text = await geminiChat(
      prompt || '', 
      knowledgeBase || '', 
      personality || 'professional', 
      customInstructions || '', 
      primaryLanguage || 'auto'
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

