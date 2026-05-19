import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, collection, addDoc, getDocs, query, where, getDoc } from 'firebase/firestore';
import { analyzeWebsite, parseFile, analyzeText } from '../services/botService';
import { 
  Bot, 
  Globe, 
  Building2, 
  FileText,
  Upload,
  File,
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
  const [fileUploading, setFileUploading] = useState(false);
  const [scannedSuggestions, setScannedSuggestions] = useState<{text: string, url: string}[]>([]);
  
  // New Premium Features State
  const [personality, setPersonality] = useState('professional');
  const [isPersonalityDropdownOpen, setIsPersonalityDropdownOpen] = useState(false);
  const [isUseCaseDropdownOpen, setIsUseCaseDropdownOpen] = useState(false);
  const [responseSpeed, setResponseSpeed] = useState('natural');
  const [isResponseSpeedDropdownOpen, setIsResponseSpeedDropdownOpen] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
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

  const handleAnalyze = async () => {
    if (!websiteUrl) return;
    
    // Check for localhost or private IPs
    if (websiteUrl.includes('localhost') || websiteUrl.includes('127.0.0.1') || websiteUrl.includes('192.168.')) {
      setError('Localhost and private IP addresses cannot be analyzed by our cloud server. Please paste the content manually.');
      return;
    }

    setLoading(true);
    setError('');
    setSuggestion('');
    setAnalysisResult('');
    try {
      const data = await analyzeWebsite(websiteUrl);
      const { knowledgeBase, missingTips, businessName } = data.result;
      
      setAnalysisResult(knowledgeBase);
      if (data.suggestions) {
        setScannedSuggestions(data.suggestions);
      }
      
      if (businessName && !botName) {
        setBotName(businessName);
      }

      setDetails(prev => {
        const base = prev.trim();
        const header = `--- KNOWLEDGE FROM ${websiteUrl.toUpperCase()} ---`;
        return base ? `${base}\n\n${header}\n${knowledgeBase}` : `${header}\n${knowledgeBase}`;
      });

      if (missingTips && missingTips.length > 0) {
         setScannedSuggestions(prev => [...prev, ...missingTips.map(t => ({ text: `TIP: ${t}`, url: '' }))]);
      }

      toast.success("Website analyzed and structured!");
    } catch (err: any) {
      console.error("Analysis Exception:", err);
      
      let msg = err.message || 'Analysis failed.';
      let sug = err.suggestion || "You can skip the scan and paste your website info manually below to proceed instantly.";

      if (err.message?.includes('Timeout') || err.message?.includes('8000') || err.message?.includes('15000')) {
        msg = "The website is responding too slowly (Network Timeout).";
        sug = "Site response time exceeded our cloud limit. Please copy the text from your website and paste it manually below.";
      } else if (err.message?.includes('403')) {
        msg = "Access Forbidden (403).";
        sug = "This website is blocking our scanner. Please paste the content manually into the details box below—it's the fastest way!";
      } else if (err.message?.includes('Scanner Blocked') || err.message?.includes('Restricted')) {
        msg = "Website Scanner Blocked.";
        sug = "The website is protecting itself from automated scans. Don't worry—just copy the text from your website and paste it into the details box below to continue!";
      }
      
      setError(msg);
      setSuggestion(sug);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    setFileUploading(true);
    try {
      const data = await parseFile(file);
      setDetails(prev => {
        const base = prev.trim();
        return base ? base + "\n\nExtracted from document (" + file.name + "):\n" + data.result : data.result;
      });
      toast.success(`Successfully uploaded ${file.name}`);
    } catch (err: any) {
      console.error("File Upload Error:", err);
      toast.error(err.message || "Failed to upload file.");
    } finally {
      setFileUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleOptimizeText = async () => {
    if (!details || details.length < 20) {
      toast.error("Please enter more details to optimize.");
      return;
    }
    
    setLoading(true);
    try {
      const data = await analyzeText(details, botName || companyName);
      setDetails(data.result);
      toast.success("AI significantly improved your knowledge structure!");
    } catch (err: any) {
      toast.error(err.message || "Failed to optimize text.");
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
        greetingMessage: `Hello! I am ${botName}, your ${companyName} assistant. How can I help you today?`,
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
                {/* Knowledge Section */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-gray-900">Website Training</h3>
                  </div>
                  
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Main Website URL</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="url"
                                placeholder="https://yourbusiness.com"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                              />
                            </div>
                            <button
                              onClick={handleAnalyze}
                              disabled={loading || !websiteUrl}
                              className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center shrink-0 text-sm"
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  Deep Scanning...
                                </>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4 mr-2" />
                                  Analyze
                                </>
                              )}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {['About Us', 'Pricing', 'Products', 'FAQ', 'Contact'].map((key) => (
                              <span key={key} className="px-2 py-1 bg-white border border-gray-100 rounded-md text-[9px] font-black uppercase tracking-tighter text-gray-400">
                                Priority: {key}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2">
                            <strong>Deep Scan:</strong> Our AI will crawl multiple pages to find business rules, services, and policies.
                          </p>
                        </div>

                        {/* File Upload Section */}
                        <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100 border-dashed">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Upload PDF or Text Files</label>
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 rounded-xl p-6 bg-white hover:bg-indigo-50/50 transition-all cursor-pointer relative group">
                            <input
                              type="file"
                              accept=".pdf,.txt"
                              onChange={handleFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                              disabled={fileUploading}
                            />
                            {fileUploading ? (
                              <div className="flex flex-col items-center">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                                <p className="text-xs font-bold text-indigo-600">Extracting data...</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <Upload className="w-8 h-8 text-indigo-400 group-hover:text-indigo-600 mb-2 transition-colors" />
                                <p className="text-xs font-bold text-gray-600">Click or drag PDF/TXT files</p>
                                <p className="text-[10px] text-gray-400 mt-1">Max 5MB per file</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Additional URLs */}
                        <div className="space-y-3">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Additional Training URLs (Help Center, Docs, etc.)</label>
                          {additionalUrls.map((url, index) => (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={index} 
                              className="flex gap-2"
                            >
                              <div className="relative flex-1">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                  type="url"
                                  placeholder="https://docs.yourbusiness.com"
                                  value={url}
                                  onChange={(e) => {
                                    const newUrls = [...additionalUrls];
                                    newUrls[index] = e.target.value;
                                    setAdditionalUrls(newUrls);
                                  }}
                                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                />
                              </div>
                              <button
                                onClick={() => setAdditionalUrls(additionalUrls.filter((_, i) => i !== index))}
                                className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ))}
                          <button
                            onClick={() => setAdditionalUrls([...additionalUrls, ''])}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center"
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            + Add another URL
                          </button>
                        </div>

                        {analysisResult && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-green-50 rounded-xl border border-green-100"
                      >
                        <div className="flex items-start space-x-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-green-700">Analysis Successful</p>
                            <p className="text-[10px] text-green-600 mt-1">
                              AI successfully structured your business details. {scannedSuggestions.length > 0 && "Found more relevant pages below."}
                            </p>
                          </div>
                        </div>

                        {scannedSuggestions.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-green-100">
                             <p className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-2">Improve Your Bot (Manual Input Needed):</p>
                             <div className="flex flex-wrap gap-2">
                               {scannedSuggestions.map((s, i) => (
                                 <button
                                   key={i}
                                   onClick={() => {
                                      if (s.url) {
                                        setWebsiteUrl(s.url);
                                        setScannedSuggestions(prev => prev.filter((_, idx) => idx !== i));
                                      }
                                   }}
                                   disabled={!s.url}
                                   className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center shadow-sm ${
                                     s.url 
                                       ? "bg-white border border-green-200 text-green-700 hover:bg-green-100" 
                                       : "bg-indigo-600 text-white border border-indigo-700 cursor-default"
                                   }`}
                                 >
                                   {s.url ? <LinkIcon className="w-3 h-3 mr-1.5" /> : <Zap className="w-3 h-3 mr-1.5" />}
                                   {s.text}
                                 </button>
                               ))}
                             </div>
                          </div>
                        )}
                      </motion.div>
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
                           onClick={() => { setAnalysisResult(''); setDetails(''); }}
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
