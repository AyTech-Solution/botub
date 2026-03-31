import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthGuard from './components/AuthGuard';
import { Loader2 } from 'lucide-react';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BotCreation = lazy(() => import('./pages/BotCreation'));
const BotDetail = lazy(() => import('./pages/BotDetail'));
const BotSettings = lazy(() => import('./pages/BotSettings'));
const ChatHistory = lazy(() => import('./pages/ChatHistory'));
const PremiumPage = lazy(() => import('./pages/PremiumPage'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
      <p className="text-gray-500 font-medium animate-pulse">Loading your experience...</p>
    </div>
  );
}

const WidgetPage = lazy(() => import('./pages/WidgetPage'));

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const isWidgetPage = location.pathname.startsWith('/widget/');

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" richColors />
      {!isAuthPage && !isWidgetPage && <Navbar />}
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/widget/:botId" element={<WidgetPage />} />
            <Route 
              path="/dashboard" 
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              } 
            />
            <Route 
              path="/create-bot" 
              element={
                <AuthGuard>
                  <BotCreation />
                </AuthGuard>
              } 
            />
            <Route 
              path="/bot/:botId" 
              element={
                <AuthGuard>
                  <BotDetail />
                </AuthGuard>
              } 
            />
            <Route 
              path="/bot/:botId/settings" 
              element={
                <AuthGuard>
                  <BotSettings />
                </AuthGuard>
              } 
            />
            <Route 
              path="/bot/:botId/history" 
              element={
                <AuthGuard>
                  <ChatHistory />
                </AuthGuard>
              } 
            />
            <Route 
              path="/premium" 
              element={
                <AuthGuard>
                  <PremiumPage />
                </AuthGuard>
              } 
            />
            <Route 
              path="/account-settings" 
              element={
                <AuthGuard>
                  <AccountSettings />
                </AuthGuard>
              } 
            />
          </Routes>
        </Suspense>
      </main>
      {!isAuthPage && !isWidgetPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
