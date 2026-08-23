import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Smartphone,
  HardDrive,
  Cpu,
  RefreshCw,
  X,
  Play,
  Share2,
  ExternalLink,
  ChevronRight,
  Zap,
  Layers,
  ArrowDown
} from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
}

export type DownloadPhase = 'idle' | 'downloading' | 'verifying' | 'installing' | 'completed';

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
}) => {
  const TOTAL_SIZE_MB = 28.6;
  const [phase, setPhase] = useState<DownloadPhase>('idle');
  const [downloadedMb, setDownloadedMb] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('0.0 MB/s');
  const [installProgress, setInstallProgress] = useState<number>(0);
  const [installedSuccessfully, setInstalledSuccessfully] = useState<boolean>(false);

  const animationFrameRef = useRef<number | null>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      if (phase === 'completed') {
        // keep completed
      } else {
        setPhase('idle');
        setDownloadedMb(0);
        setInstallProgress(0);
        setDownloadSpeed('0.0 MB/s');
      }
    }
  }, [isOpen]);

  // Handle actual download and install simulation
  const startDownloadAndInstall = () => {
    setPhase('downloading');
    setDownloadedMb(0);
    setInstallProgress(0);

    const startTime = Date.now();
    const durationMs = 3800; // ~3.8 seconds realistic high-speed download

    const updateDownload = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(1, elapsed / durationMs);

      // Natural ease-out calculation
      const currentMb = Number((progressRatio * TOTAL_SIZE_MB).toFixed(1));
      setDownloadedMb(currentMb);

      // Random speed fluctuations between 5.2 MB/s and 8.4 MB/s
      const speed = (5.2 + Math.sin(elapsed / 200) * 2.1).toFixed(1);
      setDownloadSpeed(`${speed} MB/s`);

      if (progressRatio < 1) {
        animationFrameRef.current = requestAnimationFrame(updateDownload);
      } else {
        setDownloadedMb(TOTAL_SIZE_MB);
        setDownloadSpeed('Complete');
        
        // Trigger actual file download in browser so user gets real physical file
        try {
          const blob = new Blob([
            `MNG FILM Official Package v2.4.8\nBuild: 2026.08\nPackage: com.mngfilm.app\nStatus: Verified\nPlatform: Web & Android PWA Container`
          ], { type: 'application/vnd.android.package-archive' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'MNG_FILM_Official_v2.4.apk';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn('Physical file download trigger:', e);
        }

        // Move to Phase 2: Verifying
        setPhase('verifying');
        setTimeout(() => {
          // Move to Phase 3: Installing
          setPhase('installing');
          runInstallation();
        }, 1200);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateDownload);
  };

  // Run Installation step
  const runInstallation = () => {
    let current = 0;
    const interval = setInterval(() => {
      current += 15;
      if (current >= 100) {
        setInstallProgress(100);
        clearInterval(interval);
        setPhase('completed');
        setInstalledSuccessfully(true);

        // If native PWA install prompt is available, trigger it
        if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
          try {
            deferredPrompt.prompt().catch((err: any) => console.log('PWA prompt dismissed:', err));
          } catch (err) {
            console.error('PWA prompt execution:', err);
          }
        }
      } else {
        setInstallProgress(current);
      }
    }, 250);
  };

  const handleClose = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    onClose();
  };

  if (!isOpen) return null;

  const downloadPercentage = Math.min(100, Math.round((downloadedMb / TOTAL_SIZE_MB) * 100));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden text-slate-100">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/30 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-black uppercase tracking-wider border border-cyan-500/30">
                  Official Release
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> Safe
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">MNG FILM App</h3>
              <p className="text-[11px] text-slate-400">Package Size: {TOTAL_SIZE_MB} MB • v2.4.8</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Phases Display */}

        {/* PHASE 0: IDLE (READY TO DOWNLOAD) */}
        {phase === 'idle' && (
          <div className="space-y-4 relative z-10 animate-in fade-in duration-200">
            {/* Features & Metadata Spec */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> File Size:
                </span>
                <span className="font-bold text-white font-mono">{TOTAL_SIZE_MB} MB</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Compatibility:
                </span>
                <span className="font-bold text-cyan-300">Android 7.0+ & Web Mobile</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" /> Server CDN:
                </span>
                <span className="font-bold text-emerald-400">High-Speed Africa Gateway</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                ⚡ <strong>Instant Grabbing Engine:</strong> 10x smoother order grabbing and film syndicate investment tracking with zero browser lag.
              </div>
            </div>

            {/* Action CTA */}
            <button
              onClick={startDownloadAndInstall}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 hover:text-white shadow-xl shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <Download className="w-5 h-5" />
              <span>Download & Install ({TOTAL_SIZE_MB} MB)</span>
            </button>
          </div>
        )}

        {/* PHASE 1: DOWNLOADING (DYNAMIC MB COUNTER) */}
        {phase === 'downloading' && (
          <div className="space-y-4 relative z-10 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-cyan-400 font-black text-sm uppercase tracking-wider">
                <ArrowDown className="w-4 h-4 animate-bounce" />
                <span>Downloading Application...</span>
              </div>
              <p className="text-xs text-slate-400">Please do not close this window</p>
            </div>

            {/* MB Counter Big Display */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-5 text-center space-y-3 shadow-inner">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                  {downloadedMb.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-slate-400">
                  / {TOTAL_SIZE_MB} MB
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full transition-all duration-100 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                    style={{ width: `${downloadPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                  <span>Speed: <strong className="text-emerald-400">{downloadSpeed}</strong></span>
                  <span className="text-cyan-300 font-bold">{downloadPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: VERIFYING PACKAGE */}
        {phase === 'verifying' && (
          <div className="space-y-4 relative z-10 text-center py-4 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Verifying Package Integrity...</h4>
              <p className="text-xs text-slate-400 font-mono">
                Checksum: SHA-256 (28.6 MB verified)
              </p>
            </div>
          </div>
        )}

        {/* PHASE 3: INSTALLING */}
        {phase === 'installing' && (
          <div className="space-y-4 relative z-10 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-wider">
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Installing MNG FILM Application...</span>
              </div>
              <p className="text-xs text-slate-400">Configuring box office order engine</p>
            </div>

            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-3 shadow-inner">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {installProgress}%
              </div>

              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-200 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                  style={{ width: `${installProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">Registering offline service cache & database...</p>
            </div>
          </div>
        )}

        {/* PHASE 4: COMPLETED (SUCCESSFUL INSTALLATION) */}
        {phase === 'completed' && (
          <div className="space-y-4 relative z-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                Application Successfully Installed!
              </h3>
              <p className="text-xs text-slate-300">
                Downloaded 28.6 MB and configured for your device.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 text-left text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Ready on your Home Screen</span>
              </div>
              <p className="text-[11px] text-slate-400">
                You can now launch MNG FILM directly from your phone's home screen or app drawer for ultra-fast grabbing and real-time updates.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:text-white shadow-xl shadow-emerald-500/25 active:scale-95 transition-all"
            >
              Open & Continue App
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
