import React from 'react';
import { Link } from 'react-router-dom';
import { X, Code, Globe, Layout, FileCode, Check, Copy, ChevronRight, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IntegrationGuideProps {
  isOpen: boolean;
  onClose: () => void;
  botId: string;
  themeColor?: string;
  position?: string;
}

export default function IntegrationGuide({ isOpen, onClose, botId, themeColor = "#4f46e5", position = "right" }: IntegrationGuideProps) {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'manual' | 'wordpress' | 'hostinger'>('manual');

  const snippet = `<!-- Botub Chat Embed -->
<script>
  window.BOTUB_CONFIG = {
    botId: "${botId}",
    themeColor: "${themeColor}",
    position: "${position}"
  };
</script>
<script src="${window.location.origin}/bot-widget.js" async></script>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'manual', name: 'Manual HTML', icon: FileCode },
    { id: 'wordpress', name: 'WordPress', icon: Globe },
    { id: 'hostinger', name: 'Hostinger / Builders', icon: Layout },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <Code className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Deploy Bot.</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Integration Blueprint</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors text-slate-400 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-8 md:p-10 custom-scrollbar">
              {/* Step 1: Snippet */}
              <div className="mb-12">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100">1</div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">The Code Snippet</h3>
                </div>
                
                <div className="bg-slate-900 rounded-[2rem] p-8 relative group border border-white/5 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Code className="w-32 h-32 text-white" />
                  </div>
                  
                  <code className="text-indigo-200 text-[11px] font-mono break-all block pr-12 leading-relaxed relative z-10">
                    {snippet}
                  </code>
                  
                  <button 
                    onClick={copySnippet}
                    className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white text-indigo-400 hover:text-slate-900 rounded-xl transition-all border border-white/5 backdrop-blur-md group/btn"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />}
                  </button>
                </div>
                
                <div className="mt-6 flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Paste this snippet just before the <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-900 font-bold">{"</body>"}</code> tag in your main layout or HTML template.
                  </p>
                </div>
              </div>

              {/* Step 2: Placement */}
              <div className="mb-12">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100">2</div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Placement Strategy</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <Layout className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-black text-slate-900">Optimal Load</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Placed at bottom to prioritize your site's core content loading speed.</p>
                  </div>
                  <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <Globe className="w-4 h-4 text-sky-500" />
                      <span className="text-xs font-black text-slate-900">Domain Sync</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">One script works for all subdomains and environments automatically.</p>
                  </div>
                </div>
              </div>

              {/* Quick Troubleshooting */}
              <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100">
                <h4 className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-4 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-2" />
                  Common Issues
                </h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                  {[
                    "CSP Header conflict",
                    "Invalid Bot ID",
                    "Ad-blocker filter",
                    "Mobile viewport"
                  ].map((err, i) => (
                    <div key={i} className="flex items-center text-[10px] font-bold text-rose-800/60 leading-none">
                      <div className="w-1 h-1 bg-rose-300 rounded-full mr-2" />
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-50 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link 
                to={`/integration-guide/${botId}`} 
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 flex items-center transition-colors"
                onClick={onClose}
              >
                View Expert Guide
                <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
              <button 
                onClick={onClose}
                className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Launch Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
