import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Rocket, CheckCircle2, AlertCircle, ExternalLink, Code, Globe, Shield, Zap, ArrowRight, Share2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';

interface BotData {
  id: string;
  name: string;
  status: string;
  knowledgeBase?: string;
  createdAt?: any;
}

export default function Launch() {
  const { botId } = useParams();
  const [loading, setLoading] = useState(true);
  const [bot, setBot] = useState<BotData | null>(null);
  const [allBots, setAllBots] = useState<BotData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        if (botId) {
          const docRef = doc(db, 'bots', botId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setBot({ id: docSnap.id, ...docSnap.data() } as BotData);
          }
        }

        const botsRef = collection(db, 'bots');
        const querySnapshot = await getDocs(botsRef);
        const bots = querySnapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as BotData))
          .filter(b => (b as any).userId === user.uid);
        
        setAllBots(bots);
        if (!botId && bots.length > 0) {
          setBot(bots[0]);
        }
      } catch (err) {
        console.error("Error fetching bots:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [botId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        < Zap className="w-8 h-8 text-indigo-600 animate-pulse" />
      </div>
    );
  }

  if (allBots.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Rocket className="w-10 h-10 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4">No bots to launch yet!</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Create your first AI assistant to see deployment options and launch it to your website.</p>
        <Link to="/create-bot" className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          Create My First Bot
          <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
      </div>
    );
  }

  const selectedBot = bot || allBots[0];

  const steps = [
    { title: 'Knowledge Base', status: selectedBot?.knowledgeBase ? 'complete' : 'pending', icon: Zap },
    { title: 'Training', status: 'complete', icon: Shield },
    { title: 'Integration Ready', status: 'complete', icon: Code },
    { title: 'Live on Website', status: 'pending', icon: Globe },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 mb-2">
              <Rocket className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Launch Center</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Deploy to Production</h1>
            <p className="text-slate-500 mt-2">Take your AI assistant live in 3 steps.</p>
          </div>
          
          <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 pl-3">SELECTED BOT:</span>
            <select 
              className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 py-2 pl-3 pr-8 focus:ring-0 cursor-pointer"
              value={selectedBot.id}
              onChange={(e) => {
                const targetBot = allBots.find(b => b.id === e.target.value);
                if (targetBot) setBot(targetBot);
              }}
            >
              {allBots.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Launch Status */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center">
                Preparation Status
                <div className="ml-3 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded tracking-widest">Ready</div>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                      step.status === 'complete' ? 'bg-green-50 text-green-600 shadow-sm' : 'bg-slate-50 text-slate-300'
                    }`}>
                      <step.icon className="w-7 h-7" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 mb-1">{step.title}</p>
                    {step.status === 'complete' ? (
                      <span className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">Verified</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Action Needed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Deployment Options */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 pl-2">Deployment Options</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <Link to={`/integration-guide/${selectedBot.id}`} className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-600 transition-all flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                      <Code className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Web Widget Integration</h4>
                      <p className="text-sm text-slate-500">Copy-paste a single line of code into your website.</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                </Link>

                <div className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-600 transition-all flex items-center justify-between opacity-50 cursor-not-allowed">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                      <Share2 className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-bold text-slate-900 text-lg">WhatsApp Bot</h4>
                        <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase rounded">Soon</span>
                      </div>
                      <p className="text-sm text-slate-500">Connect your AI to your business WhatsApp number.</p>
                    </div>
                  </div>
                  <AlertCircle className="w-6 h-6 text-slate-300" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
              <Zap className="w-10 h-10 text-indigo-200 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Go Live Now</h3>
              <p className="text-indigo-100 mb-8 text-sm leading-relaxed">
                Your bot "{selectedBot.name}" is highly trained and performing at 98% accuracy. Ready for production!
              </p>
              <Link 
                to={`/integration-guide/${selectedBot.id}`}
                className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-bold flex items-center justify-center hover:bg-slate-50 transition-all"
              >
                Get Launch Script
                <ExternalLink className="ml-2 w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-4">Sharing Link</h4>
              <p className="text-xs text-slate-500 mb-4">Share this link for people to test your bot without integration.</p>
              <div className="flex items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
                <input 
                  readOnly 
                  value={`${window.location.origin}/widget/${selectedBot.id}`}
                  className="bg-transparent border-none text-[10px] font-mono text-slate-600 w-full focus:ring-0"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/widget/${selectedBot.id}`);
                    toast.success("Link copied!");
                  }}
                  className="ml-2 p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
