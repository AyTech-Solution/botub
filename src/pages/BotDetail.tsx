import React, { useState, useEffect, useRef, memo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { generateBotResponse } from '../services/geminiService';
import { speak } from '../services/ttsService';
import { 
  Bot, 
  ArrowLeft, 
  Send, 
  Settings, 
  Activity, 
  MessageSquare, 
  Code,
  Globe,
  Copy,
  Check,
  Loader2,
  Server,
  BarChart3,
  History,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  BookOpen,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  AlertTriangle,
  HeartPulse,
  TrendingUp,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { deleteDoc } from 'firebase/firestore';
import IntegrationGuide from '../components/IntegrationGuide';

// Memoized Knowledge Entry for performance
const KnowledgeEntry = memo(({ 
  entry, 
  editingKnowledgeId, 
  deletingKnowledgeId, 
  knowledgeInput, 
  setKnowledgeInput, 
  setEditingKnowledgeId, 
  setDeletingKnowledgeId, 
  handleUpdateKnowledge, 
  handleDeleteKnowledge, 
  isSavingKnowledge,
  setIsAddingKnowledge
}: any) => {
  return (
    <div className="group glass rounded-2xl p-6 hover:shadow-xl transition-all relative border-none">
      {editingKnowledgeId === entry.id ? (
        <div className="space-y-4">
          <textarea
            value={knowledgeInput}
            onChange={(e) => setKnowledgeInput(e.target.value)}
            className="w-full p-4 rounded-xl bg-white/50 border border-brand-primary/20 focus:ring-2 focus:ring-brand-primary outline-none transition-all text-sm min-h-[120px] font-medium"
          />
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setEditingKnowledgeId(null)}
              className="p-2 text-gray-400 hover:text-brand-dark"
            >
              <X className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleUpdateKnowledge(entry.id)}
              disabled={!knowledgeInput.trim() || isSavingKnowledge}
              className="p-2 text-brand-primary hover:text-brand-secondary disabled:opacity-50"
            >
              {isSavingKnowledge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Source: {entry.sourceUrl === 'manual' ? 'Manual Entry' : 'Website Analysis'}
            </span>
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  setEditingKnowledgeId(entry.id);
                  setKnowledgeInput(entry.content);
                  setIsAddingKnowledge(false);
                }}
                className="p-1.5 text-gray-400 hover:text-brand-primary transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setDeletingKnowledgeId(entry.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {deletingKnowledgeId === entry.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl z-20 flex flex-col items-center justify-center p-6 text-center"
              >
                <Trash2 className="w-8 h-8 text-red-500 mb-3" />
                <h4 className="text-sm font-black text-brand-dark mb-1">Delete this entry?</h4>
                <p className="text-xs text-gray-500 mb-4 font-medium">This action cannot be undone.</p>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setDeletingKnowledgeId(null)}
                    className="px-4 py-1.5 text-xs font-black text-gray-400 hover:text-brand-dark uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleDeleteKnowledge(entry.id)}
                    className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-black hover:bg-red-700 transition-all uppercase tracking-widest"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-sm text-gray-600 leading-relaxed line-clamp-4 font-medium">{entry.content}</p>
        </>
      )}
    </div>
  );
});

KnowledgeEntry.displayName = 'KnowledgeEntry';

export default function BotDetail() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState<any>(null);
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<{ id: string, type: 'info' | 'error', message: string, timestamp: string }[]>([]);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState<string | null>(null);
  const [deletingKnowledgeId, setDeletingKnowledgeId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [userProfile, setUserProfile] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [knowledgeInput, setKnowledgeInput] = useState('');
  const [isSavingKnowledge, setIsSavingKnowledge] = useState(false);

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

  useEffect(() => {
    setLogs([
      { id: '1', type: 'info', message: 'Bot engine initialized', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      { id: '2', type: 'info', message: 'Knowledge base loaded', timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString() },
      { id: '3', type: 'info', message: 'System check passed', timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString() },
      { id: '4', type: 'info', message: 'Ready for deployment', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
    ]);
  }, []);

  useEffect(() => {
    if (!botId) return;

    const fetchBot = async () => {
      const docRef = doc(db, 'bots', botId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.ownerId !== auth.currentUser?.uid) {
          navigate('/dashboard');
          return;
        }
        setBot(data);
      } else {
        navigate('/dashboard');
      }
    };

    fetchBot();

    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      }
    };
    fetchProfile();

    const q = query(collection(db, 'bots', botId, 'knowledge'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setKnowledge(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [botId, navigate]);

  useEffect(() => {
    if (bot && messages.length === 0) {
      const greeting = bot.greetingMessage || 'Hello! How can I help you today?';
      setMessages([{ role: 'bot', text: greeting }]);
      if (bot.voiceOutputEnabled) {
        speak(greeting, bot.voiceId, volume, () => setIsPlaying(true), () => setIsPlaying(false));
      }
    }
  }, [bot, messages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = (bot?.primaryLanguage === 'auto' || !bot?.primaryLanguage) ? 'en-US' : bot.primaryLanguage;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, [bot?.primaryLanguage]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const togglePlayback = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    const timestamp = new Date().toISOString();
    setLogs(prev => [{ id: Date.now().toString(), type: 'info' as const, message: `User message: "${userMsg.substring(0, 30)}..."`, timestamp: new Date().toISOString() }, ...prev].slice(0, 10));
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setSending(true);

    // Save to Firestore
    let currentSessionId = sessionId;
    try {
      if (!currentSessionId) {
        const initialMessages = [
          { role: 'bot', text: bot.greetingMessage || 'Hello! How can I help you today?', timestamp },
          { role: 'user', text: userMsg, timestamp }
        ];
        const sessionRef = await addDoc(collection(db, 'bots', botId!, 'chats'), {
          botId,
          userId: auth.currentUser?.uid,
          startedAt: timestamp,
          lastMessageAt: timestamp,
          messages: initialMessages
        });
        currentSessionId = sessionRef.id;
        setSessionId(currentSessionId);
      } else {
        await updateDoc(doc(db, 'bots', botId!, 'chats', currentSessionId), {
          lastMessageAt: timestamp,
          messages: arrayUnion({ role: 'user', text: userMsg, timestamp })
        });
      }
    } catch (err) {
      console.error("Error saving user message to history:", err);
    }

    const fullKnowledge = knowledge.map(k => k.content).join('\n\n');
    const botResponse = await generateBotResponse(userMsg, fullKnowledge, bot.personality, bot.customInstructions, bot.primaryLanguage);
    
    // Artificial delay based on responseSpeed setting
    const delay = bot.responseSpeed === 'instant' ? 0 : bot.responseSpeed === 'slow' ? 4000 : 1500;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const botTimestamp = new Date().toISOString();
    
    setLogs(prev => [{ id: Date.now().toString(), type: 'info' as const, message: 'Bot response generated', timestamp: new Date().toISOString() }, ...prev].slice(0, 10));
    setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    setSending(false);
    if (bot.voiceOutputEnabled) {
      speak(botResponse, bot.voiceId, volume, () => setIsPlaying(true), () => setIsPlaying(false));
    }

    // Update usage stats in Firestore
    try {
      const botRef = doc(db, 'bots', botId!);
      await updateDoc(botRef, {
        'usageStats.totalMessages': (bot.usageStats?.totalMessages || 0) + 2,
        'usageStats.userMessages': (bot.usageStats?.userMessages || 0) + 1,
        'usageStats.botMessages': (bot.usageStats?.botMessages || 0) + 1,
        'usageStats.lastActiveAt': botTimestamp
      });
    } catch (err) {
      console.error("Error updating usage stats:", err);
    }

    // Save bot response to Firestore
    if (currentSessionId) {
      try {
        await updateDoc(doc(db, 'bots', botId!, 'chats', currentSessionId), {
          lastMessageAt: botTimestamp,
          messages: arrayUnion({ role: 'bot', text: botResponse, timestamp: botTimestamp })
        });
      } catch (err) {
        console.error("Error saving bot response to history:", err);
      }
    }
  };

  const copySnippet = () => {
    const snippet = `<script src="${window.location.origin}/bot-widget.js" data-bot-id="${botId}"></script>`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddKnowledge = async () => {
    if (!knowledgeInput.trim() || !botId) return;
    setIsSavingKnowledge(true);
    try {
      await addDoc(collection(db, 'bots', botId, 'knowledge'), {
        botId,
        content: knowledgeInput.trim(),
        sourceUrl: 'manual',
        lastUpdated: new Date().toISOString()
      });
      setKnowledgeInput('');
      setIsAddingKnowledge(false);
    } catch (err) {
      console.error("Error adding knowledge:", err);
    } finally {
      setIsSavingKnowledge(false);
    }
  };

  const handleUpdateKnowledge = async (id: string) => {
    if (!knowledgeInput.trim() || !botId) return;
    setIsSavingKnowledge(true);
    try {
      await updateDoc(doc(db, 'bots', botId, 'knowledge', id), {
        content: knowledgeInput.trim(),
        lastUpdated: new Date().toISOString()
      });
      setKnowledgeInput('');
      setEditingKnowledgeId(null);
    } catch (err) {
      console.error("Error updating knowledge:", err);
    } finally {
      setIsSavingKnowledge(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!botId) return;
    try {
      await deleteDoc(doc(db, 'bots', botId, 'knowledge', id));
      setDeletingKnowledgeId(null);
    } catch (err) {
      console.error("Error deleting knowledge:", err);
    }
  };

  if (loading || !bot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
          <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] animate-pulse">Initializing Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <Link to="/dashboard" className="flex items-center text-gray-400 hover:text-brand-primary transition-all font-black text-[10px] uppercase tracking-widest group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex items-center space-x-4">
            <Link 
              to={`/bot/${botId}/settings`}
              className="p-3 glass rounded-2xl text-gray-400 hover:text-brand-primary transition-all border-none"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <Link 
              to={`/bot/${botId}/history`}
              className="p-3 glass rounded-2xl text-gray-400 hover:text-brand-primary transition-all border-none"
              title="View Chat History"
            >
              <History className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left: Bot Info & Snippet */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div variants={itemVariants} className="glass rounded-[2.5rem] p-8 relative overflow-hidden group border-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl flex items-center justify-center mb-6 text-white font-black text-3xl shadow-lg shadow-brand-primary/20 overflow-hidden"
                >
                  {bot.avatarUrl ? (
                    <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    bot.name?.[0]?.toUpperCase() || '?'
                  )}
                </motion.div>
                <h1 className="text-3xl font-black text-brand-dark mb-2 tracking-tight">{bot.name || 'Unnamed Bot'}</h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">{bot.companyName}</p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                    <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest ${
                      bot.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {bot.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Chats</span>
                    <span className="text-xl font-black text-brand-dark tracking-tighter">{bot.usageStats?.totalChats || 0}</span>
                  </div>
                </div>

                <Link 
                  to={`/bot/${botId}/history`}
                  className="btn-secondary w-full mt-8 py-4 text-xs"
                >
                  <History className="w-4 h-4 mr-2" />
                  View History
                </Link>
              </div>
            </motion.div>

            {/* Detailed Usage Statistics */}
            <motion.div 
              variants={itemVariants} 
              className="glass rounded-[2.5rem] p-8 space-y-8 border-none"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-brand-dark uppercase tracking-[0.2em]">Usage Analytics</h3>
                <TrendingUp className="w-4 h-4 text-brand-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <User className="w-3.5 h-3.5 text-brand-primary" />, label: 'User Msgs', value: bot.usageStats?.userMessages || 0 },
                  { icon: <Bot className="w-3.5 h-3.5 text-brand-secondary" />, label: 'Bot Msgs', value: bot.usageStats?.botMessages || 0 },
                  { icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />, label: 'Error Rate', value: bot.usageStats?.errorRate || '0%' },
                  { icon: <HeartPulse className="w-3.5 h-3.5 text-red-500" />, label: 'Health', value: bot.usageStats?.health || '100%' }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -4 }}
                    className="bg-white/50 rounded-2xl p-4 border border-white/20 hover:border-brand-primary/20 transition-all group/stat"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {stat.icon}
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <p className="text-xl font-black text-brand-dark tracking-tighter group-hover/stat:text-brand-primary transition-colors">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="pt-6 border-t border-brand-dark/5">
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  <span>Total Messages</span>
                  <span className="text-brand-primary text-sm tracking-tighter">
                    {(bot.usageStats?.userMessages || 0) + (bot.usageStats?.botMessages || 0)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* System Health */}
            <motion.div variants={itemVariants} className="glass rounded-[2.5rem] p-8 space-y-8 border-none">
              <h3 className="text-[10px] font-black text-brand-dark uppercase tracking-[0.2em]">System Health</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Bot Online</span>
                  </div>
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="flex items-center justify-between p-5 bg-white/50 rounded-2xl border border-white/20">
                  <div className="flex items-center space-x-3">
                    <Server className="w-4 h-4 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Server Status</span>
                  </div>
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{bot.usageStats?.serverStatus || 'Operational'}</span>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-brand-dark/5">
                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Activity Stream</h4>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                  {logs.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic text-center py-4 font-medium">No recent activity detected</p>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className={`p-3 rounded-xl border text-[9px] font-mono flex items-start space-x-3 transition-all hover:translate-x-1 ${
                        log.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white/50 border-white/20 text-gray-600'
                      }`}>
                        <span className="opacity-40 shrink-0 font-bold">{new Date(log.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}</span>
                        <span className="flex-grow truncate font-medium">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-brand-dark rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-primary/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Code className="text-brand-primary w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight">Deployment</h2>
                </div>
                <p className="text-gray-400 text-xs mb-8 leading-relaxed font-medium">
                  Embed this script into your website's header to activate the AI agent instantly.
                </p>
                <div className="bg-black/40 rounded-2xl p-5 mb-8 relative group border border-white/5">
                  <code className="text-brand-primary text-[10px] font-mono break-all leading-relaxed">
                    {`<script src="${window.location.origin}/bot-widget.js" data-bot-id="${botId}"></script>`}
                  </code>
                  <button 
                    onClick={copySnippet}
                    className="absolute top-3 right-3 p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <button 
                  onClick={() => setIsGuideOpen(true)}
                  className="w-full btn-primary py-4 text-xs"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Setup Guide
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right: Chat Preview */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div variants={itemVariants} className="glass rounded-[2.5rem] flex flex-col h-[700px] overflow-hidden border-none">
              <div className="p-8 border-b border-brand-dark/5 flex items-center justify-between bg-white/30 backdrop-blur-md">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-primary/20 overflow-hidden">
                    {bot.avatarUrl ? (
                      <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      bot.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-brand-dark tracking-tight">Live Preview</h3>
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center mt-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                      Agent Online
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {bot.voiceOutputEnabled && (
                    <div className="flex items-center space-x-4 bg-white/50 px-5 py-2.5 rounded-2xl border border-white/20">
                      <button
                        onClick={togglePlayback}
                        className={`p-2.5 rounded-xl transition-all ${
                          isPlaying 
                            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                            : 'bg-white text-gray-400 hover:text-brand-primary border border-gray-100'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      
                      <div className="flex items-center space-x-3">
                        {volume === 0 ? (
                          <VolumeX className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-gray-400" />
                        )}
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-brand-light/30 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <MessageSquare className="w-12 h-12 text-gray-300" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Start a conversation to test logic</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex items-end space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'bot' && (
                      <div className="w-10 h-10 rounded-xl bg-brand-primary flex-shrink-0 flex items-center justify-center text-white text-xs font-black overflow-hidden shadow-lg shadow-brand-primary/10">
                        {bot.avatarUrl ? (
                          <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          bot.name?.[0]?.toUpperCase() || '?'
                        )}
                      </div>
                    )}
                    <div className={`max-w-[80%] p-5 rounded-[1.5rem] text-sm font-medium shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-brand-primary text-white rounded-tr-none' 
                        : 'bg-white text-brand-dark border border-white/20 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {sending && (
                  <div className="flex justify-start items-end space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary flex-shrink-0 flex items-center justify-center text-white text-xs font-black overflow-hidden">
                      {bot.avatarUrl ? (
                        <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        bot.name?.[0]?.toUpperCase() || '?'
                      )}
                    </div>
                    <div className="bg-white p-5 rounded-[1.5rem] rounded-tl-none border border-white/20 shadow-sm">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-brand-primary/30 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-brand-primary/30 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-brand-primary/30 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {(userProfile?.subscription?.status !== 'premium' || bot.showPoweredBy) && (
                <div className="py-4 border-t border-brand-dark/5 bg-white/30 backdrop-blur-md flex items-center justify-center space-x-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Powered by</span>
                  <div className="flex items-center bg-white/50 px-3 py-1.5 rounded-xl border border-white/20 shadow-sm">
                    <Bot className="w-3.5 h-3.5 text-brand-primary mr-2" />
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Botub</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="p-8 bg-white/50 backdrop-blur-md border-t border-brand-dark/5 flex items-center space-x-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Ask anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full px-6 py-4 bg-white/80 border border-white/20 rounded-2xl focus:ring-2 focus:ring-brand-primary outline-none transition-all text-sm font-medium pr-12"
                  />
                  {bot.voiceEnabled && (
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                        isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-brand-primary'
                      }`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="p-4 bg-brand-primary text-white rounded-2xl hover:bg-brand-secondary disabled:opacity-50 transition-all shadow-lg shadow-brand-primary/20"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </motion.div>

            {/* Knowledge Base Section */}
            <motion.div variants={itemVariants} className="glass rounded-[2.5rem] p-8 border-none">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-brand-light rounded-2xl">
                    <BookOpen className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-brand-dark tracking-tight">Knowledge Base</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Training Data & Context</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsAddingKnowledge(!isAddingKnowledge);
                    setEditingKnowledgeId(null);
                    setKnowledgeInput('');
                  }}
                  className="p-3 bg-brand-primary text-white rounded-2xl hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20"
                >
                  {isAddingKnowledge ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              <AnimatePresence>
                {isAddingKnowledge && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8 overflow-hidden"
                  >
                    <div className="p-6 bg-brand-light rounded-[2rem] border border-brand-primary/10 space-y-4">
                      <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Add New Knowledge</h4>
                      <textarea
                        placeholder="Enter facts, instructions, or context for your bot..."
                        value={knowledgeInput}
                        onChange={(e) => setKnowledgeInput(e.target.value)}
                        className="w-full p-5 rounded-2xl bg-white border border-brand-primary/10 focus:ring-2 focus:ring-brand-primary outline-none transition-all text-sm min-h-[150px] font-medium"
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={handleAddKnowledge}
                          disabled={!knowledgeInput.trim() || isSavingKnowledge}
                          className="btn-primary py-3 px-8 text-xs"
                        >
                          {isSavingKnowledge ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Knowledge
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {knowledge.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-brand-light/50 rounded-[2rem] border border-dashed border-gray-200">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No knowledge entries yet</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Add some context to help your bot learn.</p>
                  </div>
                ) : (
                  knowledge.map((entry) => (
                    <KnowledgeEntry 
                      key={entry.id}
                      entry={entry}
                      editingKnowledgeId={editingKnowledgeId}
                      deletingKnowledgeId={deletingKnowledgeId}
                      knowledgeInput={knowledgeInput}
                      setKnowledgeInput={setKnowledgeInput}
                      setEditingKnowledgeId={setEditingKnowledgeId}
                      setDeletingKnowledgeId={setDeletingKnowledgeId}
                      handleUpdateKnowledge={handleUpdateKnowledge}
                      handleDeleteKnowledge={handleDeleteKnowledge}
                      isSavingKnowledge={isSavingKnowledge}
                      setIsAddingKnowledge={setIsAddingKnowledge}
                    />
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <IntegrationGuide 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
        botId={botId || ''} 
      />
    </div>
  );
}
