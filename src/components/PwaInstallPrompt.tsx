import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X } from 'lucide-react';
import { AppDownloadModal } from './AppDownloadModal';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check if already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const dismissed = localStorage.getItem('mng_film_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    // Listen for custom trigger to open App Download Modal from anywhere in the app
    const handleTriggerDownloadModal = () => {
      setIsDownloadModalOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('trigger-app-download', handleTriggerDownloadModal);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('trigger-app-download', handleTriggerDownloadModal);
    };
  }, []);

  const handleOpenDownload = () => {
    setIsDownloadModalOpen(true);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('mng_film_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Header / Nav Quick Install Button */}
      <button
        onClick={handleOpenDownload}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
        title="Download & Install MNG FILM App (28.6 MB)"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span className="hidden sm:inline font-sans">App Download</span>
      </button>

      {/* Floating Bottom Banner Prompt */}
      {showBanner && !isInstalled && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-md shadow-cyan-500/30 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white leading-tight">Install MNG FILM App</h4>
              <p className="text-[10px] text-slate-400">Download 28.6 MB package & install to device</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenDownload}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95 transition-all flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Dynamic MB Download and Installation Modal */}
      <AppDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />
    </>
  );
};
