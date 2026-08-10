import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatUtcDateTime } from '../lib/dateUtils';
import {
  Film,
  Zap,
  Clock,
  AlertTriangle,
  RotateCw,
  ChevronRight,
  Check,
  Calendar,
  Wallet,
  Sparkles,
} from 'lucide-react';

interface GrabOrderViewProps {
  onNavigate: (view: string) => void;
}

export const GrabOrderView: React.FC<GrabOrderViewProps> = ({ onNavigate }) => {
  const { user, token, grabStatus, refreshGrabStatus, refreshUserData } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [grabHistory, setGrabHistory] = useState<any[]>([]);

  const fetchGrabHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/grab/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGrabHistory(data.history || []);
      }
    } catch (err) {
      console.error('Error fetching grab history:', err);
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

      setSuccessMsg('Order matching initiated! 60-second processing started...');
      await refreshGrabStatus();
      await fetchGrabHistory();
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || 'An error occurred while grabbing order');
    } finally {
      setLoading(false);
    }
  };

  const eligibleBalanceUsdt = Math.max(user?.balance || 0, user?.investment || 0);
  const eligibleBalanceEtb = Math.max(user?.balanceEtb || 0, user?.investmentEtb || 0);

  const hasEligibleUsdt = eligibleBalanceUsdt >= 20;
  const hasEligibleEtb = eligibleBalanceEtb >= 4000;

  const isMinBalanceMet = hasEligibleUsdt || hasEligibleEtb;

  const isEtbUser = hasEligibleEtb || (!hasEligibleUsdt && eligibleBalanceEtb > 0);
  const activeCurrency = isEtbUser ? 'ETB' : 'USDT';
  const eligibleBalance = isEtbUser ? eligibleBalanceEtb : eligibleBalanceUsdt;
  const minRequiredBalance = isEtbUser ? 4000 : 20;

  // Format cooldown remaining ms into HH:MM:SS
  const formatCooldownTime = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 px-3 sm:px-4">
      {/* Title Header */}
      <div className="text-center pt-1 space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
          Grab Order
        </h1>
        <p className="text-xs text-slate-400">
          Daily Compound Earnings • Resets strictly at <span className="text-cyan-400 font-bold">00:00 UTC</span>
        </p>
      </div>

      {/* Toast Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Minimum Balance & UTC Cycle Info Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 space-y-1.5 shadow-lg">
        <div className="flex items-center justify-between font-bold">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Wallet className="w-4 h-4" />
            <span>Eligible Balance:</span>
          </span>
          <div className="text-right font-mono text-sm">
            <span className="text-white">
              {eligibleBalance.toFixed(2)} {activeCurrency}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
          <span>Minimum Required Balance:</span>
          <span className={isMinBalanceMet ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            20 USDT <span className="text-slate-500 font-normal">OR</span> 4,000 ETB
          </span>
        </div>
      </div>

      {/* MAIN RADIAL TIMER INTERACTIVE CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* RADIAL CIRCULAR CLOCK DISPLAY */}
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
            <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-wider">
              {grabStatus.isGrabActive
                ? `00:${grabStatus.remainingSeconds.toString().padStart(2, '0')}`
                : grabStatus.cooldownRemainingMs > 0
                ? formatCooldownTime(grabStatus.cooldownRemainingMs)
                : '01:00'}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">
              {grabStatus.isGrabActive
                ? 'Processing Order'
                : grabStatus.cooldownRemainingMs > 0
                ? 'Next UTC Reset In'
                : 'Time Remaining'}
            </span>

            {/* Movie icon in center */}
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mt-2 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Film className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Subtitles */}
        <div className="space-y-1 pt-1">
          <h3 className="text-sm font-extrabold text-white">Daily Order Grabbing</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Complete your daily order grab to generate automatic daily compound profit.
          </p>
        </div>

        {/* START GRAB BUTTON */}
        <div className="pt-2">
          <button
            onClick={handleStartGrab}
            disabled={loading || grabStatus.isGrabActive || grabStatus.cooldownRemainingMs > 0 || !isMinBalanceMet}
            className={`w-full py-4 rounded-full font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95 ${
              grabStatus.isGrabActive || grabStatus.cooldownRemainingMs > 0 || !isMinBalanceMet
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
              <span>Today's Grab Completed (Resets 00:00 UTC)</span>
            ) : !isMinBalanceMet ? (
              <span>Min Balance Required (20 USDT or 4,000 ETB)</span>
            ) : (
              <>
                <Zap className="w-5 h-5 text-white fill-white" />
                <span>Start Grab Order</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* GRAB HISTORY */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Grab Profit History</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {grabHistory.length} Records
          </span>
        </div>

        {grabHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs space-y-1">
            <p className="font-semibold text-slate-400">No grab history records yet.</p>
            <p className="text-[10px] text-slate-500">Complete your daily order grab to generate compound profit.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grabHistory.map((item: any) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <span className="font-extrabold text-white text-xs">
                        Daily Grab Profit
                      </span>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        <span>UTC Cycle: {item.utcCycleDate || 'Standard'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-400 text-sm">
                      +{Number(item.profitEarned || 0).toFixed(4)} {item.currency || (isEtbUser ? 'ETB' : 'USDT')}
                    </p>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                      Completed
                    </span>
                  </div>
                </div>

                {/* Previous -> New Balance Audit Trail */}
                <div className="flex items-center justify-between text-[11px] bg-slate-900/90 p-2 rounded-xl border border-slate-800/60 font-mono text-slate-300">
                  <span>
                    Prev: <strong className="text-slate-200">{Number(item.previousBalance || 0).toFixed(2)}</strong>
                  </span>
                  <span className="text-slate-500">→</span>
                  <span>
                    New: <strong className="text-cyan-300">{Number(item.newBalance || 0).toFixed(2)}</strong>
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 text-right">
                  {formatUtcDateTime(item.endTime || item.startTime || Date.now())}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
