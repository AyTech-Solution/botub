import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Globe, 
  Code2, 
  CheckCircle2, 
  ArrowLeft, 
  Copy, 
  Info, 
  BookOpen,
  Layout,
  ExternalLink,
  MessageSquare,
  Loader2,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function IntegrationGuide() {
  const { botId: paramBotId } = useParams();
  const [botData, setBotData] = useState<any>(null);
  const [loading, setLoading] = useState(!!paramBotId);

  useEffect(() => {
    if (paramBotId) {
      const fetchBot = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'bots', paramBotId));
          if (docSnap.exists()) {
            setBotData({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (err) {
          console.error("Failed to fetch bot for guide", err);
        } finally {
          setLoading(false);
        }
      };
      fetchBot();
    }
  }, [paramBotId]);

  const botId = paramBotId || "YOUR_BOT_ID";
  const themeColor = botData?.branding?.color || "#4f46e5";
  const position = botData?.branding?.position || "right";

  const integrationSnippet = `<!-- Botub Chat Embed -->
<script>
  window.BOTUB_CONFIG = {
    botId: "${botId}",
    themeColor: "${themeColor}",
    position: "${position}"
  };
</script>
<script src="${window.location.origin}/bot-widget.js" async></script>`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:px-8 lg:py-20">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div>
            <Link 
              to="/dashboard" 
              className="inline-flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[0.9]">
              Integration<br />
              <span className="text-indigo-600">Guide.</span>
            </h1>
          </div>
          <div className="max-w-xs">
            <p className="text-slate-500 font-medium leading-relaxed">
              Deploy your intelligent assistant to any platform with a single line of code. Built for performance and compatibility.
            </p>
          </div>
        </div>

        {/* Main Guide Section - Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          {/* Step 1: Code Snippet */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 bg-slate-900 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200/20"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <Code2 className="w-64 h-64" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-xl">1</div>
                <h3 className="text-2xl font-black tracking-tight">Your Unique Snippet</h3>
              </div>
              
              <p className="text-slate-400 font-medium mb-8 max-w-lg">
                Copy this code and paste it just before the closing <code className="text-indigo-300 font-bold bg-white/5 px-2 py-0.5 rounded">&lt;/body&gt;</code> tag of your website.
              </p>

              <div className="relative group/code">
                <div className="absolute -top-12 right-0 flex items-center space-x-4">
                   <button 
                    onClick={() => copyToClipboard(integrationSnippet)}
                    className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 shadow-lg shadow-indigo-500/20"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </button>
                </div>
                <pre className="bg-black/40 backdrop-blur-xl p-8 rounded-[2rem] font-mono text-sm overflow-x-auto whitespace-pre border border-white/5 leading-relaxed text-indigo-200">
                  {integrationSnippet}
                </pre>
              </div>
            </div>
          </motion.div>

          {/* Side Stats/Info */}
          <div className="lg:col-span-4 grid grid-cols-1 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200/50 flex flex-col justify-between"
            >
              <div>
                <CheckCircle2 className="w-12 h-12 mb-6" />
                <h3 className="text-2xl font-black mb-4">Instant Sync</h3>
                <p className="text-indigo-100 font-medium text-sm leading-relaxed">
                  Changes made in your dashboard are reflected instantly on your site without updating the code.
                </p>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span>Protocol</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded">HTTPS/TLS</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm border border-slate-100 font-black text-xl">2</div>
                  <h3 className="text-xl font-black text-slate-900">Placement</h3>
                </div>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                  Always place the script at the bottom. This ensures your main content loads first for optimal SEO performance.
                </p>
              </div>
              <Link 
                to={`/bot/${botId}/test`}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center space-x-3 group-hover:scale-[1.02]"
              >
                <Zap className="w-4 h-4 text-indigo-400" />
                <span>Launch Now</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Platform Guides Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="col-span-full mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-600 rounded-full" />
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Platform Specifics</h2>
            </div>
          </div>
          
          {[
            { 
              title: "Hostinger", 
              icon: Globe, 
              color: "bg-indigo-50 text-indigo-600",
              desc: "Navigate to hPanel > Website Builder > Custom Code. Paste your snippet into the Footer field.",
              link: "https://support.hostinger.com/en/articles/4461817-how-to-add-custom-code-to-your-website"
            },
            { 
              title: "Wix / Squarespace", 
              icon: Layout, 
              color: "bg-slate-50 text-slate-800",
              desc: "Go to Settings > Advanced > Custom Code. Add the snippet to the 'Body End' section.",
              link: "https://support.wix.com/en/article/embedding-custom-code-on-your-site"
            },
            { 
              title: "Godaddy / Bluehost", 
              icon: Globe, 
              color: "bg-emerald-50 text-emerald-600",
              desc: "Use the 'Add Custom Script' option in your site settings. Target the Footer or Body End.",
              link: "https://www.godaddy.com/help/add-google-ads-or-custom-scripts-to-my-site-27252"
            },
            { 
              title: "Other Domains", 
              icon: Globe, 
              color: "bg-rose-50 text-rose-600",
              desc: "Works with Namecheap, Cloudflare, and more. Look for 'Footer Scripts' or 'Header/Footer' settings.",
              link: "#"
            }
          ].map((platform, i) => (
            <motion.div
              key={platform.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className={`w-14 h-14 ${platform.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <platform.icon className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-4">{platform.title}</h4>
              <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                {platform.desc}
              </p>
              <a 
                href={platform.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center hover:text-indigo-800 transition-colors"
              >
                Docs <ExternalLink className="w-3 h-3 ml-1.5" />
              </a>
            </motion.div>
          ))}
        </div>

        {/* Troubleshooting & Support */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.1),transparent_50%)]" />
            <h3 className="text-3xl font-black mb-8 relative z-10 tracking-tight">Need help with<br />installation?</h3>
            <p className="text-slate-400 font-medium mb-10 relative z-10">
              Our technical team can help you map your domain or troubleshoot complex CSP and cross-origin headers.
            </p>
            <Link 
              to="/contact" 
              className="inline-flex items-center px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-900/40 relative z-10"
            >
              Contact Support
            </Link>
          </div>

          <div className="bg-slate-50 rounded-[3rem] p-12 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm border border-slate-100">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Expert Guides</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Advanced Scenarios</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Learn how to implement user-identity passing, advanced event tracking, and custom CSS overrides.
                  </p>
                </div>
                <a href="#" className="inline-flex items-center text-xs font-black text-slate-900 hover:text-indigo-600 transition-colors">
                  View Developer Docs <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </div>
            </div>
          </div>

          <div className="bg-rose-50 rounded-[3rem] p-12 border border-rose-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
                  <Info className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-rose-950 tracking-tight">Troubleshooting</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "CSP Errors: Whitelist script domain",
                  "Ad-Blockers: Ensure tracker is unblocked",
                  "Cross-Origin: Check headers if using SDK",
                  "Protocol: Ensure your site uses HTTPS"
                ].map((check, i) => (
                  <li key={i} className="flex items-center text-rose-900/70 font-bold text-sm">
                    <div className="w-2 h-2 bg-rose-400 rounded-full mr-4" />
                    {check}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-10 p-5 bg-white/50 rounded-2xl border border-rose-200">
              <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Common Fix</p>
              <p className="text-[10px] font-bold text-rose-950 mt-1 italic italic">"Disable 'Ghostery' or 'uBlock' if widget doesn't appear on local dev host."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
