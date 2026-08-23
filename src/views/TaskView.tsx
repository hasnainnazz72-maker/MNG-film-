import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FilmInvestment, FilmInvestmentPlan, FILM_INVESTMENT_PLANS } from '../types';
import { formatUtcDateTime } from '../lib/dateUtils';
import {
  Film,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ClipboardCheck,
  Wallet,
  Coins,
  DollarSign,
  HelpCircle,
  Lock,
  Layers,
  Award
} from 'lucide-react';

interface TaskViewProps {
  onNavigate: (view: string) => void;
}

export const TaskView: React.FC<TaskViewProps> = ({ onNavigate }) => {
  const { user, refreshUserData, t } = useAuth();

  // Active view tab: 'film_invest' or 'daily_task'
  const [activeTab, setActiveTab] = useState<'film_invest' | 'daily_task'>('film_invest');

  // Film investments data
  const [plans, setPlans] = useState<FilmInvestmentPlan[]>(FILM_INVESTMENT_PLANS);
  const [myInvestments, setMyInvestments] = useState<FilmInvestment[]>([]);
  const [investmentsLoading, setInvestmentsLoading] = useState<boolean>(false);
  const [historyTab, setHistoryTab] = useState<'active' | 'completed'>('active');

  // Investment Modal State
  const [selectedPlan, setSelectedPlan] = useState<FilmInvestmentPlan | null>(null);
  const [investCurrency, setInvestCurrency] = useState<'ETB' | 'USDT'>('ETB');
  const [investAmount, setInvestAmount] = useState<string>('2000');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Fetch investments
  const fetchMyInvestments = async () => {
    if (!user) return;
    try {
      setInvestmentsLoading(true);
      const res = await fetch('/api/film-investments/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('nexgrab_token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.investments) {
          setMyInvestments(data.investments);
        }
      }
    } catch (err) {
      console.error('Failed to fetch film investments:', err);
    } finally {
      setInvestmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInvestments();
  }, [user]);

  // Open modal with plan
  const handleOpenInvest = (plan: FilmInvestmentPlan) => {
    setSelectedPlan(plan);
    setSubmitError(null);
    setSubmitSuccess(null);
    setInvestCurrency('ETB');
    setInvestAmount(plan.minInvestmentEtb.toString());
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedPlan(null);
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitting(false);
  };

  // Switch currency in modal
  const handleCurrencyChange = (curr: 'ETB' | 'USDT') => {
    setInvestCurrency(curr);
    setSubmitError(null);
    if (selectedPlan) {
      setInvestAmount(curr === 'ETB' ? selectedPlan.minInvestmentEtb.toString() : selectedPlan.minInvestmentUsdt.toString());
    }
  };

  // Quick preset amount select
  const handlePresetAmount = (amt: number) => {
    setInvestAmount(amt.toString());
    setSubmitError(null);
  };

  // Set maximum available balance
  const handleSetMaxAmount = () => {
    if (!user) return;
    if (investCurrency === 'ETB') {
      const bal = Math.floor(user.balanceEtb || 0);
      setInvestAmount(bal > 0 ? bal.toString() : '0');
    } else {
      const bal = Number((user.balance || 0).toFixed(2));
      setInvestAmount(bal > 0 ? bal.toString() : '0');
    }
  };

  // Submit investment
  const handleSubmitInvest = async () => {
    if (!selectedPlan || !user) return;
    const num = Number(investAmount);
    const isEtb = investCurrency === 'ETB';
    const minReq = isEtb ? selectedPlan.minInvestmentEtb : selectedPlan.minInvestmentUsdt;

    if (!num || isNaN(num) || num <= 0) {
      setSubmitError('Please enter a valid investment amount.');
      return;
    }
    if (num < minReq) {
      setSubmitError(`Minimum investment for ${selectedPlan.name} is ${minReq.toLocaleString()} ${investCurrency}.`);
      return;
    }

    const currentBal = isEtb ? (user.balanceEtb || 0) : (user.balance || 0);
    if (currentBal < num) {
      setSubmitError(`Insufficient ${investCurrency} balance. You have ${currentBal.toLocaleString()} ${investCurrency}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const res = await fetch('/api/film-investments/invest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('nexgrab_token')}`,
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          amount: num,
          currency: investCurrency,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to start investment.');
      }

      setSubmitSuccess(`🎉 Successfully invested ${num.toLocaleString()} ${investCurrency} into ${selectedPlan.name}!`);
      await refreshUserData();
      await fetchMyInvestments();

      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    } catch (err: any) {
      setSubmitError(err.message || 'Investment transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered investments
  const activeInvestments = myInvestments.filter((inv) => inv.status === 'active');
  const completedInvestments = myInvestments.filter((inv) => inv.status === 'completed');

  // Live calculations for modal preview
  const numInput = Number(investAmount) || 0;
  const planRate = selectedPlan ? selectedPlan.dailyProfitPercent / 100 : 0;
  const calcDailyProfit = Number((numInput * planRate).toFixed(2));
  const calcTotalProfit = selectedPlan ? Number((numInput * planRate * selectedPlan.durationDays).toFixed(2)) : 0;
  const calcTotalReturn = Number((numInput + calcTotalProfit).toFixed(2));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 px-3 sm:px-4">
      {/* Top Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Film className="w-7 h-7 text-cyan-400" />
            <span>Task Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Film Syndicate Investment & Daily Box Office Tasks
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-2xl w-full sm:w-auto shadow-lg">
          <button
            onClick={() => setActiveTab('film_invest')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'film_invest'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Film Investment</span>
          </button>
          <button
            onClick={() => setActiveTab('daily_task')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'daily_task'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Daily Tasks</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: FILM INVESTMENT PLANS */}
      {activeTab === 'film_invest' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* User Balances Bar */}
          {user && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Available Balances</span>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-sm sm:text-base font-black text-emerald-400">
                      {(user.balanceEtb || 0).toLocaleString()} ETB
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-sm sm:text-base font-black text-cyan-400">
                      {(user.balance || 0).toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('recharge')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  + Deposit Funds
                </button>
              </div>
            </div>
          )}

          {/* Film Investment Plans Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Featured Film Investment Plans</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Select a syndicate production term to earn verified daily profit with automatic principal return.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => {
                const is7Day = plan.durationDays === 7;
                const totalProfitPercent = (plan.dailyProfitPercent * plan.durationDays).toFixed(1);

                return (
                  <div
                    key={plan.id}
                    className="group relative bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-cyan-500/50 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col"
                  >
                    {/* Top Film Poster Banner */}
                    <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-950">
                      <img
                        src={plan.imageUrl}
                        alt={plan.filmTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                      {/* Plan Duration Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-black shadow-lg">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{plan.durationDays}-Day Term</span>
                      </div>

                      {/* Daily Yield Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-lg">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{plan.dailyProfitPercent}% Daily</span>
                      </div>

                      {/* Title Overlay */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">
                          {plan.name}
                        </span>
                        <h3 className="text-lg font-black text-white truncate drop-shadow-md">
                          {plan.filmTitle}
                        </h3>
                      </div>
                    </div>

                    {/* Plan Details Body */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5">
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {plan.description}
                      </p>

                      {/* Metrics Summary Grid */}
                      <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Daily Rate</span>
                          <span className="text-sm sm:text-base font-black text-cyan-400">
                            {plan.dailyProfitPercent}%
                          </span>
                        </div>
                        <div className="text-center border-x border-slate-800">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Yield</span>
                          <span className="text-sm sm:text-base font-black text-emerald-400">
                            +{totalProfitPercent}%
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Min Deposit</span>
                          <span className="text-xs sm:text-sm font-black text-amber-400">
                            {plan.minInvestmentEtb.toLocaleString()} ETB
                          </span>
                        </div>
                      </div>

                      {/* Example Return Callout */}
                      <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-slate-300">
                        <Award className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-white">Guaranteed Return Example:</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Invest 10,000 ETB → Receive{' '}
                            <strong className="text-cyan-300">
                              {(10000 * (plan.dailyProfitPercent / 100)).toLocaleString()} ETB/day
                            </strong>
                            . Total <strong className="text-emerald-400">
                              {(10000 + 10000 * (plan.dailyProfitPercent / 100) * plan.durationDays).toLocaleString()} ETB
                            </strong> returned automatically on Day {plan.durationDays}.
                          </p>
                        </div>
                      </div>

                      {/* Action CTA Button */}
                      <button
                        onClick={() => handleOpenInvest(plan)}
                        className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 hover:text-white shadow-lg shadow-cyan-500/25 active:scale-95 transition-all duration-200"
                      >
                        <span>Invest Now in {plan.durationDays}-Day Plan</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MY FILM INVESTMENTS PORTFOLIO */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>My Film Portfolio</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Track your active locked contracts and matured returns.
                </p>
              </div>

              {/* Subtabs */}
              <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
                <button
                  onClick={() => setHistoryTab('active')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    historyTab === 'active'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active ({activeInvestments.length})
                </button>
                <button
                  onClick={() => setHistoryTab('completed')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    historyTab === 'completed'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Completed ({completedInvestments.length})
                </button>
              </div>
            </div>

            {/* List */}
            {historyTab === 'active' ? (
              activeInvestments.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                    <Film className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Active Film Investments</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You currently do not have any running film investments. Choose a 7-day or 30-day plan above to start earning daily returns!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeInvestments.map((inv) => {
                    const nowMs = Date.now();
                    const totalDurationMs = inv.endTimeMs - inv.startTimeMs;
                    const elapsedMs = Math.max(0, nowMs - inv.startTimeMs);
                    const progressPercent = Math.min(100, Math.floor((elapsedMs / totalDurationMs) * 100));
                    const remainingHours = Math.max(0, Math.ceil((inv.endTimeMs - nowMs) / (1000 * 60 * 60)));
                    const remainingDays = Math.ceil(remainingHours / 24);

                    return (
                      <div
                        key={inv.id}
                        className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex-shrink-0">
                              <img
                                src={inv.filmPoster}
                                alt={inv.filmTitle}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider">
                                  {inv.planName}
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                              </div>
                              <h4 className="text-sm font-bold text-white truncate max-w-[180px]">
                                {inv.filmTitle}
                              </h4>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-black uppercase">
                            Active
                          </span>
                        </div>

                        {/* Financial figures */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Principal Locked</span>
                            <span className="font-black text-white">
                              {inv.amount.toLocaleString()} {inv.currency}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Daily Yield Rate</span>
                            <span className="font-black text-emerald-400">
                              +{inv.dailyProfitAmount.toLocaleString()} {inv.currency} / day
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Total Profit</span>
                            <span className="font-black text-emerald-400">
                              +{inv.totalProfitAmount.toLocaleString()} {inv.currency}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Return on Maturity</span>
                            <span className="font-black text-cyan-300">
                              {inv.totalReturnAmount.toLocaleString()} {inv.currency}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Term Progress</span>
                            <span className="font-bold text-cyan-400">
                              {progressPercent}% ({remainingDays} {remainingDays === 1 ? 'day' : 'days'} left)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Started: {formatUtcDateTime(inv.startDate)}</span>
                            <span>Matures: {formatUtcDateTime(inv.endDate)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              completedInvestments.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Completed Investments Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When your investment reaches its 7 or 30-day maturity date, the principal and all accumulated profit will be credited automatically.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedInvestments.map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase">
                              {inv.planName} (Completed)
                            </span>
                            <h4 className="text-sm font-bold text-white truncate max-w-[180px]">
                              {inv.filmTitle}
                            </h4>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase">
                          Matured & Returned
                        </span>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Principal Returned:</span>
                          <span className="font-bold text-white">
                            {inv.amount.toLocaleString()} {inv.currency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Profit Credited:</span>
                          <span className="font-bold text-emerald-400">
                            +{inv.totalProfitAmount.toLocaleString()} {inv.currency}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-800">
                          <span className="font-semibold text-slate-300">Total Credited to Account:</span>
                          <span className="font-black text-cyan-300">
                            {inv.totalReturnAmount.toLocaleString()} {inv.currency}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 text-right">
                        Settled on: {formatUtcDateTime(inv.completedAt || inv.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* RULES & SAFETY ACCORDION */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Film Syndicate Rules & Safeguards</span>
            </h4>
            <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
              <li>
                <strong>7-Day Term:</strong> Generates 3.0% daily profit for 7 days. Total return equals 121.0% of principal.
              </li>
              <li>
                <strong>30-Day Term:</strong> Generates 3.5% daily profit for 30 days. Total return equals 205.0% of principal.
              </li>
              <li>
                <strong>Automatic Maturity:</strong> Upon completing the investment cycle, your original principal and total profit are automatically credited directly to your available balance.
              </li>
              <li>
                <strong>Safe Separation:</strong> Film Investment is an independent yield mechanism and does not affect your daily Grab eligibility.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* VIEW 2: DAILY TASKS (ORDER GRABBING) */}
      {activeTab === 'daily_task' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 space-y-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Circular glowing illustration with clipboard icon */}
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-cyan-500/10 border-2 border-cyan-400/30 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-2xl">
                <div className="relative p-4 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                  <ClipboardCheck className="w-12 h-12 text-cyan-300" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-black shadow-lg">
                    ↓
                  </div>
                </div>
              </div>
            </div>

            {/* Card Text Content */}
            <div className="space-y-2">
              <h2 className="text-lg font-black text-white tracking-wide">
                Daily Order Grabbing
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Complete your daily box office order tasks to earn continuous commissions based on your VIP level and investment balance.
              </p>
            </div>

            {/* PILL BUTTON */}
            <div>
              <button
                onClick={() => onNavigate('grab')}
                className="w-full py-4 rounded-full font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95"
              >
                <span>Go to Grab Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVESTMENT MODAL DIALOG */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">
                  Film Syndicate Subscription
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {selectedPlan.name} ({selectedPlan.durationDays} Days)
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Currency Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Select Currency</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCurrencyChange('ETB')}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                    investCurrency === 'ETB'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>ETB Bank Balance</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCurrencyChange('USDT')}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                    investCurrency === 'USDT'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                  <span>USDT Crypto Balance</span>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-300">Investment Amount</label>
                <div className="text-slate-400">
                  <span>Available: </span>
                  <strong className="text-white">
                    {investCurrency === 'ETB'
                      ? `${(user?.balanceEtb || 0).toLocaleString()} ETB`
                      : `${(user?.balance || 0).toFixed(2)} USDT`}
                  </strong>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={investAmount}
                  onChange={(e) => {
                    setInvestAmount(e.target.value);
                    setSubmitError(null);
                  }}
                  min={investCurrency === 'ETB' ? selectedPlan.minInvestmentEtb : selectedPlan.minInvestmentUsdt}
                  placeholder={`Min ${investCurrency === 'ETB' ? selectedPlan.minInvestmentEtb : selectedPlan.minInvestmentUsdt}`}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-2xl px-4 py-3.5 text-white font-black text-base outline-none transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={handleSetMaxAmount}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs font-bold transition-colors"
                >
                  MAX
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {investCurrency === 'ETB' ? (
                  [2000, 5000, 10000, 20000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        investAmount === amt.toString()
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {amt.toLocaleString()} ETB
                    </button>
                  ))
                ) : (
                  [20, 50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        investAmount === amt.toString()
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {amt} USDT
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Real-time Calculation Breakdown Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Daily Profit Rate:</span>
                <span className="font-bold text-cyan-400">{selectedPlan.dailyProfitPercent}% / day</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Expected Daily Profit:</span>
                <span className="font-bold text-emerald-400">
                  +{calcDailyProfit.toLocaleString()} {investCurrency} / day
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Total Expected Profit ({selectedPlan.durationDays} Days):</span>
                <span className="font-bold text-emerald-400">
                  +{calcTotalProfit.toLocaleString()} {investCurrency}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-200">Total Return upon Maturity:</span>
                <span className="font-black text-sm text-cyan-300">
                  {calcTotalReturn.toLocaleString()} {investCurrency}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                * Principal ({numInput.toLocaleString()} {investCurrency}) + Profit ({calcTotalProfit.toLocaleString()} {investCurrency}) returned in full at maturity.
              </p>
            </div>

            {/* Error / Success Feedback */}
            {submitError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
            {submitSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="w-1/3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitInvest}
                disabled={isSubmitting || !!submitSuccess}
                className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confirm & Lock Investment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
