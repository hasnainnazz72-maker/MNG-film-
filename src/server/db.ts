import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  Firestore
} from 'firebase/firestore';

import {
  User,
  VIPPlan,
  VIP_PLANS,
  RechargeRequest,
  WithdrawalRequest,
  Transaction,
  GrabLog,
  Announcement,
  Banner,
  SupportTicket,
  UserNotification,
  SystemSettings,
  ActivityLog,
  VipLevel
} from '../types.js';

export { VIP_PLANS };

export interface StoredAdmin {
  id: string;
  username: string;
  passwordHash: string;
  role: 'superadmin' | 'admin';
  lastLogin?: string;
}

export interface StoredUser extends User {
  passwordHash: string;
  fundPasswordHash?: string;
}

export interface BackupMetadata {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  userCount: number;
  transactionCount: number;
  rechargeCount: number;
  withdrawalCount: number;
  isAutoBackup: boolean;
}

interface DatabaseData {
  schemaVersion: number;
  lastBackupAt?: string;
  users: StoredUser[];
  admins: StoredAdmin[];
  rechargeRequests: RechargeRequest[];
  withdrawalRequests: WithdrawalRequest[];
  transactions: Transaction[];
  grabLogs: GrabLog[];
  announcements: Announcement[];
  banners: Banner[];
  supportTickets: SupportTicket[];
  notifications: UserNotification[];
  settings: SystemSettings;
  activityLogs: ActivityLog[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const TMP_FILE = path.join(DB_DIR, 'db.json.tmp');
const BACKUPS_DIR = path.join(DB_DIR, 'backups');
const LOGS_DIR = path.join(DB_DIR, 'logs');
const CURRENT_SCHEMA_VERSION = 2;

function ensureDirectories() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function writeSystemLog(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
  try {
    ensureDirectories();
    const logLine = `[${new Date().toISOString()}] [${level}] ${message}\n`;
    fs.appendFileSync(path.join(LOGS_DIR, 'system.log'), logLine, 'utf-8');
  } catch (err) {
    console.error('Failed to write to system log:', err);
  }
}

let firestoreInstance: Firestore | null = null;

function initFirestore(): Firestore | null {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      writeSystemLog('WARN', 'firebase-applet-config.json not found');
      return null;
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    const dbInstance = config.firestoreDatabaseId
      ? getFirestore(app, config.firestoreDatabaseId)
      : getFirestore(app);
    writeSystemLog('INFO', `Firebase Firestore connected: ${config.projectId}`);
    return dbInstance;
  } catch (err: any) {
    writeSystemLog('ERROR', `Firestore init failed: ${err.message}`);
    return null;
  }
}

/**
 * Normalizes user record to ensure all required fields are present
 */
function normalizeUser(rawUser: any): StoredUser {
  const cleanPhone = (rawUser.phone || '').toString().trim();
  const countryCode = rawUser.countryCode || '+1';
  
  return {
    id: rawUser.id || 'usr_' + Date.now() + Math.random().toString(36).substring(2, 6),
    username: rawUser.username || `Member_${cleanPhone.slice(-4) || '0000'}`,
    phone: cleanPhone,
    countryCode,
    email: (rawUser.email || `user_${cleanPhone || Date.now()}@nexgrab.net`).toLowerCase().trim(),
    balance: typeof rawUser.balance === 'number' ? rawUser.balance : 0,
    investment: typeof rawUser.investment === 'number' ? rawUser.investment : 0,
    todayProfit: typeof rawUser.todayProfit === 'number' ? rawUser.todayProfit : 0,
    totalProfit: typeof rawUser.totalProfit === 'number' ? rawUser.totalProfit : 0,
    vipLevel: (rawUser.vipLevel && rawUser.vipLevel >= 1 && rawUser.vipLevel <= 5) ? rawUser.vipLevel : 1,
    isGrabActive: !!rawUser.isGrabActive,
    lastGrabTimestamp: rawUser.lastGrabTimestamp || null,
    grabEndTime: rawUser.grabEndTime || null,
    referralCode: (rawUser.referralCode || 'NG' + Math.floor(100000 + Math.random() * 900000)).toUpperCase().trim(),
    referredByCode: rawUser.referredByCode ? rawUser.referredByCode.toUpperCase().trim() : null,
    directMembersCount: typeof rawUser.directMembersCount === 'number' ? rawUser.directMembersCount : 0,
    teamMembersCount: typeof rawUser.teamMembersCount === 'number' ? rawUser.teamMembersCount : 0,
    teamDeposit: typeof rawUser.teamDeposit === 'number' ? rawUser.teamDeposit : 0,
    status: rawUser.status === 'suspended' ? 'suspended' : 'active',
    createdAt: rawUser.createdAt || new Date().toISOString(),
    fundPasswordSet: typeof rawUser.fundPasswordSet === 'boolean' ? rawUser.fundPasswordSet : !!rawUser.fundPasswordHash,
    passwordHash: rawUser.passwordHash || bcrypt.hashSync('User@123456', 10),
    fundPasswordHash: rawUser.fundPasswordHash || undefined,
  };
}

/**
 * Validates and migrates database data payload
 */
function validateAndMigrateData(data: any): DatabaseData {
  const adminPasswordHash = bcrypt.hashSync('AyeshaNazz', 10);
  
  const defaultAdmins: StoredAdmin[] = [
    {
      id: 'admin_1',
      username: 'hasnainnazz',
      passwordHash: adminPasswordHash,
      role: 'superadmin',
    }
  ];

  const defaultAnnouncements: Announcement[] = [
    {
      id: 'ann_1',
      title: 'Welcome to MNG FILM Order Matching Platform',
      content: 'Experience secure, server-verified 24-hour order matching cycles with up to 5% daily profit tiers.',
      isImportant: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ann_2',
      title: 'USDT BEP20 & TRC20 Deposit Channels Live',
      content: 'Deposits are processed securely via admin verification. Minimum deposit is 20 USDT.',
      isImportant: false,
      createdAt: new Date().toISOString(),
    }
  ];

  const defaultBanners: Banner[] = [
    {
      id: 'b1',
      title: 'Automated Global Order Matching Engine',
      imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
      active: true,
    },
    {
      id: 'b2',
      title: 'Tiered VIP Earnings Up to 5% Daily',
      imageUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80',
      active: true,
    }
  ];

  const defaultSettings: SystemSettings = {
    minInvestment: 20,
    minWithdrawal: 10,
    withdrawalFeePercent: 8,
    usdtBep20Address: '0xbd63907b714a667f5052c432cdc4ad3dc0d73658',
    usdtTrc20Address: 'TETttTRj6ZX5gAm79RgDgDm6WHeMrnDjdy',
    etbCbeBankName: 'CBE (Commercial Bank of Ethiopia)',
    etbCbeAccountName: 'Bonsa Shamsadin',
    etbCbeAccountNumber: '1000251685715',
    ethiopianBanks: [
      'CBE (Commercial Bank of Ethiopia)',
      'Awash Bank',
      'Dashen Bank',
      'Bank of Abyssinia',
      'Wegagen Bank',
      'Nib International Bank',
      'Hibret Bank',
      'Oromia Bank',
      'Zemen Bank',
      'Cooperative Bank of Oromia',
      'Telebirr / CBE Birr',
      'Lion International Bank',
      'Berhan Bank',
      'Abay Bank',
      'Addis International Bank',
    ],
    allowCustomReferral: false,
    captchaEnabled: true,
    announcementText: 'System status: Normal operations. Order matching cycle 24 hours.',
    maintenanceMode: false,
  };

  if (!data || typeof data !== 'object') {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      users: [],
      admins: defaultAdmins,
      rechargeRequests: [],
      withdrawalRequests: [],
      transactions: [],
      grabLogs: [],
      announcements: defaultAnnouncements,
      banners: defaultBanners,
      supportTickets: [],
      notifications: [],
      settings: defaultSettings,
      activityLogs: [
        {
          id: 'log_init_' + Date.now(),
          actor: 'SYSTEM',
          action: 'DB_INITIALIZED',
          details: 'Initialized persistent NexGrab Database.',
          ip: '127.0.0.1',
          createdAt: new Date().toISOString(),
        }
      ]
    };
  }

  const rawUsers = Array.isArray(data.users) ? data.users : [];
  const users = rawUsers.map(normalizeUser);

  let admins = Array.isArray(data.admins) ? data.admins : [];
  const hasHasnainAdmin = admins.some((a: any) => a.username.toLowerCase() === 'hasnainnazz');
  if (!hasHasnainAdmin) {
    admins.unshift(defaultAdmins[0]);
  } else {
    admins = admins.map((a: any) => {
      if (a.username.toLowerCase() === 'hasnainnazz') {
        return { ...a, passwordHash: adminPasswordHash };
      }
      return a;
    });
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastBackupAt: data.lastBackupAt,
    users,
    admins,
    rechargeRequests: Array.isArray(data.rechargeRequests) ? data.rechargeRequests : [],
    withdrawalRequests: Array.isArray(data.withdrawalRequests) ? data.withdrawalRequests : [],
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    grabLogs: Array.isArray(data.grabLogs) ? data.grabLogs : [],
    announcements: Array.isArray(data.announcements) && data.announcements.length > 0 ? data.announcements : defaultAnnouncements,
    banners: Array.isArray(data.banners) && data.banners.length > 0 ? data.banners : defaultBanners,
    supportTickets: Array.isArray(data.supportTickets) ? data.supportTickets : [],
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    settings: {
      ...defaultSettings,
      ...(data.settings || {}),
      usdtBep20Address: '0xbd63907b714a667f5052c432cdc4ad3dc0d73658',
      usdtTrc20Address: 'TETttTRj6ZX5gAm79RgDgDm6WHeMrnDjdy',
    },
    activityLogs: Array.isArray(data.activityLogs) ? data.activityLogs : [],
  };
}

function loadInitialData(): DatabaseData {
  ensureDirectories();

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const data = validateAndMigrateData(parsed);
      writeSystemLog('INFO', `Database loaded from local disk ${DB_FILE}. Total users: ${data.users.length}`);
      return data;
    } catch (err: any) {
      writeSystemLog('ERROR', `Failed reading main db.json (${err.message})`);
    }
  }

  const initialData = validateAndMigrateData(null);
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    fs.renameSync(TMP_FILE, DB_FILE);
  } catch (err: any) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }

  return initialData;
}

class Database {
  private data: DatabaseData;
  private backupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.data = loadInitialData();
    firestoreInstance = initFirestore();
    this.syncFirestoreData();
    this.recalculateAllReferralStats();
    this.scheduleAutoBackups();
  }

  /**
   * Syncs dataset with Firebase Firestore on startup
   * Fetches persistent documents from Firestore or populates Firestore if empty
   */
  private async syncFirestoreData() {
    if (!firestoreInstance) return;

    try {
      writeSystemLog('INFO', 'Starting Firebase Firestore bidirectional data sync...');
      
      // 1. Users
      const usersSnap = await getDocs(collection(firestoreInstance, 'users'));
      if (!usersSnap.empty) {
        const userMap = new Map<string, StoredUser>();
        usersSnap.forEach(d => {
          const u = normalizeUser(d.data());
          userMap.set(u.id, u);
        });
        // Keep local users created offline or recently
        for (const localU of this.data.users) {
          if (!userMap.has(localU.id)) {
            userMap.set(localU.id, localU);
            this.setFirestoreDoc('users', localU.id, localU);
          }
        }
        this.data.users = Array.from(userMap.values());
        writeSystemLog('INFO', `Synced ${this.data.users.length} users with Firestore`);
      } else if (this.data.users.length > 0) {
        for (const u of this.data.users) {
          await this.setFirestoreDoc('users', u.id, u);
        }
      }

      // 2. Admins
      const adminPasswordHash = bcrypt.hashSync('AyeshaNazz', 10);
      const hasnainAdmin: StoredAdmin = {
        id: 'admin_hasnain',
        username: 'hasnainnazz',
        passwordHash: adminPasswordHash,
        role: 'superadmin',
      };

      const adminsSnap = await getDocs(collection(firestoreInstance, 'admins'));
      if (!adminsSnap.empty) {
        const adminMap = new Map<string, StoredAdmin>();
        adminsSnap.forEach(d => {
          const a = d.data() as StoredAdmin;
          if (a.username.toLowerCase() === 'hasnainnazz') {
            const updated = { ...a, passwordHash: adminPasswordHash };
            adminMap.set(a.id, updated);
            this.setFirestoreDoc('admins', a.id, updated);
          } else {
            adminMap.set(a.id, a);
          }
        });
        if (!Array.from(adminMap.values()).some(a => a.username.toLowerCase() === 'hasnainnazz')) {
          adminMap.set(hasnainAdmin.id, hasnainAdmin);
          this.setFirestoreDoc('admins', hasnainAdmin.id, hasnainAdmin);
        }
        this.data.admins = Array.from(adminMap.values());
      } else {
        this.data.admins = [hasnainAdmin];
        await this.setFirestoreDoc('admins', hasnainAdmin.id, hasnainAdmin);
      }

      // 3. Settings
      const settingsDoc = await getDoc(doc(firestoreInstance, 'settings', 'system_settings'));
      if (settingsDoc.exists()) {
        this.data.settings = {
          ...this.data.settings,
          ...settingsDoc.data(),
          usdtBep20Address: '0xbd63907b714a667f5052c432cdc4ad3dc0d73658',
          usdtTrc20Address: 'TETttTRj6ZX5gAm79RgDgDm6WHeMrnDjdy',
        };
        await this.setFirestoreDoc('settings', 'system_settings', this.data.settings);
      } else {
        await this.setFirestoreDoc('settings', 'system_settings', this.data.settings);
      }

      // 4. Recharges
      const rechargesSnap = await getDocs(collection(firestoreInstance, 'rechargeRequests'));
      if (!rechargesSnap.empty) {
        const listMap = new Map<string, RechargeRequest>();
        rechargesSnap.forEach(d => {
          const r = d.data() as RechargeRequest;
          listMap.set(r.id, r);
        });
        for (const localR of this.data.rechargeRequests) {
          if (!listMap.has(localR.id)) {
            listMap.set(localR.id, localR);
            this.setFirestoreDoc('rechargeRequests', localR.id, localR);
          }
        }
        this.data.rechargeRequests = Array.from(listMap.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } else if (this.data.rechargeRequests.length > 0) {
        for (const r of this.data.rechargeRequests) {
          await this.setFirestoreDoc('rechargeRequests', r.id, r);
        }
      }

      // 5. Withdrawals
      const withdrawalsSnap = await getDocs(collection(firestoreInstance, 'withdrawalRequests'));
      if (!withdrawalsSnap.empty) {
        const listMap = new Map<string, WithdrawalRequest>();
        withdrawalsSnap.forEach(d => {
          const w = d.data() as WithdrawalRequest;
          listMap.set(w.id, w);
        });
        for (const localW of this.data.withdrawalRequests) {
          if (!listMap.has(localW.id)) {
            listMap.set(localW.id, localW);
            this.setFirestoreDoc('withdrawalRequests', localW.id, localW);
          }
        }
        this.data.withdrawalRequests = Array.from(listMap.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } else if (this.data.withdrawalRequests.length > 0) {
        for (const w of this.data.withdrawalRequests) {
          await this.setFirestoreDoc('withdrawalRequests', w.id, w);
        }
      }

      // 6. Transactions
      const txSnap = await getDocs(collection(firestoreInstance, 'transactions'));
      if (!txSnap.empty) {
        const listMap = new Map<string, Transaction>();
        txSnap.forEach(d => {
          const t = d.data() as Transaction;
          listMap.set(t.id, t);
        });
        for (const localT of this.data.transactions) {
          if (!listMap.has(localT.id)) {
            listMap.set(localT.id, localT);
            this.setFirestoreDoc('transactions', localT.id, localT);
          }
        }
        this.data.transactions = Array.from(listMap.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } else if (this.data.transactions.length > 0) {
        for (const t of this.data.transactions) {
          await this.setFirestoreDoc('transactions', t.id, t);
        }
      }

      // 7. Announcements
      const annSnap = await getDocs(collection(firestoreInstance, 'announcements'));
      if (!annSnap.empty) {
        const listMap = new Map<string, Announcement>();
        annSnap.forEach(d => {
          const a = d.data() as Announcement;
          listMap.set(a.id, a);
        });
        for (const localA of this.data.announcements) {
          if (!listMap.has(localA.id)) {
            listMap.set(localA.id, localA);
            this.setFirestoreDoc('announcements', localA.id, localA);
          }
        }
        this.data.announcements = Array.from(listMap.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } else if (this.data.announcements.length > 0) {
        for (const a of this.data.announcements) {
          await this.setFirestoreDoc('announcements', a.id, a);
        }
      }

      this.saveLocal();
      writeSystemLog('INFO', '✅ Firebase Firestore sync completed successfully.');
    } catch (err: any) {
      writeSystemLog('ERROR', `Error during Firestore sync: ${err.message}`);
    }
  }

  /**
   * Helper to write to Firestore asynchronously
   */
  private async setFirestoreDoc(collectionName: string, docId: string, payload: any) {
    if (!firestoreInstance) return;
    try {
      const sanitized = JSON.parse(JSON.stringify(payload));
      await setDoc(doc(firestoreInstance, collectionName, docId), sanitized);
    } catch (err: any) {
      writeSystemLog('ERROR', `Failed writing to Firestore [${collectionName}/${docId}]: ${err.message}`);
    }
  }

  private async deleteFirestoreDoc(collectionName: string, docId: string) {
    if (!firestoreInstance) return;
    try {
      await deleteDoc(doc(firestoreInstance, collectionName, docId));
    } catch (err: any) {
      writeSystemLog('ERROR', `Failed deleting Firestore doc [${collectionName}/${docId}]: ${err.message}`);
    }
  }

  private saveLocal() {
    try {
      ensureDirectories();
      const payload = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(TMP_FILE, payload, 'utf-8');
      fs.renameSync(TMP_FILE, DB_FILE);
    } catch (err: any) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (directErr: any) {
        writeSystemLog('ERROR', `Save error: ${directErr.message}`);
      }
    }
  }

  private recalculateAllReferralStats() {
    let updated = false;
    for (const user of this.data.users) {
      const directMembers = this.data.users.filter(
        u => u.referredByCode && u.referredByCode.toUpperCase() === user.referralCode.toUpperCase()
      );
      const directCodes = directMembers.map(m => m.referralCode.toUpperCase());
      
      const subMembers = this.data.users.filter(
        u => u.referredByCode && directCodes.includes(u.referredByCode.toUpperCase())
      );
      const subCodes = subMembers.map(m => m.referralCode.toUpperCase());

      const tertiaryMembers = this.data.users.filter(
        u => u.referredByCode && subCodes.includes(u.referredByCode.toUpperCase())
      );

      const newDirectCount = directMembers.length;
      const newTeamCount = directMembers.length + subMembers.length + tertiaryMembers.length;
      const newTeamDeposit = [...directMembers, ...subMembers, ...tertiaryMembers].reduce(
        (sum, m) => sum + (m.investment || 0), 0
      );

      if (
        user.directMembersCount !== newDirectCount ||
        user.teamMembersCount !== newTeamCount ||
        user.teamDeposit !== newTeamDeposit
      ) {
        user.directMembersCount = newDirectCount;
        user.teamMembersCount = newTeamCount;
        user.teamDeposit = newTeamDeposit;
        updated = true;
      }
    }

    if (updated) {
      this.saveLocal();
    }
  }

  private scheduleAutoBackups() {
    const lastBackupTime = this.data.lastBackupAt ? new Date(this.data.lastBackupAt).getTime() : 0;
    const now = Date.now();
    
    if (now - lastBackupTime > 24 * 60 * 60 * 1000) {
      this.createBackupSnapshot(true);
    }

    this.backupTimer = setInterval(() => {
      this.createBackupSnapshot(true);
    }, 12 * 60 * 60 * 1000);
  }

  public createBackupSnapshot(isAuto = false): BackupMetadata {
    ensureDirectories();
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-');
    const prefix = isAuto ? 'db-autobackup' : 'db-manualbackup';
    const filename = `${prefix}-${dateStr}.json`;
    const filepath = path.join(BACKUPS_DIR, filename);

    this.data.lastBackupAt = now.toISOString();
    const payload = JSON.stringify(this.data, null, 2);
    
    fs.writeFileSync(filepath, payload, 'utf-8');
    this.saveLocal();

    const stats = fs.statSync(filepath);
    writeSystemLog('INFO', `Created DB backup: ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);

    this.rotateOldBackups();

    return {
      filename,
      sizeBytes: stats.size,
      createdAt: now.toISOString(),
      userCount: this.data.users.length,
      transactionCount: this.data.transactions.length,
      rechargeCount: this.data.rechargeRequests.length,
      withdrawalCount: this.data.withdrawalRequests.length,
      isAutoBackup: isAuto,
    };
  }

  private rotateOldBackups() {
    try {
      if (!fs.existsSync(BACKUPS_DIR)) return;
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a));

      if (files.length > 30) {
        const toDelete = files.slice(30);
        for (const f of toDelete) {
          fs.unlinkSync(path.join(BACKUPS_DIR, f));
        }
      }
    } catch (err: any) {
      writeSystemLog('ERROR', `Backup rotation failed: ${err.message}`);
    }
  }

  public listBackups(): BackupMetadata[] {
    ensureDirectories();
    if (!fs.existsSync(BACKUPS_DIR)) return [];

    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
    const result: BackupMetadata[] = [];

    for (const f of files) {
      try {
        const filepath = path.join(BACKUPS_DIR, f);
        const stats = fs.statSync(filepath);
        const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        result.push({
          filename: f,
          sizeBytes: stats.size,
          createdAt: content.lastBackupAt || stats.birthtime.toISOString(),
          userCount: Array.isArray(content.users) ? content.users.length : 0,
          transactionCount: Array.isArray(content.transactions) ? content.transactions.length : 0,
          rechargeCount: Array.isArray(content.rechargeRequests) ? content.rechargeRequests.length : 0,
          withdrawalCount: Array.isArray(content.withdrawalRequests) ? content.withdrawalRequests.length : 0,
          isAutoBackup: f.includes('autobackup'),
        });
      } catch (err) {
        // Skip
      }
    }

    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public restoreBackup(filename: string): { success: boolean; message: string; userCount: number } {
    ensureDirectories();
    const filepath = path.join(BACKUPS_DIR, path.basename(filename));

    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file ${filename} does not exist`);
    }

    try {
      this.createBackupSnapshot(false);

      const raw = fs.readFileSync(filepath, 'utf-8');
      const parsed = JSON.parse(raw);
      this.data = validateAndMigrateData(parsed);
      this.saveLocal();
      this.syncFirestoreData();

      return {
        success: true,
        message: `Database restored successfully from ${filename}`,
        userCount: this.data.users.length,
      };
    } catch (err: any) {
      throw new Error(`Restore failed: ${err.message}`);
    }
  }

  // --- SETTINGS ---
  getSettings(): SystemSettings {
    return this.data.settings;
  }

  updateSettings(newSettings: Partial<SystemSettings>) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.saveLocal();
    this.setFirestoreDoc('settings', 'system_settings', this.data.settings);
    return this.data.settings;
  }

  // --- USERS ---
  getUsers(): StoredUser[] {
    return this.data.users;
  }

  getUserById(id: string): StoredUser | undefined {
    if (!id) return undefined;
    return this.data.users.find(u => u.id === id);
  }

  getUserByPhone(countryCode: string, phone: string): StoredUser | undefined {
    if (!phone) return undefined;
    const cleanPhone = phone.trim();
    const cleanCountry = countryCode ? countryCode.trim() : '';

    return this.data.users.find(u => {
      const pMatch = u.phone === cleanPhone;
      const cMatch = !cleanCountry || u.countryCode === cleanCountry;
      return pMatch && cMatch;
    });
  }

  getUserByEmail(email: string): StoredUser | undefined {
    if (!email) return undefined;
    const cleanEmail = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === cleanEmail);
  }

  getUserByReferralCode(code: string): StoredUser | undefined {
    if (!code) return undefined;
    const cleanCode = code.trim().toUpperCase();
    return this.data.users.find(u => u.referralCode.toUpperCase() === cleanCode);
  }

  addUser(user: StoredUser): StoredUser {
    const normalized = normalizeUser(user);
    this.data.users.push(normalized);

    if (normalized.referredByCode) {
      const referrer = this.getUserByReferralCode(normalized.referredByCode);
      if (referrer) {
        referrer.directMembersCount += 1;
        referrer.teamMembersCount += 1;
        this.checkAndUpdateVipLevel(referrer.id);
        this.setFirestoreDoc('users', referrer.id, referrer);

        this.addNotification({
          id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 5),
          userId: referrer.id,
          title: 'New Member Joined!',
          message: `User ${normalized.phone.slice(0, 3)}***${normalized.phone.slice(-2)} registered using your referral code.`,
          type: 'info',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    this.saveLocal();
    this.setFirestoreDoc('users', normalized.id, normalized);
    return normalized;
  }

  updateUser(id: string, updates: Partial<StoredUser>): StoredUser | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;

    Object.assign(user, updates);
    this.checkAndUpdateVipLevel(id);
    this.saveLocal();
    this.setFirestoreDoc('users', user.id, user);
    return user;
  }

  deleteUser(id: string): boolean {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      const deleted = this.data.users.splice(index, 1)[0];
      this.saveLocal();
      this.deleteFirestoreDoc('users', id);
      return true;
    }
    return false;
  }

  checkAndUpdateVipLevel(userId: string) {
    const user = this.getUserById(userId);
    if (!user) return;

    let targetVip: VipLevel = 1;
    for (const plan of VIP_PLANS) {
      if (
        user.investment >= plan.minInvestment &&
        user.directMembersCount >= plan.reqDirectMembers
      ) {
        targetVip = plan.level;
      }
    }

    if (user.vipLevel !== targetVip) {
      const oldLevel = user.vipLevel;
      user.vipLevel = targetVip;
      this.addNotification({
        id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 5),
        userId: user.id,
        title: 'VIP Level Upgraded!',
        message: `Congratulations! Your VIP plan has been upgraded from VIP ${oldLevel} to VIP ${targetVip}.`,
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // --- ADMIN USERS ---
  getAdminByUsername(username: string): StoredAdmin | undefined {
    if (!username) return undefined;
    const cleanUser = username.trim().toLowerCase();
    let admin = this.data.admins.find(a => a.username.toLowerCase() === cleanUser);
    if (!admin && cleanUser === 'hasnainnazz') {
      const adminPasswordHash = bcrypt.hashSync('AyeshaNazz', 10);
      admin = {
        id: 'admin_hasnain',
        username: 'hasnainnazz',
        passwordHash: adminPasswordHash,
        role: 'superadmin',
      };
      this.data.admins.push(admin);
      this.setFirestoreDoc('admins', admin.id, admin);
    }
    return admin;
  }

  updateAdminLogin(id: string) {
    const admin = this.data.admins.find(a => a.id === id);
    if (admin) {
      admin.lastLogin = new Date().toISOString();
      this.saveLocal();
      this.setFirestoreDoc('admins', admin.id, admin);
    }
  }

  // --- RECHARGES ---
  getRecharges(): RechargeRequest[] {
    return this.data.rechargeRequests;
  }

  getRechargeById(id: string): RechargeRequest | undefined {
    return this.data.rechargeRequests.find(r => r.id === id);
  }

  addRecharge(request: RechargeRequest): RechargeRequest {
    this.data.rechargeRequests.unshift(request);
    this.saveLocal();
    this.setFirestoreDoc('rechargeRequests', request.id, request);
    return request;
  }

  processRecharge(id: string, status: 'approved' | 'rejected', adminNote?: string): RechargeRequest | undefined {
    const req = this.getRechargeById(id);
    if (!req || req.status !== 'pending') return undefined;

    req.status = status;
    req.adminNote = adminNote;
    req.processedAt = new Date().toISOString();

    if (status === 'approved') {
      const user = this.getUserById(req.userId);
      if (user) {
        user.balance += req.amount;
        user.investment += req.amount;

        if (user.referredByCode) {
          const referrer = this.getUserByReferralCode(user.referredByCode);
          if (referrer) {
            referrer.teamDeposit += req.amount;
            this.setFirestoreDoc('users', referrer.id, referrer);
          }
        }

        const isEtb = req.network === 'ETB_BANK' || req.paymentMethod === 'ETB_BANK';
        const methodLabel = isEtb ? 'ETB Bank Transfer' : req.network;
        const currencyLabel = isEtb ? 'ETB' : 'USDT';

        this.addTransaction({
          id: 'tx_' + Date.now(),
          userId: user.id,
          type: 'recharge',
          amount: req.amount,
          balanceAfter: user.balance,
          description: `${methodLabel} Recharge (${req.amount} ${currencyLabel}) Approved`,
          status: 'completed',
          createdAt: new Date().toISOString(),
        });

        this.addNotification({
          id: 'notif_' + Date.now(),
          userId: user.id,
          title: 'Recharge Approved!',
          message: `Your deposit of ${req.amount} ${currencyLabel} via ${methodLabel} has been approved and credited.`,
          type: 'success',
          isRead: false,
          createdAt: new Date().toISOString(),
        });

        this.checkAndUpdateVipLevel(user.id);
        this.setFirestoreDoc('users', user.id, user);
      }
    } else {
      this.addNotification({
        id: 'notif_' + Date.now(),
        userId: req.userId,
        title: 'Recharge Rejected',
        message: `Your deposit request of ${req.amount} USDT was rejected. Note: ${adminNote || 'Invalid TXID/Payment proof'}.`,
        type: 'error',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    this.saveLocal();
    this.setFirestoreDoc('rechargeRequests', req.id, req);
    return req;
  }

  // --- WITHDRAWALS ---
  getWithdrawals(): WithdrawalRequest[] {
    return this.data.withdrawalRequests;
  }

  getWithdrawalById(id: string): WithdrawalRequest | undefined {
    return this.data.withdrawalRequests.find(w => w.id === id);
  }

  addWithdrawal(request: WithdrawalRequest): WithdrawalRequest {
    const user = this.getUserById(request.userId);
    if (!user || user.balance < request.amount) {
      throw new Error('Insufficient wallet balance for withdrawal request');
    }

    user.balance -= request.amount;
    this.data.withdrawalRequests.unshift(request);

    const isEtb = request.network === 'ETB_BANK' || request.paymentMethod === 'ETB_BANK';
    const currencyLabel = isEtb ? 'ETB' : 'USDT';
    const methodDesc = isEtb ? `ETB Bank (${request.bankName || 'Ethiopian Bank'})` : request.network;

    this.addTransaction({
      id: 'tx_' + Date.now(),
      userId: user.id,
      type: 'withdrawal',
      amount: -request.amount,
      balanceAfter: user.balance,
      description: `Withdrawal Request ${request.amount} ${currencyLabel} via ${methodDesc} (Fee: ${request.fee} ${currencyLabel})`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    this.saveLocal();
    this.setFirestoreDoc('users', user.id, user);
    this.setFirestoreDoc('withdrawalRequests', request.id, request);
    return request;
  }

  processWithdrawal(id: string, status: 'approved' | 'rejected', adminNote?: string): WithdrawalRequest | undefined {
    const req = this.getWithdrawalById(id);
    if (!req || req.status !== 'pending') return undefined;

    req.status = status;
    req.adminNote = adminNote;
    req.processedAt = new Date().toISOString();

    const user = this.getUserById(req.userId);
    const isEtb = req.network === 'ETB_BANK' || req.paymentMethod === 'ETB_BANK';
    const currencyLabel = isEtb ? 'ETB' : 'USDT';
    const destinationDesc = isEtb
      ? `${req.bankName || 'ETB Bank'} - ${req.accountNumber || ''}`
      : `${req.walletAddress.slice(0, 6)}...${req.walletAddress.slice(-4)}`;

    if (status === 'approved') {
      if (user) {
        this.addNotification({
          id: 'notif_' + Date.now(),
          userId: user.id,
          title: 'Withdrawal Approved!',
          message: `Your withdrawal of ${req.netAmount} ${currencyLabel} has been processed and sent to ${destinationDesc}.`,
          type: 'success',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      if (user) {
        user.balance += req.amount;
        this.addTransaction({
          id: 'tx_' + Date.now(),
          userId: user.id,
          type: 'withdrawal',
          amount: req.amount,
          balanceAfter: user.balance,
          description: `Withdrawal Refund (${req.amount} ${currencyLabel}) - Request Rejected`,
          status: 'completed',
          createdAt: new Date().toISOString(),
        });

        this.addNotification({
          id: 'notif_' + Date.now(),
          userId: user.id,
          title: 'Withdrawal Rejected & Refunded',
          message: `Your withdrawal request of ${req.amount} ${currencyLabel} was rejected and refunded.`,
          type: 'error',
          isRead: false,
          createdAt: new Date().toISOString(),
        });

        this.setFirestoreDoc('users', user.id, user);
      }
    }

    this.saveLocal();
    this.setFirestoreDoc('withdrawalRequests', req.id, req);
    return req;
  }

  // --- TRANSACTIONS ---
  getTransactions(userId?: string): Transaction[] {
    if (userId) {
      return this.data.transactions.filter(t => t.userId === userId);
    }
    return this.data.transactions;
  }

  addTransaction(tx: Transaction): Transaction {
    this.data.transactions.unshift(tx);
    this.saveLocal();
    this.setFirestoreDoc('transactions', tx.id, tx);
    return tx;
  }

  // --- GRAB ORDER ENGINE ---
  startGrabOrder(userId: string): { remainingSeconds: number; endTime: number } {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    if (user.status === 'suspended') {
      throw new Error('Your account is currently suspended. Contact support.');
    }

    if (user.investment < 20) {
      throw new Error('Minimum investment of 20 USDT is required to start Grab Order.');
    }

    const now = Date.now();

    if (user.lastGrabTimestamp && (now - user.lastGrabTimestamp) < 24 * 60 * 60 * 1000) {
      const msLeft = (24 * 60 * 60 * 1000) - (now - user.lastGrabTimestamp);
      const hoursLeft = (msLeft / (1000 * 60 * 60)).toFixed(1);
      throw new Error(`You have already completed your daily Grab Order. Next cycle available in ${hoursLeft} hours.`);
    }

    if (user.isGrabActive && user.grabEndTime && now < user.grabEndTime) {
      const remainingSeconds = Math.ceil((user.grabEndTime - now) / 1000);
      return { remainingSeconds, endTime: user.grabEndTime };
    }

    const durationMs = 60 * 1000;
    user.isGrabActive = true;
    user.lastGrabTimestamp = now;
    user.grabEndTime = now + durationMs;

    this.saveLocal();
    this.setFirestoreDoc('users', user.id, user);
    return { remainingSeconds: 60, endTime: user.grabEndTime };
  }

  getGrabStatus(userId: string): {
    isGrabActive: boolean;
    remainingSeconds: number;
    canGrab: boolean;
    cooldownRemainingMs: number;
    todayProfit: number;
    totalProfit: number;
    vipPlan: VIPPlan;
  } {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const now = Date.now();
    const plan = VIP_PLANS.find(p => p.level === user.vipLevel) || VIP_PLANS[0];

    if (user.isGrabActive && user.grabEndTime) {
      if (now >= user.grabEndTime) {
        const profitAmount = Number(((user.investment * plan.dailyProfitPercent) / 100).toFixed(4));
        user.isGrabActive = false;
        user.balance += profitAmount;
        user.todayProfit += profitAmount;
        user.totalProfit += profitAmount;

        const grabLog: GrabLog = {
          id: 'grab_' + Date.now(),
          userId: user.id,
          vipLevel: user.vipLevel,
          investmentAtGrab: user.investment,
          profitEarned: profitAmount,
          durationSeconds: 60,
          startTime: new Date(user.lastGrabTimestamp || now - 60000).toISOString(),
          endTime: new Date(now).toISOString(),
          status: 'completed',
        };
        this.data.grabLogs.unshift(grabLog);
        this.setFirestoreDoc('grabLogs', grabLog.id, grabLog);

        this.addTransaction({
          id: 'tx_grab_' + Date.now(),
          userId: user.id,
          type: 'grab_profit',
          amount: profitAmount,
          balanceAfter: user.balance,
          description: `VIP ${user.vipLevel} Daily Grab Profit (${plan.dailyProfitPercent}%)`,
          status: 'completed',
          createdAt: new Date().toISOString(),
        });

        // Team Commissions
        if (user.referredByCode) {
          const level1User = this.getUserByReferralCode(user.referredByCode);
          if (level1User) {
            const l1Bonus = Number((profitAmount * 0.14).toFixed(4));
            if (l1Bonus > 0) {
              level1User.balance += l1Bonus;
              level1User.todayProfit += l1Bonus;
              level1User.totalProfit += l1Bonus;
              this.setFirestoreDoc('users', level1User.id, level1User);
              this.addTransaction({
                id: 'tx_ref1_' + Date.now(),
                userId: level1User.id,
                type: 'referral_bonus',
                amount: l1Bonus,
                balanceAfter: level1User.balance,
                description: `Level 1 Team Grab Bonus (14% from ${user.username})`,
                status: 'completed',
                createdAt: new Date().toISOString(),
              });
            }

            if (level1User.referredByCode) {
              const level2User = this.getUserByReferralCode(level1User.referredByCode);
              if (level2User) {
                const l2Bonus = Number((profitAmount * 0.07).toFixed(4));
                if (l2Bonus > 0) {
                  level2User.balance += l2Bonus;
                  level2User.todayProfit += l2Bonus;
                  level2User.totalProfit += l2Bonus;
                  this.setFirestoreDoc('users', level2User.id, level2User);
                  this.addTransaction({
                    id: 'tx_ref2_' + Date.now(),
                    userId: level2User.id,
                    type: 'referral_bonus',
                    amount: l2Bonus,
                    balanceAfter: level2User.balance,
                    description: `Level 2 Team Grab Bonus (7% from ${user.username})`,
                    status: 'completed',
                    createdAt: new Date().toISOString(),
                  });
                }

                if (level2User.referredByCode) {
                  const level3User = this.getUserByReferralCode(level2User.referredByCode);
                  if (level3User) {
                    const l3Bonus = Number((profitAmount * 0.03).toFixed(4));
                    if (l3Bonus > 0) {
                      level3User.balance += l3Bonus;
                      level3User.todayProfit += l3Bonus;
                      level3User.totalProfit += l3Bonus;
                      this.setFirestoreDoc('users', level3User.id, level3User);
                      this.addTransaction({
                        id: 'tx_ref3_' + Date.now(),
                        userId: level3User.id,
                        type: 'referral_bonus',
                        amount: l3Bonus,
                        balanceAfter: level3User.balance,
                        description: `Level 3 Team Grab Bonus (3% from ${user.username})`,
                        status: 'completed',
                        createdAt: new Date().toISOString(),
                      });
                    }
                  }
                }
              }
            }
          }
        }

        this.saveLocal();
        this.setFirestoreDoc('users', user.id, user);
      }
    }

    let canGrab = true;
    let cooldownRemainingMs = 0;

    if (user.investment < 20) {
      canGrab = false;
    } else if (user.isGrabActive) {
      canGrab = false;
    } else if (user.lastGrabTimestamp && (now - user.lastGrabTimestamp) < 24 * 60 * 60 * 1000) {
      canGrab = false;
      cooldownRemainingMs = (24 * 60 * 60 * 1000) - (now - user.lastGrabTimestamp);
    }

    const remainingSeconds = user.isGrabActive && user.grabEndTime && user.grabEndTime > now
      ? Math.ceil((user.grabEndTime - now) / 1000)
      : 0;

    return {
      isGrabActive: user.isGrabActive,
      remainingSeconds,
      canGrab,
      cooldownRemainingMs,
      todayProfit: user.todayProfit,
      totalProfit: user.totalProfit,
      vipPlan: plan,
    };
  }

  // --- ANNOUNCEMENTS, BANNERS, SUPPORT, NOTIFICATIONS ---
  getAnnouncements(): Announcement[] {
    return this.data.announcements;
  }

  addAnnouncement(ann: Announcement): Announcement {
    this.data.announcements.unshift(ann);
    this.saveLocal();
    this.setFirestoreDoc('announcements', ann.id, ann);
    return ann;
  }

  deleteAnnouncement(id: string) {
    this.data.announcements = this.data.announcements.filter(a => a.id !== id);
    this.saveLocal();
    this.deleteFirestoreDoc('announcements', id);
  }

  getBanners(): Banner[] {
    return this.data.banners;
  }

  getNotifications(userId: string): UserNotification[] {
    return this.data.notifications.filter(n => n.userId === userId);
  }

  addNotification(notif: UserNotification) {
    this.data.notifications.unshift(notif);
    this.saveLocal();
    this.setFirestoreDoc('notifications', notif.id, notif);
  }

  markNotificationRead(userId: string, id: string) {
    const notif = this.data.notifications.find(n => n.id === id && n.userId === userId);
    if (notif) {
      notif.isRead = true;
      this.saveLocal();
      this.setFirestoreDoc('notifications', notif.id, notif);
    }
  }

  getSupportTickets(userId?: string): SupportTicket[] {
    if (userId) {
      return this.data.supportTickets.filter(t => t.userId === userId);
    }
    return this.data.supportTickets;
  }

  createSupportTicket(ticket: SupportTicket): SupportTicket {
    this.data.supportTickets.unshift(ticket);
    this.saveLocal();
    this.setFirestoreDoc('supportTickets', ticket.id, ticket);
    return ticket;
  }

  replySupportTicket(ticketId: string, sender: 'user' | 'admin', text: string): SupportTicket | undefined {
    const ticket = this.data.supportTickets.find(t => t.id === ticketId);
    if (!ticket) return undefined;

    ticket.messages.push({
      sender,
      text,
      timestamp: new Date().toISOString(),
    });

    ticket.status = sender === 'admin' ? 'replied' : 'open';
    ticket.updatedAt = new Date().toISOString();

    if (sender === 'admin') {
      this.addNotification({
        id: 'notif_ticket_' + Date.now(),
        userId: ticket.userId,
        title: 'Support Reply Received',
        message: `Admin replied to your ticket #${ticket.id.slice(-5)}: "${text.slice(0, 40)}..."`,
        type: 'info',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    this.saveLocal();
    this.setFirestoreDoc('supportTickets', ticket.id, ticket);
    return ticket;
  }

  adjustUserBalance(userId: string, amount: number, type: 'add' | 'deduct', reason: string): StoredUser {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    if (type === 'deduct' && user.balance < amount) {
      throw new Error('Cannot deduct more than user current balance');
    }

    const netAdjust = type === 'add' ? amount : -amount;
    user.balance += netAdjust;
    if (type === 'add') {
      user.investment += amount;
    }

    this.addTransaction({
      id: 'tx_adj_' + Date.now(),
      userId: user.id,
      type: type === 'add' ? 'admin_add' : 'admin_deduct',
      amount: netAdjust,
      balanceAfter: user.balance,
      description: `Admin Manual Balance ${type.toUpperCase()}: ${reason}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    this.addNotification({
      id: 'notif_adj_' + Date.now(),
      userId: user.id,
      title: `Balance ${type === 'add' ? 'Credited' : 'Adjusted'}`,
      message: `Your balance was ${type === 'add' ? 'increased' : 'decreased'} by ${amount} USDT by Admin. Reason: ${reason}.`,
      type: type === 'add' ? 'success' : 'warning',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    this.checkAndUpdateVipLevel(user.id);
    this.saveLocal();
    this.setFirestoreDoc('users', user.id, user);
    return user;
  }

  logActivity(actor: string, action: string, details: string, ip: string = '127.0.0.1') {
    const log: ActivityLog = {
      id: 'act_' + Date.now() + Math.random().toString(36).substring(2, 5),
      actor,
      action,
      details,
      ip,
      createdAt: new Date().toISOString(),
    };
    this.data.activityLogs.unshift(log);
    this.saveLocal();
    this.setFirestoreDoc('activityLogs', log.id, log);
    writeSystemLog('INFO', `Activity: [${actor}] [${action}] ${details}`);
  }

  getActivityLogs(): ActivityLog[] {
    return this.data.activityLogs;
  }
}

export const db = new Database();
