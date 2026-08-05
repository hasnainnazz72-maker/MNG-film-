import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NetworkType } from '../types';
import {
  ArrowUpCircle,
  ShieldCheck,
  AlertCircle,
  RotateCw,
  CheckCircle2,
  Lock,
  Wallet,
} from 'lucide-react';

interface WithdrawalViewProps {
  onNavigate: (view: string) => void;
}

export const WithdrawalView: React.FC<WithdrawalViewProps> = ({ onNavigate }) => {
  const { user, token, refreshUserData, t } = useAuth();
  const [network, setNetwork] = useState<NetworkType>('USDT_BEP20');
  const [amount, setAmount] = useState<string>('50');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [fundPassword, setFundPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const numAmount = Number(amount) || 0;
  const fee = Number(((numAmount * 8) / 100).toFixed(2));
  const netAmount = Math.max(0, Number((numAmount - fee).toFixed(2)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      onNavigate('login');
      return;
    }

    if (numAmount < 10) {
      setError('Minimum withdrawal amount is 10 USDT.');
      return;
    }

    if (!user || user.balance < numAmount) {
      setError('Insufficient available balance for withdrawal.');
      return;
    }

    if (!walletAddress || walletAddress.trim().length < 10) {
      setError('Please provide a valid destination wallet address.');
      return;
    }

    if (!fundPassword || fundPassword.length !== 6) {
      setError('6-digit Fund Password is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: numAmount,
          network,
          walletAddress: walletAddress.trim(),
          fundPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit withdrawal request');
      }

      setSuccess(`Withdrawal request for ${numAmount} USDT submitted! Awaiting admin approval.`);
      setAmount('50');
      setWalletAddress('');
      setFundPassword('');
      refreshUserData();
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <ArrowUpCircle className="w-3.5 h-3.5" />
          <span>USDT Withdrawal Engine</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">{t('withdrawal')} Funds</h1>
        <p className="text-xs text-slate-400">
          Request funds withdrawal to your USDT wallet address. 8% processing fee applies. Requires admin approval.
        </p>
      </div>

      <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        {/* User Available Balance Indicator */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Available Wallet Balance</p>
            <p className="text-xl font-bold text-amber-300">{(user?.balance || 0).toFixed(2)} USDT</p>
          </div>
          <button
            type="button"
            onClick={() => setAmount((user?.balance || 0).toString())}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-colors"
          >
            Max
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Network Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Target Blockchain Network</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNetwork('USDT_BEP20')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  network === 'USDT_BEP20'
                    ? 'bg-amber-500/20 border-amber-400 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <p className="font-bold text-xs text-amber-400">USDT BEP20</p>
                <p className="text-[10px] text-slate-400 font-mono">BNB Smart Chain</p>
              </button>

              <button
                type="button"
                onClick={() => setNetwork('USDT_TRC20')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  network === 'USDT_TRC20'
                    ? 'bg-amber-500/20 border-amber-400 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <p className="font-bold text-xs text-rose-400">USDT TRC20</p>
                <p className="text-[10px] text-slate-400 font-mono">TRON Network</p>
              </button>
            </div>
          </div>

          {/* Destination Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Destination Wallet Address</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder={`Enter your ${network.replace('_', ' ')} wallet address`}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Withdrawal Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Withdrawal Amount (USDT)</label>
            <div className="relative">
              <input
                type="number"
                min={10}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-amber-400">USDT</span>
            </div>
          </div>

          {/* Fee Calculation Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Withdrawal Processing Fee (8%):</span>
              <span className="font-bold text-rose-400">-{fee.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
              <span>Net Amount You Receive:</span>
              <span className="text-emerald-400 text-sm">{netAmount.toFixed(2)} USDT</span>
            </div>
          </div>

          {/* 6-Digit Fund Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              6-Digit Security Fund Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={fundPassword}
                onChange={(e) => setFundPassword(e.target.value)}
                placeholder="Enter 6-digit fund password"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm tracking-wider uppercase transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {loading ? <RotateCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            <span>{loading ? 'Processing...' : 'Submit Withdrawal Request'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
