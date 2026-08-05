import React from 'react';
import { useAuth } from '../context/AuthContext';
import { VIP_PLANS } from '../types';
import { Crown, CheckCircle2, ArrowRight, ShieldCheck, Users, Zap, TrendingUp } from 'lucide-react';

interface VipViewProps {
  onNavigate: (view: string) => void;
}

export const VipView: React.FC<VipViewProps> = ({ onNavigate }) => {
  const { user, t } = useAuth();
  const userVip = user?.vipLevel || 1;
  const userInvestment = user?.investment || 0;
  const directMembers = user?.directMembersCount || 0;

  return (
    <div className="space-y-6 pb-20">
      {/* VIP Overview Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <Crown className="w-3.5 h-3.5" />
          <span>Tiered VIP Profit Engine</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">VIP Membership Tiers</h1>
        <p className="text-xs md:text-sm text-slate-400">
          VIP plans unlock higher daily profit percentages on order grabbing. Upgrades occur automatically when capital and team requirements are satisfied.
        </p>
      </div>

      {/* User Current Qualification Tracker Card */}
      {user && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs text-slate-400 font-medium">Your Active Plan</span>
              <div className="flex items-center gap-2 pt-1">
                <Crown className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-extrabold text-amber-300">VIP {userVip} Tier</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('recharge')}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Deposit Capital
              </button>
              <button
                onClick={() => onNavigate('team')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Invite Direct Team
              </button>
            </div>
          </div>

          {/* Capital & Direct Members Progress Bar towards Next VIP */}
          {userVip < 5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              {(() => {
                const nextPlan = VIP_PLANS.find((p) => p.level === userVip + 1)!;
                const invPercent = Math.min(Math.round((userInvestment / nextPlan.minInvestment) * 100), 100);
                const teamPercent = Math.min(Math.round((directMembers / nextPlan.reqDirectMembers) * 100), 100);

                return (
                  <>
                    <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-300">Target Capital for VIP {nextPlan.level}</span>
                        <span className="text-cyan-400">{userInvestment} / {nextPlan.minInvestment} USDT</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-cyan-400 h-full transition-all" style={{ width: `${invPercent}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-300">Direct Members for VIP {nextPlan.level}</span>
                        <span className="text-amber-400">{directMembers} / {nextPlan.reqDirectMembers} Members</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-400 h-full transition-all" style={{ width: `${teamPercent}%` }} />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* VIP Tier Cards Grid (VIP 1 - VIP 5) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {VIP_PLANS.map((plan) => {
          const isCurrent = userVip === plan.level;
          return (
            <div
              key={plan.level}
              className={`rounded-3xl p-5 flex flex-col justify-between space-y-5 transition-all relative overflow-hidden ${
                isCurrent
                  ? 'bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-400 shadow-2xl shadow-amber-500/20'
                  : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  Active
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className={`w-5 h-5 ${isCurrent ? 'text-amber-400' : 'text-slate-400'}`} />
                  <h3 className="text-lg font-black text-white">{plan.name}</h3>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-center">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Daily Profit</span>
                  <p className="text-2xl font-black text-emerald-400">+{plan.dailyProfitPercent}%</p>
                </div>

                <div className="space-y-2 text-xs text-slate-300 pt-1">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Min Investment:</span>
                    <span className="font-bold text-white">{plan.minInvestment} USDT</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Max Investment:</span>
                    <span className="font-bold text-white">{plan.maxInvestment.toLocaleString()} USDT</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Direct Members:</span>
                    <span className="font-bold text-amber-300">{plan.reqDirectMembers}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                {isCurrent ? (
                  <button
                    onClick={() => onNavigate('grab')}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Grab Order</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('recharge')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Upgrade</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
