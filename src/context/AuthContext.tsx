import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, VIPPlan } from '../types';
import { LanguageCode, TRANSLATIONS, LANGUAGES } from '../i18n/translations';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  adminToken: string | null;
  adminUser: { id: string; username: string; role: string } | null;
  language: LanguageCode;
  t: (key: string) => string;
  isRtl: boolean;
  isInitializing: boolean;
  setLanguage: (lang: LanguageCode) => void;
  login: (token: string, user: User) => void;
  adminLogin: (token: string, admin: { id: string; username: string; role: string }) => void;
  logout: () => void;
  adminLogout: () => void;
  refreshUserData: () => Promise<void>;
  grabStatus: {
    isGrabActive: boolean;
    remainingSeconds: number;
    canGrab: boolean;
    cooldownRemainingMs: number;
    todayProfit: number;
    totalProfit: number;
    vipPlan: VIPPlan | null;
  };
  refreshGrabStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexgrab_token'));
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('nexgrab_admin_token'));
  const [adminUser, setAdminUser] = useState<{ id: string; username: string; role: string } | null>(() => {
    const saved = localStorage.getItem('nexgrab_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('nexgrab_lang') as LanguageCode;
    return saved && TRANSLATIONS[saved] ? saved : 'en';
  });

  const [grabStatus, setGrabStatus] = useState<{
    isGrabActive: boolean;
    remainingSeconds: number;
    canGrab: boolean;
    cooldownRemainingMs: number;
    todayProfit: number;
    totalProfit: number;
    vipPlan: VIPPlan | null;
  }>({
    isGrabActive: false,
    remainingSeconds: 0,
    canGrab: false,
    cooldownRemainingMs: 0,
    todayProfit: 0,
    totalProfit: 0,
    vipPlan: null,
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('nexgrab_lang', lang);
  };

  const currentLangObj = LANGUAGES.find(l => l.code === language);
  const isRtl = !!currentLangObj?.rtl;

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  }, [language, isRtl]);

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('nexgrab_token', newToken);
  };

  const adminLogin = (newToken: string, newAdmin: { id: string; username: string; role: string }) => {
    setAdminToken(newToken);
    setAdminUser(newAdmin);
    localStorage.setItem('nexgrab_admin_token', newToken);
    localStorage.setItem('nexgrab_admin_user', JSON.stringify(newAdmin));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nexgrab_token');
  };

  const adminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('nexgrab_admin_token');
    localStorage.removeItem('nexgrab_admin_user');
  };

  const refreshUserData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else if (res.status === 401 || res.status === 403) {
        logout();
      }
    } catch (err) {
      // Ignore transient network errors on polling
    }
  };

  const refreshGrabStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/grab/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGrabStatus(data);
      } else if (res.status === 401 || res.status === 403) {
        logout();
      }
    } catch (err) {
      // Ignore transient network errors on polling
    }
  };

  // Firebase auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      // Firebase auth state initialized
    });
    return () => unsubscribe();
  }, []);

  // Restore session and fetch initial profile on boot
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      if (token) {
        try {
          await Promise.all([refreshUserData(), refreshGrabStatus()]);
        } catch (err) {
          // ignore transient init error
        }
      }
      if (mounted) {
        setIsInitializing(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [token]);

  // Polling for live grab timer sync & balance updates every 2 seconds if grab active
  useEffect(() => {
    if (!token || isInitializing) return;
    const interval = setInterval(() => {
      refreshGrabStatus();
    }, grabStatus.isGrabActive ? 1000 : 5000);

    return () => clearInterval(interval);
  }, [token, isInitializing, grabStatus.isGrabActive]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        adminToken,
        adminUser,
        language,
        t,
        isRtl,
        isInitializing,
        setLanguage,
        login,
        adminLogin,
        logout,
        adminLogout,
        refreshUserData,
        grabStatus,
        refreshGrabStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
