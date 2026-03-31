import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { 
  ArrowLeft, 
  MessageSquare, 
  Calendar, 
  User, 
  Bot as BotIcon,
  ChevronRight,
  Loader2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatHistory() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);

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
      }
    };

    fetchBot();

    const q = query(
      collection(db, 'bots', botId, 'chats'),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(sessionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [botId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to={`/bot/${botId}`} className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors font-medium">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Bot
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Chat History</h1>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Sessions List */}
          <div className="lg:col-span-1 space-y-4">
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                Recent Sessions
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {sessions.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No chat history found.</p>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full text-left p-4 rounded-2xl transition-all border ${
                        selectedSession?.id === session.id
                          ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                          : 'bg-white border-gray-50 hover:border-indigo-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          {new Date(session.lastMessageAt).toLocaleDateString()}
                        </span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedSession?.id === session.id ? 'rotate-90 text-indigo-600' : 'text-gray-300'}`} />
                      </div>
                      <p className="text-sm font-bold text-gray-900 truncate mb-1">
                        {session.messages?.[session.messages.length - 1]?.text || 'No messages'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(session.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Session Detail */}
          <div className="lg:col-span-2">
            <motion.div variants={itemVariants}>
              <AnimatePresence mode="wait">
              {selectedSession ? (
                <motion.div
                  key={selectedSession.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[700px] overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100 bg-white flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Session Details</h3>
                        <p className="text-xs text-gray-400">
                          {new Date(selectedSession.startedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Messages</p>
                      <p className="text-lg font-bold text-indigo-600">{selectedSession.messages?.length || 0}</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
                    {selectedSession.messages?.map((msg: any, idx: number) => (
                      <div 
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mb-1 ${
                            msg.role === 'user' ? 'bg-indigo-100 text-indigo-600 ml-2' : 'bg-white border border-gray-100 text-gray-400 mr-2'
                          }`}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <BotIcon className="w-4 h-4" />}
                          </div>
                          <div className={`p-4 rounded-2xl text-sm shadow-sm ${
                            msg.role === 'user' 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                          }`}>
                            {msg.text}
                            <div className={`text-[9px] mt-2 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm h-[700px] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6">
                    <MessageSquare className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Session</h3>
                  <p className="text-gray-500 max-w-xs">
                    Choose a chat session from the list on the left to view the full conversation history.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  </div>
);
}
