import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthGuard from './components/AuthGuard';
import { Loader2 } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Lazy load pages for better performance
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BotCreation = lazy(() => import('./pages/BotCreation'));
const BotDetail = lazy(() => import('./pages/BotDetail'));
const BotSettings = lazy(() => import('./pages/BotSettings'));
const ChatHistory = lazy(() => import('./pages/ChatHistory'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const IntegrationGuide = lazy(() => import('./pages/IntegrationGuide'));
const Contact = lazy(() => import('./pages/Contact'));
const Launch = lazy(() => import('./pages/Launch'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
      <p className="text-gray-500 font-medium animate-pulse">Loading your experience...</p>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const WidgetPage = lazy(() => import('./pages/WidgetPage'));

function AppContent() {
  const location = useLocation();
  const [user, setUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isAuthPath = location.pathname === '/auth';
  const isHomePath = location.pathname === '/';
  const isWidgetPage = location.pathname.startsWith('/widget/');
  
  // An auth page is explicitly /auth OR / when the user is not logged in
  const isShowingAuth = isAuthPath || (isHomePath && !user && !authLoading);

  if (authLoading && (isHomePath || isAuthPath)) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Toaster position="top-right" richColors />
      {!isShowingAuth && !isWidgetPage && <Navbar />}
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={user ? <Dashboard /> : <AuthPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route 
              path="/launch" 
              element={
                <AuthGuard>
                  <Launch />
                </AuthGuard>
              } 
            />
            <Route 
              path="/launch/:botId" 
              element={
                <AuthGuard>
                  <Launch />
                </AuthGuard>
              } 
            />
            <Route 
              path="/integration-guide" 
              element={
                <AuthGuard>
                  <IntegrationGuide />
                </AuthGuard>
              } 
            />
            <Route 
              path="/integration-guide/:botId" 
              element={
                <AuthGuard>
                  <IntegrationGuide />
                </AuthGuard>
              } 
            />
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
      {!isShowingAuth && !isWidgetPage && <Footer />}
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
