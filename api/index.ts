import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import { sendEmail } from "./mailing/service";

const app = express();
app.use(cors());
app.use(express.json());

// Deterministic Analysis Engine
function roughScrapAnalysis(text: string, title: string, metaDescription: string) {
  const emails = Array.from(text.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)).map(m => m[0]);
  const uniqueEmails = [...new Set(emails)];

  const phones = Array.from(text.matchAll(/(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g)).map(m => m[0]);
  const uniquePhones = [...new Set(phones)];

  const pricingMatches = Array.from(text.matchAll(/(\$\s?\d+(?:\.\d{2})?|\d+\s?USD|\d+\s?INR|\d+\s?Rs|₹\s?\d+)/gi)).map(m => m[0]);
  const uniquePrices = [...new Set(pricingMatches)].slice(0, 8);

  const sections = text.split('\n');
  const products = sections.filter(l => 
    l.toLowerCase().includes('plan') || 
    l.toLowerCase().includes('feature') || 
    l.toLowerCase().includes('service') || 
    l.toLowerCase().includes('module')
  ).slice(0, 15);

  return `
--- BOTUB KNOWLEDGE BASE (SLM ENGINE) ---

BUSINESS/SITE NAME: ${title || 'Website'}
SUMMARY: ${metaDescription || 'Information extracted from the homepage.'}

SERVICES & FEATURES FOUND:
${products.length > 0 ? products.join('\n') : 'No specific service headers found, but internal data is indexed below.'}

PRICING & OFFERS IDENTIFIED:
${uniquePrices.length > 0 ? uniquePrices.join(', ') : 'No clear pricing found. (Check manual details below)'}

CONTACT & CONNECT:
- Emails: ${uniqueEmails.join(', ') || 'Not explicitly found'}
- Phones: ${uniquePhones.join(', ') || 'Not explicitly found'}

CORE CONTENT DATA:
${text.substring(0, 4000)}
  `.trim();
}

function roughScrapChat(query: string, knowledgeBase: string, personality: string) {
  const lowQuery = query.toLowerCase();
  const keywords = lowQuery.split(/\s+/).filter(w => w.length > 2);
  const lines = knowledgeBase.split('\n').filter(l => l.trim().length > 10);
  
  const matches = lines.map(line => {
    let score = 0;
    const lowLine = line.toLowerCase();
    keywords.forEach(word => {
      if (lowLine.includes(word)) score += word.length;
    });
    if (lowLine.includes(lowQuery)) score += 30;
    return { line, score };
  })
  .filter(m => m.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 6);

  let baseResponse = "Verified system response based on our internal data:";
  const p = personality.toLowerCase();
  if (p.includes('friendly')) baseResponse = "Hello! Here is what I found:";
  else if (p.includes('professional')) baseResponse = "Based on the records, here is the information:";

  if (matches.length > 0) {
    const uniqueLines = Array.from(new Set(matches.map(m => m.line.trim()))).join('\n');
    return `${baseResponse}\n\n${uniqueLines}\n\nAnything else?`;
  }
  
  return `I'm analyzing your request. Based on our site records, search for specific terms like pricing, services, or contact info to get better results.`;
}

// Routes
app.get("/api/health", (req, res) => res.json({ status: "ok", service: "Botub Engine" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/api/send-report", async (req, res) => {
  const { email, reportContent, subject } = req.body;
  if (!email || !reportContent) return res.status(400).json({ error: "Required fields missing" });
  try {
    await sendEmail({ to: email, subject: subject || "Botub Report", text: reportContent });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/analyze-website", async (req, res) => {
  let { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });
  if (!url.startsWith('http')) url = 'https://' + url;

  try {
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 6000,
      maxRedirects: 3,
      validateStatus: () => true
    });

    if (response.status >= 400) {
      return res.status(response.status).json({ error: `Site returned ${response.status}`, suggestion: "Try another URL or paste content manually." });
    }

    const $ = cheerio.load(response.data);
    
    // Clean
    $('script, style, noscript, iframe, footer, nav, aside').remove();
    
    const title = $('title').text() || 'Website';
    const description = $('meta[name="description"]').attr('content') || '';
    
    // Extract text specifically from content areas or body
    let bodyText = $('main, article, #content, .content, body').text();
    bodyText = bodyText.replace(/\s+/g, ' ').trim();

    if (bodyText.length < 50) {
      return res.status(422).json({ error: "Low Content", suggestion: "Site may be dynamic (React/Vue). Paste details manually." });
    }

    const result = roughScrapAnalysis(bodyText, title, description);
    res.json({ result, title, crawledCount: 1 });
  } catch (err: any) {
    res.status(500).json({ error: "Analysis Error", details: err.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { prompt, knowledgeBase, personality } = req.body;
  try {
    const text = roughScrapChat(prompt, knowledgeBase, personality);
    res.json({ text });
  } catch (err: any) {
    res.status(500).json({ error: "Chat Error" });
  }
});

app.get("/api/config-status", (req, res) => {
  res.json({ hasFirebase: !!process.env.FIREBASE_PROJECT_ID, hasSmtp: !!process.env.SMTP_USER });
});

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Platform Error", message: err.message });
});

export default app;

