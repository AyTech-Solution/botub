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

  return `
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

    const systemPrompt = `You are a professional, helpful, and very friendly AI assistant representing a business.
    
BUSINESS KNOWLEDGE:
${hasKnowledge ? cleanKB : 'No specific details provided yet. Greet the user warmly, introduce yourself as the business assistant, and offer to help with general questions.'}

TONE: ${personality}
LANGUAGE PREFERENCE: ${primaryLanguage}
CUSTOM INSTRUCTIONS: ${customInstructions}

BEHAVIORAL RULES:
1. TALK LIKE A HUMAN. Be warm, polite, and helpful. Use a natural tone of voice.
2. NO ROBOTIC PHRASES: Never say "based on the documents" or "I don't have access to that info". Instead say "I don't have that specific detail yet, but I can check for you" or "Aap humein call kar sakte hain details ke liye".
3. MULTILINGUAL: If the user speaks Hindi or Hinglish, respond in natural, polite Hinglish. (e.g., "Hanji, kaise hain aap? Main aapki poori help karunga.").
4. CONCISE & HELPFUL: Give direct answers. Don't repeat greetings if already in conversation.
5. IDENTITY: You represent the company directly. Do NOT mention being an AI or a large language model.

CONVERSATION HISTORY:
${historyContext || 'No previous messages.'}

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
    const response = await model.generateContent(`Act as an Expert Knowledge Architect. Review the following raw text from a website/document and transform it into a highly organized, professional Knowledge Base for a business AI Chatbot.

SOURCE NAME: ${title}
SOURCE DESCRIPTION: ${description}

RAW CONTENT:
${text.substring(0, 20000)}

YOUR TASK:
1. Identify the core Business Focus (What do they do?).
2. Extract all Products and Services with detailed features.
3. Extract Pricing details, plans, and value propositions.
4. Extract every contact detail (Emails, Phones, Locations, Social handles).
5. Identify helpful FAQ pairs based on the text.

OUTPUT FORMAT:
- Use clean Markdown headers.
- Be factual and concise.
- Ensure the result is formatted for another AI to read easily.`);
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

  console.log(`Starting scan for: ${url}`);

  try {
    let response;
    
    // First Attempt: Modern Chrome on Windows
    try {
      response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: () => true
      });
    } catch (err) {
      console.warn("Axios primary attempt failed:", (err as any).message);
    }

    // Success Check & Retry Logic
    if (!response || response.status >= 400 || !response.data || response.data.length < 500) {
      console.log(`Primary attempt failed (Status ${response?.status}). Retrying with alternate headers...`);
      try {
        response = await axios.get(url, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': '*/*',
          },
          timeout: 10000,
          validateStatus: () => true
        });
      } catch (err) {
         console.warn("Axios retry failed:", (err as any).message);
      }
    }

    if (!response || response.status >= 400 || !response.data || response.data.length < 100) {
      const statusCode = response?.status || 500;
      return res.status(statusCode).json({ 
        error: `Access Restricted (Code ${statusCode})`, 
        suggestion: "This website is blocking automated AI scanners. Please manually copy-paste the text from 'About Us', 'Pricing', and 'Services' pages into the details box to train your bot!" 
      });
    }

    const html = response.data;
    if (typeof html !== 'string') {
      return res.status(422).json({ error: "Unexpected content type received from website." });
    }

    const $ = load(html);
    
    // Clean up junk but keep some structure
    $(`script, style, noscript, iframe, footer, nav, aside, svg, .sidebar, #sidebar, .footer, #footer, .cookie-banner, .ads, .popup`).remove();
    
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || 'Website';
    const description = $('meta[name="description"]').attr('content') || '';
       // Find the element with the most text if specific ones fail
    const selectors = [
      'main', 'article', '#content', '.content', '#main', '.main-content', 
      '.entry-content', '.post-content', '.page-content', '.container', 'body'
    ];
    
    let mainText = '';
    for (const selector of selectors) {
      const text = $(selector).text().trim();
      if (text.length > 500) {
        mainText = text;
        break;
      }
    }

    if (!mainText || mainText.length < 300) {
      mainText = $('body').text();
    }
    
    // Better cleaning: remove excessive whitespace and repeated lines
    mainText = mainText
      .replace(/\s\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .split('\n')
      .map(l => l.trim())
      .filter((l, i, arr) => l.length > 5 && arr.indexOf(l) === i)
      .join('\n');

    if (mainText.length < 50) {
      return res.status(422).json({ 
        error: "Scanning limitation", 
        suggestion: "This URL returns very little text content. It might be blocked or require JavaScript. Please paste the content manually into the details box." 
      });
    }

    console.log(`Scanned ${mainText.length} chars. Sending to Gemini for analysis...`);
    // Gemini Analyze converts raw text into structured business KB
    const result = await geminiAnalyze(mainText.substring(0, 20000), title, description);
    res.json({ result, title, crawledCount: 1 });
  } catch (err: any) {
    console.error("Critical Scanner Error:", err);
    res.status(500).json({ 
      error: "Connection Interrupted", 
      suggestion: "The website connection failed or was refused. Please bypass this by manually pasting the text from your website into the details box."
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

