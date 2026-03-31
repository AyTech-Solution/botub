import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { generateBotResponse } from '../services/geminiService';
import { speak } from '../services/ttsService';
import { 
  Send, 
  User, 
  Bot, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Loader2,
  Sparkles,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export default function WidgetPage() {
  const { botId } = useParams();
  const [bot, setBot] = useState<any>(null);
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && bot) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = (bot.primaryLanguage === 'auto' || !bot.primaryLanguage) ? 'en-US' : bot.primaryLanguage;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        // Automatically send after voice input
        setTimeout(() => handleSend(), 500);
      };
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, [bot]);

  useEffect(() => {
    if (!botId) return;

    const fetchBot = async () => {
      try {
        const botRef = doc(db, 'bots', botId);
        const botSnap = await getDoc(botRef);
        if (botSnap.exists()) {
          const botData = botSnap.data();
          setBot(botData);
          
          // Fetch knowledge
          const qKnowledge = query(collection(db, 'bots', botId, 'knowledge'));
          const unsubscribeKnowledge = onSnapshot(qKnowledge, (snapshot) => {
            const knowledgeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setKnowledge(knowledgeData);
          });

          // Add initial greeting
          setMessages([{
            id: 'greeting',
            role: 'bot',
            content: botData.greetingMessage || `Hello! I'm ${botData.name}. How can I help you today?`,
            timestamp: new Date().toISOString()
          }]);

          return () => unsubscribeKnowledge();
        } else {
          setError('Bot not found');
        }
      } catch (err: any) {
        setError('Failed to load bot');
      }
    };

    fetchBot();
  }, [botId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading || !bot) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const fullKnowledge = knowledge.map(k => k.content).join('\n\n') || `
        Company: ${bot.companyName || 'N/A'}
        Details: ${bot.companyDetails || 'N/A'}
        Links: ${bot.links?.join(', ') || 'N/A'}
      `;
      
      const response = await generateBotResponse(
        input, 
        fullKnowledge, 
        bot.personality || 'friendly', 
        bot.customInstructions || '', 
        bot.primaryLanguage || 'auto'
      );
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);

      if (isSpeaking && bot.voiceOutputEnabled) {
        speak(response, bot.voiceId);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-white p-6 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-900 leading-tight">{bot.name}</h1>
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Always Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setIsSpeaking(!isSpeaking)}
            className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'bg-white text-gray-800 shadow-sm border border-gray-100'
            }`}>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <div className={`text-[10px] mt-1.5 font-bold ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <div className="flex-grow relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all outline-none text-sm font-medium pr-10"
            />
            {bot.voiceEnabled && (
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                  isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:text-indigo-600'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="mt-2 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center">
            Powered by <Sparkles className="w-3 h-3 mx-1 text-indigo-400" /> Botub
          </p>
        </div>
      </div>
    </div>
  );
}
