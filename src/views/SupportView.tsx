import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatUtcDateTime, formatUtcTime } from '../lib/dateUtils';
import { Headphones, Send, Plus, MessageSquare, Clock, CheckCircle2, RotateCw } from 'lucide-react';

export const SupportView: React.FC = () => {
  const { token, t } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>('');
  const [category, setCategory] = useState<string>('recharge');
  const [message, setMessage] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchTickets = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/support/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        if (data.length > 0 && !selectedTicket) {
          setSelectedTicket(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message || !token) return;

    setLoading(true);
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, category, message }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubject('');
        setMessage('');
        setShowCreateModal(false);
        fetchTickets();
        setSelectedTicket(data.ticket);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText || !selectedTicket || !token) return;

    try {
      const res = await fetch(`/api/support/ticket/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: replyText }),
      });

      if (res.ok) {
        const data = await res.json();
        setReplyText('');
        setSelectedTicket(data.ticket);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-white">{t('support')} Desk</h1>
          <p className="text-xs text-slate-400">24/7 dedicated customer service and support ticket portal.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Official Telegram Customer Support Card */}
      <div className="bg-gradient-to-r from-blue-900/60 via-cyan-950/70 to-slate-900 border border-cyan-500/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">Official Telegram Customer Support</h2>
            <p className="text-xs text-slate-300">Contact our 24/7 online support agent directly on Telegram for instant deposit & withdrawal assistance.</p>
            <span className="inline-block mt-1 text-xs font-mono font-bold text-cyan-400">Telegram: @Mrdaniel55</span>
          </div>
        </div>
        <a
          href="https://t.me/Mrdaniel55"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Contact @Mrdaniel55</span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tickets Sidebar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl h-[500px] flex flex-col">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Your Tickets</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">No support tickets found.</div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-cyan-500/15 border-cyan-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs truncate max-w-[140px]">{ticket.subject}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        ticket.status === 'open'
                          ? 'bg-amber-500/20 text-amber-300'
                          : ticket.status === 'replied'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">{formatUtcDateTime(ticket.updatedAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Ticket Thread */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col h-[500px] shadow-xl">
          {selectedTicket ? (
            <>
              <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedTicket.subject}</h3>
                  <p className="text-xs text-cyan-400 uppercase font-mono">Category: {selectedTicket.category}</p>
                </div>
                <span className="text-xs text-slate-500 font-mono">ID: #{selectedTicket.id.slice(-6)}</span>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {selectedTicket.messages.map((m: any, idx: number) => {
                  const isAdmin = m.sender === 'admin';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl max-w-sm text-xs leading-relaxed space-y-1 ${
                          isAdmin
                            ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-100 rounded-tl-none'
                            : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tr-none'
                        }`}
                      >
                        <p className="font-bold text-[10px] text-slate-400">{isAdmin ? 'Support Agent' : 'You'}</p>
                        <p>{m.text}</p>
                        <p className="text-[9px] text-slate-500 text-right">{formatUtcTime(m.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
              <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
              <span>Select a support ticket to view conversation or create a new one.</span>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Customer Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="recharge">Recharge / Deposit Inquiry</option>
                  <option value="withdrawal">Withdrawal Issue</option>
                  <option value="grab_order">Order Grabbing Question</option>
                  <option value="vip_tier">VIP Tier Upgrade</option>
                  <option value="security">Account / Password</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your inquiry"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Message</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide complete details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold"
                >
                  {loading ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
