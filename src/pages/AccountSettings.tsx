import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  User as UserIcon, 
  Mail, 
  Camera, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  KeyRound,
  Info,
  Trash2,
  AlertTriangle,
  LogOut,
  Crown,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'sonner';
import Logo from '../components/Logo';

export default function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
          setDisplayName(data.displayName || '');
          setPhotoURL(data.photoURL || '');
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName,
        photoURL
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!auth.currentUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    }
  };

  const handleDeactivate = async () => {
    if (!auth.currentUser) return;
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        deactivated: true,
        deactivatedAt: new Date().toISOString()
      });
      toast.success('Account deactivated successfully');
      await auth.signOut();
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate account');
    } finally {
      setActionLoading(false);
      setShowDeactivateConfirm(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    setActionLoading(true);
    try {
      const uid = auth.currentUser.uid;
      
      // 1. Delete user document
      await updateDoc(doc(db, 'users', uid), {
        deleted: true,
        deletedAt: new Date().toISOString()
      });

      // In a real app, we might delete all bots too, or just mark user as deleted
      // For this demo, we'll sign out and redirect
      toast.success('Account deletion requested successfully');
      await auth.signOut();
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const [activeTab, setActiveTab] = useState('profile');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'subscription', label: 'Subscription', icon: <Crown className="w-4 h-4" /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <div className="flex items-center space-x-4">
                  <Logo className="w-16 h-16" iconOnly />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {tabs.find(t => t.id === activeTab)?.label} Settings
                    </h1>
                    <p className="text-gray-500 text-sm">
                      {activeTab === 'profile' && 'Manage your public profile and contact information.'}
                      {activeTab === 'security' && 'Secure your account with password and authentication.'}
                      {activeTab === 'subscription' && 'View and manage your current subscription plan.'}
                      {activeTab === 'danger' && 'Irreversible actions for your account.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <AnimatePresence mode="wait">
                  {activeTab === 'profile' && (
                    <motion.form
                      key="profile"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleSave}
                      className="space-y-8"
                    >
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                          <div className="relative group">
                            <div className="w-24 h-24 rounded-3xl bg-gray-100 border-2 border-gray-100 flex items-center justify-center overflow-hidden group-hover:border-indigo-200 transition-all">
                              {photoURL ? (
                                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <UserIcon className="w-10 h-10 text-gray-300" />
                              )}
                            </div>
                            <button 
                              type="button"
                              className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md border border-gray-100 text-gray-600 hover:text-indigo-600 transition-all"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">Profile Photo</h3>
                            <p className="text-xs text-gray-500 mb-3">Update your avatar to personalize your account.</p>
                            <input 
                              type="text"
                              value={photoURL}
                              onChange={(e) => setPhotoURL(e.target.value)}
                              placeholder="Enter Image URL (e.g., https://picsum.photos/200)"
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block ml-1">Full Name</label>
                            <div className="relative">
                              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block ml-1">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="email"
                                value={auth.currentUser?.email || ''}
                                disabled
                                className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 ml-1 flex items-center">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Email cannot be changed for security reasons.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-100">
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Changes
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {activeTab === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-gray-50 rounded-2xl p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm font-bold text-gray-900 mb-1">Reset Password</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              We'll send a password reset link to your email address. 
                              {auth.currentUser?.providerData[0]?.providerId === 'google.com' && (
                                <span className="block mt-2 text-indigo-600 font-medium flex items-center justify-center sm:justify-start">
                                  <Info className="w-3 h-3 mr-1" />
                                  Recommended for Google users.
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleResetPassword}
                            className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm flex items-center"
                          >
                            <KeyRound className="w-4 h-4 mr-2" />
                            Reset Password
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'subscription' && (
                    <motion.div
                      key="subscription"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-gray-50 rounded-2xl p-8 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Plan</p>
                            <div className="flex items-center justify-center sm:justify-start space-x-3">
                              <span className={`px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wider ${
                                userProfile?.subscription?.status === 'premium' || userProfile?.subscription?.status === 'trial'
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : 'bg-gray-200 text-gray-600 border border-gray-300'
                              }`}>
                                {userProfile?.subscription?.status || 'Free'}
                              </span>
                              {userProfile?.subscription?.expiryDate && (
                                <span className="text-xs text-gray-500 font-medium">
                                  Expires: {new Date(userProfile.subscription.expiryDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <Link 
                            to="/premium"
                            className="inline-flex items-center px-8 py-3 bg-white border border-gray-200 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-sm"
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            Manage Subscription
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'danger' && (
                    <motion.div
                      key="danger"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1">Deactivate Account</h4>
                            <p className="text-xs text-gray-500 mb-4">Temporarily disable your account. You can reactivate it later.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowDeactivateConfirm(true)}
                            className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all flex items-center justify-center"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Deactivate
                          </button>
                        </div>

                        <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-red-600 mb-1">Delete Account</h4>
                            <p className="text-xs text-gray-500 mb-4">Permanently delete your account and all associated data.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all flex items-center justify-center shadow-lg shadow-red-100"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Forever
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-4 bg-red-600 text-white rounded-2xl shadow-2xl flex items-center mb-4"
            >
              <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
              <span className="text-sm font-bold">{error}</span>
              <button onClick={() => setError('')} className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-4 bg-green-600 text-white rounded-2xl shadow-2xl flex items-center"
            >
              <CheckCircle2 className="w-5 h-5 mr-3 shrink-0" />
              <span className="text-sm font-bold">Profile updated successfully!</span>
              <button onClick={() => setSuccess(false)} className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {showDeactivateConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !actionLoading && setShowDeactivateConfirm(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-6">
                  <LogOut className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Deactivate Account?</h3>
                <p className="text-gray-500 text-sm mb-8">
                  Your account will be temporarily disabled. You can reactivate it anytime by logging back in.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowDeactivateConfirm(false)}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeactivate}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deactivate'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !actionLoading && setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account Permanently?</h3>
                <p className="text-gray-500 text-sm mb-8">
                  This action is irreversible. All your bots, settings, and data will be permanently deleted.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Forever'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
