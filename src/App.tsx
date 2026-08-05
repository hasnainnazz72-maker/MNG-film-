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
  const { token, isRtl } = useAuth();
  const [currentView, setCurrentView] = useState<string>('register');

  // Automatically check URL route, referral parameters, and user auth state
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);

    const hasRef = params.get('ref') || params.get('invite') || params.get('code') || params.get('invitationCode') || hash.includes('ref=');

    if (path === '/admin' || hash.includes('admin')) {
      setCurrentView('admin');
    } else if (!token || hasRef || hash.includes('register')) {
      setCurrentView('register');
    } else {
      setCurrentView('home');
    }
  }, [token]);

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
