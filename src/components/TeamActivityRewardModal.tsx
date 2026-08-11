import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Users,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  AlertTriangle,
  FileText,
  ShieldCheck,
  X,
  RotateCw,
  Gift,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { TEAM_ACTIVITY_REWARD_TABLE } from '../types';

interface TeamActivityRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamActivityRewardModal: React.FC<TeamActivityRewardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { token, refreshUserData } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [claimingMilestone, setClaimingMilestone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/team-activity-reward/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        setError(data.error || 'Failed to load Team Activity Reward data.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, token]);

  const handleClaim = async (milestone: number) => {
    if (!token) return;
    setClaimingMilestone(milestone);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/team-activity-reward/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ milestone }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || `Successfully claimed ${data.claim?.rewardEtb?.toLocaleString()} ETB!`);
        refreshUserData();
        fetchStats();
      } else {
        setError(data.error || 'Claim failed.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error executing claim.');
    } finally {
      setClaimingMilestone(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-red-950/90 border border-amber-500/40 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative text-slate-100 p-4 sm:p-6 space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER BRANDING */}
        <div className="text-center space-y-2 pt-2 relative overflow-hidden">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-red-600/20 to-amber-400/20 border border-amber-500/40 shadow-lg shadow-amber-500/10 mb-1">
            <Award className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 uppercase tracking-wide flex items-center justify-center gap-2">
            <span>★</span>
            <span>TEAM ACTIVITY REWARD</span>
            <span>★</span>
          </h2>

          <div className="inline-block px-3 py-1 rounded-full bg-red-950/80 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider shadow">
            Minimum Recharge to be Active Member: 4,000 ETB
          </div>
        </div>

        {/* ALERT MESSAGES */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 shadow">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 shadow">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ACTIVE MEMBERS BREAKDOWN CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center space-y-1 shadow">
            <p className="text-[10px] text-amber-300 font-medium">Total Active (A+B+C)</p>
            <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {loading ? '-' : stats?.totalActive || 0}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow">
            <p className="text-[10px] text-slate-400 font-medium">Level A Active</p>
            <p className="text-lg font-bold text-cyan-400 font-mono">
              {loading ? '-' : stats?.levelAActive || 0}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow">
            <p className="text-[10px] text-slate-400 font-medium">Level B Active</p>
            <p className="text-lg font-bold text-indigo-400 font-mono">
              {loading ? '-' : stats?.levelBActive || 0}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow">
            <p className="text-[10px] text-slate-400 font-medium">Level C Active</p>
            <p className="text-lg font-bold text-emerald-400 font-mono">
              {loading ? '-' : stats?.levelCActive || 0}
            </p>
          </div>
        </div>

        {/* NEXT MILESTONE PROGRESS CARD */}
        {stats?.nextMilestone && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/60 border border-amber-500/30 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Next Milestone:</span>
                <strong className="text-amber-300 font-mono">{stats.nextMilestone} Active Members</strong>
              </span>
              <span className="font-black text-emerald-400 font-mono text-sm">
                Reward: {stats.nextRewardEtb?.toLocaleString()} ETB
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Current Progress</span>
                <span>{stats.totalActive} / {stats.nextMilestone} Members ({Math.min(100, Math.round((stats.totalActive / stats.nextMilestone) * 100))}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500 shadow-lg shadow-amber-500/30"
                  style={{ width: `${Math.min(100, (stats.totalActive / stats.nextMilestone) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* TEAM ACTIVITY REWARD TABLE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Gift className="w-4 h-4" />
              <span>Reward Milestone Schedule</span>
            </h3>
            <span className="text-[10px] text-slate-400">All Rewards in ETB</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-950/80 shadow-xl">
            <div className="grid grid-cols-12 bg-gradient-to-r from-red-950 to-amber-950 border-b border-amber-500/30 px-3 py-2.5 text-[11px] font-black text-amber-300 uppercase tracking-wider">
              <div className="col-span-5 flex items-center gap-1">
                <span>Active Members</span>
              </div>
              <div className="col-span-4 text-right">
                <span>Rewards (ETB)</span>
              </div>
              <div className="col-span-3 text-center">
                <span>Status</span>
              </div>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
              {TEAM_ACTIVITY_REWARD_TABLE.map((item) => {
                const milestoneData = stats?.milestones?.find((m: any) => m.requiredActive === item.requiredActive);
                const isClaimed = milestoneData?.isClaimed || false;
                const isEligible = milestoneData?.isEligible || false;
                const isClaiming = claimingMilestone === item.requiredActive;

                return (
                  <div
                    key={item.requiredActive}
                    className={`grid grid-cols-12 px-3 py-2.5 items-center text-xs transition-colors ${
                      isEligible
                        ? 'bg-amber-500/10 hover:bg-amber-500/15'
                        : isClaimed
                        ? 'bg-emerald-950/20'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Active members count */}
                    <div className="col-span-5 font-bold font-mono text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                      <span>{item.requiredActive.toLocaleString()}</span>
                    </div>

                    {/* Reward Amount */}
                    <div className="col-span-4 text-right font-black font-mono text-amber-300">
                      {item.rewardEtb.toLocaleString()} ETB
                    </div>

                    {/* Claim Button / Status */}
                    <div className="col-span-3 text-center">
                      {isClaimed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Claimed</span>
                        </span>
                      ) : isEligible ? (
                        <button
                          onClick={() => handleClaim(item.requiredActive)}
                          disabled={isClaiming}
                          className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1 mx-auto"
                        >
                          {isClaiming ? (
                            <RotateCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3 fill-slate-950" />
                          )}
                          <span>Claim</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-semibold">
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CLAIM HISTORY SECTION */}
        {stats?.claimHistory && stats.claimHistory.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Claim History ({stats.claimHistory.length})</span>
            </h3>

            <div className="space-y-2">
              {stats.claimHistory.map((claim: any) => (
                <div
                  key={claim.id}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-amber-400">★</span>
                      <span>{claim.milestone} Active Members Milestone</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      TxID: {claim.txId} • {new Date(claim.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-400 font-mono text-sm">
                      +{claim.rewardEtb?.toLocaleString()} ETB
                    </p>
                    <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IMPORTANT NOTES BOX (VERBATIM TEXT REQUIRED BY SPEC) */}
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200/90 text-xs space-y-2 shadow-lg">
          <div className="flex items-center gap-2 font-black text-amber-300 uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>IMPORTANT NOTES</span>
          </div>
          <p className="leading-relaxed text-[11px] text-amber-100/80">
            “Only members who have successfully recharged and maintain a minimum balance of 4,000 ETB will be counted as Active Members. If a member withdraws funds and their balance drops below 4,000 ETB, they will no longer count as an Active Member. Recharging again and maintaining a balance of 4,000 ETB or more will make them count again.”
          </p>
        </div>

        {/* REWARD REGISTRATION GUIDE & REMARKS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-cyan-400 text-[11px] uppercase">
              <FileText className="w-3.5 h-3.5" />
              <span>Reward Registration Guide</span>
            </div>
            <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1">
              <li>Click on "Claim" button when milestone reached.</li>
              <li>Your reward will be credited directly to your ETB wallet.</li>
            </ol>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px] uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Important Remarks</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Each user is allowed only one account. Duplicate account manipulation will result in disqualification. MNG FILM retains final interpretation rights.
            </p>
          </div>
        </div>

        {/* FOOTER SLOGAN */}
        <div className="text-center pt-2 pb-1 border-t border-amber-500/20">
          <p className="text-[11px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 uppercase">
            ONE TEAM ♥ ONE VISION ♥ ONE SUCCESS
          </p>
        </div>
      </div>
    </div>
  );
};
