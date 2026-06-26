import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-12">
          <div className="flex flex-col items-center md:items-start group">
            <Logo iconOnly className="w-12 h-12 outline-brand-primary shadow-2xl shadow-brand-primary/10 rounded-2xl group-hover:rotate-12 transition-transform" />
          </div>

          <div className="text-center">
            <span className="text-3xl font-black text-brand-dark tracking-tighter block">Botub</span>
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mt-1 block">AI Network</span>
            <div className="flex items-center justify-center space-x-6 mt-4">
              <Link to="/contact" className="text-xs font-bold text-gray-500 hover:text-indigo-600 uppercase tracking-widest">Contact</Link>
              <Link to="/launch" className="text-xs font-bold text-gray-500 hover:text-indigo-600 uppercase tracking-widest">Launch</Link>
              <Link to="/dashboard" className="text-xs font-bold text-gray-500 hover:text-indigo-600 uppercase tracking-widest">Dashboard</Link>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end space-y-3">
            <div className="flex items-center space-x-6">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 px-3 py-1 rounded-full bg-slate-50">Enterprise v2.0.0</span>
            </div>
            <p className="text-slate-400 text-[11px] font-bold tracking-wide text-center md:text-right">
              &copy; {new Date().getFullYear()} AI Network by <span className="text-brand-dark">AyTech Solution</span>
            </p>
            <p className="text-[9px] text-brand-primary font-black uppercase tracking-[0.2em]">Managed by Aayush Kumawat</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
