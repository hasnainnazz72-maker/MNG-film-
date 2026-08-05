import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Film,
  CheckSquare,
  QrCode,
  User,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Megaphone,
  Headphones,
  Settings,
  Crown,
  Wallet,
  Zap,
} from 'lucide-react';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  const { t } = useAuth();

  // Desktop navigation items
  const desktopMainTabs = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'task', label: t('task'), icon: CheckSquare },
    { id: 'grab', label: t('grabOrder'), icon: Zap, highlight: true },
    { id: 'share', label: t('team'), icon: QrCode },
    { id: 'profile', label: t('profile'), icon: User },
  ];

  const secondaryMenu = [
    { id: 'recharge', label: t('recharge'), icon: ArrowDownCircle },
    { id: 'withdraw', label: t('withdrawal'), icon: ArrowUpCircle },
    { id: 'wallet', label: t('wallet'), icon: Wallet },
    { id: 'vip', label: t('vip'), icon: Crown },
    { id: 'transactions', label: t('transactions'), icon: History },
    { id: 'support', label: t('support'), icon: Headphones },
  ];

  // Mobile Bottom Menu items: Home | Task | GRAB | Team | Profile
  const mobileMenuItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'task', label: t('task'), icon: CheckSquare },
    { id: 'grab', label: t('grabOrder'), icon: Zap, isCenterGrab: true },
    { id: 'share', label: t('team'), icon: QrCode },
    { id: 'profile', label: t('profile'), icon: User },
  ];

  return (
    <>
      {/* Desktop Navigation Sub-Header */}
      <nav className="hidden lg:block bg-slate-900/90 border-b border-slate-800/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {desktopMainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                      : tab.highlight
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-slate-800 my-auto" />

          <div className="flex items-center gap-1">
            {secondaryMenu.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-cyan-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Fixed Bottom Navigation Bar - Exactly: Home | Task | Grab | Share Code | Mine */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5">
        <div className="flex items-end justify-between max-w-md mx-auto px-1 relative">
          {mobileMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'share' && currentView === 'team');

            if (item.isCenterGrab) {
              return (
                <div key={item.id} className="relative flex flex-col items-center -top-5">
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`relative w-14 h-14 rounded-full bg-slate-950 p-1 flex items-center justify-center border-2 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all active:scale-95 ${
                      isActive ? 'scale-110 border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.9)]' : ''
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
                      <Zap className="w-7 h-7 text-slate-950 fill-slate-950" />
                    </div>
                  </button>
                  <span className={`text-[10px] font-black mt-1 tracking-wider uppercase ${
                    isActive ? 'text-cyan-400' : 'text-slate-300'
                  }`}>
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-1 py-1 transition-all ${
                  isActive ? 'text-cyan-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] tracking-tight font-medium whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
