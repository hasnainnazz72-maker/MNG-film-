import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomeView } from './views/HomeView';
import { GrabOrderView } from './views/GrabOrderView';
import { WalletView } from './views/WalletView';
import { VipView } from './views/VipView';
import { TeamView } from './views/TeamView';
import { TaskView } from './views/TaskView';
import { RechargeView } from './views/RechargeView';
import { WithdrawalView } from './views/WithdrawalView';
import { TransactionHistoryView } from './views/TransactionHistoryView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { SupportView } from './views/SupportView';
import { ProfileView } from './views/ProfileView';
import { AuthModal } from './views/AuthModal';
import { AdminPanelView } from './views/AdminPanelView';

const MainAppContent: React.FC = () => {
  const { token, isInitializing, isRtl } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');

  // Automatically check URL route, referral parameters, and user auth state once auth is restored
  useEffect(() => {
    if (isInitializing) return;

    const path = window.location.pathname;
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hasRef = params.get('ref') || params.get('invite') || params.get('code') || params.get('invitationCode') || hash.includes('ref=');

    if (path === '/admin' || hash.includes('admin')) {
      setCurrentView('admin');
      return;
    }

    if (token) {
      // User is authenticated
      if (hasRef || hash.includes('register') || hash.includes('login')) {
        // Clean up URL ref parameter or hash so it doesn't linger after login/register
        try {
          window.history.replaceState({}, document.title, path || '/');
        } catch (e) {
          // ignore
        }
      }
      // If currently stuck on auth screen, send to home dashboard
      if (currentView === 'register' || currentView === 'login') {
        setCurrentView('home');
      }
    } else {
      // User is not authenticated
      if (hash.includes('login')) {
        setCurrentView('login');
      } else {
        setCurrentView('register');
      }
    }
  }, [token, isInitializing]);

  const handleNavigate = (view: string) => {
    if (!token && view !== 'admin' && view !== 'login' && view !== 'register') {
      setCurrentView('register');
    } else {
      setCurrentView(view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onNavigate={handleNavigate} />;
      case 'task':
        return <TaskView onNavigate={handleNavigate} />;
      case 'grab':
        return <GrabOrderView onNavigate={handleNavigate} />;
      case 'share':
      case 'team':
        return <TeamView onNavigate={handleNavigate} />;
      case 'profile':
      case 'mine':
        return <ProfileView onNavigate={handleNavigate} />;
      case 'recharge':
        return <RechargeView onNavigate={handleNavigate} />;
      case 'withdraw':
        return <WithdrawalView onNavigate={handleNavigate} />;
      case 'wallet':
        return <WalletView onNavigate={handleNavigate} />;
      case 'vip':
        return <VipView onNavigate={handleNavigate} />;
      case 'transactions':
        return <TransactionHistoryView />;
      case 'announcements':
        return <AnnouncementsView />;
      case 'support':
        return <SupportView />;
      case 'login':
        return <AuthModal initialMode="login" onSuccess={() => handleNavigate('home')} />;
      case 'register':
        return <AuthModal initialMode="register" onSuccess={() => handleNavigate('home')} />;
      case 'admin':
        return <AdminPanelView />;
      default:
        return <HomeView onNavigate={handleNavigate} />;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/30 animate-pulse">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            </div>
          </div>
          <span className="text-sm font-semibold tracking-wider text-cyan-400">Authenticating MNG FILM Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header containing MNG FILM logo, language selector, and status header icons */}
      {currentView !== 'admin' && <Header onNavigate={handleNavigate} currentView={currentView} />}

      {/* Main Navigation Subheader & Fixed Bottom Bar */}
      <Navigation currentView={currentView} onNavigate={handleNavigate} />

      {/* Primary Main Content View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 pb-20">
        {renderView()}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
