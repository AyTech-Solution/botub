import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  CreditCard,
  Image,
  ChevronDown,
  Building2,
  BookOpen,
  BrainCircuit,
  MessageSquare,
  Copy,
  ExternalLink,
  RefreshCw,
  Upload,
  Code2,
  Palette
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
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [primaryLanguage, setPrimaryLanguage] = useState('auto');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWebhookUrl, setShowWebhookUrl] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  const [brandingColor, setBrandingColor] = useState('#4f46e5');
  const [position, setPosition] = useState<'left' | 'right'>('right');
  const [links, setLinks] = useState<string[]>([]);

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
    { title: '1. SLM Training', desc: 'Your bot uses our specialized Botub SLM Engine, optimized for accuracy and speed.' },
    { title: '2. Knowledge Base', desc: 'Upload PDFs or text files to create a domain-specific assistant for your use case.' },
    { title: '3. Web Widget', desc: 'Embed the bot on any website with our optimized multi-config script.' },
    { title: '4. API Access', desc: 'Optionally use Webhooks to connect your bot to other business projects.' }
  ];

  const personaTemplates = [
    { label: 'Customer Support', icon: <Building2 className="w-3 h-3" />, text: 'You are a patient and helpful support agent. Use clear, simple language and always verify if the user needs more help before ending.' },
    { label: 'Sales Expert', icon: <Zap className="w-3 h-3" />, text: 'You are a persuasive sales consultant. Focus on highlighting benefits, creating urgency, and guiding the user toward a purchase.' },
    { label: 'Technical Guru', icon: <SettingsIcon className="w-4 h-4" />, text: 'You are a highly knowledgeable technical expert. Provide detailed, accurate explanations and don\'t shy away from complex terms when necessary.' },
    { label: 'Playful Guide', icon: <Smile className="w-4 h-4" />, text: 'You are a fun and energetic guide. Use plenty of emojis, keep responses short and punchy, and maintain a very positive vibe.' }
  ];

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
          setName(data.name || '');
          setPersonality(data.personality || 'professional');
          setAvatarUrl(data.avatarUrl || '');
          setResponseSpeed(data.responseSpeed || 'natural');
          setPrimaryLanguage(data.primaryLanguage || 'auto');
          setGreetingMessage(data.greetingMessage || '');
          setCustomInstructions(data.customInstructions || '');
          setShowPoweredBy(data.showPoweredBy !== undefined ? data.showPoweredBy : true);
          setBrandingColor(data.branding?.color || '#4f46e5');
          setPosition(data.branding?.position || 'right');
          setLinks(data.links || []);
          setWebhookUrl(data.integrationParams?.webhookUrl || '');
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'bots/' + botId);
      } finally {
        setLoading(false);
      }
    };

    fetchBot();
  }, [botId, navigate]);

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
    
    setSaving(true);
    setSuccess(false);

    try {
      const docRef = doc(db, 'bots', botId);
      await updateDoc(docRef, {
        name,
        personality,
        avatarUrl,
        responseSpeed,
        primaryLanguage,
        greetingMessage,
        customInstructions,
        showPoweredBy,
        branding: {
          color: brandingColor,
          position: position
        },
        links: links.filter(l => l.trim() !== ''),
        integrationParams: {
          webhookUrl,
        }
      });
      setSuccess(true);
      toast.success('Settings saved successfully!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'bots/' + botId);
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
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto pb-32">
        <div className="flex items-center justify-between mb-10">
          <Link to={`/bot/${botId}`} className="flex items-center text-slate-500 hover:text-indigo-600 transition-all font-bold group">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Bot
          </Link>
          <div className="text-right">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure bot behavior</p>
          </div>
        </div>

        <motion.form 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSave} 
          className="space-y-8"
        >
          <AnimatePresence>
            {(success || error) && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className={`p-6 rounded-[2rem] border-2 flex items-center justify-between mb-8 overflow-hidden shadow-2xl ${
                  success 
                    ? 'bg-emerald-50 border-emerald-500/20 text-emerald-900 shadow-emerald-500/10' 
                    : 'bg-rose-50 border-rose-500/20 text-rose-900 shadow-rose-500/10'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl ${success ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-rose-500 shadow-lg shadow-rose-500/20'}`}>
                    {success ? <CheckCircle2 className="w-6 h-6 text-white" /> : <AlertCircle className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h4 className="font-black text-lg uppercase tracking-tight leading-none">
                      {success ? 'Update Complete' : 'Update Failed'}
                    </h4>
                    <p className="text-[11px] font-bold uppercase tracking-widest mt-1 opacity-60">
                      {success ? 'All changes synced to Botub Cloud successfully' : error}
                    </p>
                  </div>
                </div>
                {error && (
                  <button 
                    onClick={() => setError('')}
                    className="p-2 hover:bg-rose-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-rose-400" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bot Avatar Section */}
          <motion.section variants={itemVariants} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Image className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bot Appearance</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">How your bot looks to users</p>
              </div>
            </div>
            
            <div className="space-y-10">
              {/* Predefined Avatars */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Select from templates</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                  {predefinedAvatars.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all ${
                        avatarUrl === url ? 'border-indigo-600 scale-105 shadow-xl' : 'border-slate-50 hover:border-indigo-200'
                      }`}
                    >
                      <img 
                        src={url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </button>
                  ))}
                  
                  {/* Generate Button */}
                  <button
                    type="button"
                    onClick={handleGenerateAvatar}
                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 group"
                  >
                    <RefreshCw className="w-6 h-6 mb-2 group-hover:rotate-180 transition-transform duration-700" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Random</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-red-400 hover:bg-red-50/50 transition-all flex flex-col items-center justify-center text-slate-400 hover:text-red-600 group"
                  >
                    <BotIcon className="w-6 h-6 mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Reset</span>
                  </button>
                </div>
              </div>

              {/* Upload & Custom URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-50">
                <div>
                  <label className="block">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Custom Upload</span>
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
                        className="flex items-center justify-center w-full p-8 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
                      >
                        <Upload className="w-6 h-6 mr-3 text-slate-400 group-hover:text-indigo-600" />
                        <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600">Choose custom image</span>
                      </label>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">External URL</span>
                    <div className="flex gap-4">
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.png"
                        className="flex-1 px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 transition-all font-bold text-sm"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Personality Settings Section */}
          <motion.section variants={itemVariants} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Smile className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bot Personality</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Define the tone of voice</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'professional', label: 'Professional', desc: 'Formal and business-like', icon: <Building2 className="w-5 h-5" /> },
                  { id: 'friendly', label: 'Friendly', desc: 'Warm and approachable', icon: <Smile className="w-5 h-5" /> },
                  { id: 'humorous', label: 'Humorous', desc: 'Light-hearted and witty', icon: <Zap className="w-5 h-5" /> },
                  { id: 'technical', label: 'Technical', desc: 'Precise and data-driven', icon: <SettingsIcon className="w-5 h-5" /> }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPersonality(opt.id)}
                    className={`p-6 rounded-[2rem] border-2 text-left transition-all flex items-center space-x-4 ${
                      personality === opt.id 
                        ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50' 
                        : 'border-slate-50 hover:border-indigo-100 bg-slate-50/30'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${personality === opt.id ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-400 border border-slate-100 shadow-sm'}`}>
                      {opt.icon}
                    </div>
                    <div>
                      <p className={`font-black tracking-tight ${personality === opt.id ? 'text-indigo-900' : 'text-slate-900'}`}>{opt.label}</p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Chat Configuration Section */}
          <motion.section variants={itemVariants} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Training Sources</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Websites your bot has learned from</p>
              </div>
            </div>

            <div className="space-y-4">
              {links.map((link, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3"
                >
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...links];
                        newLinks[index] = e.target.value;
                        setLinks(newLinks);
                      }}
                      placeholder="https://example.com/docs"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 font-bold text-sm transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, i) => i !== index))}
                    className="p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
              
              <button
                type="button"
                onClick={() => setLinks([...links, ''])}
                className="flex items-center space-x-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-4 py-3 rounded-xl transition-all w-fit"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Add Support URL</span>
              </button>
              
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-3 mt-4">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight leading-relaxed">
                  Note: Adding URLs here updates the bot's metadata. To re-train the bot with new content, please visit the Knowledge Base section in Bot Details.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Chat Configuration Section */}
          <motion.section variants={itemVariants} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Chat Settings</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interface and language</p>
              </div>
            </div>
            
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="relative">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Language</span>
                  <button
                    type="button"
                    onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                    className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-left text-sm font-bold flex items-center justify-between hover:border-slate-200 transition-all font-sans"
                  >
                    <span className="text-slate-900">
                      {primaryLanguage === 'auto' ? 'Auto-detect' : primaryLanguage}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isLanguageDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden p-2 max-h-48 overflow-y-auto ring-1 ring-black/5"
                      >
                        {['auto', 'English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic'].map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              setPrimaryLanguage(lang);
                              setIsLanguageDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-sm font-bold rounded-xl transition-colors ${
                              primaryLanguage === lang ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {lang === 'auto' ? 'Auto-detect' : lang}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Response Speed</span>
                  <button
                    type="button"
                    onClick={() => setIsResponseSpeedDropdownOpen(!isResponseSpeedDropdownOpen)}
                    className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-left text-sm font-bold flex items-center justify-between hover:border-slate-200 transition-all font-sans"
                  >
                    <span className="text-slate-900 capitalize">{responseSpeed}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform ${isResponseSpeedDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isResponseSpeedDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden p-2 ring-1 ring-black/5"
                      >
                        {['instant', 'natural', 'slow'].map((speed) => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => {
                              setResponseSpeed(speed);
                              setIsResponseSpeedDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-sm font-bold rounded-xl transition-colors ${
                              responseSpeed === speed ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="capitalize">{speed}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Greeting Message</label>
                <textarea
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  placeholder="e.g., Welcome to Botub! How can I help you automate your business today?"
                  className="w-full px-6 py-5 rounded-3xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 font-bold text-slate-900 text-sm min-h-[100px] leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Custom Instructions</label>
                  <span className={`text-[9px] font-black px-2 py-1 rounded bg-slate-50 ${(customInstructions?.length || 0) > 4500 ? 'text-red-500' : 'text-slate-400'}`}>
                    {(customInstructions?.length || 0)} / 5000
                  </span>
                </div>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value.slice(0, 5000))}
                  placeholder="Detailed system instructions for your bot..."
                  className="w-full px-6 py-6 rounded-3xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 font-medium text-slate-900 text-sm min-h-[200px] leading-relaxed font-mono"
                />
              </div>
            </div>
          </motion.section>


          {/* Website Branding Section */}
          <motion.section variants={itemVariants} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Widget Styling</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customize the chat widget</p>
              </div>
            </div>
            
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Primary Color</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={brandingColor}
                      onChange={(e) => setBrandingColor(e.target.value)}
                      className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={brandingColor}
                      onChange={(e) => setBrandingColor(e.target.value)}
                      className="flex-1 px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-mono text-sm font-bold uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Position</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['left', 'right'].map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPosition(pos as any)}
                        className={`py-4 rounded-2xl text-sm font-bold capitalize transition-all ${
                          position === pos ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="pt-10 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Live Widget Preview</p>
                <div className="relative h-64 bg-slate-100 rounded-[2rem] border border-slate-200/50 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
                  
                  {/* Fake Page Content */}
                  <div className="p-8 space-y-4">
                    <div className="h-4 w-3/4 bg-slate-200 rounded-full" />
                    <div className="h-4 w-1/2 bg-slate-200 rounded-full" />
                    <div className="h-20 w-full bg-slate-200/50 rounded-2xl" />
                  </div>

                  {/* The Preview Widget */}
                  <div 
                    className={`absolute bottom-6 transition-all duration-500 ${position === 'left' ? 'left-6' : 'right-6'}`}
                  >
                    <div 
                      className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform active:scale-95"
                      style={{ backgroundColor: brandingColor }}
                    >
                      <MessageSquare className="w-8 h-8" />
                      
                      {/* Notification Badge */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-[10px] font-black">1</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">
                  This is how the bubble will appear on your site
                </p>
              </div>
            </div>
          </motion.section>

          {/* Website Integration Section */}
          <motion.section variants={itemVariants} className="bg-slate-900 rounded-[2.5rem] p-10 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/20">
                  <Code2 className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Ready to Deploy?</h2>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Project Integration Guide</p>
                </div>
              </div>
              <Link 
                to={`/integration-guide/${botId}`} 
                className="w-full md:w-auto px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all shadow-2xl flex items-center justify-center"
              >
                Get Embed Code
                <ExternalLink className="w-4 h-4 ml-3" />
              </Link>
            </div>
          </motion.section>

          {/* Technical Integration Section */}
          <motion.section variants={itemVariants} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">External Integrations</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connect your bot to third-party services</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Webhook Endpoint</label>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Optional</span>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type={showWebhookUrl ? "text" : "password"}
                      placeholder="https://your-api.com/webhook"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWebhookUrl(!showWebhookUrl)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                    >
                      {showWebhookUrl ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed px-1">
                    Enter a URL to receive real-time events. We'll send a POST request with JSON payload whenever a new conversation state is triggered.
                  </p>
                  
                  {webhookUrl && (
                    <div className="space-y-4">
                      <button
                        type="button"
                        disabled={isTestingWebhook}
                        onClick={async () => {
                          setIsTestingWebhook(true);
                          setWebhookTestResult(null);
                          try {
                            const response = await fetch('/api/test-webhook', {
                              method: 'POST',
                              headers: { 
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ url: webhookUrl })
                            });
                            const data = await response.json();
                            setWebhookTestResult(data);
                            if (data.success) {
                              toast.success('Webhook target responded with status ' + data.status);
                            } else {
                              toast.error(`Webhook target reachable but returned ${data.status}`);
                            }
                          } catch (err: any) {
                            console.error("Test failed:", err);
                            toast.error('Failed to communicate with webhook tester');
                          } finally {
                            setIsTestingWebhook(false);
                          }
                        }}
                        className={`flex items-center text-[10px] font-black uppercase tracking-widest transition-colors ${
                          isTestingWebhook ? 'text-slate-400' : 'text-indigo-600 hover:text-indigo-700'
                        }`}
                      >
                        {isTestingWebhook ? (
                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        ) : (
                          <Zap className="w-3 h-3 mr-1.5" />
                        )}
                        Test Connection
                      </button>

                      <AnimatePresence>
                        {webhookTestResult && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`p-6 rounded-3xl border text-sm overflow-hidden ${
                              webhookTestResult.success 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                                : 'bg-red-50 border-red-100 text-red-900'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2">
                                {webhookTestResult.success ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                                <span className="font-black uppercase tracking-widest text-[10px]">
                                  {webhookTestResult.success ? 'Success' : 'Failed'}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] bg-white/50 px-2 py-0.5 rounded-full">
                                {webhookTestResult.duration || 'N/A'}
                              </span>
                            </div>
                            
                            {webhookTestResult.success ? (
                              <div className="space-y-4">
                                <div className="p-4 bg-white/40 rounded-2xl border border-emerald-200/50">
                                  <p className="font-bold text-emerald-800">Connection Successful</p>
                                  <p className="text-xs text-emerald-700/70 mt-1">
                                    The server at {webhookUrl} responded correctly to our test payload.
                                  </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white/40 p-3 rounded-xl border border-emerald-200/50">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50 mb-1">Status Code</p>
                                    <p className="text-sm font-bold text-emerald-900">{webhookTestResult.status} {webhookTestResult.statusText}</p>
                                  </div>
                                  <div className="bg-white/40 p-3 rounded-xl border border-emerald-200/50">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50 mb-1">Response Time</p>
                                    <p className="text-sm font-bold text-emerald-900">{webhookTestResult.duration}</p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50 mb-2 ml-1">Response Body</p>
                                  <pre className="bg-slate-900 text-slate-300 p-4 rounded-2xl font-mono text-[10px] overflow-x-auto shadow-inner">
                                    {JSON.stringify(webhookTestResult.data, null, 2)}
                                  </pre>
                                </div>

                                {webhookTestResult.headers && (
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50 mb-2 ml-1">Response Headers</p>
                                    <div className="bg-white/50 p-3 rounded-xl font-mono text-[9px] text-emerald-800/70 space-y-1">
                                      {Object.entries(webhookTestResult.headers).slice(0, 5).map(([k, v]) => (
                                        <div key={k} className="flex"><span className="font-bold mr-2 uppercase">{k}:</span> <span className="opacity-80">{String(v)}</span></div>
                                      ))}
                                      {Object.keys(webhookTestResult.headers || {}).length > 5 && <p className="italic opacity-50">... and {Object.keys(webhookTestResult.headers).length - 5} more</p>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="p-4 bg-white/40 rounded-2xl border border-red-200/50">
                                  <p className="font-bold text-red-800">{webhookTestResult.error || 'Connection Error'}</p>
                                  <p className="text-xs text-red-700/70 mt-1">{webhookTestResult.details}</p>
                                </div>

                                {webhookTestResult.status && (
                                  <div className="bg-white/40 p-3 rounded-xl border border-red-200/50">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-600/50 mb-1">HTTP Status</p>
                                    <p className="text-sm font-bold text-red-900">{webhookTestResult.status} {webhookTestResult.statusText}</p>
                                  </div>
                                )}

                                <div className="p-3 bg-red-100/50 rounded-xl flex items-start space-x-3">
                                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                  <p className="text-[10px] text-red-800/80 leading-relaxed">
                                    <strong>Troubleshooting:</strong> Ensure your server is accessible from the internet and accepts POST requests with JSON content. If using a local server, consider using a tool like ngrok to expose it.
                                  </p>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${showPoweredBy ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-100'}`}>
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 tracking-tight">Show Branding</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Display "Powered by Botub"</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPoweredBy(!showPoweredBy)}
                    className={`w-14 h-8 rounded-full transition-all relative ${showPoweredBy ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${showPoweredBy ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Quick Guide */}
          <motion.section variants={itemVariants} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Development Guide</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Training', desc: 'Define your bot persona and knowledge instructions above.' },
                { title: 'Styling', desc: 'Customizing colors and position to match your website theme.' },
                { title: 'Embedding', desc: 'Get the script from integration guide and paste into your HTML.' },
                { title: 'Testing', desc: 'Try common questions to ensure the bot behaves as expected.' }
              ].map((step, index) => (
                <div key={index} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <h4 className="font-black text-slate-900 text-sm mb-1">{step.title}</h4>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase tracking-tight">{step.desc}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Danger Zone Section */}
          <motion.section variants={itemVariants} className="p-10 bg-rose-50 rounded-[2.5rem] border border-rose-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-white text-rose-600 rounded-2xl flex items-center justify-center shadow-sm border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-rose-900 tracking-tight">Danger Zone</h2>
                <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Irreversible actions</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-sm font-bold text-rose-900/60 leading-relaxed text-center sm:text-left">
                Deleting this bot will permanently remove its configuration and chat records. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto px-10 py-5 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 flex items-center justify-center group"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Delete Bot
              </button>
            </div>
          </motion.section>

          {/* Spacer for sticky bar */}
          <div className="h-32" />

          {/* Sticky Actions Bar */}
          <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
            <div className="max-w-4xl mx-auto w-full pointer-events-auto">
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-white/80 backdrop-blur-2xl p-4 rounded-3xl border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] flex items-center justify-between"
              >
                <div className="hidden sm:flex items-center ml-4">
                  <AnimatePresence mode="wait">
                    {success ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center text-emerald-600 font-black text-sm"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Settings Saved!
                      </motion.div>
                    ) : (
                      <div className="flex items-center text-slate-400 font-bold text-sm">
                        <Save className="w-5 h-5 mr-2" />
                        Unsaved Changes
                      </div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => navigate(`/bot/${botId}`)}
                    className="flex-1 sm:flex-none px-10 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || success}
                    className={`flex-1 sm:flex-none px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center disabled:opacity-50 ${
                      success 
                        ? 'bg-emerald-600 text-white shadow-emerald-100' 
                        : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
                    }`}
                  >
                    {saving ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
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
    </div>
  );
}
