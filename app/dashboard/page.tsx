'use client';

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

import ManualLinkModal from '@/components/ManualLinkModal';
import { supabase } from '@/lib/supabase';
import {
  AlertTriangle,
  DollarSign,
  Send,
  PartyPopper,
  TrendingUp,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  Info,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  Calendar
} from 'lucide-react';

interface FailedPayment {
  id: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  customer_email?: string | null;
  customer_contact?: string | null;
  amount: number;
  currency: string;
  error_code?: string | null;
  error_description?: string | null;
  error_reason?: string | null;
  failure_category?: string;
  retry_strategy?: string;
  retry_count?: number;
  next_retry_at?: string | null;
  status: string;
  recovery_link?: string | null;
  recovery_payment_link_id?: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const [payments, setPayments] = useState<FailedPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  
  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  const fetchPayments = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from('failed_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Dashboard] Error fetching failed payments:', error);
      } else if (data) {
        setPayments(data as FailedPayment[]);
      }
    } catch (err) {
      console.error('[Dashboard] Unexpected error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleGenerateLink = async (id: string) => {
    try {
      setGeneratingId(id);
      const response = await fetch('/api/generate-recovery-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ failedPaymentId: id }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert(`Error: ${data.error || 'Failed to generate recovery link'}`);
      } else {
        if (data.recovery_link) {
          window.open(data.recovery_link, '_blank');
        }
        await fetchPayments(true);
      }
    } catch (err: any) {
      alert(`Error: ${err?.message || 'Something went wrong'}`);
    } finally {
      setGeneratingId(null);
    }
  };

  // Filtered Payments Logic
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Category / Status Filter
      if (activeFilter === 'recovered' && p.status !== 'recovered') return false;
      if (activeFilter === 'pending' && p.status === 'recovered') return false;
      if (
        activeFilter !== 'all' &&
        activeFilter !== 'recovered' &&
        activeFilter !== 'pending' &&
        (p.failure_category || '').toLowerCase() !== activeFilter
      ) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const emailMatch = (p.customer_email || '').toLowerCase().includes(q);
        const contactMatch = (p.customer_contact || '').toLowerCase().includes(q);
        const payIdMatch = (p.razorpay_payment_id || '').toLowerCase().includes(q);
        const orderIdMatch = (p.razorpay_order_id || '').toLowerCase().includes(q);
        return emailMatch || contactMatch || payIdMatch || orderIdMatch;
      }

      return true;
    });
  }, [payments, activeFilter, searchQuery]);

  // Summary Stat Calculations
  const totalFailed = payments.length;
  const amountAtRiskPaise = payments
    .filter((p) => p.status === 'pending' || p.status === 'retry_scheduled')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const amountAtRisk = amountAtRiskPaise / 100;

  const recoveryLinksSent = payments.filter(
    (p) => p.status === 'retry_scheduled' || p.status === 'recovered'
  ).length;

  const recoveredPayments = payments.filter((p) => p.status === 'recovered');
  const revenueRecoveredPaise = recoveredPayments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );
  const revenueRecovered = revenueRecoveredPaise / 100;

  const recoveryRate = totalFailed > 0 ? (recoveredPayments.length / totalFailed) * 100 : 0;

  // Distribution calculation
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      insufficient_funds: 0,
      card_expired: 0,
      payment_method_restricted: 0,
      network_glitch: 0,
      authentication_failed: 0,
      card_declined: 0,
      other: 0,
    };
    payments.forEach((p) => {
      const cat = (p.failure_category || 'other').toLowerCase();
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.other++;
      }
    });
    return counts;
  }, [payments]);

  const formatCurrency = (amountPaise: number, currency: string = 'INR') => {
    const val = (amountPaise || 0) / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getCategoryBadge = (category?: string) => {
    const cat = (category || '').toLowerCase();
    const map: Record<string, { label: string; className: string }> = {
      insufficient_funds: {
        label: 'Insufficient Funds',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      },
      card_expired: {
        label: 'Card Expired',
        className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      },
      payment_method_restricted: {
        label: 'Method Restricted',
        className: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      },
      network_glitch: {
        label: 'Network Glitch',
        className: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      },
      authentication_failed: {
        label: 'Auth Failed',
        className: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      },
      card_declined: {
        label: 'Card Declined',
        className: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
      },
      manual_dispatch: {
        label: 'Manual Dispatch',
        className: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      },
    };
    return map[cat] || {
      label: category ? category.replaceAll('_', ' ') : 'Other',
      className: 'bg-slate-500/10 text-slate-400 border-slate-800',
    };
  };

  const getFailureExplanation = (category?: string) => {
    const cat = (category || '').toLowerCase();
    switch (cat) {
      case 'insufficient_funds':
        return 'Auto-retrying silently — insufficient funds failures often resolve within days of salary credit';
      case 'card_expired':
        return "Card unusable — sending update request immediately, retrying won't help";
      case 'payment_method_restricted':
        return 'Payment method blocked — requesting customer switch methods immediately';
      case 'network_glitch':
        return 'Temporary gateway issue — retrying automatically within hours';
      case 'authentication_failed':
        return 'Customer failed OTP or cancelled 3D-Secure — sending recovery link to retry';
      case 'card_declined':
        return 'Issuing bank declined the card — requesting customer to try a different card';
      case 'manual_dispatch':
        return 'Manually created recovery link by merchant admin';
      default:
        return 'Reviewing manually — sending recovery link as a precaution';
    }
  };

  const getStatusBadge = (row: FailedPayment) => {
    const s = (row.status || '').toLowerCase();
    if (s === 'recovered') {
      return {
        label: 'Recovered',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      };
    }
    if (s === 'retry_scheduled') {
      // If a recovery link was actually generated, show "Link Sent"
      if (row.recovery_link) {
        return {
          label: 'Link Sent',
          className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        };
      }
      // Otherwise it's a scheduled auto-retry — show the delay
      const strat = (row.retry_strategy || '').toLowerCase();
      const delayLabel = strat === 'auto_retry_soon' ? '2hr' : '72hr';
      return {
        label: `Auto-Retry (${delayLabel})`,
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
    }
    const strat = (row.retry_strategy || '').toLowerCase();
    const retryCount = row.retry_count || 0;
    if (
      s === 'pending' &&
      (strat === 'auto_retry_later' || strat === 'auto_retry_soon') &&
      retryCount > 0
    ) {
      return {
        label: `Auto-Retrying (${retryCount}/2)`,
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
    }
    return {
      label: 'Pending',
      className: 'bg-slate-500/10 text-slate-400 border-slate-700/40',
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Shared Sticky Navigation */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Page Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Payment Recovery Dashboard</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time monitoring of Razorpay payment failures, automated classification, and recovery link dispatches.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchPayments(true)}
              disabled={refreshing}
              className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Create Manual Link</span>
            </button>

            <Link
              href="/test-payment"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <span>+ Simulate Failure</span>
            </Link>
          </div>
        </div>

        {/* Stat Cards Grid (5 columns) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Failed */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Failures</span>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-extrabold text-white tracking-tight">{totalFailed}</div>
            )}
            <p className="text-[11px] text-slate-500">Tracked failure events</p>
          </div>

          {/* Card 2: Amount at Risk */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Amount at Risk</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(amountAtRisk)}
              </div>
            )}
            <p className="text-[11px] text-slate-500">Pending & scheduled</p>
          </div>

          {/* Card 3: Recovery Links Sent */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Links Dispatched</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Send className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-20 bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-extrabold text-indigo-400 tracking-tight">{recoveryLinksSent}</div>
            )}
            <p className="text-[11px] text-slate-500">Active recovery URLs</p>
          </div>

          {/* Card 4: Revenue Recovered */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Revenue Rescued</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <PartyPopper className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(revenueRecovered)}
              </div>
            )}
            <p className="text-[11px] text-slate-500">Completed link payments</p>
          </div>

          {/* Card 5: Recovery Rate */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Recovery Rate</span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-extrabold text-cyan-400 tracking-tight">
                {recoveryRate.toFixed(1)}%
              </div>
            )}
            <p className="text-[11px] text-slate-500">Success percentage</p>
          </div>
        </section>

        {/* Visual Category Distribution Bar */}
        {totalFailed > 0 && (
          <section className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" /> Failure Category Breakdown
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Distribution across {totalFailed} failures
              </span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex">
              {categoryCounts.insufficient_funds > 0 && (
                <div
                  style={{ width: `${(categoryCounts.insufficient_funds / totalFailed) * 100}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`Insufficient Funds: ${categoryCounts.insufficient_funds}`}
                />
              )}
              {categoryCounts.card_expired > 0 && (
                <div
                  style={{ width: `${(categoryCounts.card_expired / totalFailed) * 100}%` }}
                  className="bg-rose-500 h-full transition-all"
                  title={`Card Expired: ${categoryCounts.card_expired}`}
                />
              )}
              {categoryCounts.payment_method_restricted > 0 && (
                <div
                  style={{ width: `${(categoryCounts.payment_method_restricted / totalFailed) * 100}%` }}
                  className="bg-purple-500 h-full transition-all"
                  title={`Method Restricted: ${categoryCounts.payment_method_restricted}`}
                />
              )}
              {categoryCounts.network_glitch > 0 && (
                <div
                  style={{ width: `${(categoryCounts.network_glitch / totalFailed) * 100}%` }}
                  className="bg-sky-500 h-full transition-all"
                  title={`Network Glitch: ${categoryCounts.network_glitch}`}
                />
              )}
              {categoryCounts.authentication_failed > 0 && (
                <div
                  style={{ width: `${(categoryCounts.authentication_failed / totalFailed) * 100}%` }}
                  className="bg-orange-500 h-full transition-all"
                  title={`Auth Failed: ${categoryCounts.authentication_failed}`}
                />
              )}
              {categoryCounts.card_declined > 0 && (
                <div
                  style={{ width: `${(categoryCounts.card_declined / totalFailed) * 100}%` }}
                  className="bg-pink-500 h-full transition-all"
                  title={`Card Declined: ${categoryCounts.card_declined}`}
                />
              )}
              {categoryCounts.other > 0 && (
                <div
                  style={{ width: `${(categoryCounts.other / totalFailed) * 100}%` }}
                  className="bg-indigo-500 h-full transition-all"
                  title={`Other: ${categoryCounts.other}`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Insufficient Funds ({categoryCounts.insufficient_funds})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Card Expired ({categoryCounts.card_expired})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Method Restricted ({categoryCounts.payment_method_restricted})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Network Glitch ({categoryCounts.network_glitch})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Auth Failed ({categoryCounts.authentication_failed})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Card Declined ({categoryCounts.card_declined})
              </span>
            </div>
          </section>
        )}

        {/* Failed Payments Table Section */}
        <section className="bg-slate-900/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden space-y-4 p-4 sm:p-6">
          
          {/* Table Toolbar: Search & Category Filter Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search email or contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs">
              {[
                { key: 'all', label: 'All' },
                { key: 'recovered', label: 'Recovered' },
                { key: 'insufficient_funds', label: 'Low Balance' },
                { key: 'card_expired', label: 'Expired' },
                { key: 'card_declined', label: 'Declined' },
                { key: 'authentication_failed', label: 'Auth Failed' },
                { key: 'network_glitch', label: 'Glitch' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeFilter === tab.key
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            /* Skeleton Loading Table */
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-slate-800/50 rounded-xl animate-pulse w-full" />
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            /* Empty State */
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-200">
                  {payments.length === 0 ? 'No Failed Payments Recorded Yet' : 'No Records Match Filter'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {payments.length === 0
                    ? 'When a payment failure webhook is received from Razorpay, it will automatically populate here.'
                    : 'Try clearing your search query or switching filter tabs.'}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/test-payment"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg transition-all"
                >
                  <span>Go to Test Simulation Page</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            /* Data Table with date separators */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th scope="col" className="px-4 py-3.5">Customer</th>
                    <th scope="col" className="px-4 py-3.5">Amount</th>
                    <th scope="col" className="px-4 py-3.5">Failure Reason</th>
                    <th scope="col" className="px-4 py-3.5">Status</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(() => {
                    let lastDateLabel = '';

                    const formatDateLabel = (iso: string) => {
                      const d = new Date(iso);
                      const now = new Date();
                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const yesterday = new Date(today);
                      yesterday.setDate(today.getDate() - 1);
                      const rowDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

                      if (rowDate.getTime() === today.getTime()) return 'Today';
                      if (rowDate.getTime() === yesterday.getTime()) return 'Yesterday';
                      return d.toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                    };

                    const formatTime = (iso: string) => {
                      return new Date(iso).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });
                    };

                    return filteredPayments.map((row) => {
                      const categoryBadge = getCategoryBadge(row.failure_category);
                      const statusBadge = getStatusBadge(row);
                      const explanation = getFailureExplanation(row.failure_category);
                      const dateLabel = formatDateLabel(row.created_at);
                      const showDateHeader = dateLabel !== lastDateLabel;
                      lastDateLabel = dateLabel;

                      return (
                        <Fragment key={row.id}>
                          {showDateHeader && (
                            <tr key={`date-${dateLabel}`}>
                              <td colSpan={5} className="px-4 py-2.5 bg-slate-950/80">
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>{dateLabel}</span>
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr
                            key={row.id}
                            className="hover:bg-slate-800/40 transition-colors group"
                          >
                            {/* Customer */}
                            <td className="px-4 py-4 font-medium text-slate-200">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-100">
                                  {row.customer_email || row.customer_contact || 'N/A'}
                                </div>
                                {row.customer_contact && row.customer_email && (
                                  <div className="text-[11px] font-mono text-slate-400">
                                    {row.customer_contact}
                                  </div>
                                )}
                                {/* <div className="text-[10px] text-slate-500 font-mono">
                                  ID: {row.razorpay_payment_id || row.id.substring(0, 8)}
                                </div> */}
                              </div>
                            </td>

                            {/* Amount */}
                            <td className="px-4 py-4 font-mono font-semibold text-slate-100 text-sm">
                              {formatCurrency(row.amount, row.currency)}
                            </td>

                            {/* Failure Reason + Tooltip */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1.5 relative">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border ${categoryBadge.className}`}
                                >
                                  {categoryBadge.label}
                                </span>
                                <div className="group/tooltip relative inline-block">
                                  <button
                                    type="button"
                                    className="text-slate-400 hover:text-indigo-400 transition-colors p-0.5 rounded focus:outline-none"
                                    aria-label="Why this failure strategy?"
                                  >
                                    <Info className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Tooltip Content */}
                                  <div className="pointer-events-none opacity-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 transition-all duration-200 absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl text-[11px] text-slate-200 z-30 leading-relaxed">
                                    <div className="font-semibold text-indigo-400 mb-0.5">Strategy Rationale</div>
                                    {explanation}
                                    <div className="absolute top-full left-3 border-4 border-transparent border-t-slate-900" />
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border ${statusBadge.className}`}
                              >
                                {statusBadge.label}
                              </span>
                            </td>

                            {/* Action */}
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {formatTime(row.created_at)}
                                </span>
                                {row.status === 'recovered' ? (
                                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                                  </span>
                                ) : row.recovery_link ? (
                                  <button
                                    onClick={() => window.open(row.recovery_link!, '_blank')}
                                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                                  >
                                    <span>Open Link</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                ) : row.status !== 'recovered' ? (
                                  <button
                                    onClick={() => handleGenerateLink(row.id)}
                                    disabled={generatingId === row.id}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer"
                                  >
                                    {generatingId === row.id ? (
                                      <>
                                        <Loader2 className="animate-spin h-3.5 w-3.5 text-white" />
                                        Generating...
                                      </>
                                    ) : (
                                      'Generate Link'
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-slate-500 text-xs">—</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        </Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      {/* Manual Link Modal */}
      <ManualLinkModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={() => {
          fetchPayments(true);
        }}
      />
    </div>
  );
}
