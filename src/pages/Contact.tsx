import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Mail, MessageSquare, Phone, Globe, MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("Message sent successfully! We'll get back to you soon.");
    }, 1500);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-full mb-4"
          >
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Connect with Us</span>
          </motion.div>
          <h1 className="text-4xl font-black text-gray-900 sm:text-5xl tracking-tight mb-4">
            How can we <span className="text-indigo-600">help you?</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500">
            Have questions about Botub AI? Need help setting up your first bot? 
            Our team is here to support your automation journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
          >
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 mb-8">Thank you for reaching out. We usually respond within 24 hours.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <input
                      required
                      type="email"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Billing & Subscription</option>
                    <option>Feature Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Globe className="w-5 h-5 mr-2" />
                    </motion.div>
                  ) : <Send className="w-5 h-5 mr-2" />}
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 lg:pl-12"
          >
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Email us at</p>
                    <p className="text-gray-500">support@botub.ai</p>
                    <p className="text-xs text-indigo-600 font-medium mt-1">Response time: &lt; 24h</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Call us</p>
                    <p className="text-gray-500">+1 (555) 000-0000</p>
                    <p className="text-xs text-indigo-600 font-medium mt-1">Mon - Fri, 9am - 6pm EST</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Headquarters</p>
                    <p className="text-gray-500">123 AI Boulevard, Tech City, SF 94105</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-3xl p-8 text-white">
              <h4 className="text-xl font-bold mb-2">Live Support?</h4>
              <p className="text-indigo-100 mb-6 text-sm">
                Chat with our own Botub AI assistant for instant answers to common questions.
              </p>
              <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                Open Support Chat
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
