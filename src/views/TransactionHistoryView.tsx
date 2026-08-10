import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatUtcDateTime } from '../lib/dateUtils';
import { History, ArrowDownCircle, ArrowUpCircle, Zap, RefreshCw } from 'lucide-react';

export const TransactionHistoryView: React.FC = () => {
  const { token, t } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchTxs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cleanTransactionDescription = (desc: string) => {
    if (!desc) return '';
    let str = desc;

    if (/Admin\s*\[(ADD|DEDUCT)\]/i.test(str)) {
      const isAdd = /\[ADD\]/i.test(str);
      const amountMatch = str.match(/\[(ADD|DEDUCT)\]\s*([\d\.]+)\s*(\w+)/i);
      const remarkMatch = str.match(/Remark:\s*(.*)/i);

      const amountStr = amountMatch ? `${amountMatch[2]} ${amountMatch[3]}` : '';
      const remark = remarkMatch ? remarkMatch[1].trim() : '';

      if (remark) {
        return `Balance ${isAdd ? 'Credit' : 'Deduction'} (${amountStr}) - Remark: ${remark}`;
      }
      return `Balance ${isAdd ? 'Credit' : 'Deduction'} (${amountStr})`;
    }

    str = str.replace(/hasnainnazz|hasnain/gi, '');

    if (/admin|processed by|approved by/i.test(str)) {
      if (/^(processed|approved)\s+by\s+admin/i.test(str) || /^approved\s+by/i.test(str)) {
        return 'Status: Approved';
      }
      return str
        .replace(/processed by admin\s*\w*/gi, 'Status: Approved')
        .replace(/approved by admin\s*\w*/gi, 'Status: Approved')
        .replace(/approved by\s*\w*/gi, 'Status: Approved')
        .replace(/\s*by admin\s*\w*/gi, '')
        .replace(/\s*by admin/gi, '')
        .replace(/\s*by\s+[a-zA-Z0-9_-]+/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return str.replace(/\s*by\s+[a-zA-Z0-9_-]+/gi, '').replace(/\s+/g, ' ').trim();
  };

  useEffect(() => {
    fetchTxs();
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-white">{t('transactions')}</h1>
          <p className="text-xs text-slate-400">Complete immutable record of all balance movements.</p>
        </div>
        <button
          onClick={fetchTxs}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">No transaction records found.</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{cleanTransactionDescription(tx.description)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{formatUtcDateTime(tx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.amount >= 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} USDT
                  </p>
                  <p className="text-[10px] text-slate-500">Balance: {tx.balanceAfter.toFixed(2)} USDT</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
