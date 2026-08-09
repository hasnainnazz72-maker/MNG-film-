import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { NetworkType } from '../types';
import {
  ArrowDownCircle,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  RotateCw,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  X,
  FileText,
} from 'lucide-react';

interface RechargeViewProps {
  onNavigate: (view: string) => void;
}

export const RechargeView: React.FC<RechargeViewProps> = ({ onNavigate }) => {
  const { token, refreshUserData, t } = useAuth();
  const [network, setNetwork] = useState<NetworkType>('USDT_BEP20');
  const [amount, setAmount] = useState<string>('50');
  const [txid, setTxid] = useState<string>('');
  
  // Screenshot upload states
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [copiedAcc, setCopiedAcc] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [settings, setSettings] = useState<{
    usdtBep20Address: string;
    usdtTrc20Address: string;
    etbCbeBankName: string;
    etbCbeAccountName: string;
    etbCbeAccountNumber: string;
  }>({
    usdtBep20Address: '0xbd63907b714a667f5052c432cdc4ad3dc0d73658',
    usdtTrc20Address: 'TETttTRj6ZX5gAm79RgDgDm6WHeMrnDjdy',
    etbCbeBankName: 'CBE (Commercial Bank of Ethiopia)',
    etbCbeAccountName: 'Fuad Nuri Sani',
    etbCbeAccountNumber: '1000249476505',
  });

  const isEtb = network === 'ETB_BANK';
  const activeAddress = network === 'USDT_BEP20' ? settings.usdtBep20Address : settings.usdtTrc20Address;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAcc = () => {
    navigator.clipboard.writeText(settings.etbCbeAccountNumber);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Image size exceeds 15MB limit. Please select a smaller screenshot.');
      return;
    }

    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setScreenshotBase64(compressed);
          } else {
            setScreenshotBase64(reader.result as string);
          }
        };
        img.onerror = () => {
          setScreenshotBase64(reader.result as string);
        };
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotBase64('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      onNavigate('login');
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid deposit amount.');
      return;
    }

    if (!isEtb && numAmount < 20) {
      setError('Minimum deposit amount is 20 USDT.');
      return;
    }

    if (isEtb) {
      if (!txid || txid.trim().length < 3) {
        setError('Transaction / Reference Number is required for ETB Bank Transfer.');
        return;
      }
    } else {
      if (!txid || txid.trim().length < 8) {
        setError('Please enter a valid Transaction Hash / TXID.');
        return;
      }
    }

    if (!screenshotBase64) {
      setError('Please upload your payment screenshot before submitting.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/wallet/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: numAmount,
          network,
          paymentMethod: network,
          txid: txid.trim(),
          transactionReference: txid.trim(),
          proofUrl: screenshotBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit recharge request');
      }

      setSuccess(
        isEtb
          ? 'ETB Deposit request submitted successfully! Your payment proof is under review.'
          : 'Deposit request submitted successfully! Payment screenshot sent to admin for approval.'
      );
      setTxid('');
      setScreenshotBase64('');
      setFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span>Deposit Capital</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">{t('recharge')} Capital</h1>
        <p className="text-xs text-slate-400">
          Transfer via USDT (BEP20/TRC20) or Ethiopian ETB Bank Transfer and upload payment screenshot for manual approval.
        </p>
      </div>

      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        {/* Network Selection Tabs */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Select Deposit Method</label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setNetwork('USDT_BEP20')}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition-all ${
                network === 'USDT_BEP20'
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <p className="font-bold text-xs sm:text-sm text-cyan-400">BNB Chain</p>
              <p className="text-[10px] sm:text-xs font-mono mt-0.5">USDT (BEP20)</p>
            </button>

            <button
              type="button"
              onClick={() => setNetwork('USDT_TRC20')}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition-all ${
                network === 'USDT_TRC20'
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <p className="font-bold text-xs sm:text-sm text-rose-400">TRON</p>
              <p className="text-[10px] sm:text-xs font-mono mt-0.5">USDT (TRC20)</p>
            </button>

            <button
              type="button"
              onClick={() => setNetwork('ETB_BANK')}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition-all ${
                network === 'ETB_BANK'
                  ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <p className="font-bold text-xs sm:text-sm text-emerald-400">ETB Bank</p>
              <p className="text-[10px] sm:text-xs font-mono mt-0.5">CBE Transfer</p>
            </button>
          </div>
        </div>

        {/* Deposit Destination Info */}
        {isEtb ? (
          /* ETB CBE Company Account Card */
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-4 shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Company Receiving Bank Account (ETB)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                CBE Direct
              </span>
            </div>

            <div className="space-y-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Bank:</span>
                <span className="font-bold text-white">{settings.etbCbeBankName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Account Name:</span>
                <span className="font-extrabold text-amber-300">{settings.etbCbeAccountName}</span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-slate-400 shrink-0">Account Number:</span>
                <span className="font-mono font-extrabold text-cyan-300 text-sm select-all">
                  {settings.etbCbeAccountNumber}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyAcc}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              {copiedAcc ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
              <span>{copiedAcc ? 'Account Number Copied!' : 'Copy CBE Account Number'}</span>
            </button>

            <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-center">
              Please transfer your ETB deposit strictly to this CBE account only. Enter the transaction reference and upload payment receipt screenshot below.
            </p>
          </div>
        ) : (
          /* USDT Deposit Address Card */
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Official Platform Deposit Address ({network.replace('_', ' ')})</span>
              <span className="text-cyan-400 font-semibold">Min Deposit: 20 USDT</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-white p-2 rounded-xl shrink-0">
                <svg className="w-24 h-24" viewBox="0 0 100 100" fill="currentColor">
                  <rect width="100" height="100" fill="#ffffff" />
                  <path
                    fill="#020617"
                    d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z M50,15 h5 v10 h-5 z M50,35 h10 v5 h-10 z M60,50 h15 v5 h-15 z M50,60 h10 v30 h-10 z M70,60 h20 v10 h-20 z M75,80 h15 v15 h-15 z"
                  />
                </svg>
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all">
                  {activeAddress}
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                  <span>{copied ? 'Address Copied!' : 'Copy Deposit Address'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Deposit Amount ({isEtb ? 'ETB' : 'USDT'}) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={isEtb ? 1 : 20}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={isEtb ? 'Enter ETB Amount' : 'Enter USDT Amount'}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-cyan-400">
                {isEtb ? 'ETB' : 'USDT'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              {isEtb ? 'Transaction / Reference Number' : 'Transaction Hash / TXID'} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              placeholder={isEtb ? 'Enter CBE Transaction/Ref Number' : 'Paste 64-character blockchain TXID'}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* SCREENSHOT FILE UPLOAD (Gallery / Camera) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Upload Recharge Screenshot <span className="text-rose-400">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, WEBP max 10MB</span>
            </label>

            {/* Hidden HTML File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {screenshotBase64 ? (
              /* Image Preview Card */
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-extrabold text-white truncate max-w-[200px]">
                      {fileName || 'Payment_Screenshot.png'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveScreenshot}
                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-colors"
                    title="Remove Screenshot"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-56 bg-black flex items-center justify-center">
                  <img
                    src={screenshotBase64}
                    alt="Recharge Screenshot Preview"
                    className="max-h-52 w-auto object-contain rounded-lg"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Different Screenshot</span>
                </button>
              </div>
            ) : (
              /* File Upload Zone Button */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer p-6 rounded-2xl bg-slate-950/80 border-2 border-dashed border-slate-800 hover:border-cyan-500/60 transition-all text-center space-y-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors">
                    Click to Upload Payment Screenshot
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Upload receipt from device gallery or camera for admin verification
                  </p>
                </div>

                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-200 font-extrabold text-xs transition-all inline-flex items-center gap-1.5 shadow"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Upload Recharge Screenshot</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wider uppercase transition-colors shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            {loading ? <RotateCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            <span>{loading ? 'Submitting Request...' : 'Submit Deposit Request'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

