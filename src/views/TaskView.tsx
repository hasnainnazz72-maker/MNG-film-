import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react';

interface TaskViewProps {
  onNavigate: (view: string) => void;
}

export const TaskView: React.FC<TaskViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 px-3 sm:px-4">
      {/* Title Header */}
      <div className="text-center pt-1">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
          Task
        </h1>
      </div>

      {/* MAIN TASK CARD MATCHING FLEX REFERENCE EXACTLY */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 space-y-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Circular glowing illustration with clipboard icon */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-cyan-500/10 border-2 border-cyan-400/30 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-2xl">
            <div className="relative p-4 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]">
              <ClipboardCheck className="w-12 h-12 text-cyan-300" />
              {/* Plus badge on bottom right of clipboard */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-black shadow-lg">
                ↓
              </div>
            </div>
          </div>
        </div>

        {/* Card Text Content */}
        <div className="space-y-2">
          <h2 className="text-lg font-black text-white tracking-wide">
            Daily Task
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Complete Your Daily Order Grabbing Task
          </p>
        </div>

        {/* PILL BUTTON MATCHING FLEX */}
        <div>
          <button
            onClick={() => onNavigate('grab')}
            className="w-full py-4 rounded-full font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95"
          >
            <span>Go to Grab Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};
