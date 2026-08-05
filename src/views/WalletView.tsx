import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Crown,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

interface WalletViewProps {
  onNavigate: (view: string) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ onNavigate }) => {
  const { user, token, grabStatus, refreshUserData, t } = useAuth();
  const [activeTab, setActiveTab] = useState<'recharges' | 'withdrawals' | 'transactions'>('recharges');
  const [recharges, setRecharges] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchHistory = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecharges(data.recharges || []);
        setWithdrawals(data.withdrawals || []);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch wallet history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    refreshUserData();
  }, [token]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-semibold">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Pending Admin</span>
          </span>
        );
      case 'rejected':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-semibold">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Wallet Overview Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">My Financial Wallet</h2>
              <p className="text-xs text-slate-400">USDT Asset Management</p>
            </div>
          </div>
          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition-colors"
            title="Refresh Balances"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 6 Key Wallet Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-medium text-slate-400">{t('availableBalance')}</p>
            <p className="text-2xl font-black text-cyan-400">{(user?.balance || 0).toFixed(2)} USDT</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-medium text-slate-400">{t('investmentAmount')}</p>
            <p className="text-2xl font-black text-white">{(user?.investment || 0).toFixed(2)} USDT</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-medium text-slate-400">{t('todayProfit')}</p>
            <p className="text-2xl font-black text-emerald-400">+{(user?.todayProfit || 0).toFixed(2)} USDT</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-medium text-slate-400">{t('totalProfit')}</p>
            <p className="text-2xl font-black text-emerald-400">+{(user?.totalProfit || 0).toFixed(2)} USDT</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-medium text-slate-400">{t('currentVipLevel')}</p>
            <div className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <p className="text-2xl font-black text-amber-300">VIP {user?.vipLevel || 1}</p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-medium text-slate-400">{t('todayGrabStatus')}</p>
            <div className="pt-1">
              {grabStatus.isGrabActive ? (
                <span className="text-xs font-bold text-cyan-400 animate-pulse">Matching Order...</span>
              ) : grabStatus.cooldownRemainingMs > 0 ? (
                <span className="text-xs font-bold text-emerald-400">Completed Today</span>
              ) : (
                <span className="text-xs font-bold text-amber-400">Ready to Grab</span>
              )}
            </div>
          </div>
        </div>

        {/* Recharge / Withdraw Quick Action Buttons */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={() => onNavigate('recharge')}
            className="flex-1 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>{t('recharge')} USDT</span>
          </button>
          <button
            onClick={() => onNavigate('withdraw')}
            className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <ArrowUpCircle className="w-4 h-4 text-amber-400" />
            <span>{t('withdrawal')} USDT</span>
          </button>
        </div>
      </div>

      {/* History Ledger Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('recharges')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'recharges'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Recharge History ({recharges.length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'withdrawals'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Withdrawal History ({withdrawals.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'transactions'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Ledger Transactions ({transactions.length})
          </button>
        </div>

        {/* Tab 1: Recharges Table */}
        {activeTab === 'recharges' && (
          <div className="space-y-3">
            {recharges.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No recharge history records found.</div>
            ) : (
              recharges.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{rec.amount} USDT</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono">
                        {rec.network}
                      </span>
                    </div>
                    <p className="text-slate-400 font-mono text-[11px]">TXID: {rec.txid}</p>
                    <p className="text-[10px] text-slate-500">{new Date(rec.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="sm:text-right space-y-1">
                    {renderStatusBadge(rec.status)}
                    {rec.adminNote && <p className="text-[10px] text-rose-300 italic">Note: {rec.adminNote}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Withdrawals Table */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-3">
            {withdrawals.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No withdrawal history records found.</div>
            ) : (
              withdrawals.map((wd) => (
                <div
                  key={wd.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{wd.amount} USDT</span>
                      <span className="text-[11px] text-slate-400">(Net: {wd.netAmount} USDT | Fee: {wd.fee} USDT)</span>
                    </div>
                    <p className="text-slate-400 font-mono text-[11px]">Address: {wd.walletAddress}</p>
                    <p className="text-[10px] text-slate-500">{new Date(wd.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="sm:text-right space-y-1">
                    {renderStatusBadge(wd.status)}
                    {wd.adminNote && <p className="text-[10px] text-rose-300 italic">Note: {wd.adminNote}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Transactions Ledger Table */}
        {activeTab === 'transactions' && (
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No transaction log entries found.</div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{tx.description}</p>
                    <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.amount >= 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} USDT
                    </p>
                    <p className="text-[10px] text-slate-500">After: {tx.balanceAfter.toFixed(2)} USDT</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
