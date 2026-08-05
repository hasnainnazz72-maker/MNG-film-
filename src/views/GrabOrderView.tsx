import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Film,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  TrendingUp,
  Activity,
  History,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react';

interface GrabOrderViewProps {
  onNavigate: (view: string) => void;
}

const SAMPLE_HISTORY_ITEMS = [
  { id: '1', date: '19 Apr 2026, 10:00 (UTC)', profit: '+5.20 USDT', status: 'Completed' },
  { id: '2', date: '18 Apr 2026, 10:00 (UTC)', profit: '+5.20 USDT', status: 'Completed' },
  { id: '3', date: '17 Apr 2026, 10:00 (UTC)', profit: '+5.20 USDT', status: 'Completed' },
];

export const GrabOrderView: React.FC<GrabOrderViewProps> = ({ onNavigate }) => {
  const { user, token, grabStatus, refreshGrabStatus, refreshUserData } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [matchingStep, setMatchingStep] = useState<number>(0);
  const [grabHistory, setGrabHistory] = useState<any[]>([]);

  const fetchGrabHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/wallet/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const grabTxs = (data.transactions || []).filter(
          (tx: any) => tx.type === 'ORDER_PROFIT' || tx.type === 'GRAB_ORDER'
        );
        setGrabHistory(grabTxs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGrabHistory();
  }, [token]);

  const handleStartGrab = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }

    if (user.investment < 20) {
      setError('Minimum 20 USDT investment is required to start Grab Order.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/grab/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start Grab Order');
      }

      setSuccessMsg('Order matching initiated! Please wait 60 seconds.');
      await refreshGrabStatus();
    } catch (err: any) {
      setError(err.message || 'An error occurred while grabbing order');
    } finally {
      setLoading(false);
    }
  };

  const isMinInvestmentMet = (user?.investment || 0) >= 20;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 px-3 sm:px-4">
      {/* Title Header */}
      <div className="text-center pt-1">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
          Grab Order
        </h1>
      </div>

      {/* Toast Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN RADIAL TIMER INTERACTIVE CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* RADIAL CIRCULAR CLOCK DISPLAY MATCHING REFERENCE FLEX */}
        <div className="relative w-52 h-52 sm:w-60 sm:h-60 mx-auto flex flex-col items-center justify-center">
          {/* Radial arc outer track */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-slate-800"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-cyan-400"
              strokeWidth="4"
              strokeDasharray="264"
              strokeDashoffset={
                grabStatus.isGrabActive
                  ? 264 - (264 * (60 - grabStatus.remainingSeconds)) / 60
                  : 0
              }
              strokeLinecap="round"
              fill="none"
              style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.8))' }}
            />
          </svg>

          {/* Inner Content */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-1">
            <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-wider">
              {grabStatus.isGrabActive
                ? `00:${grabStatus.remainingSeconds.toString().padStart(2, '0')}`
                : '01:00'}
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              Time Remaining
            </span>

            {/* Clapperboard / Movie reel icon in center */}
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mt-2 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Film className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Subtitles */}
        <div className="space-y-1 pt-1">
          <h3 className="text-sm font-extrabold text-white">Daily Order Grabbing</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Complete one order every 24 hours to earn daily profit.
          </p>
        </div>

        {/* START GRAB LARGE PILL BUTTON MATCHING FLEX */}
        <div className="pt-2">
          <button
            onClick={handleStartGrab}
            disabled={loading || grabStatus.isGrabActive || grabStatus.cooldownRemainingMs > 0 || !isMinInvestmentMet}
            className={`w-full py-4 rounded-full font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95 ${
              grabStatus.isGrabActive || grabStatus.cooldownRemainingMs > 0 || !isMinInvestmentMet
                ? 'bg-slate-800 text-slate-500 border border-slate-700 shadow-none cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white'
            }`}
          >
            {loading ? (
              <>
                <RotateCw className="w-5 h-5 animate-spin text-white" />
                <span>Matching...</span>
              </>
            ) : grabStatus.isGrabActive ? (
              <>
                <Zap className="w-5 h-5 animate-pulse text-white fill-white" />
                <span>Matching Order ({grabStatus.remainingSeconds}s)...</span>
              </>
            ) : grabStatus.cooldownRemainingMs > 0 ? (
              <span>Order Completed</span>
            ) : !isMinInvestmentMet ? (
              <span>Recharge Min 20 USDT</span>
            ) : (
              <>
                <Zap className="w-5 h-5 text-white fill-white" />
                <span>Start Grab</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* GRAB HISTORY MATCHING REFERENCE FLEX */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-extrabold text-white">Grab History</h3>
          <button className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-0.5">
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {grabHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs space-y-1">
            <p className="font-semibold text-slate-400">No grab history records yet.</p>
            <p className="text-[10px] text-slate-500">Complete your daily order grab to generate profit.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {grabHistory.map((item: any, idx: number) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">
                      {item.date || new Date(item.createdAt || Date.now()).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500">Profit</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-emerald-400">
                    {item.profit || `+${Number(item.amount || 0).toFixed(2)} USDT`}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
