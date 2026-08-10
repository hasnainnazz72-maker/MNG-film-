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

const ETHIOPIAN_BANKS = [
  'CBE (Commercial Bank of Ethiopia)',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Wegagen Bank',
  'Nib International Bank',
  'Hibret Bank',
  'Oromia Bank',
  'Zemen Bank',
  'Cooperative Bank of Oromia',
  'Telebirr / CBE Birr',
  'Lion International Bank',
  'Berhan Bank',
  'Abay Bank',
  'Addis International Bank',
];

export const WithdrawalView: React.FC<WithdrawalViewProps> = ({ onNavigate }) => {
  const { user, token, refreshUserData, t } = useAuth();
  const [network, setNetwork] = useState<NetworkType>('USDT_BEP20');
  const [amount, setAmount] = useState<string>('50');
  const [walletAddress, setWalletAddress] = useState<string>('');
  
  // ETB Bank Specific States
  const [bankName, setBankName] = useState<string>('CBE (Commercial Bank of Ethiopia)');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [branch, setBranch] = useState<string>('');

  const [fundPassword, setFundPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEtb = network === 'ETB_BANK';
  const numAmount = Number(amount) || 0;
  const fee = Number(((numAmount * 8) / 100).toFixed(2));
  const netAmount = Math.max(0, Number((numAmount - fee).toFixed(2)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      onNavigate('login');
      return;
    }

    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }

    if (!isEtb && numAmount < 10) {
      setError('Minimum withdrawal amount is 10 USDT.');
      return;
    }

    const currentAvailableBal = isEtb ? (user?.balanceEtb || 0) : (user?.balance || 0);

    if (!user || currentAvailableBal < numAmount) {
      setError(`Insufficient available ${isEtb ? 'ETB' : 'USDT'} balance for withdrawal.`);
      return;
    }

    if (isEtb) {
      if (!bankName) {
        setError('Please select an Ethiopian bank.');
        return;
      }
      if (!accountHolderName || !accountHolderName.trim()) {
        setError('Account Holder Name is required.');
        return;
      }
      if (!accountNumber || !accountNumber.trim()) {
        setError('Account Number is required.');
        return;
      }
    } else {
      if (!walletAddress || walletAddress.trim().length < 10) {
        setError('Please provide a valid destination wallet address.');
        return;
      }
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
          paymentMethod: network,
          walletAddress: walletAddress.trim(),
          bankName: isEtb ? bankName : undefined,
          accountHolderName: isEtb ? accountHolderName.trim() : undefined,
          accountNumber: isEtb ? accountNumber.trim() : undefined,
          branch: isEtb ? branch.trim() : undefined,
          fundPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit withdrawal request');
      }

      setSuccess(
        isEtb
          ? `Withdrawal request for ${numAmount} ETB submitted! Awaiting processing.`
          : `Withdrawal request for ${numAmount} USDT submitted! Awaiting approval.`
      );
      setAmount('50');
      setWalletAddress('');
      setAccountHolderName('');
      setAccountNumber('');
      setBranch('');
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
          <span>Withdrawal Engine</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">{t('withdrawal')} Funds</h1>
        <p className="text-xs text-slate-400">
          Request funds withdrawal to your USDT wallet address or Ethiopian Bank Account. 8% processing fee applies.
        </p>
      </div>

      <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        {/* User Available Balance Indicator */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Available {isEtb ? 'ETB Bank' : 'USDT'} Balance
            </p>
            <p className="text-xl font-bold text-amber-300">
              {(isEtb ? (user?.balanceEtb || 0) : (user?.balance || 0)).toFixed(2)} {isEtb ? 'ETB' : 'USDT'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              {isEtb ? `USDT Balance: ${(user?.balance || 0).toFixed(2)} USDT` : `ETB Balance: ${(user?.balanceEtb || 0).toFixed(2)} ETB`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAmount((isEtb ? (user?.balanceEtb || 0) : (user?.balance || 0)).toString())}
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

          {/* Network / Method Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Select Withdrawal Method</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                <p className="text-[10px] text-slate-400 font-mono">BNB Chain</p>
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
                <p className="text-[10px] text-slate-400 font-mono">TRON</p>
              </button>

              <button
                type="button"
                onClick={() => setNetwork('ETB_BANK')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  network === 'ETB_BANK'
                    ? 'bg-emerald-500/20 border-emerald-400 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <p className="font-bold text-xs text-emerald-400">ETB Bank</p>
                <p className="text-[10px] text-slate-400 font-mono">Ethiopia Banks</p>
              </button>
            </div>
          </div>

          {/* Destination Details */}
          {isEtb ? (
            /* Ethiopian Bank Details Form */
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Select Ethiopian Bank <span className="text-rose-400">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                  required
                >
                  {ETHIOPIAN_BANKS.map((bank) => (
                    <option key={bank} value={bank} className="bg-slate-900 text-white">
                      {bank}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Account Holder Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Enter full name on bank account"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Account Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter bank account number"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Bank Branch <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Bole Branch"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* USDT Destination Wallet Address */
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
          )}

          {/* Withdrawal Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Withdrawal Amount ({isEtb ? 'ETB' : 'USDT'})
            </label>
            <div className="relative">
              <input
                type="number"
                min={isEtb ? 1 : 10}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={isEtb ? 'Enter ETB Amount' : 'Enter USDT Amount'}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-amber-400">
                {isEtb ? 'ETB' : 'USDT'}
              </span>
            </div>
          </div>

          {/* Fee Calculation Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Withdrawal Processing Fee (8%):</span>
              <span className="font-bold text-rose-400">
                -{fee.toFixed(2)} {isEtb ? 'ETB' : 'USDT'}
              </span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
              <span>Net Amount You Receive:</span>
              <span className="text-emerald-400 text-sm">
                {netAmount.toFixed(2)} {isEtb ? 'ETB' : 'USDT'}
              </span>
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
