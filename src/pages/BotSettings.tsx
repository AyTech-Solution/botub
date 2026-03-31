import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { speak } from '../services/ttsService';
import { 
  Bot as BotIcon, 
  ArrowLeft, 
  Save, 
  Zap, 
  Smile, 
  Settings as SettingsIcon, 
  Globe, 
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Crown,
  Trash2,
  AlertTriangle,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CreditCard,
  Image,
  ChevronDown,
  Building2,
  BookOpen,
  Send,
  MessageCircle,
  MessageSquare,
  BrainCircuit,
  Instagram,
  Copy,
  ExternalLink,
  RefreshCw,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function BotSettings() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('professional');
  const [isPersonalityDropdownOpen, setIsPersonalityDropdownOpen] = useState(false);
  const [responseSpeed, setResponseSpeed] = useState('natural');
  const [isResponseSpeedDropdownOpen, setIsResponseSpeedDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const [voiceId, setVoiceId] = useState('Kore');
  const [isVoiceIdDropdownOpen, setIsVoiceIdDropdownOpen] = useState(false);
  const [primaryLanguage, setPrimaryLanguage] = useState('auto');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWebhookUrl, setShowWebhookUrl] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [platform, setPlatform] = useState('website');
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
  const [showPoweredBy, setShowPoweredBy] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  const predefinedAvatars = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Milo',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Oscar',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Zoe',
  ];

  const usageGuideSteps = [
    { title: '1. Train your Bot', desc: 'Upload documents or add text to the Knowledge Base to give your bot specific knowledge.' },
    { title: '2. Customize Persona', desc: 'Set a unique personality and custom instructions to define how your bot speaks.' },
    { title: '3. Test & Refine', desc: 'Use the preview chat to test responses and adjust instructions for better accuracy.' },
    { title: '4. Deploy Anywhere', desc: 'Use the integration guide to embed your bot on any website or connect via Webhooks.' }
  ];

  const personaTemplates = [
    { label: 'Customer Support', icon: <Building2 className="w-3 h-3" />, text: 'You are a patient and helpful support agent. Use clear, simple language and always verify if the user needs more help before ending.' },
    { label: 'Sales Expert', icon: <Zap className="w-3 h-3" />, text: 'You are a persuasive sales consultant. Focus on highlighting benefits, creating urgency, and guiding the user toward a purchase.' },
    { label: 'Technical Guru', icon: <SettingsIcon className="w-3 h-3" />, text: 'You are a highly knowledgeable technical expert. Provide detailed, accurate explanations and don\'t shy away from complex terms when necessary.' },
    { label: 'Playful Guide', icon: <Smile className="w-3 h-3" />, text: 'You are a fun and energetic guide. Use plenty of emojis, keep responses short and punchy, and maintain a very positive vibe.' }
  ];

  const platformGuides: Record<string, any> = {
    website: {
      title: 'Website Integration',
      icon: <Globe className="w-6 h-6" />,
      steps: [
        'Copy the script snippet below.',
        'Paste it before the closing </body> tag of your website.',
        'Your bot will appear as a chat bubble in the bottom right corner.'
      ],
      snippet: `<script src="https://botify-ai.web.app/embed.js?id=${botId}"></script>`
    },
    telegram: {
      title: 'Telegram Integration',
      icon: <Send className="w-6 h-6" />,
      steps: [
        'Open Telegram and search for @BotFather.',
        'Send /newbot and follow the instructions to create your bot.',
        'Copy the API Token provided by BotFather.',
        'Paste the API Token in the API Key field below and save.'
      ]
    },
    whatsapp: {
      title: 'WhatsApp Integration',
      icon: <MessageCircle className="w-6 h-6" />,
      steps: [
        'Create a Meta Developer account and a WhatsApp Business App.',
        'Set up the WhatsApp Business API and get your Phone Number ID and Access Token.',
        'Configure the Webhook URL below in your Meta App settings.',
        'Paste your Access Token in the API Key field below.'
      ]
    },
    instagram: {
      title: 'Instagram Integration',
      icon: <Instagram className="w-6 h-6" />,
      steps: [
        'Connect your Instagram Professional account to a Facebook Page.',
        'Enable "Allow Access to Messages" in Instagram Settings > Privacy > Messages.',
        'Configure the Webhook URL below in your Meta App settings.',
        'Paste your Page Access Token in the API Key field below.'
      ]
    }
  };

  useEffect(() => {
    if (!botId) return;

    const fetchBot = async () => {
      try {
        if (auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserProfile(userSnap.data());
          }
        }

        const docRef = doc(db, 'bots', botId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.ownerId !== auth.currentUser?.uid) {
            navigate('/dashboard');
            return;
          }
          setBot(data);
          setPlatform(data.platform || 'website');
          setName(data.name || '');
          setPersonality(data.personality || 'professional');
          setAvatarUrl(data.avatarUrl || '');
          setResponseSpeed(data.responseSpeed || 'natural');
          setVoiceEnabled(data.voiceEnabled || false);
          setVoiceOutputEnabled(data.voiceOutputEnabled || false);
          setVoiceId(data.voiceId || 'Kore');
          setPrimaryLanguage(data.primaryLanguage || 'auto');
          setGreetingMessage(data.greetingMessage || '');
          setCustomInstructions(data.customInstructions || '');
          setShowPoweredBy(data.showPoweredBy !== undefined ? data.showPoweredBy : true);
          setWebhookUrl(data.integrationParams?.webhookUrl || '');
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error("Error fetching bot settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBot();
  }, [botId, navigate]);

  const isPremium = bot?.ownerId ? (userProfile?.subscription?.status === 'premium' || userProfile?.subscription?.status === 'trial') : false;

  const testPhrases: Record<string, string> = {
    auto: "Hello! I can automatically detect and respond in your language. How do I sound?",
    English: "Hello! This is a test of my English voice. How do I sound?",
    Spanish: "¡Hola! Esta es una prueba de mi voz en español. ¿Cómo sueno?",
    French: "Bonjour ! Ceci est un test de ma voix française. Comment est-ce que je sonne ?",
    German: "Hallo! Dies ist ein Test meiner deutschen Stimme. Wie höre ich mich an?",
    Chinese: "你好！这是我的中文声音测试。听起来怎么样？",
    Japanese: "こんにちは！これは私の日本語の音声テストです。どう聞こえますか？",
    Korean: "안녕하세요! 이것은 제 한국어 음성 테스트입니다. 어떻게 들리나요?",
    Hindi: "नमस्ते! यह मेरी हिंदी आवाज़ का परीक्षण है। मैं कैसा लग रहा हूँ?",
    Arabic: "مرحباً! هذا اختبار لصوتي باللغة العربية. كيف أبدو؟",
    Portuguese: "Olá! Este é um teste da minha voz em português. Como eu pareço?",
    Russian: "Привет! Это тест моего русского голоса. Как я звучу?"
  };

  const handleGenerateAvatar = () => {
    const styles = ['bottts', 'avataaars', 'identicon', 'pixel-art', 'big-smile', 'adventurer'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`);
    toast.success(`New ${randomStyle} avatar generated!`);
  };

  const handleResetAvatar = () => {
    if (bot?.name) {
      setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${bot.name}`);
      toast.success('Avatar reset to default!');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB limit for base64 to avoid Firestore limits
        toast.error('File size must be less than 500KB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        toast.success('Avatar uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botId) return;
    
    if (!isPremium && (personality !== 'professional' || responseSpeed !== 'natural' || voiceEnabled || voiceOutputEnabled)) {
      toast.error('Advanced features require a Premium subscription.');
      return;
    }

    setSaving(true);
    setSuccess(false);

    try {
      const docRef = doc(db, 'bots', botId);
      await updateDoc(docRef, {
        name,
        platform,
        personality,
        avatarUrl,
        responseSpeed,
        voiceEnabled,
        voiceOutputEnabled,
        voiceId,
        primaryLanguage,
        greetingMessage,
        customInstructions,
        showPoweredBy,
        integrationParams: {
          webhookUrl,
        }
      });
      setSuccess(true);
      toast.success('Settings saved successfully!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBot = async () => {
    if (!botId) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'bots', botId));
      toast.success('Bot deleted successfully');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete bot');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !bot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light p-4 md:p-8 premium-gradient-bg">
      <div className="max-w-4xl mx-auto pb-32">
        <div className="flex items-center justify-between mb-12">
          <Link to={`/bot/${botId}`} className="flex items-center text-gray-500 hover:text-brand-primary transition-all font-bold group">
            <div className="p-2.5 rounded-2xl bg-white/80 border border-white/50 group-hover:bg-brand-primary group-hover:text-white transition-all mr-4 shadow-sm group-hover:shadow-brand-primary/20">
              <ArrowLeft className="w-5 h-5" />
            </div>
            Back to Bot Details
          </Link>
          <div className="flex flex-col items-end">
            <h1 className="text-4xl font-extrabold text-brand-dark tracking-tight mb-1">Bot Settings</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configure your AI assistant</p>
          </div>
        </div>

        {!isPremium && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 p-10 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-primary animate-gradient rounded-[3rem] text-white shadow-2xl shadow-brand-primary/30 flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden premium-border"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl animate-pulse" />
            <div className="flex items-center space-x-6 relative z-10">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-inner">
                <Crown className="w-10 h-10 text-amber-300 drop-shadow-lg" />
              </div>
              <div>
                <h3 className="font-extrabold text-2xl tracking-tight mb-1">Unlock Premium Features</h3>
                <p className="text-white/80 text-base font-medium">Get access to voice input, advanced personalities, and more.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/premium')}
              className="w-full sm:w-auto px-10 py-5 bg-white text-brand-primary rounded-2xl font-black text-lg hover:bg-brand-light hover:scale-105 transition-all flex items-center justify-center shadow-2xl relative z-10 group"
            >
              <CreditCard className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
              Upgrade Now
            </button>
          </motion.div>
        )}

        <motion.form 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSave} 
          className="space-y-8"
        >
          {/* Bot Avatar */}
          <motion.section variants={itemVariants} className="glass-card">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary">
                <Image className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Bot Avatar</h2>
            </div>
            <p className="text-gray-500 text-sm mb-8">Choose an avatar for your bot, generate a random one, or upload your own.</p>
            
            <div className="space-y-8">
              {/* Predefined Avatars */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Predefined Avatars</p>
                <div className="flex flex-wrap gap-4">
                  {predefinedAvatars.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-20 h-20 rounded-2xl border-2 transition-all p-1 overflow-hidden ${
                        avatarUrl === url ? 'border-brand-primary bg-brand-primary/5 scale-105 shadow-lg' : 'border-transparent bg-white/50 hover:border-brand-primary/30'
                      }`}
                    >
                      <img 
                        src={url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover rounded-xl" 
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </button>
                  ))}
                  
                  {/* Generate Button */}
                  <button
                    type="button"
                    onClick={handleGenerateAvatar}
                    className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand-primary hover:bg-brand-primary/5 transition-all flex flex-col items-center justify-center text-gray-400 hover:text-brand-primary group"
                    title="Generate Random Avatar"
                  >
                    <RefreshCw className="w-8 h-8 mb-1 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Generate</span>
                  </button>

                  {/* Reset Button */}
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand-primary hover:bg-brand-primary/5 transition-all flex flex-col items-center justify-center text-gray-400 hover:text-brand-primary group"
                    title="Reset to Default"
                  >
                    <BotIcon className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Reset</span>
                  </button>
                </div>
              </div>

              {/* Upload & Custom URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block">
                    <span className="label-premium">Upload Custom Avatar</span>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="flex items-center justify-center w-full p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand-primary hover:bg-brand-primary/5 transition-all cursor-pointer group"
                      >
                        <Upload className="w-6 h-6 mr-3 text-gray-400 group-hover:text-brand-primary" />
                        <span className="text-sm font-bold text-gray-500 group-hover:text-brand-primary">Choose File</span>
                      </label>
                    </div>
                  </label>
                  <p className="text-[10px] text-gray-400 italic mt-3">
                    Max size: 500KB. Square images work best.
                  </p>
                </div>

                <div>
                  <label className="block">
                    <span className="label-premium">Custom Avatar URL</span>
                    <div className="flex gap-4">
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.png"
                        className="input-premium flex-1"
                      />
                      {avatarUrl && (
                        <div className="w-14 h-14 rounded-2xl border-2 border-brand-primary p-1 overflow-hidden flex-shrink-0 bg-white shadow-lg">
                          <img 
                            src={avatarUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover rounded-xl" 
                            referrerPolicy="no-referrer" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=error';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Personality Settings */}
          <motion.section variants={itemVariants} className="glass-card">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary">
                <Smile className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Bot Personality</h2>
            </div>
            <p className="text-gray-500 text-sm mb-8">Choose how your bot interacts with users. This affects the tone and style of responses.</p>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPersonalityDropdownOpen(!isPersonalityDropdownOpen)}
                className="w-full p-5 rounded-2xl border-2 border-white/30 bg-white/50 backdrop-blur-md focus:border-brand-primary focus:ring-0 transition-all text-sm flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary">
                    {[
                      { id: 'professional', icon: <Building2 className="w-4 h-4" /> },
                      { id: 'friendly', icon: <Smile className="w-4 h-4" /> },
                      { id: 'humorous', icon: <Zap className="w-4 h-4" /> },
                      { id: 'technical', icon: <SettingsIcon className="w-4 h-4" /> }
                    ].find(p => p.id === personality)?.icon}
                  </div>
                  <span className="font-extrabold text-brand-dark capitalize text-base">{personality}</span>
                </div>
                <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isPersonalityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isPersonalityDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute z-50 left-0 right-0 mt-3 bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-2xl overflow-hidden p-2"
                  >
                    {[
                      { id: 'professional', label: 'Professional', desc: 'Formal, polite, and business-focused.', premium: false, icon: <Building2 className="w-4 h-4" /> },
                      { id: 'friendly', label: 'Friendly', desc: 'Warm, approachable, and helpful.', premium: true, icon: <Smile className="w-4 h-4" /> },
                      { id: 'humorous', label: 'Humorous', desc: 'Witty, light-hearted, and engaging.', premium: true, icon: <Zap className="w-4 h-4" /> },
                      { id: 'technical', label: 'Technical', desc: 'Precise, detailed, and data-driven.', premium: true, icon: <SettingsIcon className="w-4 h-4" /> }
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
                        className={`w-full p-4 text-left rounded-2xl transition-all flex items-center justify-between group mb-1 last:mb-0 ${
                          personality === p.id ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'hover:bg-brand-primary/5'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2.5 rounded-xl ${personality === p.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary'} transition-colors`}>
                            {p.icon}
                          </div>
                          <div>
                            <p className={`text-sm font-extrabold ${personality === p.id ? 'text-white' : 'text-brand-dark'}`}>{p.label}</p>
                            <p className={`text-[10px] ${personality === p.id ? 'text-white/70' : 'text-gray-500'}`}>{p.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {p.premium && !isPremium && (
                            <Crown className={`w-4 h-4 ${personality === p.id ? 'text-white' : 'text-amber-500'}`} />
                          )}
                          {personality === p.id && (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!isPremium && personality === 'professional' && (
              <p className="mt-5 text-xs text-amber-600 flex items-center font-bold bg-amber-50 p-3 rounded-xl border border-amber-100">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium to unlock more personalities.
              </p>
            )}
          </motion.section>

          {/* Messaging & Persona */}
          <motion.section variants={itemVariants} className="glass-card">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Messaging & Persona</h2>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="block">
                  <span className="label-premium">Bot Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-premium"
                    placeholder="e.g. Customer Support Bot"
                    required
                  />
                </label>
              </div>

              <div>
                <label className="block">
                  <span className="label-premium">Greeting Message</span>
                  <textarea
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    placeholder="e.g., Hello! I'm Alex, your travel assistant. How can I help you plan your next adventure today?"
                    className="input-premium min-h-[100px] resize-none leading-relaxed"
                  />
                </label>
                <p className="text-[10px] text-gray-400 italic mt-3">
                  This message will be sent automatically when a user starts a new conversation.
                </p>
              </div>

              <div>
                <label className="block">
                  <span className="label-premium flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-brand-primary" />
                    Primary Language
                  </span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                      className="w-full p-5 rounded-2xl border-2 border-white/30 bg-white/50 backdrop-blur-md focus:border-brand-primary focus:ring-0 transition-all text-sm flex items-center justify-between group"
                    >
                      <span className="font-extrabold text-brand-dark text-base">
                        {primaryLanguage === 'auto' ? 'Auto-detect (User\'s Language)' : primaryLanguage}
                      </span>
                      <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isLanguageDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute z-50 left-0 right-0 mt-3 bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-2xl overflow-hidden p-2 max-h-[240px] overflow-y-auto"
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
                              className={`w-full p-4 text-left rounded-2xl transition-all flex items-center justify-between group mb-1 last:mb-0 ${
                                primaryLanguage === lang ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'hover:bg-brand-primary/5'
                              }`}
                            >
                              <span className={`text-sm font-extrabold ${primaryLanguage === lang ? 'text-white' : 'text-brand-dark'}`}>
                                {lang === 'auto' ? 'Auto-detect (User\'s Language)' : lang}
                              </span>
                              {primaryLanguage === lang && (
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </label>
                <p className="text-[10px] text-gray-400 italic mt-3">
                  The bot will primarily respond in this language. If set to Auto-detect, it will match the user's language.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center space-x-2">
                    <span className="label-premium mb-0">Custom Instructions</span>
                    {!isPremium && <Crown className="w-4 h-4 text-amber-500" />}
                  </label>
                  <span className={`text-[10px] font-bold ${customInstructions.length > 4500 ? 'text-red-500' : 'text-gray-400'} bg-gray-100 px-2 py-1 rounded-lg uppercase tracking-tighter`}>
                    {customInstructions.length} / 5000
                  </span>
                </div>
                
                <div className="relative">
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value.slice(0, 5000))}
                    disabled={!isPremium}
                    placeholder="e.g., You are a helpful travel agent named Alex. You are enthusiastic about outdoor adventures but always prioritize safety. Use emojis occasionally to keep the tone light."
                    className={`input-premium min-h-[180px] resize-none leading-relaxed ${
                      !isPremium ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                  {!isPremium && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[1px] rounded-[2rem] pointer-events-none">
                      <div className="bg-white/90 px-5 py-3 rounded-2xl shadow-xl border border-amber-100 flex items-center scale-110">
                        <Crown className="w-5 h-5 text-amber-500 mr-3" />
                        <span className="text-sm font-extrabold text-amber-700">Premium Feature</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Templates</p>
                    {customInstructions && isPremium && (
                      <button 
                        type="button"
                        onClick={() => setCustomInstructions('')}
                        className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center uppercase tracking-tighter"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {personaTemplates.map((template) => (
                      <button
                        key={template.label}
                        type="button"
                        onClick={() => {
                          if (!isPremium) {
                            setShowUpgradeModal(true);
                            return;
                          }
                          setCustomInstructions(template.text);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-[11px] font-extrabold transition-all border flex items-center space-x-2 ${
                          isPremium 
                            ? 'bg-brand-primary/5 text-brand-primary border-brand-primary/10 hover:bg-brand-primary/10 hover:scale-105' 
                            : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                        }`}
                      >
                        {template.icon}
                        <span>{template.label}</span>
                        {!isPremium && <Lock className="w-3 h-3 ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>
                
                <p className="text-[10px] text-gray-400 italic mt-4">
                  These instructions will be combined with the selected personality to shape the bot's behavior. Detailed instructions lead to better results.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Training Mode Settings */}
          <motion.section variants={itemVariants} className="glass-card">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Training Mode</h2>
            </div>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Your bot is currently trained using **Small Language Model (SLM)** technology, optimized for high efficiency and specific business tasks.
            </p>
            
            <div className="p-8 rounded-[2rem] border-2 border-brand-primary/20 bg-brand-primary/5 flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <div className="p-4 rounded-2xl bg-brand-primary text-white shadow-xl shadow-brand-primary/20">
                  <Zap className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-extrabold text-brand-dark text-lg">SLM Trained</p>
                  <p className="text-xs text-gray-500 font-medium">Optimized for business logic and speed.</p>
                </div>
              </div>
              <div className="bg-brand-primary text-white px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-lg shadow-brand-primary/20">
                Active
              </div>
            </div>
          </motion.section>

          {/* Performance Settings */}
          <motion.section variants={itemVariants} className="glass-card">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary">
                <Zap className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Response Speed</h2>
            </div>
            <p className="text-gray-500 text-sm mb-8">Control the simulated typing speed of your bot to make it feel more human.</p>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsResponseSpeedDropdownOpen(!isResponseSpeedDropdownOpen)}
                className="w-full p-5 rounded-2xl border-2 border-white/30 bg-white/50 backdrop-blur-md focus:border-brand-primary focus:ring-0 transition-all text-sm flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-brand-dark capitalize text-base">{responseSpeed}</span>
                </div>
                <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isResponseSpeedDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isResponseSpeedDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute z-50 left-0 right-0 mt-3 bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-2xl overflow-hidden p-2"
                  >
                    {[
                      { id: 'instant', label: 'Instant', desc: 'No delay', premium: true },
                      { id: 'natural', label: 'Natural', desc: '1-2s delay', premium: false },
                      { id: 'slow', label: 'Deliberate', desc: '3-5s delay', premium: true }
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
                        className={`w-full p-4 text-left rounded-2xl transition-all flex items-center justify-between group mb-1 last:mb-0 ${
                          responseSpeed === s.id ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'hover:bg-brand-primary/5'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2.5 rounded-xl ${responseSpeed === s.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary'} transition-colors`}>
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-sm font-extrabold ${responseSpeed === s.id ? 'text-white' : 'text-brand-dark'}`}>{s.label}</p>
                            <p className={`text-[10px] ${responseSpeed === s.id ? 'text-white/70' : 'text-gray-500'}`}>{s.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {s.premium && !isPremium && (
                            <Crown className={`w-4 h-4 ${responseSpeed === s.id ? 'text-white' : 'text-amber-500'}`} />
                          )}
                          {responseSpeed === s.id && (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* Voice Input Settings */}
          <motion.section variants={itemVariants} className="glass-card overflow-hidden relative">
            {!isPremium && (
              <div className="absolute top-0 right-0 mt-6 mr-6">
                <div className="flex items-center space-x-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 shadow-sm">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest">Premium</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary">
                <Mic className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Voice Input</h2>
            </div>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Enable users to interact with your bot using their voice. This uses advanced speech-to-text technology to provide a hands-free experience.
            </p>
            
            <div className={`p-8 rounded-[2rem] border-2 transition-all duration-500 ${
              voiceEnabled ? 'border-brand-primary bg-brand-primary/5 shadow-xl shadow-brand-primary/10' : 'border-white/30 bg-white/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <div className={`p-4 rounded-2xl transition-all duration-500 ${
                    voiceEnabled ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {voiceEnabled ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
                  </div>
                  <div>
                    <p className="font-extrabold text-brand-dark text-lg">Enable Voice Input</p>
                    <p className="text-xs text-gray-500 font-medium">Allow microphone access for real-time conversation.</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => isPremium ? setVoiceEnabled(!voiceEnabled) : setShowUpgradeModal(true)}
                  className={`w-16 h-9 rounded-full transition-all relative ${
                    voiceEnabled ? 'bg-brand-primary shadow-lg shadow-brand-primary/30' : 'bg-gray-200'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                    voiceEnabled ? 'translate-x-7' : ''
                  }`} />
                </button>
              </div>
            </div>

            {!isPremium && (
              <div className="mt-8 p-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] border border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-amber-100">
                    <Zap className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-extrabold text-amber-900 text-lg">Unlock Voice Features</p>
                    <p className="text-xs text-amber-700/70 font-medium">Get voice input, custom voices, and more with Premium.</p>
                  </div>
                </div>
                <Link
                  to="/premium"
                  className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 text-white rounded-2xl font-extrabold text-sm hover:bg-amber-600 transition-all shadow-xl shadow-amber-200 flex items-center justify-center group"
                >
                  Upgrade Now
                  <ArrowLeft className="ml-2 w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </motion.section>

          {/* Voice Output Settings */}
          <motion.section variants={itemVariants} className="glass-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary">
                  <Volume2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Voice Output (TTS)</h2>
              </div>
              {!isPremium && <Crown className="w-6 h-6 text-amber-500" />}
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center justify-between p-8 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/30 shadow-sm">
                <div className="flex items-center space-x-5">
                  <div className={`p-4 rounded-2xl transition-all duration-500 ${voiceOutputEnabled ? 'bg-brand-primary/10 text-brand-primary' : 'bg-gray-200 text-gray-500'}`}>
                    {voiceOutputEnabled ? <Volume2 className="w-8 h-8" /> : <VolumeX className="w-8 h-8" />}
                  </div>
                  <div>
                    <p className="font-extrabold text-brand-dark text-lg">Enable Voice Output</p>
                    <p className="text-sm text-gray-500 font-medium">The bot will speak its responses aloud.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => isPremium ? setVoiceOutputEnabled(!voiceOutputEnabled) : setShowUpgradeModal(true)}
                  className={`w-16 h-9 rounded-full transition-all relative ${
                    voiceOutputEnabled ? 'bg-brand-primary shadow-lg shadow-brand-primary/30' : 'bg-gray-200'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                    voiceOutputEnabled ? 'translate-x-7' : ''
                  }`} />
                </button>
              </div>

              {voiceOutputEnabled && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="label-premium mb-0">Select Voice</label>
                    <button
                      type="button"
                      onClick={() => speak(testPhrases[primaryLanguage] || testPhrases['auto'], voiceId as any)}
                      className="text-xs font-extrabold text-brand-primary hover:text-brand-secondary flex items-center bg-brand-primary/5 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Volume2 className="w-4 h-4 mr-1.5" />
                      Test Voice
                    </button>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsVoiceIdDropdownOpen(!isVoiceIdDropdownOpen)}
                      className="w-full p-5 rounded-2xl border-2 border-white/30 bg-white/50 backdrop-blur-md focus:border-brand-primary focus:ring-0 transition-all text-sm flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary">
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <span className="font-extrabold text-brand-dark text-base">{voiceId}</span>
                      </div>
                      <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isVoiceIdDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isVoiceIdDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute z-50 left-0 right-0 mt-3 bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-2xl overflow-hidden p-2"
                        >
                          {['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                setVoiceId(v);
                                setIsVoiceIdDropdownOpen(false);
                              }}
                              className={`w-full p-4 text-left rounded-2xl transition-all flex items-center justify-between group mb-1 last:mb-0 ${
                                voiceId === v ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'hover:bg-brand-primary/5'
                              }`}
                            >
                              <div className="flex items-center space-x-4">
                                <div className={`p-2.5 rounded-xl ${voiceId === v ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary'} transition-colors`}>
                                  <Volume2 className="w-4 h-4" />
                                </div>
                                <span className={`text-sm font-extrabold ${voiceId === v ? 'text-white' : 'text-brand-dark'}`}>{v}</span>
                              </div>
                              {voiceId === v && (
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </div>

            {!isPremium && (
              <p className="text-xs text-amber-600 mt-6 flex items-center font-bold bg-amber-50 p-3 rounded-xl border border-amber-100">
                <AlertCircle className="w-4 h-4 mr-2" />
                Voice output is a premium feature. Upgrade to enable.
              </p>
            )}
          </motion.section>

          {/* Platform Selection */}
          <motion.section variants={itemVariants} className="glass-card">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Deployment Platform</h2>
            </div>
            <p className="text-gray-500 text-sm mb-8">Choose where you want to deploy your bot. This will provide tailored integration instructions.</p>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                className="w-full p-5 rounded-2xl border-2 border-white/30 bg-white/50 backdrop-blur-md focus:border-brand-primary focus:ring-0 transition-all text-sm flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary">
                    {platformGuides[platform]?.icon || <Globe className="w-4 h-4" />}
                  </div>
                  <span className="font-extrabold text-brand-dark capitalize text-base">{platform}</span>
                </div>
                <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isPlatformDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isPlatformDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute z-50 left-0 right-0 mt-3 bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-2xl overflow-hidden p-2"
                  >
                    {Object.keys(platformGuides).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPlatform(p);
                          setIsPlatformDropdownOpen(false);
                        }}
                        className={`w-full p-4 text-left rounded-2xl transition-all flex items-center justify-between group mb-1 last:mb-0 ${
                          platform === p ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'hover:bg-brand-primary/5'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2.5 rounded-xl ${platform === p ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary'} transition-colors`}>
                            {platformGuides[p].icon}
                          </div>
                          <div>
                            <p className={`text-sm font-extrabold ${platform === p ? 'text-white' : 'text-brand-dark'}`}>{platformGuides[p].title}</p>
                          </div>
                        </div>
                        {platform === p && (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* Platform Integration Guide */}
          <motion.section variants={itemVariants} className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-[2.5rem] p-10 text-white shadow-2xl shadow-brand-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="flex items-center space-x-5 mb-10 relative z-10">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-xl border border-white/30 text-white shadow-lg">
                {platformGuides[platform]?.icon}
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">{platformGuides[platform]?.title} Guide</h2>
            </div>
            
            <div className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 gap-6">
                {platformGuides[platform]?.steps.map((step: string, index: number) => (
                  <div key={index} className="flex items-start space-x-5 bg-white/10 p-6 rounded-[1.5rem] backdrop-blur-xl border border-white/20 shadow-lg group hover:bg-white/20 transition-all">
                    <div className="flex-shrink-0 w-8 h-8 bg-white text-brand-primary rounded-xl flex items-center justify-center font-extrabold text-sm shadow-lg">
                      {index + 1}
                    </div>
                    <p className="text-base text-white font-medium leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              {platform === 'website' && (
                <div className="mt-10">
                  <p className="text-xs font-extrabold text-white/60 uppercase tracking-widest mb-4">Embed Script</p>
                  <div className="relative group">
                    <pre className="bg-brand-dark/40 p-6 rounded-[1.5rem] text-xs font-mono text-brand-light/90 overflow-x-auto border border-white/10 backdrop-blur-xl shadow-2xl">
                      {platformGuides.website.snippet}
                    </pre>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(platformGuides.website.snippet);
                        toast.success('Snippet copied to clipboard!');
                      }}
                      className="absolute right-4 top-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white opacity-0 group-hover:opacity-100 shadow-lg border border-white/20"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {(platform === 'telegram' || platform === 'whatsapp' || platform === 'instagram') && (
                <div className="mt-10 p-8 bg-white/10 rounded-[2rem] border border-white/20 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-extrabold text-white/60 uppercase tracking-widest">Webhook URL</p>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/api/webhook/${botId}`;
                        navigator.clipboard.writeText(url);
                        toast.success('Webhook URL copied!');
                      }}
                      className="text-xs font-extrabold text-white hover:text-brand-light flex items-center transition-all bg-white/10 px-4 py-2 rounded-xl border border-white/10"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </button>
                  </div>
                  <code className="block p-5 bg-brand-dark/30 rounded-2xl text-xs font-mono text-brand-light/90 break-all border border-white/5 shadow-inner">
                    {window.location.origin}/api/webhook/{botId}
                  </code>
                </div>
              )}
            </div>
          </motion.section>

          {/* Integration Settings */}
          <motion.section variants={itemVariants} className="glass-card">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Integration Parameters</h2>
            </div>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Configure advanced integration options for your bot. These parameters allow your bot to communicate with external systems and authenticate securely.
            </p>
            
            <div className="space-y-8">
              <div>
                <label className="block">
                  <span className="label-premium">Webhook URL</span>
                  <div className="relative">
                    <SettingsIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                    <input
                      type={showWebhookUrl ? "text" : "password"}
                      placeholder="Enter your secure webhook endpoint (e.g., https://api.yoursite.com/webhook)"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="input-premium pl-14 pr-14 py-5 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWebhookUrl(!showWebhookUrl)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors p-2 rounded-lg hover:bg-gray-100"
                    >
                      {showWebhookUrl ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  </div>
                </label>
                <p className="text-[10px] text-gray-400 mt-3 italic">The URL where your bot will send real-time event notifications. Masked for security.</p>
              </div>
            </div>
          </motion.section>

          {/* Branding Settings */}
          <motion.section variants={itemVariants} className="glass-card">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary">
                <Crown className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Branding</h2>
            </div>
            <p className="text-gray-500 text-sm mb-8">Customize the appearance of your bot's interface.</p>
            
            <div className="flex items-center justify-between p-8 rounded-[2rem] bg-white/50 backdrop-blur-md border border-white/30 shadow-sm">
              <div className="flex items-center space-x-5">
                <div className={`p-4 rounded-2xl transition-all duration-500 ${showPoweredBy || !isPremium ? 'bg-brand-primary/10 text-brand-primary' : 'bg-gray-200 text-gray-500'}`}>
                  <Crown className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-extrabold text-brand-dark text-lg">Show "Powered by Botub"</p>
                  <p className="text-sm text-gray-500 font-medium">Display a small footer at the bottom of the chat widget.</p>
                  {!isPremium && (
                    <p className="text-[10px] text-amber-600 font-extrabold mt-2 flex items-center bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 w-fit">
                      <Crown className="w-3.5 h-3.5 mr-1.5" />
                      Premium required to hide branding
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isPremium) {
                    setShowUpgradeModal(true);
                    return;
                  }
                  setShowPoweredBy(!showPoweredBy);
                }}
                className={`w-16 h-9 rounded-full transition-all relative ${
                  showPoweredBy || !isPremium ? 'bg-brand-primary shadow-lg shadow-brand-primary/30' : 'bg-gray-200'
                } ${!isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                  showPoweredBy || !isPremium ? 'translate-x-7' : ''
                }`} />
              </button>
            </div>
          </motion.section>

          {/* Bot Usage Guide */}
          <motion.section variants={itemVariants} className="glass-card premium-border">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 rounded-2xl bg-brand-primary/10 text-brand-primary">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Bot Usage Guide</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {usageGuideSteps.map((step, index) => (
                <div key={index} className="flex space-x-5 p-6 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand-primary text-white rounded-2xl flex items-center justify-center font-black text-base shadow-lg shadow-brand-primary/20 group-hover:scale-110 transition-transform">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-brand-dark text-base mb-2">{step.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-8 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 rounded-[2rem] border border-brand-primary/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="flex items-start space-x-5 relative z-10">
                <div className="p-3 bg-brand-primary text-white rounded-xl shadow-lg">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg font-black text-brand-dark mb-2">Pro Tip: Iterative Training</p>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    The most successful bots are built iteratively. Start with a small knowledge base, test common questions, and add more data based on where the bot struggles. Use the "Custom Instructions" to fine-tune specific edge cases.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Danger Zone */}
          <motion.section variants={itemVariants} className="p-10 bg-red-50/50 backdrop-blur-md rounded-[3rem] border-2 border-red-100 shadow-2xl shadow-red-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full -mr-24 -mt-24 blur-3xl" />
            <div className="flex items-center space-x-4 mb-8 relative z-10">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-inner">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-red-900 tracking-tight">Danger Zone</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 relative z-10">
              <div className="max-w-md">
                <p className="font-black text-red-900 text-lg mb-2">Delete this bot</p>
                <p className="text-sm text-red-700/70 font-medium leading-relaxed">Once you delete a bot, there is no going back. All data, knowledge base, and history will be permanently erased.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto px-10 py-4 bg-red-600 text-white rounded-2xl font-black text-base hover:bg-red-700 transition-all shadow-2xl shadow-red-600/20 flex items-center justify-center group active:scale-95"
              >
                <Trash2 className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                Delete Bot
              </button>
            </div>
          </motion.section>

          {/* Sticky Actions Bar */}
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-40"
          >
            <div className="glass-card !p-4 flex items-center justify-between premium-shadow border-white/50">
              <div className="hidden sm:flex items-center ml-4">
                <AnimatePresence mode="wait">
                  {success ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center text-green-600 font-black text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Settings Saved Successfully!
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center text-gray-400 font-bold text-sm"
                    >
                      <AlertCircle className="w-5 h-5 mr-2" />
                      You have unsaved changes
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate(`/bot/${botId}`)}
                  className="flex-1 sm:flex-none px-8 py-4 bg-white text-gray-600 rounded-2xl font-bold text-base hover:bg-gray-50 transition-all border border-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || success}
                  className={`flex-1 sm:flex-none px-12 py-4 rounded-2xl font-black text-base transition-all shadow-2xl flex items-center justify-center disabled:opacity-50 group active:scale-95 ${
                    success 
                      ? 'bg-green-600 text-white shadow-green-600/20' 
                      : 'bg-brand-primary text-white shadow-brand-primary/20 hover:bg-brand-secondary'
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Saving...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-3" />
                      Saved!
                    </>
                  ) : (
                    <>
                      Save Changes
                      <Save className="ml-3 w-5 h-5 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.form>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-white/50 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                <AlertTriangle className="text-red-600 w-10 h-10" />
              </div>

              <h3 className="text-3xl font-black text-brand-dark mb-3 tracking-tight">Delete Bot?</h3>
              <p className="text-gray-500 mb-10 font-medium leading-relaxed">
                This will permanently delete <strong className="text-red-600">{bot.name}</strong> and all associated chat history and knowledge base entries. This action <span className="underline decoration-red-200 underline-offset-4">cannot be undone</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-base hover:bg-gray-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBot}
                  disabled={deleting}
                  className="flex-1 px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-base hover:bg-red-700 transition-all shadow-2xl shadow-red-600/20 flex items-center justify-center disabled:opacity-50 active:scale-95"
                >
                  {deleting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl border border-white/50 text-center overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-primary/5 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
              
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-24 h-24 bg-gradient-to-br from-amber-50 to-orange-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-200/20 border border-amber-100">
                <Crown className="text-amber-500 w-12 h-12 drop-shadow-md" />
              </div>

              <h3 className="text-3xl font-black text-brand-dark mb-4 tracking-tight">Premium Feature</h3>
              <p className="text-gray-500 mb-10 font-medium leading-relaxed">
                Advanced features like voice integration, custom personalities, and speed settings are exclusive to our <span className="text-brand-primary font-black">Premium</span> users. Upgrade now to unlock the full potential.
              </p>

              <div className="flex flex-col gap-4">
                <Link
                  to="/premium"
                  className="w-full px-8 py-5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-2xl font-black text-lg hover:scale-[1.02] transition-all shadow-2xl shadow-brand-primary/30 flex items-center justify-center group"
                >
                  <Zap className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                  Upgrade to Premium
                </Link>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-base hover:bg-gray-200 transition-all active:scale-95"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
