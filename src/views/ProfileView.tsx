import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES, LanguageCode } from '../i18n/translations';
import { TeamActivityRewardModal } from '../components/TeamActivityRewardModal';
import { AppDownloadModal } from '../components/AppDownloadModal';
import {
  User as UserIcon,
  ShieldCheck,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Crown,
  Globe,
  Headphones,
  ChevronRight,
  Menu,
  Smartphone,
  Share2,
  PlusCircle,
  X,
  Check,
  Send,
  Award,
  Film,
  Download,
} from 'lucide-react';

interface ProfileViewProps {
  onNavigate: (view: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const { user, token, logout, refreshUserData, language, setLanguage, t } = useAuth();
  const [activeTab, setActiveTab] = useState<'main' | 'security'>('main');

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newFundPassword, setNewFundPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // PWA, Menu, and Team Activity Reward State
  const [showTeamRewardModal, setShowTeamRewardModal] = useState<boolean>(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState<boolean>(false);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaMessage, setPwaMessage] = useState<string | null>(null);
  const [showLangModal, setShowLangModal] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    setShowMenuDrawer(false);
    setShowDownloadModal(true);
  };

  const handleShareApp = () => {
    const shareUrl = `${window.location.origin}?ref=${user?.referralCode || ''}`;
    if (navigator.share) {
      navigator.share({
        title: 'MNG FILM',
        text: 'Join MNG FILM Box Office Order Grabbing Platform',
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setPwaMessage('MNG FILM share link copied to clipboard!');
    }
  };

  const handleUpdatePasswords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!currentPassword) {
      setError('Current login password is required to verify changes.');
      return;
    }

    if (newFundPassword && (newFundPassword.length !== 6 || !/^\d{6}$/.test(newFundPassword))) {
      setError('New Fund Password must be exactly 6 numeric digits.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/update-passwords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword: newPassword || undefined,
          newFundPassword: newFundPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update security credentials');
      }

      setSuccess('Security passwords updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setNewFundPassword('');
      refreshUserData();
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
    { code: 'ru', label: 'Русский' },
    { code: 'pt', label: 'Português' },
    { code: 'zh', label: '中文' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 px-3 sm:px-4 relative">
      {/* MINE / PROFILE TOP BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 border border-cyan-500/30 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* TOP RIGHT THREE-LINE MENU BUTTON */}
        <button
          onClick={() => setShowMenuDrawer(true)}
          className="absolute top-4 right-4 p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-cyan-400 shadow-lg active:scale-95 transition-all z-20"
          title="Open Menu"
        >
          <Menu className="w-5 h-5 text-cyan-400" />
        </button>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pr-10">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-2xl text-cyan-400">
                  {user?.username ? user.username.substring(0, 2).toUpperCase() : 'MNG'}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-md bg-cyan-400 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow">
                VIP {user?.vipLevel || 1}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white tracking-wide">
                {user?.username || 'MNG Member'}
              </h2>
              <p className="text-xs text-cyan-400 font-mono">
                {user?.countryCode || ''} {user?.phone || 'Account Verified'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">
                <span>Ref Code:</span>
                <strong className="text-amber-300">{user?.referralCode || 'N/A'}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('vip')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95 shrink-0"
          >
            <Crown className="w-4 h-4 fill-slate-950" />
            <span>VIP {user?.vipLevel || 1} Tier</span>
          </button>
        </div>
      </div>

      {/* WALLET BALANCE SUMMARY CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Wallet Balance</span>
          </div>
          <button
            onClick={() => onNavigate('wallet')}
            className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>Overview</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[10px] text-slate-400 font-medium">Available Balances</p>
            <p className="text-base font-black text-cyan-400 font-mono mt-0.5">
              {(user?.balance || 0).toFixed(2)} <span className="text-xs font-normal text-slate-300">USDT</span>
            </p>
            {(user?.balanceEtb !== undefined && user?.balanceEtb !== null) && (
              <p className="text-xs font-bold text-emerald-400 font-mono">
                {(user?.balanceEtb || 0).toFixed(2)} <span className="text-[10px] font-normal text-slate-300">ETB</span>
              </p>
            )}
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[10px] text-slate-400 font-medium">Today's Profit</p>
            <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
              +{(user?.todayProfit || 0).toFixed(2)} <span className="text-xs font-normal">USDT</span>
            </p>
            {(user?.todayProfitEtb !== undefined && user?.todayProfitEtb !== null) && (
              <p className="text-xs font-bold text-emerald-300 font-mono">
                +{(user?.todayProfitEtb || 0).toFixed(2)} <span className="text-[10px] font-normal">ETB</span>
              </p>
            )}
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 col-span-2 sm:col-span-1">
            <p className="text-[10px] text-slate-400 font-medium">Total Profit Earned</p>
            <p className="text-base font-black text-amber-300 font-mono mt-0.5">
              {(user?.totalProfit || 0).toFixed(2)} <span className="text-xs font-normal">USDT</span>
            </p>
            {(user?.totalProfitEtb !== undefined && user?.totalProfitEtb !== null) && (
              <p className="text-xs font-bold text-amber-400 font-mono">
                {(user?.totalProfitEtb || 0).toFixed(2)} <span className="text-[10px] font-normal">ETB</span>
              </p>
            )}
          </div>
        </div>

        {/* QUICK RECHARGE / WITHDRAW BUTTONS */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => onNavigate('recharge')}
            className="py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <ArrowDownCircle className="w-4 h-4 fill-slate-950" />
            <span>Recharge</span>
          </button>
          <button
            onClick={() => onNavigate('withdraw')}
            className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 border border-amber-500/30 active:scale-95 transition-all"
          >
            <ArrowUpCircle className="w-4 h-4 text-amber-300" />
            <span>Withdrawal</span>
          </button>
        </div>
      </div>

      {/* TEAM ACTIVITY REWARD CARD / BANNER (PROMINENT OPTION IN MINE SECTION) */}
      <div
        onClick={() => setShowTeamRewardModal(true)}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-amber-950/90 to-slate-950 border border-amber-500/50 p-4 sm:p-5 cursor-pointer hover:border-amber-400 transition-all shadow-xl group"
      >
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                <span>⭐ TEAM BONUS ⭐</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 uppercase tracking-wide">
                TEAM ACTIVITY REWARD
              </h3>
              <p className="text-[11px] text-amber-100/80">
                Earn up to <strong className="text-amber-300 font-mono font-bold">32,000,000 ETB</strong> for Active Team Members
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shrink-0">
            <span>View</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* MINE NAVIGATION MENU LIST (REQUIRED BY SPECIFICATION) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl divide-y divide-slate-800/80">
        {/* ⭐ TEAM ACTIVITY REWARD ⭐ MENU OPTION */}
        <button
          onClick={() => setShowTeamRewardModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left group bg-gradient-to-r from-red-950/30 via-transparent to-transparent"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-300 flex items-center gap-1">
                <span>⭐ TEAM ACTIVITY REWARD ⭐</span>
              </p>
              <p className="text-[10px] text-slate-400">Claim up to 32,000,000 ETB milestone bonuses</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* 🎬 FILM SYNDICATE INVESTMENT OPTION */}
        <button
          onClick={() => onNavigate('task')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left group bg-gradient-to-r from-cyan-950/20 via-transparent to-transparent"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-black text-cyan-300 flex items-center gap-1">
                <span>🎬 FILM SYNDICATE INVESTMENT</span>
              </p>
              <p className="text-[10px] text-slate-400">7-Day (3% Daily) & 30-Day (3.5% Daily) Plans</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Recharge History */}
        <button
          onClick={() => onNavigate('transactions')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Recharge History</p>
              <p className="text-[10px] text-slate-400">View USDT deposit logs & statuses</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </button>

        {/* Withdrawal History */}
        <button
          onClick={() => onNavigate('transactions')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Withdrawal History</p>
              <p className="text-[10px] text-slate-400">Track payouts & approval progress</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </button>

        {/* Transaction History */}
        <button
          onClick={() => onNavigate('transactions')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Transaction History</p>
              <p className="text-[10px] text-slate-400">Complete activity, commission & profit ledger</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </button>

        {/* App Download (28.6 MB) */}
        <button
          onClick={() => setShowDownloadModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left group bg-gradient-to-r from-blue-950/20 via-transparent to-transparent"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Download className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <span>App Download (28.6 MB)</span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-400/40 text-[9px] text-cyan-300 font-bold">APK / PWA</span>
              </p>
              <p className="text-[10px] text-slate-400">Download package with MB progress and install to phone</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Security Center & Password Toggle */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Security Center</p>
                <p className="text-[10px] text-slate-400">
                  Fund password status: {user?.fundPassword ? 'Configured (6-digit)' : 'Not set'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab(activeTab === 'security' ? 'main' : 'security')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-[11px] transition-colors flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{activeTab === 'security' ? 'Hide Passwords' : 'Change Password'}</span>
            </button>
          </div>

          {/* Security Form Dropdown */}
          {activeTab === 'security' && (
            <div className="pt-3 border-t border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-cyan-400">Update Account & Fund Passwords</h4>
              <form onSubmit={handleUpdatePasswords} className="space-y-3">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{success}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Current Login Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    New Login Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    New 6-Digit Fund Password (Optional)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newFundPassword}
                    onChange={(e) => setNewFundPassword(e.target.value)}
                    placeholder="6 numeric digits"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Save Password Updates</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Language</p>
              <p className="text-[10px] text-slate-400">Select application display language</p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name} ({l.nativeName})
              </option>
            ))}
          </select>
        </div>

        {/* Customer Support */}
        <div className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left group">
          <button
            onClick={() => onNavigate('support')}
            className="flex-1 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Customer Support</p>
              <p className="text-[10px] text-slate-400">Telegram: @Mrdaniel55 | 24/7 Service</p>
            </div>
          </button>
          <a
            href="https://t.me/Mrdaniel55"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 ml-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>@Mrdaniel55</span>
          </a>
        </div>
      </div>

      {/* LOGOUT BUTTON */}
      <button
        onClick={logout}
        className="w-full py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out Account</span>
      </button>

      {/* TOP-RIGHT THREE-LINE MENU DRAWER MODAL */}
      {showMenuDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-extrabold text-white">MNG FILM Settings</h3>
              </div>
              <button
                onClick={() => {
                  setShowMenuDrawer(false);
                  setPwaMessage(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pwaMessage && (
              <div className="p-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs leading-relaxed whitespace-pre-line flex items-start gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{pwaMessage}</span>
              </div>
            )}

            {/* 5 SPECIFIED MENU OPTIONS */}
            <div className="space-y-2">
              {/* 1. Add to Home Screen */}
              <button
                onClick={handleInstallPWA}
                className="w-full p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Add to Home Screen</p>
                    <p className="text-[10px] text-slate-400">Quick home screen shortcut</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
              </button>

              {/* 2. Install Application (PWA) */}
              <button
                onClick={handleInstallPWA}
                className="w-full p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Install Application (PWA)</p>
                    <p className="text-[10px] text-slate-400">Standalone App Experience</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
              </button>

              {/* 3. Share App */}
              <button
                onClick={handleShareApp}
                className="w-full p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 transition-all flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Share App</p>
                    <p className="text-[10px] text-slate-400">Send invite link to friends</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
              </button>

              {/* 4. Language */}
              <button
                onClick={() => setShowLangModal(!showLangModal)}
                className="w-full p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 transition-all flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Language</p>
                    <p className="text-[10px] text-slate-400">Current: {language.toUpperCase()}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
              </button>

              {showLangModal && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-2 text-xs max-h-56 overflow-y-auto">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangModal(false);
                      }}
                      className={`p-2 rounded-xl text-left font-bold transition-colors flex items-center gap-2 ${
                        language === l.code ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-base">{l.flag}</span>
                      <span className="truncate">{l.nativeName}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 5. Logout */}
              <button
                onClick={() => {
                  setShowMenuDrawer(false);
                  logout();
                }}
                className="w-full p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-400">Logout</p>
                    <p className="text-[10px] text-rose-300/70">Sign out of account</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEAM ACTIVITY REWARD MODAL */}
      <TeamActivityRewardModal
        isOpen={showTeamRewardModal}
        onClose={() => setShowTeamRewardModal(false)}
      />

      {/* APP DOWNLOAD & INSTALLATION MODAL (28.6 MB) */}
      <AppDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        deferredPrompt={deferredPrompt}
      />
    </div>
  );
};
