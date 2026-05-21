import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, collection, addDoc, getDocs, query, where, getDoc } from 'firebase/firestore';
import { analyzeWebsite, analyzeText } from '../services/botService';
import { 
  Bot, 
  Globe,
  Building2, 
  FileText,
  Link as LinkIcon,
  ArrowRight, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Zap,
  Smile,
  Settings as SettingsIcon,
  X,
  ChevronDown,
  Crown,
  ShoppingCart,
  UserCheck,
  Info,
  Copy,
  Code2,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const SuccessConfetti = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0, 
            scale: 0,
            x: '50%',
            y: '50%'
          }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1.2, 1],
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            rotate: Math.random() * 360
          }}
          transition={{ 
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeOut"
          }}
          className="absolute w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899'][Math.floor(Math.random() * 5)]
          }}
        />
      ))}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            rotate: [0, 180]
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut"
          }}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" />
        </motion.div>
      ))}
    </div>
  );
};

function getIconForSection(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('about') || t.includes('company') || t.includes('identity') || t.includes('overview') || t.includes('general')) return '🏢';
  if (t.includes('service') || t.includes('product') || t.includes('offer') || t.includes('feature')) return '🛠️';
  if (t.includes('price') || t.includes('pricing') || t.includes('cost') || t.includes('plan') || t.includes('fee')) return '💰';
  if (t.includes('contact') || t.includes('phone') || t.includes('email') || t.includes('support') || t.includes('whatsapp') || t.includes('link')) return '📞';
  if (t.includes('refund') || t.includes('policy') || t.includes('privacy') || t.includes('rule') || t.includes('term')) return '🔐';
  if (t.includes('faq') || t.includes('question') || t.includes('answer')) return '❓';
  return '📝';
}

function parseExtractedKnowledge(markdownText: string) {
  const sections: { title: string; content: string; icon: string }[] = [];
  if (!markdownText) return sections;
  
  const lines = markdownText.split('\n');
  let currentSectionTitle = 'General Overview';
  let currentSectionContent: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if line looks like a header (Markdown h3/h2, nested bold or key section headers)
    const isHeader = trimmed.startsWith('###') || trimmed.startsWith('##') || (trimmed.startsWith('**') && trimmed.endsWith('**')) || trimmed.endsWith(':');
    if (isHeader) {
      if (currentSectionContent.length > 0) {
        sections.push({
          title: currentSectionTitle,
          content: currentSectionContent.join('\n'),
          icon: getIconForSection(currentSectionTitle)
        });
        currentSectionContent = [];
      }
      currentSectionTitle = trimmed.replace(/[#*:]/g, '').trim();
    } else {
      currentSectionContent.push(line);
    }
  }
  
  if (currentSectionContent.length > 0 || sections.length === 0) {
    sections.push({
      title: currentSectionTitle,
      content: currentSectionContent.join('\n') || markdownText,
      icon: getIconForSection(currentSectionTitle)
    });
  }
  
  return sections;
}

export default function BotCreation() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState('website');
  const [useCase, setUseCase] = useState('customer_support');
  const [botName, setBotName] = useState('Botub Assistant');
  const [companyName, setCompanyName] = useState('My Business');
  const [details, setDetails] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [additionalUrls, setAdditionalUrls] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [botCount, setBotCount] = useState(0);
  const [createdBotId, setCreatedBotId] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [scannedSuggestions, setScannedSuggestions] = useState<{text: string, url: string, isTip?: boolean}[]>([]);
  const [tipToFix, setTipToFix] = useState<string | null>(null);
  const [tipValue, setTipValue] = useState('');
  
  // Custom interactive breakdown and optimization states
  const [selectedBreakdownTab, setSelectedBreakdownTab] = useState(0);
  const [editingBreakdownIndex, setEditingBreakdownIndex] = useState<number | null>(null);
  const [editingBreakdownValue, setEditingBreakdownValue] = useState('');

  // Specific sections & URLs inclusion states
  const [extractedSections, setExtractedSections] = useState<{
    id: string;
    title: string;
    content: string;
    icon: string;
    sourceUrl: string;
    selected: boolean;
  }[]>([]);
  
  const [discoveredPageUrls, setDiscoveredPageUrls] = useState<{
    url: string;
    title: string;
    selected: boolean;
    loading: boolean;
    crawled: boolean;
  }[]>([]);
  
  // New Premium Features State
  const [personality, setPersonality] = useState('professional');
  const [isPersonalityDropdownOpen, setIsPersonalityDropdownOpen] = useState(false);
  const [isUseCaseDropdownOpen, setIsUseCaseDropdownOpen] = useState(false);
  const [responseSpeed, setResponseSpeed] = useState('natural');
  const [isResponseSpeedDropdownOpen, setIsResponseSpeedDropdownOpen] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('Welcome to Botub! How can I help you automate your business today?');
  const [primaryLanguage, setPrimaryLanguage] = useState('auto');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  const navigate = useNavigate();

  const personaTemplates = [
    { label: 'Customer Support', icon: <Building2 className="w-3 h-3" />, text: 'You are a patient and helpful support agent. Use clear, simple language and always verify if the user needs more help before ending.' },
    { label: 'Sales Expert', icon: <Zap className="w-3 h-3" />, text: 'You are a persuasive sales consultant. Focus on highlighting benefits, creating urgency, and guiding the user toward a purchase.' },
    { label: 'Technical Guru', icon: <SettingsIcon className="w-3 h-3" />, text: 'You are a highly knowledgeable technical expert. Provide detailed, accurate explanations and don\'t shy away from complex terms when necessary.' },
    { label: 'Playful Guide', icon: <Smile className="w-3 h-3" />, text: 'You are a fun and energetic guide. Use plenty of emojis, keep responses short and punchy, and maintain a very positive vibe.' },
    { label: 'Influencer', icon: <UserCheck className="w-3 h-3" />, text: 'You are a friendly and engaging social media influencer. Use a personal tone, share updates with excitement, and build strong connections with your audience.' },
    { label: 'Moderator', icon: <AlertCircle className="w-3 h-3" />, text: 'You are a firm but fair community moderator. Your job is to keep the conversation safe, respectful, and on-topic. Warn users who break rules.' }
  ];

  const useCaseTemplates: Record<string, any[]> = {
    website: [
      { id: 'customer_support', label: 'Customer Support', icon: <Building2 className="w-5 h-5" />, desc: 'Help users with queries and issues.' },
      { id: 'lead_gen', label: 'Lead Generation', icon: <UserCheck className="w-5 h-5" />, desc: 'Collect user info and qualify leads.' },
      { id: 'ecommerce', label: 'E-commerce', icon: <ShoppingCart className="w-5 h-5" />, desc: 'Assist with products and orders.' },
      { id: 'booking', label: 'Appointment Booking', icon: <ArrowRight className="w-5 h-5" />, desc: 'Schedule meetings and appointments.' },
      { id: 'feedback', label: 'Feedback Collection', icon: <MessageCircle className="w-5 h-5" />, desc: 'Gather user reviews and surveys.' },
      { id: 'manual', label: 'Manual Setup', icon: <SettingsIcon className="w-5 h-5" />, desc: 'Full control over bot behavior.' }
    ]
  };

  useEffect(() => {
    const checkLimits = async () => {
      if (!auth.currentUser) return;
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserProfile(userSnap.data());
        }

        const q = query(collection(db, 'bots'), where('ownerId', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        setBotCount(querySnapshot.size);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'checkLimits');
      }
    };
    checkLimits();
  }, []);

  const handleOptimizeText = async () => {
    if (!details || details.length < 20) {
      toast.error("Please enter more details to optimize.");
      return;
    }
    
    setLoading(true);
    try {
      const data = await analyzeText(details, botName || companyName);
      // data.result is the object { knowledgeBase, missingTips, businessName }
      if (data.result && data.result.knowledgeBase) {
        setDetails(data.result.knowledgeBase);
        toast.success("AI significantly improved your knowledge structure!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to optimize text.");
    } finally {
      setLoading(false);
    }
  };

  const updateDetailsFromSections = (sectionsList: { id: string; title: string; content: string; icon: string; sourceUrl: string; selected: boolean }[]) => {
    const includedContent = sectionsList
      .filter(s => s.selected)
      .map(s => `### ${s.title}\n${s.content}`)
      .join('\n\n');
    setDetails(includedContent);
  };

  const toggleSectionSelection = (id: string) => {
    const updated = extractedSections.map(s => 
      s.id === id ? { ...s, selected: !s.selected } : s
    );
    setExtractedSections(updated);
    updateDetailsFromSections(updated);
  };

  const updateSectionContent = (id: string, newContent: string) => {
    const updated = extractedSections.map(s => 
      s.id === id ? { ...s, content: newContent } : s
    );
    setExtractedSections(updated);
    updateDetailsFromSections(updated);
  };

  const handleCrawlUrl = async (url: string) => {
    setDiscoveredPageUrls(prev => {
      const exists = prev.find(p => p.url === url);
      if (exists) {
        return prev.map(p => p.url === url ? { ...p, loading: true } : p);
      } else {
        return [...prev, { url, title: url, selected: true, loading: true, crawled: false }];
      }
    });

    try {
      const data = await analyzeWebsite(url);
      const { knowledgeBase } = data.result;
      const parsed = parseExtractedKnowledge(knowledgeBase);
      const newSections = parsed.map((sect, i) => ({
        id: `sect-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        title: sect.title,
        content: sect.content,
        icon: sect.icon,
        sourceUrl: url,
        selected: true
      }));

      const nextSections = [...extractedSections.filter(s => s.sourceUrl !== url), ...newSections];
      setExtractedSections(nextSections);
      updateDetailsFromSections(nextSections);

      setDiscoveredPageUrls(prev => 
        prev.map(p => p.url === url ? { ...p, loading: false, crawled: true, selected: true } : p)
      );
      toast.success(`Successfully scanned and integrated page: ${url}`);
    } catch (err: any) {
      console.error(`Failed to crawl ${url}:`, err);
      toast.error(`Failed to crawl ${url}: ${err.message || err}`);
      setDiscoveredPageUrls(prev => 
        prev.map(p => p.url === url ? { ...p, loading: false, selected: false } : p)
      );
    }
  };

  const toggleUrlSelection = async (url: string) => {
    const target = discoveredPageUrls.find(p => p.url === url);
    if (!target) return;

    if (!target.crawled) {
      await handleCrawlUrl(url);
    } else {
      const newSelectedState = !target.selected;
      setDiscoveredPageUrls(prev => 
        prev.map(p => p.url === url ? { ...p, selected: newSelectedState } : p)
      );
      const updated = extractedSections.map(s => 
        s.sourceUrl === url ? { ...s, selected: newSelectedState } : s
      );
      setExtractedSections(updated);
      updateDetailsFromSections(updated);
    }
  };

  const handleAnalyze = async () => {
    if (!websiteUrl) return;
    
    setLoading(true);
    setError('');
    setSuggestion('');
    setAnalysisResult('');
    try {
      const data = await analyzeWebsite(websiteUrl);
      const { knowledgeBase, missingTips, businessName } = data.result;
      
      setAnalysisResult(knowledgeBase);
      
      const parsed = parseExtractedKnowledge(knowledgeBase);
      const newSections = parsed.map((sect, i) => ({
        id: `sect-${Date.now()}-${i}`,
        title: sect.title,
        content: sect.content,
        icon: sect.icon,
        sourceUrl: websiteUrl,
        selected: true
      }));
      setExtractedSections(newSections);
      updateDetailsFromSections(newSections);

      if (data.suggestions) {
        setScannedSuggestions(data.suggestions);
        const filteredUrls = data.suggestions
          .filter((s: any) => s.url && !s.isTip)
          .map((s: any) => ({
            url: s.url,
            title: s.text,
            selected: false,
            loading: false,
            crawled: false
          }));
        setDiscoveredPageUrls(filteredUrls);
      }
      
      if (businessName && !botName) {
        setBotName(businessName);
      }

      if (missingTips && missingTips.length > 0) {
         setScannedSuggestions(prev => [
           ...prev, 
           ...missingTips.map((t: string) => ({ text: t, url: '', isTip: true }))
         ]);
      }

      toast.success("Website analysis successful!");
    } catch (err: any) {
      console.error("Analysis Exception:", err);
      setError(err.message || 'Analysis failed.');
      setSuggestion(err.suggestion || "Please try pasting the content manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async () => {
    if (!auth.currentUser) {
      toast.error('You must be logged in to create a bot.');
      return;
    }
    
    if (!botName || !companyName) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    let botId = '';
    try {
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const safeCompany = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const safeBot = botName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      botId = `${safeCompany}-${safeBot}-${randomSuffix}`;
      
      // Generate initial instructions based on use case
      let initialInstructions = customInstructions;
      if (!initialInstructions) {
        const selectedUseCase = useCaseTemplates[platform]?.find(u => u.id === useCase);
        
        const basePrompt = `You are a ${selectedUseCase?.label || 'AI'} assistant for ${companyName}. Platform: ${platform}.`;
        const goalPrompt = `Goal: ${selectedUseCase?.desc || 'General assistance'}.`;
        
        let specificInstructions = '';
        switch (useCase) {
          case 'customer_support':
            specificInstructions = 'Focus on solving user problems patiently. Be polite and professional. If you cannot solve an issue, provide contact details for human support.';
            break;
          case 'sales':
          case 'ecommerce':
          case 'social_sales':
            specificInstructions = 'Act as a persuasive sales consultant. Highlight product benefits, answer pricing questions, and guide users toward making a purchase.';
            break;
          case 'lead_gen':
            specificInstructions = 'Your primary goal is to collect user contact information (name, email, phone) and qualify them as potential leads. Be engaging but direct.';
            break;
          case 'music':
            specificInstructions = 'You are a music enthusiast. Help users find songs, playlists, and artists. Provide interesting trivia about music when relevant.';
            break;
          case 'video':
            specificInstructions = 'Help users discover and share video content. Explain how to upload or download videos if asked.';
            break;
          case 'booking':
            specificInstructions = 'Assist users in scheduling appointments. Check availability and confirm dates/times clearly.';
            break;
          case 'moderator':
            specificInstructions = 'Monitor group chat for spam or offensive content. Enforce community guidelines strictly but fairly.';
            break;
          case 'influencer':
            specificInstructions = 'Represent the influencer with a friendly and personal tone. Engage with fans, share updates, and manage common inquiries.';
            break;
          default:
            specificInstructions = 'Provide helpful and accurate information. Maintain a professional tone.';
        }

        initialInstructions = `${basePrompt} ${goalPrompt} ${specificInstructions} Always prioritize efficiency and accuracy.`;
      }

      const botData = {
        id: botId,
        ownerId: auth.currentUser?.uid,
        name: botName,
        companyName,
        platform,
        useCase,
        companyDetails: details,
        links: websiteUrl ? [websiteUrl, ...additionalUrls.filter(u => u.trim())] : [...additionalUrls.filter(u => u.trim())],
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        status: 'active',
        personality: personality,
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + botName,
        responseSpeed: responseSpeed,
        voiceEnabled: false,
        voiceOutputEnabled: false,
        voiceId: 'Kore',
        primaryLanguage: primaryLanguage,
        greetingMessage: greetingMessage.trim() || `Welcome to Botub! How can I help you automate your business today?`,
        customInstructions: initialInstructions,
        integrationParams: {
          webhookUrl: ''
        },
        usageStats: {
          totalChats: 0,
          totalMessages: 0,
          userMessages: 0,
          botMessages: 0,
          errorRate: '0%',
          health: '100%',
          serverStatus: 'online'
        }
      };

      await setDoc(doc(db, 'bots', botId), botData);
      
      // Send email notification (Removed)
      
      // Add initial knowledge
      if (details) {
        const knowledgePath = `bots/${botId}/knowledge`;
        try {
          await addDoc(collection(db, 'bots', botId, 'knowledge'), {
            botId,
            content: details,
            sourceUrl: websiteUrl || 'manual',
            lastUpdated: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, knowledgePath);
        }
      }

      setCreatedBotId(botId);
      setIsFinishing(true);
      setTimeout(() => {
        setIsFinishing(false);
        setStep(4);
      }, 3500);
    } catch (err: any) {
      console.error("Bot creation error:", err);
      
      let displayError = "An unexpected error occurred.";
      let displaySuggestion = "Please try clicking 'Finalize Bot' again. If this persists, refresh the page.";

      if (err.message && err.message.startsWith('{')) {
        try {
          const parsed = JSON.parse(err.message);
          displayError = `Database Connection Issue (${parsed.operationType})`;
          displaySuggestion = "We couldn't reach the database server. Please check your internet and click 'Finalize Bot' again.";
        } catch (e) {
          displayError = "Database Sync Failed";
        }
      } else if (err.message?.includes('permission-denied')) {
        displayError = "Access Denied";
        displaySuggestion = "Your account doesn't have permission to perform this update, or the bot name exists and you don't own it. Try a different name.";
      } else if (err.message?.includes('504') || err.message?.includes('502') || err.message?.includes('500')) {
        displayError = "Network Congestion";
        displaySuggestion = "The cloud server is currently busy. Your configuration is saved—please click 'Finalize Bot' once more to retry.";
      } else {
        displayError = err.message || displayError;
      }
      
      setError(displayError);
      setSuggestion(displaySuggestion);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Your Bot</h1>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Step {step} of 4</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-600"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isFinishing && (
            <motion.div
              key="finishing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100 flex flex-col items-center justify-center text-center overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#4f46e505_0%,_transparent_70%)]" />
              
              <div className="relative w-32 h-32 mb-8">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-100"
                />
                <motion.div
                  animate={{ 
                    rotate: -360,
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border-4 border-dashed border-indigo-200"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bot className="w-12 h-12 text-indigo-600 animate-bounce" />
                </div>
              </div>

              <motion.h3 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl font-black text-slate-900 tracking-tight mb-2"
              >
                Forging Your AI Assistant
              </motion.h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Calibrating intelligence modules...
              </p>

              <div className="w-64 h-1.5 bg-gray-100 rounded-full mt-8 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3 }}
                  className="h-full bg-indigo-600 rounded-full"
                />
              </div>
            </motion.div>
          )}

          {!isFinishing && step === 1 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="text-indigo-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Platform</h2>
              <p className="text-gray-500 mb-8">Choose where your bot will be deployed. We'll provide tailored setup instructions for each.</p>
              
              <div className="grid grid-cols-1 gap-4 mb-8">
                {[
                  { id: 'website', label: 'Website', icon: <Globe className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                      platform === p.id 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${p.color}`}>
                      {p.icon}
                    </div>
                    <span className="font-bold text-gray-900">{p.label} (Currently Supported)</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setUseCase(useCaseTemplates[platform][0].id);
                  setStep(2);
                }}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center"
              >
                Continue
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </motion.div>
          )}

          {!isFinishing && step === 2 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <Bot className="text-indigo-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Bot Name</label>
                  <div className="relative">
                    <Bot className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="bot-name-input"
                      placeholder="Give your bot a unique name (e.g. Maya, SupportHero)"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Use Case</label>
                  <button
                    type="button"
                    onClick={() => setIsUseCaseDropdownOpen(!isUseCaseDropdownOpen)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between hover:border-indigo-300 transition-all font-bold text-sm"
                  >
                    <div className="flex items-center space-x-3">
                      {useCaseTemplates[platform]?.find(u => u.id === useCase)?.icon}
                      <span className="capitalize">{useCaseTemplates[platform]?.find(u => u.id === useCase)?.label}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isUseCaseDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isUseCaseDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                      >
                        {useCaseTemplates[platform]?.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => { setUseCase(u.id); setIsUseCaseDropdownOpen(false); }}
                            className="w-full p-4 text-left hover:bg-gray-50 flex items-center space-x-3"
                          >
                            <div className="text-indigo-600">{u.icon}</div>
                            <div>
                              <p className="text-xs font-bold capitalize">{u.label}</p>
                              <p className="text-[10px] text-gray-400">{u.desc}</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp, AyTech Solution"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!botName || !companyName}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center disabled:opacity-50"
                  >
                    Next Step
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {!isFinishing && step === 3 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="text-indigo-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Knowledge & Persona</h2>
              <p className="text-gray-500 mb-8">Train your bot with knowledge and define how it should interact.</p>
              
              <div className="space-y-8">
                {/* Website Section */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-gray-900">Website Importer</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                       <input
                        type="url"
                        placeholder="https://yourbusiness.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                      />
                      <button
                        onClick={handleAnalyze}
                        disabled={loading || !websiteUrl}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center shrink-0 text-sm"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan"}
                      </button>
                    </div>

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-xs font-bold text-red-600">{error}</p>
                        {suggestion && <p className="text-[10px] text-red-500 mt-1">{suggestion}</p>}
                      </div>
                    )}

                    {analysisResult && (
                      <div className="mt-8 space-y-6">
                        {/* Summary & Score banner */}
                        {(() => {
                          const totalSectionsCount = extractedSections.length;
                          const selectedSectionsCount = extractedSections.filter(s => s.selected).length;
                          const missingTipsList = scannedSuggestions.filter(s => s.isTip);
                          const totalPoints = totalSectionsCount + missingTipsList.length;
                          const scoreValue = totalPoints > 0 ? Math.max(10, Math.min(100, Math.round((selectedSectionsCount / totalPoints) * 100))) : 100;
                          
                          return (
                            <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-2 text-center md:text-left">
                                  <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Intelligence Report Generated</span>
                                  </div>
                                  <h3 className="text-xl font-black font-sans leading-tight">AI Website Extraction Report</h3>
                                  <p className="text-xs text-slate-400 font-medium max-w-md">
                                    We scanned your website and structured the business knowledge. You can choose specific sections and crawl other pages to expand and refine your training base.
                                  </p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl">
                                  <div className="relative flex items-center justify-center">
                                    {/* Score Indicator */}
                                    <svg className="w-16 h-16 transform -rotate-90">
                                      <circle cx="32" cy="32" r="28" className="text-slate-800" strokeWidth="4" fill="transparent" stroke="currentColor" />
                                      <circle cx="32" cy="32" r="28" className="text-indigo-500" strokeWidth="4" fill="transparent" strokeDasharray={176} strokeDashoffset={176 - (176 * scoreValue) / 100} strokeLinecap="round" stroke="currentColor" />
                                    </svg>
                                    <span className="absolute text-sm font-black font-mono">{scoreValue}%</span>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Completeness Score</p>
                                    <p className="text-xs font-bold text-slate-200">
                                      {scoreValue === 100 ? "🎉 Pure perfection!" : scoreValue > 75 ? "✨ Excellent structure" : "⚠️ Needs detail fine-tuning"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Two Column Layout: Extracted Data breakdown and Actionable tips */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
                          {/* Left Panel: Detailed Breakdown of Extracted Info (7 Columns) */}
                          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm leading-tight">Structured Knowledge Categories</h4>
                                <p className="text-[10px] text-slate-400 font-medium">Toggle checkboxes to select specific sections to include in the training base</p>
                              </div>
                              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-widest font-mono shrink-0">
                                {extractedSections.filter(s => s.selected).length}/{extractedSections.length} Sections Active
                              </span>
                            </div>

                            {extractedSections.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 text-xs">
                                No sections selected or identified. Try scanning or enter manually below.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {/* Section Tabs with checkbox */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                  {extractedSections.map((sect, sIdx) => {
                                    const isActive = (selectedBreakdownTab >= extractedSections.length ? 0 : selectedBreakdownTab) === sIdx;
                                    return (
                                      <div
                                        key={sect.id}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                                          isActive 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100' 
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-100'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={sect.selected}
                                          onChange={() => toggleSectionSelection(sect.id)}
                                          className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-550 cursor-pointer"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedBreakdownTab(sIdx);
                                            setEditingBreakdownIndex(null);
                                          }}
                                          className="flex items-center gap-1 text-left"
                                        >
                                          <span>{sect.icon}</span>
                                          <span className="capitalize">{sect.title}</span>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Active Section Panel */}
                                {(() => {
                                  const activeTabIdx = selectedBreakdownTab >= extractedSections.length ? 0 : selectedBreakdownTab;
                                  const activeSect = extractedSections[activeTabIdx];
                                  if (!activeSect) return null;

                                  return (
                                    <div className={`bg-slate-50/50 rounded-2xl p-5 border transition-all space-y-3 relative group ${
                                      activeSect.selected ? 'border-indigo-100 bg-slate-50/50' : 'border-dashed border-red-200 bg-red-50/5'
                                    }`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xl">{activeSect.icon}</span>
                                          <span className="font-extrabold text-slate-900 text-xs capitalize">{activeSect.title}</span>
                                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                                            activeSect.selected 
                                              ? 'bg-indigo-50 text-indigo-600' 
                                              : 'bg-red-50 text-red-500 border border-red-100'
                                          }`}>
                                            {activeSect.selected ? 'Included' : 'Excluded'}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {editingBreakdownIndex !== activeTabIdx ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingBreakdownIndex(activeTabIdx);
                                                setEditingBreakdownValue(activeSect.content);
                                              }}
                                              className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1"
                                            >
                                              Modify
                                            </button>
                                          ) : null}
                                        </div>
                                      </div>

                                      <p className="text-[9px] text-slate-400 font-medium font-sans">Source URL: <span className="font-mono">{activeSect.sourceUrl}</span></p>

                                      {editingBreakdownIndex === activeTabIdx ? (
                                        <div className="space-y-3">
                                          <textarea
                                            rows={6}
                                            value={editingBreakdownValue}
                                            onChange={(e) => setEditingBreakdownValue(e.target.value)}
                                            className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-medium leading-relaxed outline-none focus:ring-2 focus:ring-indigo-600/15 focus:border-indigo-600"
                                          />
                                          <div className="flex items-center justify-end gap-2">
                                            <button
                                              type="button"
                                              onClick={() => setEditingBreakdownIndex(null)}
                                              className="px-3 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                updateSectionContent(activeSect.id, editingBreakdownValue);
                                                setEditingBreakdownIndex(null);
                                                toast.success("Section content updated successfully!");
                                              }}
                                              className="px-3 py-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                                            >
                                              Save Change
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className={`text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto ${
                                          !activeSect.selected ? 'text-slate-400/70 line-through' : ''
                                        }`}>
                                          {activeSect.content.trim()}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Right Panel: Sitemap selection & Missing tips (5 Columns) */}
                          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                            {/* Sitemap section */}
                            {discoveredPageUrls.length > 0 && (
                              <div className="pb-4 border-b border-dashed border-slate-100 space-y-3">
                                <div>
                                  <h4 className="text-slate-900 text-xs font-extrabold uppercase tracking-widest font-mono">🌐 Discover Page URLs</h4>
                                  <p className="text-[9px] text-slate-400 font-mono">Select specific pages to automatically scan and import their sections into the bot's training data.</p>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {discoveredPageUrls.map((p) => (
                                    <div 
                                      key={p.url} 
                                      onClick={() => !p.loading && toggleUrlSelection(p.url)}
                                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50/50 transition-colors cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <input
                                          type="checkbox"
                                          checked={p.selected}
                                          disabled={p.loading}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            toggleUrlSelection(p.url);
                                          }}
                                          className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                                        />
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-slate-700 truncate capitalize">{p.title}</p>
                                          <p className="text-[9px] text-slate-400 font-mono truncate">{p.url}</p>
                                        </div>
                                      </div>

                                      <div className="shrink-0 pl-1.5">
                                        {p.loading ? (
                                          <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                                        ) : p.crawled ? (
                                          <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">Crawled</span>
                                        ) : (
                                          <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">Scan page</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <h4 className="font-extrabold text-slate-900 text-xs leading-tight uppercase tracking-widest font-mono">⚠️ Potential Missing Data Points</h4>
                              <p className="text-[10px] text-slate-400 font-medium">Under-optimized information gaps in AI's context</p>
                            </div>

                            {/* List of Tips */}
                            {(() => {
                              const tips = scannedSuggestions.filter(s => s.isTip);
                              
                              if (tips.length === 0) {
                                return (
                                  <div className="p-6 bg-emerald-50/50 border border-emerald-100/40 rounded-2xl text-center space-y-2">
                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-lg">🎉</div>
                                    <p className="text-xs font-black text-emerald-950 font-sans">No missing gaps!</p>
                                    <p className="text-[10px] text-emerald-700/80 font-medium max-w-[200px] mx-auto leading-relaxed">Your business training records are pristine and ready to respond accurately.</p>
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                  {tips.map((tip, idx) => {
                                    const rawTitle = tip.text.replace('missing', '').replace('not found', '').trim();
                                    const displayTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
                                    
                                    let whyItMatters = "Add this details to let the chatbot answer specific customers perfectly.";
                                    const tL = displayTitle.toLowerCase();
                                    if (tL.includes('pricing') || tL.includes('cost') || tL.includes('plan')) {
                                      whyItMatters = "Customers frequently ask about cost. Adding pricing reduces support friction.";
                                    } else if (tL.includes('refund') || tL.includes('cancel')) {
                                      whyItMatters = "Defining refunds upfront sets reliable customer expectations and builds trust.";
                                    } else if (tL.includes('contact') || tL.includes('whatsapp') || tL.includes('phone') || tL.includes('email')) {
                                      whyItMatters = "If users want custom options, they'll need clear contact info to reach out.";
                                    } else if (tL.includes('address') || tL.includes('location')) {
                                      whyItMatters = "Helps physical customers locate your official offices or store branch.";
                                    } else if (tL.includes('hours') || tL.includes('time')) {
                                      whyItMatters = "Gives automatic answers to 'when are you open' support requests.";
                                    }

                                    const isResolving = tipToFix === tip.text;

                                    return (
                                      <div key={idx} className="p-4 rounded-xl border border-amber-100 bg-amber-50/20 hover:bg-amber-50/40 transition-colors space-y-3 relative overflow-hidden">
                                        <div className="flex items-start gap-2.5">
                                          <div className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">⚠️</div>
                                          <div className="space-y-1">
                                            <p className="text-xs font-extrabold text-amber-950 font-sans">{displayTitle} Not Found</p>
                                            <p className="text-[10px] text-amber-800/80 font-medium leading-relaxed">{whyItMatters}</p>
                                          </div>
                                        </div>

                                        {!isResolving ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTipToFix(tip.text);
                                              setTipValue('');
                                            }}
                                            className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] rounded-lg tracking-widest uppercase transition-colors"
                                          >
                                            Fill Missing Data
                                          </button>
                                        ) : (
                                          <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm space-y-2">
                                            <div className="flex items-center justify-between">
                                              <p className="text-[9px] font-extrabold text-amber-900 tracking-wider">PROVIDE DETAILS:</p>
                                              <button type="button" onClick={() => setTipToFix(null)}>
                                                <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                                              </button>
                                            </div>
                                            <div className="flex gap-1.5">
                                              <input
                                                type="text"
                                                autoFocus
                                                placeholder={`Type details for ${displayTitle.toLowerCase()}...`}
                                                value={tipValue}
                                                onChange={(e) => setTipValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter' && tipValue.trim()) {
                                                    const formattedRecord = `### ${displayTitle}\n${tipValue.trim()}`;
                                                    setDetails(prev => prev.trim() + "\n\n" + formattedRecord);
                                                    setAnalysisResult(prev => prev.trim() + "\n\n" + formattedRecord);
                                                    setScannedSuggestions(prev => prev.filter(s => s.text !== tip.text));
                                                    setTipToFix(null);
                                                    toast.success(`${displayTitle} added to Knowledge Base!`);
                                                  }
                                                }}
                                                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-600/10"
                                              />
                                              <button
                                                type="button"
                                                disabled={!tipValue.trim()}
                                                onClick={() => {
                                                  const formattedRecord = `### ${displayTitle}\n${tipValue.trim()}`;
                                                  setDetails(prev => prev.trim() + "\n\n" + formattedRecord);
                                                  setAnalysisResult(prev => prev.trim() + "\n\n" + formattedRecord);
                                                  setScannedSuggestions(prev => prev.filter(s => s.text !== tip.text));
                                                  setTipToFix(null);
                                                  toast.success(`${displayTitle} added to Knowledge Base!`);
                                                }}
                                                className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase transition-colors"
                                              >
                                                Add
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Knowledge */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      <label className="text-sm font-black text-indigo-900 flex items-center">
                        <Building2 className="w-4 h-4 mr-2" />
                        MAIN BUSINESS KNOWLEDGE
                      </label>
                      <p className="text-[10px] text-gray-400 font-medium">Training Data: Feed your AI with About Us, Services, Pricing, and Policies.</p>
                    </div>
                    {details.length > 0 && (
                       <div className="flex items-center space-x-2">
                         <button 
                           onClick={handleOptimizeText}
                           disabled={loading}
                           className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-widest hover:bg-indigo-100 transition-colors flex items-center"
                         >
                           {loading ? <Loader2 className="w-2 h-2 animate-spin mr-1" /> : <Zap className="w-2 h-2 mr-1" />}
                           AI RE-STRUCTURE
                         </button>
                         <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                           {details.length} chars indexed
                         </span>
                         <button 
                           onClick={() => setDetails('')}
                           className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                         >
                           Clear
                         </button>
                       </div>
                    )}
                  </div>
                  <div className="relative group">
                    <textarea
                      rows={10}
                      placeholder="Paste your content here:
- What does your business do?
- List of Services & Products
- Pricing Details
- Refund/Privacy Policies
- Common Customer Questions
- Contact Details (WhatsApp, Email)"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      className="w-full p-5 bg-white border-2 border-indigo-50 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all resize-none text-sm leading-relaxed font-medium shadow-inner"
                    />
                    {!details && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
                        <FileText className="w-12 h-12 mb-4 text-indigo-400" />
                        <p className="text-xs font-black text-indigo-900 uppercase tracking-[0.2em]">Knowledge Hub</p>
                        <p className="text-[10px] font-bold text-indigo-400 mt-2">Paste info from your Website or Docs here</p>
                      </div>
                    )}
                  </div>
                  {error && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-800">
                          {error.length > 60 ? 'Scan Limitation' : error}
                        </p>
                        <p className="text-[10px] text-amber-600 mt-1 leading-relaxed">
                          {suggestion || "This website might be restricted or using a structure our automated scanner can't fully read. Please copy-paste the important text (About, Pricing, Services) manually above."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Persona Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  {/* Personality Dropdown */}
                  <div className="relative">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Personality</label>
                    <button
                      type="button"
                      onClick={() => setIsPersonalityDropdownOpen(!isPersonalityDropdownOpen)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between hover:border-indigo-300 transition-all font-bold text-sm"
                    >
                      <span className="capitalize">{personality}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isPersonalityDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isPersonalityDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden"
                        >
                          {['professional', 'friendly', 'humorous', 'technical'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => { setPersonality(p); setIsPersonalityDropdownOpen(false); }}
                              className="w-full p-3 text-left hover:bg-gray-50 text-xs font-bold capitalize"
                            >
                              {p}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Language Selection */}
                  <div className="relative">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Language</label>
                    <button
                      type="button"
                      onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between hover:border-indigo-300 transition-all font-bold text-sm"
                    >
                      <span className="truncate">{primaryLanguage === 'auto' ? 'Auto-detect' : primaryLanguage}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                        <AnimatePresence>
                          {isLanguageDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden max-h-48 overflow-y-auto"
                            >
                              {['auto', 'Hindi', 'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'].map((lang) => (
                                <button
                                  key={lang}
                                  type="button"
                                  onClick={() => { setPrimaryLanguage(lang); setIsLanguageDropdownOpen(false); }}
                                  className="w-full p-3 text-left hover:bg-gray-50 text-xs font-bold"
                                >
                                  {lang === 'auto' ? 'Auto-detect' : lang}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Greeting Message / "Hi/Hello" Reply (Optional)</label>
                  <input
                    type="text"
                    placeholder={`e.g., Hello! I am ${botName || 'Assistant'}. How can I assist you today?`}
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm mb-4"
                  />
                  <p className="text-[10px] text-gray-400 mt-[-10px] mb-4">If set, the bot will use this message to greet users first and reply when they say "Hi" or "Hello". Leave it blank to use the default greeting.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Custom Instructions (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Focus on solving user problems patiently..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-sm"
                  />
                </div>

                {error && (
                  <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                  </div>
                )}
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateBot}
                    disabled={loading}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Bot...
                      </>
                    ) : (
                      <>
                        Finalize Bot
                        <CheckCircle2 className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {!isFinishing && step === 4 && (
            <motion.div 
              key="step4_success"
              initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ 
                type: "spring",
                damping: 20,
                stiffness: 100
              }}
              className="bg-white rounded-[3rem] p-12 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.15)] border border-indigo-50 text-center relative overflow-hidden"
            >
              <SuccessConfetti />
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 relative"
              >
                <div className="absolute inset-0 bg-green-500/10 rounded-full animate-ping"></div>
                <CheckCircle2 className="text-green-500 w-12 h-12 relative z-10" />
              </motion.div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Bot Created Successfully!</h2>
              <p className="text-gray-500 mb-10 max-w-md mx-auto">
                Your bot <strong>{botName}</strong> is ready to be deployed on <strong>{platform}</strong>. You can now integrate it using our tailored instructions.
              </p>
              
              {platform === 'website' ? (
                <div className="space-y-6 mb-10 text-left">
                  <div className="bg-gray-900 rounded-3xl p-8 relative group overflow-hidden shadow-2xl shadow-indigo-500/10">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Recommended: Config Object</p>
                      <button 
                        onClick={() => {
                          const snippet = `<!-- Botub Chat Embed -->
<script>
  window.BOTUB_CONFIG = {
    botId: "${createdBotId}",
    themeColor: "#4f46e5",
    position: "right"
  };
</script>
<script src="${window.location.origin}/bot-widget.js" async></script>`;
                          navigator.clipboard.writeText(snippet);
                          toast.success('Snippet copied!');
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Embed Code</span>
                      </button>
                    </div>
                    <pre className="text-indigo-100 text-[11px] font-mono break-all block py-2 leading-relaxed whitespace-pre-wrap overflow-x-auto">
{`<!-- Botub Chat Embed -->
<script>
  window.BOTUB_CONFIG = {
    botId: "${createdBotId}",
    themeColor: "#4f46e5",
    position: "right"
  };
</script>
<script src="${window.location.origin}/bot-widget.js" async></script>`}
                    </pre>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">1</div>
                      <h4 className="text-sm font-bold text-indigo-900">How to install?</h4>
                    </div>
                    <p className="text-xs text-indigo-800 leading-relaxed ml-11">
                      Simply copy the code above and paste it just before the closing <code className="bg-white px-1 rounded font-bold">{"</body>"}</code> tag in your website's primary HTML file.
                    </p>
                  </div>

                  <details className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mr-3">
                          <Code2 className="w-4 h-4" />
                        </div>
                        Quick Test: Complete HTML Page
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="p-6 pt-2 border-t border-gray-50">
                      <p className="text-[11px] text-gray-500 mb-4">Save this as <code className="bg-gray-100 px-1 rounded">index.html</code> to test your bot locally.</p>
                      <div className="relative">
                        <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-[10px] font-mono text-gray-600 overflow-x-auto leading-relaxed whitespace-pre-wrap">
{`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Botub Test Page</title>
    <style>
        body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; }
        .card { background: white; padding: 2.5rem; border-radius: 2rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Botub is Active!</h1>
        <p>Check the bottom right corner for your assistant.</p>
    </div>

    <!-- Botub Chat Embed -->
    <script>
      window.BOTUB_CONFIG = {
        botId: "${createdBotId}",
        themeColor: "#4f46e5",
        position: "right"
      };
    </script>
    <script src="${window.location.origin}/bot-widget.js" async></script>
</body>
</html>`}
                        </pre>
                        <button 
                          onClick={() => {
                            const fullCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Botub Test Page</title>
    <style>
        body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; }
        .card { background: white; padding: 2.5rem; border-radius: 2rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Botub is Active!</h1>
        <p>Check the bottom right corner for your assistant.</p>
    </div>

    <!-- Botub Chat Embed -->
    <script>
      window.BOTUB_CONFIG = {
        botId: "${createdBotId}",
        themeColor: "#4f46e5",
        position: "right"
      };
    </script>
    <script src="${window.location.origin}/bot-widget.js" async></script>
</body>
</html>`;
                            navigator.clipboard.writeText(fullCode);
                            toast.success('Complete code copied!');
                          }}
                          className="absolute top-2 right-2 p-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span className="text-[10px] font-bold">Copy All</span>
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              ) : null}


              <div className="bg-white border border-gray-100 rounded-3xl p-6 mb-8 text-left shadow-sm flex items-start space-x-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Need help with CMS Platforms?</h4>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Check our specific guides for <span className="font-bold text-indigo-600">WordPress, Shopify, React, and Next.js</span> to ensure a perfect integration.
                  </p>
                  <Link 
                    to="/integration-guide"
                    className="inline-flex items-center text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline group"
                  >
                    View Integration Center
                    <ArrowRight className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate(`/bot/${createdBotId}`)}
                  className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Test Bot Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
