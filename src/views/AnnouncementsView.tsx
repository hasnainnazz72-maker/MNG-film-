import React, { useState, useEffect } from 'react';
import { Megaphone, Bell, Calendar, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AnnouncementsView: React.FC = () => {
  const { t } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => setAnnouncements(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-white">{t('announcements')}</h1>
        <p className="text-xs text-slate-400">Official platform updates, security bulletins, and system news.</p>
      </div>

      <div className="space-y-4">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className={`p-6 rounded-3xl border transition-all ${
              ann.isImportant
                ? 'bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border-cyan-500/40 shadow-xl shadow-cyan-500/10'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <Megaphone className={`w-5 h-5 ${ann.isImportant ? 'text-cyan-400' : 'text-slate-400'}`} />
                <h3 className="text-base font-bold text-white">{ann.title}</h3>
              </div>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3" />
                {new Date(ann.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
