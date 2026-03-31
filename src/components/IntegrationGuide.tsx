import React from 'react';
import { X, Code, Globe, Layout, FileCode, Check, Copy, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IntegrationGuideProps {
  isOpen: boolean;
  onClose: () => void;
  botId: string;
}

export default function IntegrationGuide({ isOpen, onClose, botId }: IntegrationGuideProps) {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'manual' | 'wordpress' | 'hostinger'>('manual');

  const snippet = `<script src="${window.location.origin}/bot-widget.js" data-bot-id="${botId}"></script>`;

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
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Integration Guide</h2>
                  <p className="text-xs text-gray-500">Deploy your AI bot in minutes</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6 sm:p-8">
              {/* Snippet Section */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Your Unique Snippet</label>
                <div className="bg-gray-900 rounded-2xl p-4 relative group border border-gray-800">
                  <code className="text-indigo-300 text-xs font-mono break-all block pr-12">
                    {snippet}
                  </code>
                  <button 
                    onClick={copySnippet}
                    className="absolute top-1/2 -translate-y-1/2 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-500 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                  This script will load the chat widget on your website automatically.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      activeTab === tab.id 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.name}</span>
                  </button>
                ))}
              </div>

              {/* Instructions */}
              <div className="space-y-6">
                {activeTab === 'manual' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900">Manual HTML Installation</h3>
                    <ol className="space-y-4">
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Open your website's main HTML file (usually <code className="bg-gray-100 px-1 rounded text-indigo-600">index.html</code>).</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Scroll to the bottom of the file and find the closing <code className="bg-gray-100 px-1 rounded text-indigo-600">&lt;/body&gt;</code> tag.</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Paste your unique snippet right before that tag.</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Save the file and refresh your website. The bot should appear in the bottom right corner.</p>
                      </li>
                    </ol>
                  </div>
                )}

                {activeTab === 'wordpress' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900">WordPress Installation</h3>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-4">
                      <p className="text-xs text-amber-700 leading-relaxed">
                        <strong>Recommended:</strong> Use a plugin like "WPCode" or "Insert Headers and Footers" to safely add code without editing theme files.
                      </p>
                    </div>
                    <ol className="space-y-4">
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Log in to your WordPress Dashboard and go to <strong>Plugins &gt; Add New</strong>.</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Search for <strong>"WPCode"</strong>, install, and activate it.</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Go to <strong>Code Snippets &gt; Header & Footer</strong> in your sidebar.</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Paste your snippet into the <strong>Footer</strong> section and click <strong>Save Changes</strong>.</p>
                      </li>
                    </ol>
                  </div>
                )}

                {activeTab === 'hostinger' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900">Hostinger & Website Builders</h3>
                    <ol className="space-y-4">
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Open your Hostinger Website Builder (or Wix, Squarespace, etc.).</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Navigate to <strong>Website Settings</strong> or <strong>Integrations</strong>.</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Look for an option labeled <strong>"Custom Code"</strong> or <strong>"Embed Code"</strong>.</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Paste your snippet into the <strong>Body End</strong> or <strong>Footer</strong> section and publish your site.</p>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">Need help? Contact our support team.</p>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
