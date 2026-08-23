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

export type TransactionType = 'recharge' | 'withdrawal' | 'grab_profit' | 'referral_bonus' | 'admin_add' | 'admin_deduct' | 'admin_adjustment' | 'film_investment_start' | 'film_investment_return';

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

export interface TeamRewardMilestone {
  requiredActive: number;
  rewardEtb: number;
}

export const TEAM_ACTIVITY_REWARD_TABLE: TeamRewardMilestone[] = [
  { requiredActive: 22, rewardEtb: 12640 },
  { requiredActive: 60, rewardEtb: 22240 },
  { requiredActive: 110, rewardEtb: 35040 },
  { requiredActive: 310, rewardEtb: 51040 },
  { requiredActive: 610, rewardEtb: 65440 },
  { requiredActive: 1000, rewardEtb: 96000 },
  { requiredActive: 3000, rewardEtb: 240000 },
  { requiredActive: 6000, rewardEtb: 480000 },
  { requiredActive: 10000, rewardEtb: 960000 },
  { requiredActive: 30000, rewardEtb: 1920000 },
  { requiredActive: 60000, rewardEtb: 3200000 },
  { requiredActive: 100000, rewardEtb: 4800000 },
  { requiredActive: 300000, rewardEtb: 8000000 },
  { requiredActive: 600000, rewardEtb: 17600000 },
  { requiredActive: 1000000, rewardEtb: 32000000 },
];

export interface TeamActivityRewardClaim {
  id: string;
  userId: string;
  username: string;
  userPhone: string;
  milestone: number;
  activeCount: number;
  levelAActive: number;
  levelBActive: number;
  levelCActive: number;
  rewardEtb: number;
  status: 'completed';
  createdAt: string;
  txId: string;
}

export type FilmPlanId = 'film_7d' | 'film_30d';

export interface FilmInvestmentPlan {
  id: FilmPlanId;
  name: string;
  filmTitle: string;
  durationDays: number;
  dailyProfitPercent: number; // 3.0 for 3%, 3.5 for 3.5%
  minInvestmentEtb: number;    // 2000 ETB
  minInvestmentUsdt: number;   // 20 USDT
  imageUrl: string;
  description: string;
  tag: string;
}

export const FILM_INVESTMENT_PLANS: FilmInvestmentPlan[] = [
  {
    id: 'film_7d',
    name: '7-Day Film Investment',
    filmTitle: 'Blockbuster Premiere & Global Rights',
    durationDays: 7,
    dailyProfitPercent: 3.0,
    minInvestmentEtb: 2000,
    minInvestmentUsdt: 20,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    description: 'Short-cycle film production financing with 3.0% daily box-office dividend yield over 7 days (Total 21% ROI). Principal returned in full on completion.',
    tag: '7 Days Fast Yield'
  },
  {
    id: 'film_30d',
    name: '30-Day Film Investment',
    filmTitle: 'Major Cinematic Release & Box Office Syndicate',
    durationDays: 30,
    dailyProfitPercent: 3.5,
    minInvestmentEtb: 2000,
    minInvestmentUsdt: 20,
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80',
    description: 'High-yield monthly film co-production syndicate offering 3.5% daily return over 30 days (Total 105% ROI). Principal returned in full on completion.',
    tag: '30 Days High Return'
  }
];

export interface FilmInvestment {
  id: string;
  userId: string;
  username: string;
  userPhone: string;
  planId: FilmPlanId;
  planName: string;
  filmTitle: string;
  filmPoster: string;
  amount: number;
  currency: 'ETB' | 'USDT';
  durationDays: number;
  dailyProfitRate: number;        // e.g. 0.03
  dailyProfitAmount: number;      // amount * rate
  totalProfitAmount: number;      // amount * rate * durationDays
  totalReturnAmount: number;      // amount + totalProfitAmount
  startDate: string;              // ISO String
  startTimeMs: number;
  endDate: string;                // ISO String
  endTimeMs: number;
  status: 'active' | 'completed' | 'cancelled';
  principalReturned: boolean;
  profitCredited: boolean;
  creditedProfitAmount: number;
  completedAt?: string;
  txId: string;                   // Reference start transaction ID
  completionTxId?: string;       // Reference completion transaction ID
  createdAt: string;
  updatedAt?: string;
}


