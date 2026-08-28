'use client';

import { useState } from 'react';
import { X, Zap, Mail, Phone, IndianRupee, Link as LinkIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ManualLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualLinkModal({ isOpen, onClose, onSuccess }: ManualLinkModalProps) {
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [amount, setAmount] = useState('499');
  const [description, setDescription] = useState('Subscription Payment Recovery');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGeneratedLink(null);

    try {
      // Amount in paise
      const amountPaise = Math.round(parseFloat(amount) * 100);

      // Create a pending failed payment entry first or call direct generator
      const res = await fetch('/api/generate-manual-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          contact: contact || undefined,
          amount: amountPaise,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate link');
      }

      setGeneratedLink(data.recovery_link);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Recovery Link</h3>
              <p className="text-xs text-slate-400">Manual payment recovery dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form or Generated Result */}
        {generatedLink ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Recovery Link Ready!</h4>
              <p className="text-xs text-slate-300">
                Razorpay Payment Link generated and synced to Supabase database.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Razorpay Short URL</span>
              <div className="text-xs font-mono text-indigo-300 truncate select-all">
                {generatedLink}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.open(generatedLink, '_blank')}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
              >
                Open Payment Link ↗
              </button>
              <button
                onClick={() => {
                  setGeneratedLink(null);
                  setEmail('');
                  setContact('');
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl"
              >
                Create Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> Customer Email
              </label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>

            {/* Contact Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400" /> Contact Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="9999999999"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Amount Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="499"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono font-bold"
                required
              />
            </div>

            {/* Description Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Payment Description
              </label>
              <input
                type="text"
                placeholder="Subscription Recovery"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Razorpay Payment Link...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  Generate Recovery Link
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
