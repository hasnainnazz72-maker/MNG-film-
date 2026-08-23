import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatUtcTime } from '../lib/dateUtils';
import { Bell, Shield, User as UserIcon, LogOut, Check, X, ShieldAlert } from 'lucide-react';
import { PwaInstallPrompt } from './PwaInstallPrompt';

interface HeaderProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  const { user, adminUser, logout, adminLogout, t } = useAuth();
  const [showNotifDrawer, setShowNotifDrawer] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('nexgrab_token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openNotifDrawer = () => {
    fetchNotifications();
    setShowNotifDrawer(true);
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('nexgrab_token')}` },
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              {/* Clean MNG Film Hexagon Logo */}
              <svg className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider text-white">
              MNG <span className="text-cyan-400">FILM</span>
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <PwaInstallPrompt />

          {/* Security Shield Button */}
          <button
            onClick={() => onNavigate('profile')}
            className="p-2 rounded-full bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition-colors shadow-sm"
            title="Security Center"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
          </button>

          {user && (
            <>
              {/* Notification Bell */}
              <button
                onClick={openNotifDrawer}
                className="relative p-2 rounded-full bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-slate-300 transition-colors"
              >
                <Bell className="w-4 h-4 text-slate-200" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[9px] font-bold text-slate-950 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User Balance Chip */}
              <div
                onClick={() => onNavigate('wallet')}
                className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 cursor-pointer hover:border-cyan-500 transition-colors"
              >
                <span className="text-[11px] text-slate-400 font-medium">Bal:</span>
                <span className="text-xs font-bold text-cyan-400">{(user.balance || 0).toFixed(2)} USDT</span>
                {(user.balanceEtb !== undefined && user.balanceEtb !== null) && (
                  <span className="text-xs font-bold text-emerald-400">{(user.balanceEtb || 0).toFixed(2)} ETB</span>
                )}
              </div>
            </>
          )}

          {!user && (
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs transition-all shadow-md shadow-cyan-500/30 active:scale-95"
            >
              {t('login')}
            </button>
          )}
        </div>
      </div>

      {/* Notifications Drawer */}
      {showNotifDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">System Notifications</h3>
              </div>
              <button
                onClick={() => setShowNotifDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      notif.isRead
                        ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                        : 'bg-slate-800/80 border-cyan-500/40 text-slate-100 shadow-sm shadow-cyan-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-cyan-300">{notif.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {formatUtcTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
