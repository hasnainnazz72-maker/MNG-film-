export type VipLevel = 1 | 2 | 3 | 4 | 5;

export interface User {
  id: string;
  username: string;
  phone: string;
  countryCode: string;
  email: string;
  balance: number;          // USDT Available Balance (strictly USDT)
  balanceEtb: number;       // ETB Available Balance (strictly ETB)
  investment: number;       // USDT Investment
  investmentEtb: number;    // ETB Investment
  todayProfit: number;      // USDT Today Profit
  todayProfitEtb: number;   // ETB Today Profit
  totalProfit: number;      // USDT Total Profit
  totalProfitEtb: number;   // ETB Total Profit
  vipLevel: VipLevel;
  isGrabActive: boolean;
  lastGrabTimestamp: number | null; // ms timestamp
  lastGrabUtcCycle?: string | null;  // YYYY-MM-DD in UTC
  grabEndTime: number | null;       // ms timestamp
  referralCode: string;
  referredByCode: string | null;
  directMembersCount: number;
  teamMembersCount: number;
  teamDeposit: number;
  status: 'active' | 'suspended';
  createdAt: string;
  fundPasswordSet: boolean;
}

export interface VIPPlan {
  level: VipLevel;
  name: string;
  minInvestment: number;
  maxInvestment: number;
  dailyProfitPercent: number;
  reqDirectMembers: number;
}

export const VIP_PLANS: VIPPlan[] = [
  { level: 1, name: 'VIP 1 Tier', minInvestment: 20, maxInvestment: 499, dailyProfitPercent: 2.0, reqDirectMembers: 0 },
  { level: 2, name: 'VIP 2 Tier', minInvestment: 500, maxInvestment: 1999, dailyProfitPercent: 2.5, reqDirectMembers: 3 },
  { level: 3, name: 'VIP 3 Tier', minInvestment: 2000, maxInvestment: 9999, dailyProfitPercent: 3.5, reqDirectMembers: 10 },
  { level: 4, name: 'VIP 4 Tier', minInvestment: 10000, maxInvestment: 49999, dailyProfitPercent: 4.5, reqDirectMembers: 50 },
  { level: 5, name: 'VIP 5 Tier', minInvestment: 50000, maxInvestment: 200000, dailyProfitPercent: 5.0, reqDirectMembers: 100 },
];

export type NetworkType = 'USDT_BEP20' | 'USDT_TRC20' | 'ETB_BANK';
export type PaymentMethodType = 'USDT_BEP20' | 'USDT_TRC20' | 'ETB_BANK';

export interface RechargeRequest {
  id: string;
  userId: string;
  username: string;
  userPhone: string;
  amount: number;
  network: NetworkType;
  paymentMethod?: PaymentMethodType;
  currency?: 'USDT' | 'ETB';
  txid: string;
  transactionReference?: string;
  proofUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  userPhone: string;
  amount: number;
  fee: number; // 8% fee
  netAmount: number;
  network: NetworkType;
  paymentMethod?: PaymentMethodType;
  currency?: 'USDT' | 'ETB';
  walletAddress: string;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  branch?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
}

export type TransactionType = 'recharge' | 'withdrawal' | 'grab_profit' | 'referral_bonus' | 'admin_add' | 'admin_deduct' | 'admin_adjustment';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency?: 'USDT' | 'ETB';
  balanceAfter: number;
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'rejected';
  createdAt: string;
}

export interface GrabLog {
  id: string;
  userId: string;
  vipLevel: VipLevel;
  investmentAtGrab: number;
  profitEarned: number;
  previousBalance: number;
  newBalance: number;
  utcCycleDate: string;
  durationSeconds: number;
  startTime: string;
  endTime: string;
  status: 'completed';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isImportant: boolean;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  active: boolean;
}

export interface SupportTicketMessage {
  sender: 'user' | 'admin' | 'system';
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  category: 'deposit' | 'withdrawal' | 'grab' | 'account' | 'other';
  messages: SupportTicketMessage[];
  status: 'open' | 'replied' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface SystemSettings {
  minInvestment: number;
  minWithdrawal: number;
  withdrawalFeePercent: number;
  usdtBep20Address: string;
  usdtTrc20Address: string;
  etbCbeBankName?: string;
  etbCbeAccountName?: string;
  etbCbeAccountNumber?: string;
  ethiopianBanks?: string[];
  allowCustomReferral: boolean;
  captchaEnabled: boolean;
  announcementText: string;
  maintenanceMode: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'superadmin' | 'admin';
  lastLogin?: string;
}

export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  details: string;
  ip: string;
  createdAt: string;
}
