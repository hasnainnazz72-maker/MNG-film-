import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatUtcDate } from '../lib/dateUtils';
import {
  Copy,
  Check,
  Users,
  ShieldCheck,
  Search,
  UserCheck,
  Sparkles,
  Calendar,
  Wallet,
  Award,
} from 'lucide-react';

interface TeamViewProps {
  onNavigate: (view: string) => void;
}

interface TeamMember {
  id: string;
  username: string;
  phone: string;
  phoneMasked: string;
  vipLevel: number;
  investment: number;
  investmentEtb?: number;
  balance: number;
  balanceEtb?: number;
  joinedAt: string;
  status: string;
  level: 'A' | 'B' | 'C';
}

export const TeamView: React.FC<TeamViewProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [activeLevelTab, setActiveLevelTab] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [stats, setStats] = useState<{
    referralCode: string;
    directMembersCount: number;
    levelBCount: number;
    levelCCount: number;
    teamMembersCount: number;
    teamDeposit: number;
    levelADeposit: number;
    levelBDeposit: number;
    levelCDeposit: number;
    estimatedCommission: number;
    levelAMembers: TeamMember[];
    levelBMembers: TeamMember[];
    levelCMembers: TeamMember[];
    allMembers: TeamMember[];
  }>({
    referralCode: user?.referralCode || 'N584281',
    directMembersCount: 0,
    levelBCount: 0,
    levelCCount: 0,
    teamMembersCount: 0,
    teamDeposit: 0,
    levelADeposit: 0,
    levelBDeposit: 0,
    levelCDeposit: 0,
    estimatedCommission: 0,
    levelAMembers: [],
    levelBMembers: [],
    levelCMembers: [],
    allMembers: [],
  });

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/team/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.referralCode) {
          setStats({
            referralCode: data.referralCode,
            directMembersCount: data.directMembersCount || 0,
            levelBCount: data.levelBCount || 0,
            levelCCount: data.levelCCount || 0,
            teamMembersCount: data.teamMembersCount || 0,
            teamDeposit: data.teamDeposit || 0,
            levelADeposit: data.levelADeposit || 0,
            levelBDeposit: data.levelBDeposit || 0,
            levelCDeposit: data.levelCDeposit || 0,
            estimatedCommission: data.estimatedCommission || 0,
            levelAMembers: data.levelAMembers || [],
            levelBMembers: data.levelBMembers || [],
            levelCMembers: data.levelCMembers || [],
            allMembers: data.allMembers || [],
          });
        }
      })
      .catch((err) => console.error('Error fetching team stats:', err))
      .finally(() => setLoading(false));
  }, [token]);

  const eligibleBalanceEtb = Math.max(user?.balanceEtb || 0, user?.investmentEtb || 0);
  const isEtbUser = eligibleBalanceEtb > 0 || (user?.balanceEtb || 0) > 0;
  const currLabel = isEtbUser ? 'ETB' : 'USDT';

  const referralCodeStr = stats.referralCode || user?.referralCode || 'N584281';
  const referralLink = `https://mngfilm.uk/#/register?ref=${referralCodeStr}`;

  const handleCopy = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Filter members according to selected level tab & search query
  const getFilteredMembers = () => {
    let list: TeamMember[] = [];
    if (activeLevelTab === 'ALL') list = stats.allMembers;
    else if (activeLevelTab === 'A') list = stats.levelAMembers;
    else if (activeLevelTab === 'B') list = stats.levelBMembers;
    else if (activeLevelTab === 'C') list = stats.levelCMembers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.username.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q) ||
          m.phoneMasked.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const filteredMembers = getFilteredMembers();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 px-3 sm:px-4">
      {/* Header */}
      <div className="text-center pt-1 space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
          Team Center & Report
        </h1>
        <p className="text-xs text-slate-400">
          Manage your 3-Tier team network, view member registrations & statistics.
        </p>
      </div>

      {/* REFERRAL CREDENTIALS CARD */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400">Your Invitation Code</p>
          <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-xl sm:text-2xl font-mono font-black text-cyan-400 tracking-wider">
              {referralCodeStr}
            </span>
            <button
              onClick={() => handleCopy(referralCodeStr, 'code')}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              {copiedCode ? <Check className="w-4 h-4 text-slate-950 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* INVITATION LINK */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400">Invitation Link</p>
          <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs font-mono text-slate-300 truncate max-w-[220px] sm:max-w-xs">
              {referralLink}
            </span>
            <button
              onClick={() => handleCopy(referralLink, 'link')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* QR CODE DISPLAY */}
        <div className="pt-1 text-center space-y-2">
          <div className="bg-white p-3 rounded-2xl inline-block shadow-inner mx-auto">
            <svg className="w-32 h-32" viewBox="0 0 100 100" fill="currentColor">
              <rect width="100" height="100" fill="#ffffff" />
              <path
                fill="#020617"
                d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z M50,15 h5 v10 h-5 z M50,35 h10 v5 h-10 z M60,50 h15 v5 h-15 z M50,60 h10 v30 h-10 z M70,60 h20 v10 h-20 z M75,80 h15 v15 h-15 z"
              />
            </svg>
          </div>
          <p className="text-xs font-bold text-slate-400">Scan QR Code to Register Under Your Team</p>
        </div>
      </div>

      {/* OVERVIEW METRICS SUMMARY */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Team</p>
          <p className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">{stats.teamMembersCount}</p>
          <p className="text-[9px] text-slate-500">Members</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Recharge</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {stats.teamDeposit.toFixed(0)}
          </p>
          <p className="text-[9px] text-slate-500">{currLabel}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Daily Task Rebate</p>
          <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {stats.estimatedCommission.toFixed(2)}
          </p>
          <p className="text-[9px] text-slate-500">{currLabel} Task Rebate</p>
        </div>
      </div>

      {/* 3 TIER COMMISSION REBATE SUMMARY */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <h3 className="text-sm font-black text-white flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>3-Tier Team Rebate Rates</span>
          </span>
          <span className="text-[11px] text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
            Automated Credit
          </span>
        </h3>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-gradient-to-b from-cyan-950/50 to-slate-950/80 border border-cyan-500/30 space-y-1">
            <p className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">Level A</p>
            <p className="text-lg font-black text-cyan-300 font-mono">14%</p>
            <p className="text-[9px] text-slate-400">Direct ({stats.directMembersCount})</p>
          </div>

          <div className="p-3 rounded-2xl bg-gradient-to-b from-blue-950/50 to-slate-950/80 border border-blue-500/30 space-y-1">
            <p className="text-[11px] font-black text-blue-400 uppercase tracking-wider">Level B</p>
            <p className="text-lg font-black text-blue-300 font-mono">7%</p>
            <p className="text-[9px] text-slate-400">Sub ({stats.levelBCount})</p>
          </div>

          <div className="p-3 rounded-2xl bg-gradient-to-b from-purple-950/50 to-slate-950/80 border border-purple-500/30 space-y-1">
            <p className="text-[11px] font-black text-purple-400 uppercase tracking-wider">Level C</p>
            <p className="text-lg font-black text-purple-300 font-mono">3%</p>
            <p className="text-[9px] text-slate-400">Tertiary ({stats.levelCCount})</p>
          </div>
        </div>
      </div>

      {/* COMPLETE TEAM REPORT SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-black text-white">Complete Team Report</h3>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phone / user..."
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-44"
            />
          </div>
        </div>

        {/* Level Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveLevelTab('ALL')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold transition-all shrink-0 text-center ${
              activeLevelTab === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Levels ({stats.teamMembersCount})
          </button>

          <button
            onClick={() => setActiveLevelTab('A')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold transition-all shrink-0 text-center ${
              activeLevelTab === 'A'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Level A ({stats.directMembersCount})
          </button>

          <button
            onClick={() => setActiveLevelTab('B')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold transition-all shrink-0 text-center ${
              activeLevelTab === 'B'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Level B ({stats.levelBCount})
          </button>

          <button
            onClick={() => setActiveLevelTab('C')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold transition-all shrink-0 text-center ${
              activeLevelTab === 'C'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Level C ({stats.levelCCount})
          </button>
        </div>

        {/* Member List */}
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="text-center py-8 text-slate-500 text-xs">Loading team report...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
              <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-300">
                {activeLevelTab === 'ALL'
                  ? 'No registered team members found.'
                  : `No Level ${activeLevelTab} members registered yet.`}
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Share your invitation link or code with friends to build your 3-tier earning team!
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const levelBadgeColor =
                member.level === 'A'
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : member.level === 'B'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : 'bg-purple-500/20 text-purple-400 border-purple-500/40';

              return (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-white shrink-0 shadow">
                      {member.username.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">{member.username}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${levelBadgeColor}`}>
                          Level {member.level}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30">
                          VIP {member.vipLevel}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Phone: {member.phoneMasked}</span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {formatUtcDate(member.joinedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-slate-500">Recharge / Capital</p>
                      <p className="font-mono font-black text-emerald-400 text-xs">{(member.investment || 0).toFixed(2)} USDT</p>
                      {member.investmentEtb !== undefined && member.investmentEtb !== null && (
                        <p className="font-mono font-bold text-emerald-300 text-[10px]">{(member.investmentEtb || 0).toFixed(2)} ETB</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-slate-500">Current Balance</p>
                      <p className="font-mono font-black text-cyan-300 text-xs">{(member.balance || 0).toFixed(2)} USDT</p>
                      {member.balanceEtb !== undefined && member.balanceEtb !== null && (
                        <p className="font-mono font-bold text-emerald-300 text-[10px]">{(member.balanceEtb || 0).toFixed(2)} ETB</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};


