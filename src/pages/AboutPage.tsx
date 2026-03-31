import React from 'react';
import { motion } from 'motion/react';
import { Bot, Sparkles, Zap, Shield, Globe, Users, MessageSquare, Brain } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutPage() {
  const stats = [
    { label: 'Active Bots', value: '10k+', icon: Bot },
    { label: 'Messages Sent', value: '5M+', icon: MessageSquare },
    { label: 'Happy Users', value: '2k+', icon: Users },
    { label: 'Uptime', value: '99.9%', icon: Shield },
  ];

  const features = [
    {
      title: 'Advanced AI Brain',
      description: 'Powered by the latest Gemini models, our bots understand context, sentiment, and complex queries with human-like precision.',
      icon: Brain,
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Multi-Platform Integration',
      description: 'Deploy your bot anywhere—your website, Telegram, WhatsApp, or Instagram—with a single click.',
      icon: Globe,
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      title: 'Lightning Fast Responses',
      description: 'Our optimized infrastructure ensures your customers never wait. Instant responses lead to higher satisfaction.',
      icon: Zap,
      color: 'bg-amber-50 text-amber-600'
    },
    {
      title: 'Knowledge Base Learning',
      description: 'Upload documents or link your website. Your bot learns your business in seconds and provides accurate answers.',
      icon: Sparkles,
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.05),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest mb-6"
            >
              Our Mission
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-black text-gray-900 mb-8 tracking-tighter leading-tight"
            >
              Democratizing <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI for Everyone</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-500 leading-relaxed"
            >
              We believe every business, regardless of size, should have access to world-class AI technology. Botub was built to make bot creation as simple as writing a text.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">What Makes Us Different</h2>
            <p className="text-gray-500 max-w-2xl mx-auto font-medium">
              We've combined cutting-edge technology with an intuitive interface to give you the best bot-building experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-6"
              >
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 ${feature.color}`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black mb-8 tracking-tighter">Built by Visionaries</h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Our team consists of AI researchers, designers, and engineers who are passionate about the future of human-computer interaction. We're constantly pushing the boundaries of what's possible with conversational AI.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  <span className="text-gray-300 font-medium">Headquartered in Silicon Valley</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  <span className="text-gray-300 font-medium">Remote-first culture with global talent</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  <span className="text-gray-300 font-medium">Backed by leading tech investors</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img src="https://picsum.photos/seed/team1/400/500" alt="Team member" className="rounded-[2rem] w-full h-64 object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                <img src="https://picsum.photos/seed/team2/400/400" alt="Team member" className="rounded-[2rem] w-full h-48 object-cover grayscale hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="space-y-4 pt-8">
                <img src="https://picsum.photos/seed/team3/400/400" alt="Team member" className="rounded-[2rem] w-full h-48 object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                <img src="https://picsum.photos/seed/team4/400/500" alt="Team member" className="rounded-[2rem] w-full h-64 object-cover grayscale hover:grayscale-0 transition-all duration-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
