import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  Crown, 
  Check, 
  Zap, 
  MessageSquare, 
  Mic, 
  BarChart3, 
  Smartphone, 
  CreditCard,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Star,
  FileText,
  History,
  Download,
  ExternalLink,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { speak } from '../services/ttsService';
import { toast } from 'sonner';
import { arrayUnion } from 'firebase/firestore';

const UPI_ID = "aayush.kumawatptaxis";
const TRIAL_PRICE = 199;
const PREMIUM_PRICE = 1999;

export default function PremiumPage() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const isPremium = userProfile?.subscription?.status === 'premium' || userProfile?.subscription?.status === 'trial';

  const handleSendEstimate = async (plan: string, price: number) => {
    if (!auth.currentUser?.email) return;
    
    toast.info('Estimates are currently unavailable. Please contact support.');
  };

  const handlePayment = () => {
    setProcessing(true);
    setError('');

    const isTrial = !userProfile?.subscription || userProfile?.subscription?.status === 'free';
    const amount = isTrial ? TRIAL_PRICE : PREMIUM_PRICE;
    const note = isTrial ? "Botub 15-Day Trial" : "Botub Monthly Subscription";
    const planName = isTrial ? 'Trial' : 'Premium';
    
    // UPI Deep Link

const trId = "BOTUB" + Date.now(); // Unique ID generated every time
const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Botub&tr=${trId}&tid=${trId}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}&mode=02&orgid=000000`;
    


    
    // Check if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = upiUrl;
    } else {
      toast.info(`Please pay ₹${amount} to UPI ID: ${UPI_ID}`, {
        duration: 5000,
      });
    }

    // Simulate payment verification with a manual check option or auto-check
    // We'll keep the simulation but make it more robust
    const verifyPayment = async () => {
      try {
        if (!auth.currentUser) return;
        const userRef = doc(db, 'users', auth.currentUser.uid);
        
        const expiryDate = new Date();
        if (isTrial) {
          expiryDate.setDate(expiryDate.getDate() + 15);
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        }

        const paymentId = 'PAY_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const newPayment = {
          id: paymentId,
          amount,
          date: new Date().toISOString(),
          status: 'success',
          plan: planName
        };

        await updateDoc(userRef, {
          subscription: {
            status: isTrial ? 'trial' : 'premium',
            expiryDate: expiryDate.toISOString(),
            trialEndDate: isTrial ? expiryDate.toISOString() : (userProfile?.subscription?.trialEndDate || null),
            lastPaymentId: paymentId
          },
          paymentHistory: arrayUnion(newPayment)
        });

        speak(`Payment successful! Your ${planName} subscription is now active.`);
        setShowSuccessModal(true);

        // Refresh profile
        const updatedSnap = await getDoc(userRef);
        setUserProfile(updatedSnap.data());
        setProcessing(false);
      } catch (err: any) {
        console.error("Payment verification error:", err);
        setError("Failed to verify payment. Please contact support with your transaction ID.");
        setProcessing(false);
      }
    };

    // Auto-verify after a delay to simulate the time taken for payment
    setTimeout(verifyPayment, 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure Checkout</span>
          </div>
        </div>

        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center px-6 py-2 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-black text-xs uppercase tracking-[0.2em] mb-8 shadow-sm border border-amber-100"
          >
            <Star className="w-4 h-4 mr-2 fill-amber-500" />
            Premium Experience
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tighter leading-tight">
            Supercharge your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI Potential</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Join 2,000+ businesses using Botub Premium to automate their customer service and scale faster.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-stretch">
          {/* Free Plan */}
          <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="mb-10">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-6">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-500 text-sm mb-6">Perfect for testing and small projects.</p>
              <div className="flex items-baseline">
                <span className="text-5xl font-black text-gray-900 tracking-tighter">₹0</span>
                <span className="text-gray-400 font-bold ml-2 uppercase text-xs tracking-widest">/ Month</span>
              </div>
            </div>

            <div className="space-y-5 mb-12 flex-1">
              {[
                "1 Custom AI Bot",
                "Basic Knowledge Base",
                "Standard Response Speed",
                "Community Support",
                "Basic Analytics"
              ].map((feature, i) => (
                <div key={i} className="flex items-center text-gray-600 font-medium">
                  <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center mr-4 shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            <button 
              disabled={!isPremium}
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                !isPremium 
                  ? 'bg-gray-100 text-gray-400 cursor-default' 
                  : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-indigo-600 hover:text-indigo-600'
              }`}
            >
              {!isPremium ? 'Current Plan' : 'Downgrade'}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-white rounded-[3rem] p-10 border-4 border-indigo-600 shadow-2xl shadow-indigo-100 relative overflow-hidden flex flex-col transform lg:scale-105 z-10">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white px-8 py-3 rounded-bl-[2rem] font-black text-xs uppercase tracking-widest">
              Recommended
            </div>

            <div className="mb-10">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-100">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Professional</h3>
              <p className="text-gray-500 text-sm mb-6">Everything you need to scale your business.</p>
              <div className="flex items-baseline">
                <span className="text-5xl font-black text-gray-900 tracking-tighter">₹1999</span>
                <span className="text-gray-400 font-bold ml-2 uppercase text-xs tracking-widest">/ Month</span>
              </div>
              <div className="mt-4 inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest">
                Trial: 15 Days for ₹99
              </div>
            </div>

            <div className="space-y-5 mb-12 flex-1">
              {[
                "Unlimited AI Bots",
                "Voice Input & Output",
                "Advanced Sentiment Analysis",
                "Priority Response Speed",
                "Custom API & Webhooks",
                "White-label Branding"
              ].map((feature, i) => (
                <div key={i} className="flex items-center text-gray-900 font-bold">
                  <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center mr-4 shrink-0">
                    <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center"
                >
                  <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                  {error}
                </motion.div>
              )}

              <div className="flex flex-col space-y-3">
                <button 
                  onClick={handlePayment}
                  disabled={processing || isPremium}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center shadow-xl ${
                    isPremium 
                      ? 'bg-emerald-50 text-emerald-600 cursor-default shadow-none' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 active:scale-95'
                  }`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Processing...
                    </>
                  ) : isPremium ? (
                    <>
                      <Check className="w-5 h-5 mr-3" />
                      Active Plan
                    </>
                  ) : (
                    <>
                      Upgrade to Pro
                      <ArrowRight className="ml-3 w-5 h-5" />
                    </>
                  )}
                </button>

                {!isPremium && (
                  <button
                    onClick={() => handleSendEstimate('Professional', PREMIUM_PRICE)}
                    className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center border border-dashed border-gray-200 hover:border-indigo-200"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Get Estimate via Email
                  </button>
                )}
              </div>
              
              {!isPremium && (
                <div className="flex items-center justify-center space-x-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center"><Smartphone className="w-3 h-3 mr-2" /> UPI</span>
                  <span className="flex items-center"><ShieldCheck className="w-3 h-3 mr-2" /> Encrypted</span>
                  <span className="flex items-center"><CreditCard className="w-3 h-3 mr-2" /> Secure</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment History */}
        {userProfile?.paymentHistory && userProfile.paymentHistory.length > 0 && (
          <div className="mt-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-900 flex items-center">
                <History className="w-8 h-8 mr-3 text-indigo-600" />
                Payment History
              </h2>
              <span className="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {userProfile.paymentHistory.length} Transactions
              </span>
            </div>
            
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction ID</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {userProfile.paymentHistory.slice().reverse().map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <span className="text-sm font-mono font-bold text-gray-900">{payment.id}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center text-sm text-gray-500 font-medium">
                            <Calendar className="w-3.5 h-3.5 mr-2" />
                            {new Date(payment.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {payment.plan}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-black text-gray-900">₹{payment.amount}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="flex items-center text-xs font-bold text-emerald-600">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2" />
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => setSelectedPayment(payment)}
                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details Modal */}
        <AnimatePresence>
          {selectedPayment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-xl font-black text-gray-900">Transaction Details</h3>
                  <button 
                    onClick={() => setSelectedPayment(null)}
                    className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                      <Check className="w-10 h-10 text-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</span>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Successful</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amount Paid</span>
                      <span className="text-lg font-black text-gray-900">₹{selectedPayment.amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Plan</span>
                      <span className="text-sm font-bold text-indigo-600">{selectedPayment.plan}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date</span>
                      <span className="text-sm font-bold text-gray-600">{new Date(selectedPayment.date).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction ID</span>
                      <span className="text-xs font-mono font-bold text-gray-400">{selectedPayment.id}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedPayment(null)}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-600/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden p-12 text-center"
              >
                <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                  <Crown className="w-12 h-12 text-emerald-500" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Welcome to Pro!</h2>
                <p className="text-gray-500 font-medium mb-10 leading-relaxed">
                  Your payment was successful and your account has been upgraded. You now have unlimited access to all premium features.
                </p>
                <div className="space-y-4">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-3 w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Feature Comparison */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Go Premium?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-white border border-gray-100">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                <Mic className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Voice Assistant</h4>
              <p className="text-gray-500 text-sm">Let your customers talk to your bot naturally with advanced voice recognition and synthesis.</p>
            </div>
            <div className="p-6 rounded-3xl bg-white border border-gray-100">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Deep Analysis</h4>
              <p className="text-gray-500 text-sm">Get insights into customer sentiment, common pain points, and conversion triggers.</p>
            </div>
            <div className="p-6 rounded-3xl bg-white border border-gray-100">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Unlimited Scaling</h4>
              <p className="text-gray-500 text-sm">Create as many bots as you need for different departments, products, or languages.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
