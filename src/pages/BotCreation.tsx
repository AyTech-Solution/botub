import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, setDoc, collection, addDoc, getDocs, query, where, getDoc } from 'firebase/firestore';
import { analyzeWebsite } from '../services/geminiService';
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
  Send,
  MessageCircle,
  Instagram,
  ShoppingCart,
  Music,
  Video,
  Megaphone,
  UserCheck,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { speak } from '../services/ttsService';

export default function BotCreation() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState('website');
  const [useCase, setUseCase] = useState('customer_support');
  const [botName, setBotName] = useState('AyTech AI');
  const [companyName, setCompanyName] = useState('Botub');
  const [details, setDetails] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [botCount, setBotCount] = useState(0);
  
  // New Premium Features State
  const [personality, setPersonality] = useState('professional');
  const [isPersonalityDropdownOpen, setIsPersonalityDropdownOpen] = useState(false);
  const [responseSpeed, setResponseSpeed] = useState('natural');
  const [isResponseSpeedDropdownOpen, setIsResponseSpeedDropdownOpen] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('auto');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
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
    ],
    telegram: [
      { id: 'music', label: 'Music Bot', icon: <Music className="w-5 h-5" />, desc: 'Share and manage music content.' },
      { id: 'video', label: 'Video Bot', icon: <Video className="w-5 h-5" />, desc: 'Handle video uploads and sharing.' },
      { id: 'sales', label: 'Sales Bot', icon: <Zap className="w-5 h-5" />, desc: 'Direct sales and product info.' },
      { id: 'promotion', label: 'Promotion', icon: <Megaphone className="w-5 h-5" />, desc: 'Broadcast news and offers.' },
      { id: 'moderator', label: 'Group Moderator', icon: <UserCheck className="w-5 h-5" />, desc: 'Manage members and enforce rules.' },
      { id: 'manual', label: 'Manual Setup', icon: <SettingsIcon className="w-5 h-5" />, desc: 'Full control over bot behavior.' }
    ],
    whatsapp: [
      { id: 'customer_support', label: 'Customer Support', icon: <Building2 className="w-5 h-5" />, desc: 'Official business support.' },
      { id: 'sales', label: 'Sales Assistant', icon: <Zap className="w-5 h-5" />, desc: 'Guide users through purchases.' },
      { id: 'promotional', label: 'Promotional', icon: <Megaphone className="w-5 h-5" />, desc: 'Send updates and marketing.' },
      { id: 'tracking', label: 'Order Tracking', icon: <ShoppingCart className="w-5 h-5" />, desc: 'Update users on order status.' },
      { id: 'booking', label: 'Appointment Booking', icon: <ArrowRight className="w-5 h-5" />, desc: 'Schedule services via WhatsApp.' },
      { id: 'manual', label: 'Manual Setup', icon: <SettingsIcon className="w-5 h-5" />, desc: 'Full control over bot behavior.' }
    ],
    instagram: [
      { id: 'customer_support', label: 'Customer Support', icon: <Building2 className="w-5 h-5" />, desc: 'Handle DMs and comments.' },
      { id: 'sales', label: 'Social Sales', icon: <Zap className="w-5 h-5" />, desc: 'Sell directly via Instagram.' },
      { id: 'promotional', label: 'Promotional', icon: <Megaphone className="w-5 h-5" />, desc: 'Influencer and brand marketing.' },
      { id: 'influencer', label: 'Influencer Assistant', icon: <Smile className="w-5 h-5" />, desc: 'Manage fan interactions.' },
      { id: 'auto_responder', label: 'Auto-Responder', icon: <MessageCircle className="w-5 h-5" />, desc: 'Instant replies to common DMs.' },
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
        console.error("Error checking limits:", err);
      }
    };
    checkLimits();
  }, []);

  const isPremium = userProfile?.subscription?.status === 'premium' || userProfile?.subscription?.status === 'trial';

  const handleAnalyze = async () => {
    if (!websiteUrl) return;
    setLoading(true);
    setError('');
    try {
      const result = await analyzeWebsite(websiteUrl);
      setAnalysisResult(result);
      setDetails(prev => prev + "\n\nExtracted from website:\n" + result);
      setStep(4);
    } catch (err) {
      setError('Failed to analyze website. You can still enter details manually.');
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async () => {
    if (!botName || !companyName) {
      setError('Please fill in all required fields.');
      return;
    }

    if (botCount >= 1 && !isPremium) {
      setError('Free tier is limited to 1 bot. Please upgrade to Premium to create more.');
      return;
    }

    setLoading(true);
    try {
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const botId = `${companyName.toLowerCase().replace(/\s+/g, '-')}-${botName.toLowerCase().replace(/\s+/g, '-')}-${randomSuffix}`;
      
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
        links: websiteUrl ? [websiteUrl] : [],
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
        await addDoc(collection(db, 'bots', botId, 'knowledge'), {
          botId,
          content: details,
          sourceUrl: websiteUrl || 'manual',
          lastUpdated: new Date().toISOString()
        });
      }

      speak(`Congratulations! Your bot, ${botName}, has been successfully created and is ready for deployment.`);
      setStep(6);
    } catch (err: any) {
      setError(err.message);
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
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Step {step} of 6</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-600"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
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
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { id: 'website', label: 'Website', icon: <Globe className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
                  { id: 'telegram', label: 'Telegram', icon: <Send className="w-6 h-6" />, color: 'bg-sky-50 text-sky-600' },
                  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
                  { id: 'instagram', label: 'Instagram', icon: <Instagram className="w-6 h-6" />, color: 'bg-pink-50 text-pink-600' }
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
                    <span className="font-bold text-gray-900">{p.label}</span>
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

          {step === 2 && (
            <motion.div 
              key="step_usecase"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <Bot className="text-indigo-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Use Case</h2>
              <p className="text-gray-500 mb-8">What is the primary goal of your {platform} bot?</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {useCaseTemplates[platform]?.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setUseCase(u.id)}
                    className={`p-5 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${
                      useCase === u.id 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      useCase === u.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{u.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{u.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center"
                >
                  Continue
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
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
                      placeholder="e.g. SupportBot, SalesAssistant"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
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

          {step === 4 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="text-indigo-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Knowledge Source</h2>
              <p className="text-gray-500 mb-8">Provide a website URL and our AI will automatically extract the knowledge base for your bot.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Website URL (Optional)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="url"
                      placeholder="https://yourbusiness.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={websiteUrl ? handleAnalyze : () => setStep(5)}
                    disabled={loading}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        {websiteUrl ? 'Analyze & Continue' : 'Skip & Manual Entry'}
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="text-indigo-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Refine Bot Persona</h2>
              <p className="text-gray-500 mb-8">Customize how your bot behaves and interacts with users.</p>
              
              <div className="space-y-6">
                {/* Personality & Speed Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personality Dropdown */}
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                      Bot Personality
                      {!isPremium && <Lock className="w-3 h-3 ml-2 text-amber-500" />}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsPersonalityDropdownOpen(!isPersonalityDropdownOpen)}
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <Smile className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-bold text-gray-900 capitalize">{personality}</span>
                      </div>
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
                          {[
                            { id: 'professional', label: 'Professional', premium: false },
                            { id: 'friendly', label: 'Friendly', premium: true },
                            { id: 'humorous', label: 'Humorous', premium: true },
                            { id: 'technical', label: 'Technical', premium: true }
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                if (p.premium && !isPremium) {
                                  setShowUpgradeModal(true);
                                  return;
                                }
                                setPersonality(p.id);
                                setIsPersonalityDropdownOpen(false);
                              }}
                              className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span className="text-sm font-medium text-gray-900">{p.label}</span>
                              {p.premium && !isPremium && <Lock className="w-3 h-3 text-amber-500" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Response Speed Dropdown */}
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                      Response Speed
                      {!isPremium && <Lock className="w-3 h-3 ml-2 text-amber-500" />}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsResponseSpeedDropdownOpen(!isResponseSpeedDropdownOpen)}
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-bold text-gray-900 capitalize">{responseSpeed}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isResponseSpeedDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isResponseSpeedDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden"
                        >
                          {[
                            { id: 'instant', label: 'Instant', premium: true },
                            { id: 'natural', label: 'Natural', premium: false },
                            { id: 'slow', label: 'Deliberate', premium: true }
                          ].map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                if (s.premium && !isPremium) {
                                  setShowUpgradeModal(true);
                                  return;
                                }
                                setResponseSpeed(s.id);
                                setIsResponseSpeedDropdownOpen(false);
                              }}
                              className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span className="text-sm font-medium text-gray-900">{s.label}</span>
                              {s.premium && !isPremium && <Lock className="w-3 h-3 text-amber-500" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Primary Language Selection */}
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-indigo-600" />
                    Primary Language
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between hover:border-indigo-300 transition-all"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-gray-900">
                        {primaryLanguage === 'auto' ? 'Auto-detect (User\'s Language)' : primaryLanguage}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isLanguageDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden max-h-[240px] overflow-y-auto"
                      >
                        {[
                          'auto', 'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Hindi', 'Arabic', 'Portuguese', 'Russian'
                        ].map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              setPrimaryLanguage(lang);
                              setIsLanguageDropdownOpen(false);
                            }}
                            className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
                          >
                            <span className="text-sm font-medium text-gray-900">
                              {lang === 'auto' ? 'Auto-detect (User\'s Language)' : lang}
                            </span>
                            {primaryLanguage === lang && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-gray-700">Custom Instructions</label>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trained on SLM</span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="e.g. You are a helpful support agent for Acme Corp..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-sm mb-4"
                  />

                  {/* Quick Templates */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Templates</p>
                    <div className="flex flex-wrap gap-2">
                      {personaTemplates.map((template) => (
                        <button
                          key={template.label}
                          type="button"
                          onClick={() => setCustomInstructions(template.text)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center space-x-1.5"
                        >
                          {template.icon}
                          <span>{template.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Knowledge Base Details</label>
                  <textarea
                    rows={4}
                    placeholder="Enter details about your business here..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
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
                    onClick={() => setStep(4)}
                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
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

          {step === 6 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-12 shadow-xl shadow-gray-200/50 border border-gray-100 text-center"
            >
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="text-green-500 w-12 h-12" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Bot Created Successfully!</h2>
              <p className="text-gray-500 mb-10 max-w-md mx-auto">
                Your bot <strong>{botName}</strong> is ready to be deployed on <strong>{platform}</strong>. You can now integrate it using our tailored instructions.
              </p>
              
              {platform === 'website' ? (
                <div className="bg-gray-900 rounded-2xl p-6 mb-10 text-left relative group">
                  <p className="text-xs font-mono text-indigo-400 mb-3 uppercase tracking-widest">Integration Snippet</p>
                  <code className="text-gray-300 text-sm font-mono break-all">
                    {`<script src="${window.location.origin}/bot-widget.js" data-bot-id="${companyName.toLowerCase().replace(/\s+/g, '-')}-${botName.toLowerCase().replace(/\s+/g, '-')}"></script>`}
                  </code>
                  <button 
                    onClick={() => {
                      const snippet = `<script src="${window.location.origin}/bot-widget.js" data-bot-id="${companyName.toLowerCase().replace(/\s+/g, '-')}-${botName.toLowerCase().replace(/\s+/g, '-')}"></script>`;
                      navigator.clipboard.writeText(snippet);
                      toast.success('Snippet copied to clipboard!');
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                </div>
              ) : null}

              {/* Usage Guide Section */}
              <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-10 text-left shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-indigo-600" />
                  {platform.charAt(0).toUpperCase() + platform.slice(1)} Setup Guide
                </h3>
                
                <div className="space-y-6">
                  {platform === 'website' && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Copy the integration snippet provided above.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Paste it into the <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code> or <code className="bg-gray-100 px-1 rounded">&lt;body&gt;</code> section of your website's HTML.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                        <p className="text-sm text-gray-600 leading-relaxed">The chat widget will appear automatically on your site.</p>
                      </div>
                    </div>
                  )}

                  {platform === 'telegram' && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Open Telegram and search for <span className="font-bold">@BotFather</span>.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Send <code className="bg-gray-100 px-1 rounded">/newbot</code> and follow instructions to get your <span className="font-bold">API Token</span>.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Go to your Bot Settings in our dashboard and paste the token in the <span className="font-bold">API Key</span> field.</p>
                      </div>
                    </div>
                  )}

                  {platform === 'whatsapp' && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Create a Meta Developer account and set up a WhatsApp Business App.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Get your <span className="font-bold">Phone Number ID</span> and <span className="font-bold">Permanent Access Token</span>.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Configure the <span className="font-bold">Webhook URL</span> provided in our dashboard settings into your Meta App.</p>
                      </div>
                    </div>
                  )}

                  {platform === 'instagram' && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Link your Instagram Professional account to a Facebook Page.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Enable "Allow Access to Messages" in your Instagram settings.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                        <p className="text-sm text-gray-600 leading-relaxed">Connect your account via our dashboard to start automating DMs.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Create Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upgrade Modal */}
        <AnimatePresence>
          {showUpgradeModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowUpgradeModal(false)}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6">
                  <button onClick={() => setShowUpgradeModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Crown className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Premium Feature</h3>
                  <p className="text-gray-500 mb-8">
                    Unlock advanced personalities, priority response speeds, and unlimited bots with our Premium plan.
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/premium')}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center"
                    >
                      <Zap className="w-5 h-5 mr-2 fill-white" />
                      Upgrade to Pro
                    </button>
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
