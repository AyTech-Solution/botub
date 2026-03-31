import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Bot, LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from './Logo';

import { motion } from 'motion/react';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Logo className="w-10 h-10" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Home</Link>
            <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">About</Link>
            <Link to="/contact" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Contact</Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Dashboard</Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 overflow-hidden">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Sign In</Link>
                <Link 
                  to="/auth" 
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-indigo-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 py-4 px-4 space-y-4">
          <Link to="/" className="block text-base font-medium text-gray-600 hover:text-indigo-600">Home</Link>
          <Link to="/#features" className="block text-base font-medium text-gray-600 hover:text-indigo-600">Features</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="block text-base font-medium text-gray-600 hover:text-indigo-600">Dashboard</Link>
              <button 
                onClick={handleLogout}
                className="block w-full text-left text-base font-medium text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="block text-base font-medium text-indigo-600">Sign In / Up</Link>
          )}
        </div>
      )}
    </nav>
  );
}
