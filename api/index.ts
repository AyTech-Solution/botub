import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import { load } from "cheerio";
import cors from "cors";
import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

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
    return "I'm still learning about this business. Please check back later or contact support.";
  }

  const lowQuery = query.toLowerCase();
  const keywords = lowQuery.split(/\s+/).filter(w => w.length > 2);
  
  // Special Handling for Contacts
  const contactKeywords = ['contact', 'call', 'email', 'phone', 'mobile', 'address', 'location', 'reach', 'number', 'mail'];
  const isContactQuery = contactKeywords.some(k => lowQuery.includes(k));

  if (isContactQuery) {
    const contactLines = knowledgeBase.split('\n').filter(l => l.includes('CONTACT INFO') || l.includes('Emails:') || l.includes('Phones:') || l.includes('Address:'));
    if (contactLines.length > 0) {
      return contactLines.join('\n').replace('- ', '').trim();
    }
  }

  const lines = knowledgeBase.split('\n').filter(l => l.trim().length > 8 && !l.includes('---'));
  
  const matches = lines.map(line => {
    let score = 0;
    const lowLine = line.toLowerCase();
    
    keywords.forEach(word => {
      if (lowLine.includes(word)) score += Math.pow(word.length, 1.5);
    });

    if (lowLine.includes(lowQuery)) score += 100;

    return { line: line.trim(), score };
  })
  .filter(m => m.score > 10)
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);

  if (matches.length > 0) {
    return Array.from(new Set(matches.map(m => m.line))).join('\n').trim();
  }
  
  return "I'm sorry, I couldn't find a specific answer for that. Would you like to speak with a representative?";
}

// --- GEMINI AI ENGINE ---
async function geminiChat(query: string, knowledgeBase: string, personality: string) {
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
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    const response = await model.generateContent(`You are an intelligent, friendly AI assistant for a business.
    
BUSINESS KNOWLEDGE:
${cleanKB}

USER QUESTION:
${query}

TONE/PERSONALITY: ${personality}

INSTRUCTIONS:
1. Provide a natural, conversational response helping the user.
2. Stick strictly to the knowledge provided. If you don't know the answer, politely say so in a natural way (e.g. "Currently, I don't have that specific information, but you can reach us at...")
3. NEVER mention "the knowledge base", "the data", or "provided information". 
4. Be concise but warm.
5. You can speak in Hinglish (mixed Hindi/English) if the user does so.`);
    
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
    const response = await model.generateContent(`Act as a professional data analyst. Review the provided website content and create a highly detailed, clean Knowledge Base for a business AI.

SOURCE: ${title} (${description})
CONTENT:
${text.substring(0, 15000)}

GOAL: Extract and structure the following in a clear, natural format:
- Business Identity & Focus
- All Product/Service specialized features and offerings
- Pricing structures, plans, and value propositions
- ALL Contact details (emails, phone, physical location, social handles)
- Helpful FAQ based on the content

IMPORTANT: Output only the structured knowledge, no conversational intro.`);
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cache-Control': 'no-cache'
      },
      timeout: 8000,
      maxRedirects: 5,
      validateStatus: () => true
    });

    if (response.status >= 400 && response.status !== 404) {
      return res.status(response.status).json({ 
        error: `Website restricted access (Status ${response.status})`, 
        suggestion: "Cloud protection detected. Please paste website text manually." 
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
        error: "Dynamic Content Block", 
        suggestion: "This site requires JavaScript to load. Kripya content manually copy-paste karein." 
      });
    }

    const result = await geminiAnalyze(mainText, title, description);
    res.json({ result, title, crawledCount: 1 });
  } catch (err: any) {
    res.status(500).json({ 
      error: "Cloud Connection Issue", 
      suggestion: "Target site blocked the scan. Manual entry recommended."
    });
  }
});

apiRouter.post("/chat", async (req, res) => {
  const { prompt, knowledgeBase, personality } = req.body;
  try {
    const text = await geminiChat(prompt || '', knowledgeBase || '', personality || 'professional');
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

