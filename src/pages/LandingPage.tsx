import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bot, Zap, Shield, Globe, MessageSquare, BarChart3, ArrowRight, Volume2, Send, MessageCircle, Instagram } from 'lucide-react';
import { speak } from '../services/ttsService';
import { auth } from '../firebase';

export default function LandingPage() {
  const [hasSpoken, setHasSpoken] = useState(false);

  useEffect(() => {
    const welcomeUser = async () => {
      // Only speak if not logged in and hasn't spoken yet
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user && !hasSpoken) {
          // Try to speak. Browsers might block this until first interaction.
          const success = await speak("Welcome to Botub. Please login or signup to start building your intelligent custom bots.");
          if (success) setHasSpoken(true);
        }
      });
      return () => unsubscribe();
    };

    welcomeUser();
  }, [hasSpoken]);

  // Fallback: Speak on first click if it hasn't spoken yet
  const handleFirstInteraction = () => {
    if (!hasSpoken && !auth.currentUser) {
      speak("Welcome to Botub. Please login or signup to start building your intelligent custom bots.");
      setHasSpoken(true);
    }
  };

  return (
    <div className="bg-brand-light" onClick={handleFirstInteraction}>
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden min-h-screen flex items-center">
        {/* Video Background Animation */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105"
          >
            <source 
              src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-connections-background-4000-large.mp4" 
              type="video/mp4" 
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-brand-light/90 via-brand-light/40 to-brand-light"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="inline-flex items-center px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] bg-brand-primary/10 text-brand-primary mb-10 border border-brand-primary/20">
                <Zap className="w-3.5 h-3.5 mr-2.5 fill-brand-primary" />
                The Future of Support
              </span>
              <h1 className="text-6xl md:text-8xl font-black text-brand-dark tracking-tighter mb-10 leading-[0.9]">
                Intelligent <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Custom Bots</span>
              </h1>
              <p className="max-w-2xl mx-auto text-xl text-gray-500 mb-14 leading-relaxed font-medium">
                Botub empowers your business with next-gen AI assistants. 
                Train them on your data, deploy in minutes, and scale your support 24/7.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to="/auth" className="btn-primary group">
                  Start Building Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#features" className="btn-secondary">
                  View Features
                </a>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-brand-secondary/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
      </section>

      {/* Platforms Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-sm font-black text-brand-primary uppercase tracking-[0.3em] mb-4">Omnichannel Presence</h2>
            <h3 className="text-4xl md:text-5xl font-black text-brand-dark tracking-tight">Deploy Everywhere</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Globe className="w-8 h-8" />, name: "Website", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: <Send className="w-8 h-8" />, name: "Telegram", color: "text-sky-600", bg: "bg-sky-50" },
              { icon: <MessageCircle className="w-8 h-8" />, name: "WhatsApp", color: "text-green-600", bg: "bg-green-50" },
              { icon: <Instagram className="w-8 h-8" />, name: "Instagram", color: "text-pink-600", bg: "bg-pink-50" },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col items-center p-10 glass rounded-[2.5rem] hover:scale-105 transition-all cursor-default"
              >
                <div className={`w-20 h-20 ${p.bg} ${p.color} rounded-3xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform shadow-sm`}>
                  {p.icon}
                </div>
                <span className="font-black text-brand-dark uppercase tracking-widest text-xs">{p.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Features Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-sm font-black text-brand-primary uppercase tracking-[0.3em] mb-4">Core Capabilities</h2>
            <h3 className="text-4xl md:text-5xl font-black text-brand-dark tracking-tight">Built for Performance</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Website Analysis",
                description: "Simply provide your URL and our AI will extract knowledge base automatically.",
                className: "md:col-span-2"
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Secure Integration",
                description: "Unique HTML/JS snippets with anti-edit protection."
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Real-time Analytics",
                description: "Track bot health, usage stats, and customer satisfaction."
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Custom Training",
                description: "Manually add company details or upload documents to refine bot knowledge.",
                className: "md:col-span-2"
              },
              {
                icon: <Bot className="w-6 h-6" />,
                title: "AI Avatars",
                description: "Personalize your bot with AI-generated avatars."
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Instant Deployment",
                description: "Go live in minutes with our streamlined engine.",
                className: "md:col-span-2"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`bento-card ${feature.className || ''}`}
              >
                <div className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mb-8">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-brand-dark mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium">{feature.description}</p>
                
                {/* Decorative background pattern */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-dark rounded-[4rem] p-16 md:p-32 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-7xl font-black mb-10 tracking-tighter text-white">
                Ready to scale <br />
                <span className="text-brand-primary">your business?</span>
              </h2>
              <p className="text-gray-400 text-xl mb-16 max-w-2xl mx-auto font-medium">
                Join thousands of businesses already using Botub to transform their customer engagement.
              </p>
              <Link to="/auth" className="btn-primary shadow-2xl shadow-brand-primary/40">
                Get Started for Free
              </Link>
            </div>
            
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/20 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-secondary/20 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
              <Bot className="w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter text-brand-dark">Botub</span>
          </div>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
            © 2026 Botub. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="https://www.instagram.com/aytech_solution/" className="text-gray-400 hover:text-brand-primary transition-colors"><Instagram className="w-5 h-5" /></a>
            <a href="https://wa.me/917742065298?text=Hello%20*Botub*!" className="text-gray-400 hover:text-brand-primary transition-colors"><MessageCircle className="w-5 h-5" /></a>
            <a href="https://botub,vercel.app/auth/" className="text-gray-400 hover:text-brand-primary transition-colors"><Send className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
