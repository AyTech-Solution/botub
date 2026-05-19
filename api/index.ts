import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import { load } from "cheerio";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());

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
--- BOTUB SYSTEM KNOWLEDGE (SLM GENERATED) ---

SITE: ${title || 'Website'}
DESC: ${metaDescription || 'Automated business profile extracted from live content.'}

INDEXED SERVICES/PRODUCTS:
${products.length > 0 ? products.join('\n') : 'Broad content indexing active. No specific headers found.'}

INDEXED PRICING/OFFERS:
${uniquePrices.length > 0 ? uniquePrices.join(', ') : 'Check full details for pricing information.'}

CONTACT RECORDS:
- Emails: ${uniqueEmails.join(', ') || 'Not found'}
- Phones: ${uniquePhones.join(', ') || 'Not found'}

KNOWLEDGE RAW DATA:
${safeText.substring(0, 6000)}
  `.trim();
}

function roughScrapChat(query: string, knowledgeBase: string, personality: string) {
  if (!knowledgeBase || typeof knowledgeBase !== 'string' || knowledgeBase.length < 5) {
    return "Mera knowledge base abhi khali hai. Kripya settings mein jaakar details daalein.";
  }

  const lowQuery = query.toLowerCase();
  const keywords = lowQuery.split(/\s+/).filter(w => w.length > 2);
  
  // Special Handling for Contacts
  const contactKeywords = ['contact', 'call', 'email', 'phone', 'mobile', 'address', 'location', 'reach', 'number', 'mail'];
  const isContactQuery = contactKeywords.some(k => lowQuery.includes(k));

  if (isContactQuery) {
    const contactSection = knowledgeBase.split('\n').find(l => l.includes('CONTACT RECORDS') || l.includes('Emails:') || l.includes('Phones:'));
    if (contactSection) {
      // Find the specific email/phone lines
      const contactLines = knowledgeBase.split('\n').filter(l => l.includes('Emails:') || l.includes('Phones:') || l.includes('Address:'));
      if (contactLines.length > 0) {
        return contactLines.join('\n').replace('- ', '').trim();
      }
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
  .filter(m => m.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);

  if (matches.length > 0) {
    // Return only the most relevant unique lines without any prefix/suffix
    const bestLines = Array.from(new Set(matches.map(m => m.line)));
    return bestLines.join('\n').trim();
  }
  
  // Fallback for specific keyword phrases
  if (knowledgeBase.toLowerCase().includes(lowQuery)) {
    const index = knowledgeBase.toLowerCase().indexOf(lowQuery);
    const snippet = knowledgeBase.substring(Math.max(0, index - 20), index + 500).split('\n')[0];
    if (snippet.length > 10) return snippet.trim();
  }

  return "I couldn't find a specific answer for that. Please try asking about our services or contact details.";
}

// --- API ROUTES ---

const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => res.json({ status: "ok", engine: "SLM v2 PRO" }));

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

    const result = roughScrapAnalysis(mainText, title, description);
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
    const text = roughScrapChat(prompt || '', knowledgeBase || '', personality || 'professional');
    res.json({ text });
  } catch (err: any) {
    res.status(500).json({ error: "Execution Fail" });
  }
});

apiRouter.get("/config-status", (req, res) => {
  res.json({ 
    server: "Vercel Production", 
    db: !!process.env.FIREBASE_PROJECT_ID, 
    mail: !!process.env.SMTP_USER 
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

