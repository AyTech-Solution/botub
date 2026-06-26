import React, { useState, useEffect, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { 
  Bot, 
  Plus, 
  Settings, 
  Activity, 
  MessageSquare, 
  Crown, 
  Calendar, 
  MapPin,
  ChevronRight,
  BarChart3,
  Filter,
  Code2,
  User as UserIcon,
  LogOut,
  ExternalLink,
  Search,
  Grid,
  List as ListIcon,
  Loader2,
  Zap,
  Clock,
  AlertTriangle,
  TrendingUp,
  ThumbsUp
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

const ConfigAlert = memo(() => {
  return null;
});

ConfigAlert.displayName = 'ConfigAlert';

// Memoized Bot Card for performance
const BotCard = memo(({ bot, viewMode, itemVariants }: { bot: any, viewMode: 'grid' | 'list', itemVariants: any }) => {
  if (viewMode === 'grid') {
    return (
      <motion.div 
        variants={itemVariants}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -8 }}
        className="p-6 md:p-8 glass rounded-[2rem] md:rounded-[2.5rem] hover:shadow-2xl hover:shadow-brand-primary/10 transition-all group relative overflow-hidden border-none"
      >
        {/* Hover Overlay Actions */}
        <div className="absolute inset-0 bg-brand-dark/95 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-8 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-2">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <Link 
            to={`/bot/${bot.id}`}
            className="w-48 py-4 bg-white text-brand-dark rounded-2xl font-black text-sm flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Activity className="w-4 h-4 mr-2" />
            View Details
          </Link>
          <Link 
            to={`/bot/${bot.id}/settings`}
            className="w-48 py-4 bg-brand-primary text-white rounded-2xl font-black text-sm flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
        </div>
        
        <div className="relative">
          <div className="flex items-start justify-between mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand-primary/20 overflow-hidden">
              {bot.avatarUrl ? (
                <img 
                  src={bot.avatarUrl} 
                  alt={bot.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              ) : (
                bot.name?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
              bot.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {bot.status}
            </span>
          </div>

          <div className="mb-8">
            <h4 className="text-xl font-black text-brand-dark group-hover:text-brand-primary transition-colors tracking-tight">{bot.name}</h4>
            <p className="text-sm text-gray-400 font-bold mt-1 uppercase tracking-widest text-[10px]">{bot.companyName || 'No Company'}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center mb-1">
                <MessageSquare className="w-3 h-3 mr-1.5 text-brand-primary" />
                Chats
              </span>
              <span className="text-xl font-black text-brand-dark tracking-tighter">{bot.usageStats?.totalChats || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center mb-1">
                <TrendingUp className="w-3 h-3 mr-1.5 text-emerald-500" />
                Msgs
              </span>
              <span className="text-xl font-black text-brand-dark tracking-tighter">{bot.usageStats?.totalMessages || 0}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-50">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter flex items-center">
                <Calendar className="w-2.5 h-2.5 mr-1" />
                Created
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                {bot.createdAt ? (
                  typeof bot.createdAt.toDate === 'function' 
                    ? formatDistanceToNow(bot.createdAt.toDate(), { addSuffix: true })
                    : formatDistanceToNow(new Date(bot.createdAt), { addSuffix: true })
                ) : 'Recently'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Link 
                to={`/bot/${bot.id}/settings`}
                className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-primary transition-colors group/link"
              >
                <Settings className="w-3.5 h-3.5 mr-2 group/link:rotate-90 transition-transform" />
                Configure
              </Link>
              <Link 
                to={`/bot/${bot.id}`} 
                className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={itemVariants}
      layout
      className="flex items-center justify-between p-6 glass rounded-[2rem] hover:shadow-xl transition-all group border-none"
    >
      <div className="flex items-center space-x-6">
        <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center text-brand-primary font-black overflow-hidden shadow-inner">
          {bot.avatarUrl ? (
            <img 
              src={bot.avatarUrl} 
              alt={bot.name} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            bot.name?.[0]?.toUpperCase() || '?'
          )}
        </div>
        <div>
          <h4 className="font-black text-brand-dark tracking-tight">{bot.name}</h4>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{bot.companyName}</p>
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-tight mt-1 flex items-center">
            <Clock className="w-2.5 h-2.5 mr-1" />
            {bot.createdAt ? (
              typeof bot.createdAt.toDate === 'function' 
                ? formatDistanceToNow(bot.createdAt.toDate(), { addSuffix: true })
                : formatDistanceToNow(new Date(bot.createdAt), { addSuffix: true })
            ) : 'Recently Created'}
          </p>
        </div>
      </div>
      <div className="hidden md:flex items-center space-x-12">
        <div className="text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Chats</p>
          <p className="font-black text-brand-dark tracking-tighter">{bot.usageStats?.totalChats || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Messages</p>
          <p className="font-black text-brand-dark tracking-tighter">{bot.usageStats?.totalMessages || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
          <span className={`text-[10px] font-black uppercase tracking-widest ${bot.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`}>
            {bot.status}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Link 
          to={`/bot/${bot.id}/settings`} 
          className="p-3 text-gray-400 hover:text-brand-primary hover:bg-brand-light rounded-xl transition-all"
        >
          <Settings className="w-5 h-5" />
        </Link>
        <Link 
          to={`/bot/${bot.id}`} 
          className="btn-primary py-3 px-6 text-xs"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
});

BotCard.displayName = 'BotCard';

export default function Dashboard() {
  const [bots, setBots] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('Detecting...');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

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
    if (!auth.currentUser) return;

    // Fetch user profile
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const path = `users/${auth.currentUser.uid}`;
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    };
    fetchProfile();

    // Fetch bots
    const botsPath = 'bots';
    const q = query(collection(db, 'bots'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const botsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBots(botsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, botsPath);
    });

    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
            const data = await res.json();
            setLocation(`${data.city}, ${data.countryName}`);
          } catch (e) {
            setLocation('Location unavailable');
          }
        },
        () => setLocation('Permission denied')
      );
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userProfile?.displayName && !sessionStorage.getItem('hasWelcomedDashboard')) {
      sessionStorage.setItem('hasWelcomedDashboard', 'true');
    }
  }, [userProfile]);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n?.[0] || '').join('').toUpperCase() || 'U';
  };

  const filteredBots = bots.filter(bot => {
    const matchesStatus = statusFilter === 'all' ? true : bot.status === statusFilter;
    const matchesSearch = bot.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         bot.companyName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 md:mb-16 gap-6 md:gap-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-brand-dark tracking-tighter leading-tight">
              Welcome, <span className="text-brand-primary">{userProfile?.displayName?.split(' ')[0] || 'User'}</span> 👋
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <span className="flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
                <Calendar className="w-3.5 h-3.5 mr-2 text-brand-primary" /> 
                <span className="hidden sm:inline">{format(new Date(), 'EEEE, ')}</span>
                {format(new Date(), 'MMMM do')}
              </span>
              <span className="flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
                <MapPin className="w-3.5 h-3.5 mr-2 text-brand-secondary" /> 
                {location}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/integration-guide"
              className="flex-1 md:flex-none flex items-center justify-center bg-indigo-50 text-indigo-600 px-4 py-3 rounded-xl shadow-sm border border-indigo-100 hover:bg-indigo-100 transition-colors text-xs font-black uppercase tracking-widest"
            >
              <Code2 className="w-4 h-4 mr-2" /> 
              Guide
            </Link>
            <Link 
              to="/create-bot"
              className="flex-1 md:flex-none btn-primary py-3 px-6 text-xs"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Bot
            </Link>
          </div>
        </div>

        <ConfigAlert />

        {/* Stats Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-12 md:mb-16"
        >
          {[
            { 
              label: 'Bots', 
              value: bots?.length || 0,
              icon: <Bot className="w-5 h-5" />, 
              color: 'bg-brand-primary text-white', 
              trend: 'Live'
            },
            { label: 'Msgs', value: (bots || []).reduce((acc, b) => acc + (b.usageStats?.totalMessages || 0), 0), icon: <TrendingUp className="w-5 h-5" />, color: 'bg-emerald-500 text-white', trend: '+8%' },
            { 
              label: 'Avg Latency', 
              value: bots?.length > 0 
                ? (bots.reduce((acc, b) => acc + parseFloat(b.usageStats?.avgResponseTime?.replace('s', '') || '1.2'), 0) / bots.length).toFixed(1) + 's' 
                : '1.2s', 
              icon: <Clock className="w-5 h-5" />, 
              color: 'bg-indigo-500 text-white', 
              trend: 'Fast' 
            },
            { 
              label: 'Satisfaction', 
              value: bots?.length > 0 
                ? (bots.reduce((acc, b) => acc + parseFloat(b.usageStats?.satisfactionRating?.split('/')[0] || '4.8'), 0) / bots.length).toFixed(1) + '/5' 
                : '4.8/5', 
              icon: <ThumbsUp className="w-5 h-5" />, 
              color: 'bg-amber-500 text-white', 
              trend: 'Good' 
            },
          ].map((stat, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              className="glass p-5 md:p-8 rounded-3xl group relative overflow-hidden border-none"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 md:mb-8">
                  <div className={stat.color + " w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"}>
                    {React.cloneElement(stat.icon as React.ReactElement, { className: "w-4 h-4 md:w-6 md:h-6" } as any)}
                  </div>
                </div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-2xl md:text-4xl font-black text-brand-dark tracking-tighter">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search and Filters Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 flex flex-col md:flex-row gap-4 items-center"
        >
          <div className="relative flex-1 w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search bots by name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-12 py-4 bg-white border-2 border-transparent rounded-2xl md:rounded-[1.5rem] text-sm font-bold text-brand-dark placeholder-gray-400 focus:ring-0 focus:border-brand-primary shadow-lg shadow-gray-200/50 transition-all outline-none"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-brand-primary transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 md:w-40 px-4 py-4 bg-white border-2 border-transparent rounded-2xl md:rounded-[1.5rem] text-[10px] font-black text-brand-dark uppercase tracking-widest focus:ring-0 focus:border-brand-primary outline-none appearance-none cursor-pointer shadow-lg shadow-gray-200/50 transition-all text-center"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive</option>
            </select>

            <div className="flex bg-white p-1 rounded-2xl shadow-lg shadow-gray-200/50 border-2 border-transparent">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-400 hover:text-brand-primary'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-400 hover:text-brand-primary'}`}
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bots Area */}
        <div className="glass rounded-[2rem] md:rounded-[3rem] overflow-hidden border-none">
          <div className="p-6 md:p-10 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-black text-brand-dark tracking-tight">Your Bots</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-brand-primary bg-brand-light px-3 py-1.5 rounded-full uppercase tracking-widest">
                {filteredBots?.length || 0} Total
              </span>
            </div>
          </div>

          <div className="p-6 md:p-10">
            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
              </div>
            ) : filteredBots.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto bg-gradient-to-br from-brand-primary to-brand-secondary rounded-[3rem] p-12 text-white shadow-2xl shadow-brand-primary/30 relative overflow-hidden mb-16 group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-bl-[12rem] -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 mx-auto">
                      <Zap className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-black mb-4 tracking-tighter">Botub Pro</h3>
                    <p className="text-brand-light/80 text-base mb-10 font-medium">
                      Deploy our specialized SLM engine for high-performance business automation.
                    </p>
                    <Link 
                      to="/create-bot"
                      className="inline-flex items-center px-10 py-4 bg-white text-brand-primary rounded-2xl font-black hover:bg-brand-light transition-all shadow-xl"
                    >
                      Deploy Botub Bot
                      <Plus className="w-5 h-5 ml-2" />
                    </Link>
                  </div>
                </div>

                <div className="w-28 h-28 bg-brand-light rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-brand-primary/20">
                  <Bot className="w-14 h-14" />
                </div>
                <h3 className="text-3xl font-black text-brand-dark mb-4 tracking-tight">
                  {searchQuery || statusFilter !== 'all' ? 'No matches found' : 'Create Your First Bot'}
                </h3>
                <p className="text-gray-400 mb-12 max-w-sm mx-auto font-medium">
                  {searchQuery || statusFilter !== 'all'
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "You haven't created any bots yet. Start by setting up your first AI assistant to automate your business."}
                </p>
                {searchQuery || statusFilter !== 'all' ? (
                  <button 
                    onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                    className="btn-secondary"
                  >
                    Clear All Filters
                  </button>
                ) : (
                  <Link 
                    to="/create-bot"
                    className="btn-primary"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Get Started
                  </Link>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredBots.map((bot) => (
                    <BotCard 
                      key={bot.id} 
                      bot={bot} 
                      viewMode="grid" 
                      itemVariants={itemVariants} 
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredBots.map((bot) => (
                    <BotCard 
                      key={bot.id} 
                      bot={bot} 
                      viewMode="list" 
                      itemVariants={itemVariants} 
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2 pointer-events-none">
        <div className="bg-brand-dark/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 flex items-center justify-around shadow-2xl pointer-events-auto">
          <Link to="/dashboard" className="flex flex-col items-center p-3 text-white">
            <Grid className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-widest">Dash</span>
          </Link>
          <Link to="/create-bot" className="flex flex-col items-center p-4 bg-brand-primary rounded-2xl text-white shadow-lg -translate-y-6">
            <Plus className="w-6 h-6" />
          </Link>
          <Link to="/account-settings" className="flex flex-col items-center p-3 text-white/60">
            <UserIcon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-widest">Me</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
