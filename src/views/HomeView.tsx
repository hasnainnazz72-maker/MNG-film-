import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Film,
  Megaphone,
  ChevronRight,
  Wallet,
  Upload,
  Zap,
  Crown,
  Star,
} from 'lucide-react';

import heroBannerImg from '../assets/images/mission_impossible_banner_1785876755897.jpg';
import johnWickPosterImg from '../assets/images/john_wick_4_poster_1785876780298.jpg';
import interstellarPosterImg from '../assets/images/interstellar_poster_1785876798215.jpg';
import batmanPosterImg from '../assets/images/the_batman_poster_1785876819978.jpg';
import topGunPosterImg from '../assets/images/top_gun_maverick_poster_1785876837251.jpg';
import oppenheimerPosterImg from '../assets/images/oppenheimer_poster_1785878268223.jpg';
import dunePosterImg from '../assets/images/dune_poster_1785878301567.jpg';
import gladiatorPosterImg from '../assets/images/gladiator_poster_1785878289041.jpg';
import spidermanPosterImg from '../assets/images/spiderman_poster_1785878322174.jpg';

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

interface MovieItem {
  id: string;
  title: string;
  rating: number;
  posterUrl: string;
  bgGradient: string;
  minInvestment: number;
  maxInvestment: number;
  dailyReturn: number;
  vipLevel: number;
}

const FEATURED_MOVIES: MovieItem[] = [
  {
    id: 'movie_1',
    title: 'John Wick 4',
    rating: 4.8,
    posterUrl: johnWickPosterImg,
    bgGradient: 'from-amber-900/60 via-slate-900 to-slate-950',
    minInvestment: 20,
    maxInvestment: 499,
    dailyReturn: 2.3,
    vipLevel: 1,
  },
  {
    id: 'movie_2',
    title: 'Interstellar',
    rating: 4.9,
    posterUrl: interstellarPosterImg,
    bgGradient: 'from-blue-900/60 via-slate-900 to-slate-950',
    minInvestment: 500,
    maxInvestment: 1999,
    dailyReturn: 2.5,
    vipLevel: 2,
  },
  {
    id: 'movie_3',
    title: 'The Batman',
    rating: 4.7,
    posterUrl: batmanPosterImg,
    bgGradient: 'from-red-950/70 via-slate-900 to-slate-950',
    minInvestment: 2000,
    maxInvestment: 9999,
    dailyReturn: 2.1,
    vipLevel: 3,
  },
  {
    id: 'movie_4',
    title: 'Top Gun: Maverick',
    rating: 4.6,
    posterUrl: topGunPosterImg,
    bgGradient: 'from-cyan-950/70 via-slate-900 to-slate-950',
    minInvestment: 10000,
    maxInvestment: 49999,
    dailyReturn: 2.0,
    vipLevel: 4,
  },
  {
    id: 'movie_5',
    title: 'Oppenheimer',
    rating: 4.9,
    posterUrl: oppenheimerPosterImg,
    bgGradient: 'from-orange-950/70 via-slate-900 to-slate-950',
    minInvestment: 50,
    maxInvestment: 999,
    dailyReturn: 2.4,
    vipLevel: 1,
  },
  {
    id: 'movie_6',
    title: 'Dune: Part Two',
    rating: 4.8,
    posterUrl: dunePosterImg,
    bgGradient: 'from-amber-950/70 via-slate-900 to-slate-950',
    minInvestment: 1000,
    maxInvestment: 4999,
    dailyReturn: 2.6,
    vipLevel: 2,
  },
  {
    id: 'movie_7',
    title: 'Gladiator II',
    rating: 4.7,
    posterUrl: gladiatorPosterImg,
    bgGradient: 'from-yellow-950/70 via-slate-900 to-slate-950',
    minInvestment: 5000,
    maxInvestment: 14999,
    dailyReturn: 2.2,
    vipLevel: 3,
  },
  {
    id: 'movie_8',
    title: 'Spider-Man',
    rating: 4.8,
    posterUrl: spidermanPosterImg,
    bgGradient: 'from-indigo-950/70 via-slate-900 to-slate-950',
    minInvestment: 15000,
    maxInvestment: 99999,
    dailyReturn: 2.8,
    vipLevel: 4,
  },
];

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { user, t } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/announcements')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setAnnouncements(data);
        } else if (data && Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements);
        }
      })
      .catch((err) => console.warn('Announcements fetch notice:', err));
  }, []);

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-24 px-3 sm:px-4 max-w-xl sm:max-w-4xl mx-auto">
      {/* HERO BANNER MATCHING FLEX REFERENCE EXACTLY */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl aspect-[16/7.5] sm:aspect-[16/7] min-h-[160px] sm:min-h-[200px]">
        {/* Banner background poster image with error fallback */}
        {!imageErrors['hero_banner'] ? (
          <img
            src={heroBannerImg}
            alt="Mission Impossible Dead Reckoning"
            referrerPolicy="no-referrer"
            onError={() => handleImageError('hero_banner')}
            className="w-full h-full object-cover object-center brightness-90"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
            <Film className="w-16 h-16 text-cyan-500/30 animate-pulse" />
          </div>
        )}
        
        {/* Banner Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/40" />

        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between z-10">
          <div className="space-y-0.5 sm:space-y-1 max-w-md">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase drop-shadow-lg">
              MISSION: IMPOSSIBLE
            </h1>
            <p className="text-xs sm:text-base font-black text-rose-500 tracking-wider uppercase pt-0.5 drop-shadow">
              DEAD RECKONING
            </p>
            <p className="text-[9px] sm:text-xs font-semibold text-slate-200 tracking-widest uppercase opacity-90">
              EVERY CHOICE. EVERY SECOND. COUNTS.
            </p>
          </div>

          {/* Carousel dots pagination indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="w-2 h-2 rounded-full bg-slate-600/80" />
            <span className="w-2 h-2 rounded-full bg-slate-600/80" />
            <span className="w-2 h-2 rounded-full bg-slate-600/80" />
            <span className="w-2 h-2 rounded-full bg-slate-600/80" />
          </div>
        </div>
      </div>

      {/* MARQUEE CONTINUOUS ANNOUNCEMENT TICKER */}
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-lg overflow-hidden">
        <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0 z-10 bg-slate-900">
          <Megaphone className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="inline-flex whitespace-nowrap animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused]">
            <span className="text-xs text-slate-200 font-medium mr-12">
              <span className="font-extrabold text-cyan-400 mr-1.5">Welcome to MNG FILM Platform.</span>
              Complete daily order grabbing tasks
            </span>
            <span className="text-xs text-slate-200 font-medium mr-12">
              <span className="font-extrabold text-cyan-400 mr-1.5">Welcome to MNG FILM Platform.</span>
              Complete daily order grabbing tasks
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 z-10 bg-slate-900 pl-0.5" />
      </div>

      {/* QUICK ACTION ROW GRID (4 ITEMS MATCHING FLEX REFERENCE EXACTLY) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {/* 1. Recharge */}
        <button
          onClick={() => onNavigate('recharge')}
          className="p-2 sm:p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800/90 hover:border-blue-500/50 transition-all flex flex-col items-center justify-center text-center space-y-1.5 group shadow-lg active:scale-95"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-200">Recharge</span>
        </button>

        {/* 2. Withdrawal */}
        <button
          onClick={() => onNavigate('withdraw')}
          className="p-2 sm:p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800/90 hover:border-purple-500/50 transition-all flex flex-col items-center justify-center text-center space-y-1.5 group shadow-lg active:scale-95"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-200">Withdrawal</span>
        </button>

        {/* 3. Grab Order */}
        <button
          onClick={() => onNavigate('grab')}
          className="p-2 sm:p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800/90 hover:border-cyan-500/50 transition-all flex flex-col items-center justify-center text-center space-y-1.5 group shadow-lg active:scale-95"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 fill-cyan-400" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-200">Grab Order</span>
        </button>

        {/* 4. VIP Plans */}
        <button
          onClick={() => onNavigate('vip')}
          className="p-2 sm:p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800/90 hover:border-amber-500/50 transition-all flex flex-col items-center justify-center text-center space-y-1.5 group shadow-lg active:scale-95"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-200">VIP Plans</span>
        </button>
      </div>

      {/* POPULAR MOVIES SECTION MATCHING FLEX REFERENCE */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide">Popular Movies</h2>
          <button
            onClick={() => onNavigate('vip')}
            className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 MOVIE CARDS GRID MATCHING FLEX REFERENCE EXACTLY */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {FEATURED_MOVIES.map((movie) => (
            <div
              key={movie.id}
              onClick={() => onNavigate('grab')}
              className="bg-slate-900/95 border border-slate-800/90 rounded-2xl overflow-hidden hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-xl cursor-pointer active:scale-95"
            >
              {/* Poster Image with Rating & Movie Title Overlay matching Flex */}
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-950">
                {!imageErrors[movie.id] ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError(movie.id)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95"
                    loading="lazy"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-b ${movie.bgGradient} flex flex-col items-center justify-center p-2 text-center`}>
                    <Film className="w-8 h-8 text-cyan-400/50 mb-1" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                {/* Poster Title Overlay inside card image like official posters */}
                <div className="absolute bottom-6 left-1 right-1 text-center">
                  <span className="text-[10px] sm:text-xs font-black text-white tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] line-clamp-1">
                    {movie.title}
                  </span>
                </div>

                {/* Rating Badge */}
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-slate-950/90 backdrop-blur-md border border-slate-800 flex items-center gap-0.5 shadow">
                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span className="text-[9px] font-bold text-white">{movie.rating}</span>
                </div>
              </div>

              {/* Movie Info */}
              <div className="p-2 sm:p-2.5 space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-[11px] sm:text-xs font-bold text-white line-clamp-1 group-hover:text-cyan-300 transition-colors" title={movie.title}>
                    {movie.title}
                  </h3>
                  <div className="pt-0.5 space-y-0.5">
                    <p className="text-[9px] sm:text-[10px] text-slate-400">Daily Return</p>
                    <p className="text-[10px] sm:text-xs font-black text-emerald-400">+{movie.dailyReturn}%</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

