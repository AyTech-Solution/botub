# Project Report: Botub AI
## Domain-Specific Intelligent Chatbot Engine

**Project Type:** Minor Project (Web Development & Artificial Intelligence)
**Developer:** Aayush Kumawat (AyTech Solution)

---

## 1. Executive Summary
**Botub AI** is a sophisticated platform designed to empower businesses by creating domain-specific chatbots. Unlike complex AI systems that require expensive API keys and have high latency, Botub uses a custom-built deterministic "Rough-Scrap" engine to "train" bots using specific website content. It provides a seamless bridge between data extraction and practical business applications through an easy-to-use dashboard and embeddable chat widgets.

---

## 2. Project Objectives
*   **Knowledge Democratization:** Enable non-technical users to build AI agents based on their own data.
*   **Automation:** Automate the extraction of information from websites to build Knowledge Bases (KB).
*   **Security & Scalability:** Provide a secure, standalone architecture capable of handling multiple concurrent users and bots.
*   **Integration:** Offer a "one-line-of-code" integration for any website (WordPress, Shopify, Godaddy, etc.).

---

## 3. Technology Stack
### Frontend (Client-Side)
*   **React 18 & TypeScript:** For a robust, type-safe user interface.
*   **Tailwind CSS:** For modern, responsive, and utility-first styling.
*   **Motion (Framer Motion):** For smooth UI transitions and interactive animations.
*   **Lucide React:** For a consistent and scalable icon system.

### Backend (Server-Side)
*   **Node.js & Express:** Handling API routing and middleware.
*   **Vercel Serverless Functions:** For high-performance, cost-effective hosting.
*   **Cheerio & Axios:** For sophisticated web scraping and content extraction.

### Logic & Data
*   **Rough-Scrap Engine:** Custom deterministic keyword and pattern matching algorithm for response generation.
*   **Firebase Firestore:** NoSQL database for real-time data storage (Bots, Chats, Logs).
*   **Firebase Authentication:** Secure Google-based user login.

---

## 4. Key Functional Features
1.  **Smart Website Analyzer:** Users can input a URL; the system scrapes the site, cleans the HTML, and uses the Rough-Scrap engine to synthesize a comprehensive Knowledge Base automatically.
2.  **Deterministic Engine:** A 100% reliable keyword matching system that ensures zero hallucinations and instant responses.
3.  **Custom Personality Engine:** Define how the bot speaks (e.g., Professional, Quirky, Sarcastic) and provide specific "System Instructions."
4.  **Real-time Chat Widget:** A customizable, floating bubble that can be embedded on any site to provide 24/7 customer support.
5.  **Analytics Dashboard:** Visual tracking of messages, bot health, and activity logs.

---

## 5. System Architecture
The project follows a **Decoupled Architecture**:
*   **Presentation Layer:** React SPA handles user interaction and dashboard management.
*   **Security Layer:** Express proxy server ensures sensitive keys and data are never exposed to the client.
*   **Persistence Layer:** Firebase Firestore manages the state and history of all bots.
*   **Intelligence Layer:** Rough-Scrap Engine processes search queries based on the retrieved Knowledge Base.

---

## 6. Implementation Highlights
*   **SPA Reload Handling:** Implemented `vercel.json` rewrites to ensure client-side routing works perfectly even after page reloads on production.
*   **Clean Scraping:** Utilized Cheerio to strip unnecessary tags (scripts, styles) before sending content to AI, optimizing token usage and accuracy.
*   **Error Boundaries:** Comprehensive null-checking and optional chaining to prevent runtime crashes during data fetching.

---

## 7. Conclusion & Future Scope
Botub AI successfully demonstrates the practical application of Generative AI in the SaaS (Software as a Service) space. 
**Future Enhancements include:**
*   Multi-lingual voice output capabilities.
*   Direct document (PDF/Docx) upload for Knowledge Bases.
*   Advanced sentiment analysis for customer support logs.
