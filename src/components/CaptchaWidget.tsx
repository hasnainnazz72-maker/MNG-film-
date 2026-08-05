import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface CaptchaWidgetProps {
  onCaptchaGenerated: (captchaId: string) => void;
  captchaValue: string;
  setCaptchaValue: (val: string) => void;
}

export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({
  onCaptchaGenerated,
  captchaValue,
  setCaptchaValue,
}) => {
  const [captchaText, setCaptchaText] = useState<string>('----');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCaptcha = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/captcha');
      if (res.ok) {
        const data = await res.json();
        setCaptchaText(data.text);
        onCaptchaGenerated(data.captchaId);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Captcha endpoint offline, using local fallback');
    }

    // Fallback local captcha generator
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let text = '';
    for (let i = 0; i < 5; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const fallbackId = 'local-' + Date.now() + Math.random().toString(36).substring(2, 6);
    setCaptchaText(text);
    onCaptchaGenerated(fallbackId);
    setLoading(false);
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-300">
        Verification Code (CAPTCHA)
      </label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={captchaValue}
          onChange={(e) => setCaptchaValue(e.target.value)}
          placeholder="Enter 5-character code"
          maxLength={6}
          className="flex-1 bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          required
        />
        <div className="relative flex items-center justify-center bg-slate-800/90 border border-slate-700 rounded-lg px-4 py-2 select-none overflow-hidden min-w-[110px]">
          {/* Visual noise background for anti-bot protection */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:8px_8px]" />
          <span className="font-mono text-lg tracking-widest font-bold text-cyan-400 italic transform -rotate-2 select-none">
            {captchaText}
          </span>
          <button
            type="button"
            onClick={fetchCaptcha}
            disabled={loading}
            className="ml-3 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Refresh CAPTCHA"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
