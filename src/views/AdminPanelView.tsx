import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatUtcDateTime } from '../lib/dateUtils';
import {
  Shield,
  ShieldCheck,
  Users,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Settings,
  Megaphone,
  Headphones,
  Activity,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Trash2,
  Edit,
  RotateCw,
  AlertTriangle,
  Lock,
  Key,
  LogOut,
  Database,
  Download,
  RefreshCw,
  HardDrive,
  Save,
} from 'lucide-react';

export const AdminPanelView: React.FC = () => {
  const { adminToken, adminUser, adminLogin, adminLogout } = useAuth();

  // Admin Login Inputs MUST BE ABSOLUTELY EMPTY ON LOAD (Strict Security Mandate)
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Active Admin Section Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'members' | 'recharges' | 'withdrawals' | 'announcements' | 'tickets' | 'settings' | 'logs' | 'backups'
  >('overview');

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [recharges, setRecharges] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [backupActionStatus, setBackupActionStatus] = useState<string | null>(null);

  // Filters
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // Modals / Actions
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState<string>('');
  const [balanceAdjustType, setBalanceAdjustType] = useState<'add' | 'deduct'>('add');
  const [balanceAdjustCurrency, setBalanceAdjustCurrency] = useState<'ETB' | 'USDT'>('ETB');
  const [balanceAdjustReason, setBalanceAdjustReason] = useState<string>('');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Password Reset State
  const [passwordResetMember, setPasswordResetMember] = useState<any | null>(null);
  const [newMemberPassword, setNewMemberPassword] = useState<string>('');
  const [newMemberFundPassword, setNewMemberFundPassword] = useState<string>('');

  const [annTitle, setAnnTitle] = useState<string>('');
  const [annContent, setAnnContent] = useState<string>('');

  const [replyText, setReplyText] = useState<string>('');

  // Admin Handle Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.trim(), password: passwordInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Admin authentication failed');
      }

      adminLogin(data.token, data.admin);
      setUsernameInput('');
      setPasswordInput('');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Fetch Admin Data
  const fetchDashboard = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/members?search=${encodeURIComponent(memberSearch)}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecharges = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/recharges', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecharges(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWithdrawals = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/withdrawals', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/tickets', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/activity-logs', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/admin/backups', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchDashboard();
      fetchMembers();
      fetchRecharges();
      fetchWithdrawals();
      fetchTickets();
      fetchLogs();
      fetchBackups();
    }
  }, [adminToken, activeTab]);

  const handleCreateBackup = async () => {
    try {
      setBackupActionStatus('Creating daily database backup snapshot...');
      const res = await fetch('/api/admin/backups/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        setBackupActionStatus('Backup snapshot created successfully!');
        fetchBackups();
        fetchDashboard();
        setTimeout(() => setBackupActionStatus(null), 3000);
      } else {
        setBackupActionStatus('Failed to create backup snapshot.');
      }
    } catch (err) {
      console.error(err);
      setBackupActionStatus('Error creating backup.');
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to restore the database from snapshot "${filename}"? Current unbacked data will be safety snapshot prior to restore.`)) {
      return;
    }

    try {
      setBackupActionStatus(`Restoring database from snapshot ${filename}...`);
      const res = await fetch('/api/admin/backups/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ filename }),
      });

      if (res.ok) {
        setBackupActionStatus('Database restored successfully! Reloading data...');
        fetchBackups();
        fetchDashboard();
        fetchMembers();
        fetchRecharges();
        fetchWithdrawals();
        setTimeout(() => setBackupActionStatus(null), 4000);
      } else {
        const errData = await res.json();
        setBackupActionStatus(`Restore failed: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      setBackupActionStatus('Error restoring database backup.');
    }
  };

  // Actions
  const handleProcessRecharge = async (id: string, action: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/recharges/${id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action, note: action === 'approved' ? 'Approved' : 'Rejected' }),
      });
      if (res.ok) {
        fetchRecharges();
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessWithdrawal = async (id: string, action: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action, note: action === 'approved' ? 'Approved' : 'Rejected' }),
      });
      if (res.ok) {
        fetchWithdrawals();
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !balanceAdjustAmount || !balanceAdjustReason) return;

    try {
      const res = await fetch(`/api/admin/members/${selectedMember.id}/adjust-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          amount: Number(balanceAdjustAmount),
          type: balanceAdjustType,
          currency: balanceAdjustCurrency,
          reason: balanceAdjustReason,
        }),
      });

      if (res.ok) {
        setBalanceAdjustAmount('');
        setBalanceAdjustReason('');
        setSelectedMember(null);
        fetchMembers();
        fetchDashboard();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to adjust balance');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error submitting balance adjustment');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetMember) return;
    if (!newMemberPassword.trim() && !newMemberFundPassword.trim()) {
      alert('Please enter a new login password or new fund password.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/members/${passwordResetMember.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          newPassword: newMemberPassword.trim() || undefined,
          newFundPassword: newMemberFundPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Password updated successfully for member ${passwordResetMember.username}`);
        setPasswordResetMember(null);
        setNewMemberPassword('');
        setNewMemberFundPassword('');
        fetchMembers();
      } else {
        alert(data.error || 'Failed to update password');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error updating password');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ title: annTitle, content: annContent, isImportant: true }),
      });

      if (res.ok) {
        setAnnTitle('');
        setAnnContent('');
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // IF NOT AUTHENTICATED AS ADMIN -> RENDER STRICT EMPTY ADMIN LOGIN FORM
  if (!adminToken) {
    return (
      <div className="max-w-md mx-auto my-12 bg-slate-900 border border-amber-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white">MNG FILM Control Center</h2>
          <p className="text-xs text-slate-400">Restricted Administration Authentication</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Admin Username</label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter admin username"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              required
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Admin Password</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter admin password"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              required
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {loginLoading ? <RotateCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            <span>{loginLoading ? 'Authenticating...' : 'Authenticate Admin Session'}</span>
          </button>
        </form>
      </div>
    );
  }

  // LOGGED IN ADMIN PANEL INTERFACE
  return (
    <div className="space-y-6 pb-20">
      {/* Top Admin Header */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white">MNG FILM Master Control Center</h1>
            <p className="text-xs text-amber-400 font-mono">Logged in as: {adminUser?.username} (Super Admin)</p>
          </div>
        </div>

        <button
          onClick={adminLogout}
          className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin</span>
        </button>
      </div>

      {/* Admin Navigation Menu */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'members'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('recharges')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'recharges'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Recharges ({recharges.filter((r) => r.status === 'pending').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'withdrawals'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Withdrawals ({withdrawals.filter((w) => w.status === 'pending').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'announcements'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Announcements
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tickets'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Support Tickets
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'logs'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('backups')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'backups'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>DB Backups ({backups.length})</span>
        </button>
      </div>

      {/* SECTION 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && dashboardStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Registered Members</span>
            <p className="text-2xl font-black text-cyan-400">{dashboardStats.totalMembers}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Pending Recharges</span>
            <p className="text-2xl font-black text-amber-400">{dashboardStats.pendingRechargesCount}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Pending Withdrawals</span>
            <p className="text-2xl font-black text-amber-400">{dashboardStats.pendingWithdrawalsCount}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Approved Deposits</span>
            <p className="text-lg font-black text-emerald-400">{(dashboardStats.totalApprovedDepositsUsdt ?? dashboardStats.totalApprovedDeposits ?? 0).toFixed(2)} USDT</p>
            <p className="text-xs font-bold text-emerald-300 font-mono">{(dashboardStats.totalApprovedDepositsEtb ?? 0).toFixed(2)} ETB</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Approved Withdrawals</span>
            <p className="text-lg font-black text-rose-400">{(dashboardStats.totalApprovedWithdrawalsUsdt ?? dashboardStats.totalApprovedWithdrawals ?? 0).toFixed(2)} USDT</p>
            <p className="text-xs font-bold text-rose-300 font-mono">{(dashboardStats.totalApprovedWithdrawalsEtb ?? 0).toFixed(2)} ETB</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">User Balance Liability</span>
            <p className="text-lg font-black text-white">{(dashboardStats.totalUserBalanceUsdt ?? dashboardStats.totalUserBalance ?? 0).toFixed(2)} USDT</p>
            <p className="text-xs font-bold text-cyan-300 font-mono">{(dashboardStats.totalUserBalanceEtb ?? 0).toFixed(2)} ETB</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Investment Capital</span>
            <p className="text-lg font-black text-white">{(dashboardStats.totalInvestmentUsdt ?? dashboardStats.totalInvestment ?? 0).toFixed(2)} USDT</p>
            <p className="text-xs font-bold text-amber-300 font-mono">{(dashboardStats.totalInvestmentEtb ?? 0).toFixed(2)} ETB</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Grab Profits Distributed</span>
            <p className="text-lg font-black text-emerald-400">{(dashboardStats.totalProfitDistributedUsdt ?? dashboardStats.totalProfitDistributed ?? 0).toFixed(2)} USDT</p>
            <p className="text-xs font-bold text-emerald-300 font-mono">{(dashboardStats.totalProfitDistributedEtb ?? 0).toFixed(2)} ETB</p>
          </div>
        </div>
      )}

      {/* SECTION 2: MEMBERS MANAGEMENT */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search phone number, email, referral code..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={fetchMembers}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Search
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3 pl-2">User / Phone</th>
                  <th className="pb-3">Balance</th>
                  <th className="pb-3">Investment</th>
                  <th className="pb-3">VIP</th>
                  <th className="pb-3">Ref Code</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-950/40">
                    <td className="py-3 pl-2">
                      <p className="font-bold text-white">{m.username}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{m.countryCode} {m.phone}</p>
                    </td>
                    <td className="py-3 font-bold text-cyan-400">
                      <div>{(m.balance || 0).toFixed(2)} USDT</div>
                      {m.balanceEtb !== undefined && (
                        <div className="text-[10px] text-emerald-400 font-mono">{(m.balanceEtb || 0).toFixed(2)} ETB</div>
                      )}
                    </td>
                    <td className="py-3 text-slate-200">
                      <div>{(m.investment || 0).toFixed(2)} USDT</div>
                      {m.investmentEtb !== undefined && (
                        <div className="text-[10px] text-emerald-400 font-mono">{(m.investmentEtb || 0).toFixed(2)} ETB</div>
                      )}
                    </td>
                    <td className="py-3 font-bold text-amber-300">VIP {m.vipLevel}</td>
                    <td className="py-3 font-mono text-slate-400">{m.referralCode}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedMember(m)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-[11px]"
                        >
                          Adjust Balance
                        </button>
                        <button
                          onClick={() => {
                            setPasswordResetMember(m);
                            setNewMemberPassword('');
                            setNewMemberFundPassword('');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Key className="w-3 h-3" />
                          <span>Reset Password</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: RECHARGES MANAGEMENT */}
      {activeTab === 'recharges' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-cyan-400" />
                <span>Recharge & Deposit Management</span>
              </h3>
              <span className="text-xs text-slate-400">Total Requests: {recharges.length}</span>
            </div>

            {recharges.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No recharge requests found.</div>
            ) : (
              recharges.map((rec) => {
                const isEtbRec = rec.network === 'ETB_BANK' || rec.paymentMethod === 'ETB_BANK';
                return (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-white text-base">
                          {rec.amount} {isEtbRec ? 'ETB' : 'USDT'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            isEtbRec
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-cyan-300'
                          }`}
                        >
                          {isEtbRec ? 'ETB Bank Transfer' : rec.network}
                        </span>
                        <span className="text-slate-400">
                          User: <strong className="text-white">{rec.username}</strong> ({rec.userPhone})
                        </span>
                      </div>

                      <p className="font-mono text-cyan-300 text-[11px]">
                        {isEtbRec ? 'Ref / TXID:' : 'TXID:'} {rec.transactionReference || rec.txid}
                      </p>
                      <p className="text-[10px] text-slate-500">{formatUtcDateTime(rec.createdAt)}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {rec.proofUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedProofUrl(rec.proofUrl)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>View Screenshot</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">No screenshot</span>
                      )}

                      {rec.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleProcessRecharge(rec.id, 'approved')}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow"
                          >
                            Approve Deposit
                          </button>
                          <button
                            onClick={() => handleProcessRecharge(rec.id, 'rejected')}
                            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs"
                          >
                            Reject Request
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-xs ${
                            rec.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {rec.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SCREENSHOT LIGHTBOX MODAL */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Recharge Payment Screenshot Verification</span>
              </h3>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-black/90 rounded-2xl border border-slate-800 max-h-[70vh] overflow-auto p-2 flex items-center justify-center">
              <img
                src={selectedProofUrl}
                alt="Recharge Proof Screenshot"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="text-right pt-1">
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                Done Reviewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: WITHDRAWALS MANAGEMENT */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-amber-400" />
                <span>Withdrawal & Payout Management</span>
              </h3>
              <span className="text-xs text-slate-400">Total Requests: {withdrawals.length}</span>
            </div>

            {withdrawals.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No withdrawal requests found.</div>
            ) : (
              withdrawals.map((wd) => {
                const isEtbWd = wd.network === 'ETB_BANK' || wd.paymentMethod === 'ETB_BANK';
                const symbol = isEtbWd ? 'ETB' : 'USDT';
                return (
                  <div
                    key={wd.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-white text-base">
                          {wd.amount} {symbol}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            isEtbWd
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {isEtbWd ? 'ETB Bank Transfer' : wd.network}
                        </span>
                        <span className="text-slate-400">
                          (Net payout: <strong className="text-emerald-400">{wd.netAmount} {symbol}</strong> | Fee: {wd.fee} {symbol})
                        </span>
                      </div>

                      {isEtbWd ? (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-slate-300">
                          <p>
                            <span className="text-slate-500">Bank Name:</span>{' '}
                            <strong className="text-white">{wd.bankName || 'Ethiopian Bank'}</strong>
                          </p>
                          <p>
                            <span className="text-slate-500">Account Holder:</span>{' '}
                            <strong className="text-amber-300">{wd.accountHolderName || 'N/A'}</strong>
                          </p>
                          <p>
                            <span className="text-slate-500">Account Number:</span>{' '}
                            <strong className="font-mono text-cyan-300 select-all">{wd.accountNumber || wd.walletAddress}</strong>
                            {wd.branch && <span className="text-slate-400 ml-2">({wd.branch})</span>}
                          </p>
                        </div>
                      ) : (
                        <p className="font-mono text-cyan-300 text-[11px] select-all">Address: {wd.walletAddress}</p>
                      )}

                      <p className="text-[10px] text-slate-500">
                        User: <strong className="text-white">{wd.username}</strong> ({wd.userPhone}) | Date:{' '}
                        {formatUtcDateTime(wd.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {wd.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleProcessWithdrawal(wd.id, 'approved')}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow"
                          >
                            Approve Payout
                          </button>
                          <button
                            onClick={() => handleProcessWithdrawal(wd.id, 'rejected')}
                            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs"
                          >
                            Reject & Refund
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-xs ${
                            wd.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {wd.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: ANNOUNCEMENTS MANAGEMENT */}
      {activeTab === 'announcements' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white">Create System Announcement</h3>
          <form onSubmit={handleCreateAnnouncement} className="space-y-3">
            <input
              type="text"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="Announcement Title"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              required
            />
            <textarea
              rows={3}
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Announcement Body Content..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              required
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Publish Announcement
            </button>
          </form>
        </div>
      )}

      {/* SECTION 6: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Audit Trail</h3>
          <div className="space-y-2">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-amber-300 font-mono mr-2">[{log.actor}]</span>
                  <span className="font-semibold text-white mr-2">{log.action}:</span>
                  <span className="text-slate-300">{log.details}</span>
                </div>
                <span className="text-[10px] text-slate-500">{formatUtcDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 7: DATABASE BACKUPS & RESTORE */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-400" />
                  <span>Persistent Database Snapshots & One-Click Restore</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Automatic daily backups run every 24 hours. Create manual snapshots or restore data instantly.
                </p>
              </div>

              <button
                onClick={handleCreateBackup}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>Create Instant DB Snapshot</span>
              </button>
            </div>

            {backupActionStatus && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>{backupActionStatus}</span>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Backup Snapshots ({backups.length})</h4>
              
              {backups.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 border border-slate-800/80 rounded-2xl">
                  No backup snapshots found. Click "Create Instant DB Snapshot" above.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {backups.map((bk) => (
                    <div
                      key={bk.filename}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-cyan-400" />
                          <span className="font-mono text-xs font-bold text-white">{bk.filename}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bk.isAutoBackup ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {bk.isAutoBackup ? 'Auto Daily' : 'Manual'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Users: <strong className="text-white">{bk.userCount}</strong> | Transactions: <strong className="text-white">{bk.transactionCount}</strong> | Deposits: <strong className="text-white">{bk.rechargeCount}</strong> | Withdrawals: <strong className="text-white">{bk.withdrawalCount}</strong> | Size: <strong className="text-slate-300">{(bk.sizeBytes / 1024).toFixed(1)} KB</strong>
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Created At: {formatUtcDateTime(bk.createdAt)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRestoreBackup(bk.filename)}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>One-Click Restore</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Adjust Balance for {selectedMember.username}</h3>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Balances:</span>
              <div className="text-right font-extrabold font-mono text-xs space-y-0.5">
                <div className="text-cyan-300">{(selectedMember.balance || 0).toFixed(2)} USDT</div>
                <div className="text-emerald-300">{(selectedMember.balanceEtb || 0).toFixed(2)} ETB</div>
              </div>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              {/* Currency Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Currency Unit</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustCurrency('ETB')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      balanceAdjustCurrency === 'ETB'
                        ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    ETB (Ethiopian Birr)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustCurrency('USDT')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      balanceAdjustCurrency === 'USDT'
                        ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    USDT (Crypto)
                  </button>
                </div>
              </div>

              {/* Action Type: Add / Deduct */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Action Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustType('add')}
                    className={`flex-1 py-2 rounded-xl text-xs font-extrabold ${
                      balanceAdjustType === 'add' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    + Add Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustType('deduct')}
                    className={`flex-1 py-2 rounded-xl text-xs font-extrabold ${
                      balanceAdjustType === 'deduct' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    - Deduct Balance
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Adjustment Amount</label>
                <input
                  type="number"
                  min={0.1}
                  step="any"
                  value={balanceAdjustAmount}
                  onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                  placeholder={`Amount in ${balanceAdjustCurrency}`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Reason / Remark (Required for Audit)</label>
                <input
                  type="text"
                  value={balanceAdjustReason}
                  onChange={(e) => setBalanceAdjustReason(e.target.value)}
                  placeholder="Reason for audit log..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {passwordResetMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Reset Password for {passwordResetMember.username}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPasswordResetMember(null)}
                className="text-slate-500 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Phone Number:</span>
                <span className="text-white font-mono">{passwordResetMember.countryCode} {passwordResetMember.phone}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Referral Code:</span>
                <span className="text-amber-300 font-mono">{passwordResetMember.referralCode}</span>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">New Login Password</label>
                <input
                  type="text"
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                  placeholder="Enter new login password (leave blank if unchanged)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">New 6-Digit Fund Password</label>
                <input
                  type="text"
                  value={newMemberFundPassword}
                  onChange={(e) => setNewMemberFundPassword(e.target.value)}
                  placeholder="Enter 6-digit fund password (leave blank if unchanged)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPasswordResetMember(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
