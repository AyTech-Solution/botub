import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  textColor?: string;
  iconOnly?: boolean;
}

export default function Logo({ className = "w-8 h-8", showText = true, textColor = "text-gray-900", iconOnly = false }: LogoProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative flex-shrink-0">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="12" fill="url(#logoGradient)"/>
          <path d="M12 12C12 10.8954 12.8954 10 14 10H22C25.3137 10 28 12.6863 28 16C28 19.3137 25.3137 22 22 22H12V12Z" fill="white" fillOpacity="0.9"/>
          <path d="M12 20H20C23.3137 20 26 22.6863 26 26C26 29.3137 23.3137 32 20 32H14C12.8954 32 12 31.1046 12 30V20Z" fill="white" fillOpacity="0.7"/>
          <circle cx="19" cy="16" r="2" fill="#4F46E5"/>
          <circle cx="19" cy="26" r="2" fill="#4F46E5"/>
        </svg>
      </div>
      {!iconOnly && showText && (
        <span className={`text-xl font-black tracking-tighter ${textColor}`}>
          Botub
        </span>
      )}
    </div>
  );
}
