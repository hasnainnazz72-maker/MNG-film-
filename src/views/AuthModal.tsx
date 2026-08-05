import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { COUNTRY_CODES, CountryCode } from '../data/countryCodes';
import { CaptchaWidget } from '../components/CaptchaWidget';
import { Shield, Phone, Lock, Mail, Users, AlertCircle, CheckCircle2, RotateCw, X } from 'lucide-react';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
  onClose?: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const { login, t } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  const [countryCode, setCountryCode] = useState<string>('+1');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fundPassword, setFundPassword] = useState<string>('');
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [isRefLocked, setIsRefLocked] = useState<boolean>(false);

  const [captchaId, setCaptchaId] = useState<string>('');
  const [captchaValue, setCaptchaValue] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check URL params or hash for referral code & lock it
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let ref = params.get('ref') || params.get('invite') || params.get('code') || params.get('invitationCode') || params.get('referral');

    if (!ref && window.location.hash) {
      const match = window.location.hash.match(/(?:ref|invite|code|invitationCode|referral)=([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) {
        ref = match[1];
      }
    }

    if (ref) {
      setMode('register');
      setInvitationCode(ref);
      setIsRefLocked(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body: any = {
        countryCode,
        phone,
        password,
        captchaId,
        captchaCode: captchaValue,
      };

      if (email) body.email = email;

      if (mode === 'register') {
        body.fundPassword = fundPassword;
        if (invitationCode) body.invitationCode = invitationCode;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.token, data.user);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      const msg = err.message === 'Failed to fetch'
        ? 'Unable to connect to server. Please check your network or try again in a moment.'
        : (err.message || 'An error occurred during authentication');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-slate-900/95 border border-cyan-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-60 h-60 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/30 flex items-center justify-center">
          <Shield className="w-6 h-6 text-slate-950" />
        </div>
        <h2 className="text-xl font-extrabold text-white">
          {mode === 'login' ? 'MNG FILM Member Login' : 'Create MNG FILM Account'}
        </h2>
        <p className="text-xs text-slate-400">
          {mode === 'login'
            ? 'Access your film order grabbing dashboard & wallet'
            : 'Register to unlock VIP 1 box office order grabbing'}
        </p>
      </div>

      {/* Auth Toggle Tabs */}
      <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'login' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('login')}
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'register' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('register')}
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

        {/* Country Dial Code + Phone Number */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            {t('phoneNumber')} <span className="text-rose-400">*</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 w-36 sm:w-44 shrink-0 font-medium"
            >
              {COUNTRY_CODES.map((c: CountryCode) => (
                <option key={c.code + c.dialCode + c.name} value={c.dialCode} className="bg-slate-900 text-white">
                  {c.flag} {c.dialCode} - {c.name}
                </option>
              ))}
            </select>

            <div className="relative flex-1">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile number"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                required
              />
              <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Optional Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Email Address {mode === 'register' ? '(Optional)' : ''}
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Login Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Login Password <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
            <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Mode Specific Inputs on Registration */}
        {mode === 'register' && (
          <>
            {/* 6-Digit Fund Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                6-Digit Security Fund Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  value={fundPassword}
                  onChange={(e) => setFundPassword(e.target.value)}
                  placeholder="Enter 6 numeric digits for withdrawal auth"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Invitation Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Invitation Code (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => !isRefLocked && setInvitationCode(e.target.value)}
                  readOnly={isRefLocked}
                  disabled={isRefLocked}
                  placeholder="Referral Code (e.g. MNG123456)"
                  className={`w-full border rounded-xl pl-9 pr-3 py-3 text-xs font-mono transition-colors ${
                    isRefLocked
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 font-extrabold cursor-not-allowed select-none'
                      : 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500'
                  }`}
                />
                <Users className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {isRefLocked && (
                <p className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <span>🔒 Invitation code auto-filled from link and locked.</span>
                </p>
              )}
            </div>
          </>
        )}

        {/* Anti-Bot Visual CAPTCHA */}
        <CaptchaWidget
          onCaptchaGenerated={(id) => setCaptchaId(id)}
          captchaValue={captchaValue}
          setCaptchaValue={(val) => setCaptchaValue(val)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wider uppercase transition-colors shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <RotateCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
          <span>{loading ? 'Processing...' : mode === 'login' ? t('login') : 'Register Account'}</span>
        </button>
      </form>
    </div>
  );
};
