import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Github, Twitter, Linkedin, Instagram } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <Logo className="w-8 h-8" />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Empowering businesses with intelligent custom bots. Transform your customer engagement with AI-driven solutions.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6">Product</h3>
            <ul className="space-y-4">
              <li><Link to="/#features" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Features</Link></li>
              <li><Link to="/auth" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Pricing</Link></li>
              <li><Link to="/dashboard" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Bot Engine</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6">Company</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6">Social</h3>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/aytech_solution/" target="_blank" 
  rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-600 transition-colors"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-xs mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Botub. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <span className="text-gray-400 text-xs">Developer: <span className="text-gray-600 font-medium">Aayush Kumar</span></span>
            <span className="text-gray-400 text-xs">Designed by: <span className="text-gray-600 font-medium">AyTech Solution</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
