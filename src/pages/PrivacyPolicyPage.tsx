import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Shield className="text-indigo-600 w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-gray-500">Last updated: March 26, 2026</p>
        </div>

        <div className="prose prose-indigo max-w-none space-y-12">
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <FileText className="text-indigo-600 w-4 h-4" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">Introduction</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              At Botub, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information and the data your AI bots process. By using our service, you agree to the practices described in this policy.
            </p>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Lock className="text-indigo-600 w-4 h-4" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">Data Collection</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              We collect information you provide directly to us, such as when you create an account, build a bot, or contact support. This includes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
              <li>Name and contact information</li>
              <li>Business/Company details</li>
              <li>Website URLs for AI analysis</li>
              <li>Chat logs and interaction data (for bot training and analytics)</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Eye className="text-indigo-600 w-4 h-4" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">How We Use Your Data</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Your data is used to provide and improve our AI services. We do not sell your personal information to third parties. We use your data to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
              <li>Train and refine your custom AI bots</li>
              <li>Provide analytics on bot performance</li>
              <li>Communicate with you about service updates</li>
              <li>Ensure the security and integrity of our platform</li>
            </ul>
          </section>

          <section className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Security Measures</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              We implement industry-standard security measures, including encryption at rest and in transit, to protect your data. Our integration snippets include anti-edit protection to prevent unauthorized tampering with your bot's behavior.
            </p>
          </section>

          <section className="text-center pt-12 border-t border-gray-100">
            <p className="text-gray-500 text-sm">
              If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@botifyai.com" className="text-indigo-600 font-bold hover:underline">privacy@botifyai.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
