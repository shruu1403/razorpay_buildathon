'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
    if (cat === 'card_expired' || cat === 'payment_method_restricted') {
      return {
        label: cat === 'card_expired' ? 'Card Expired' : 'Method Restricted',
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      };
    }
    if (cat === 'insufficient_funds') {
      return {
        label: 'Insufficient Funds',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
    }
    if (cat === 'network_glitch') {
      return {
        label: 'Network Glitch',
        className: 'bg-slate-500/10 text-slate-300 border-slate-700/50',
      };
    }
    return {
      label: category ? category.replace('_', ' ') : 'Other',
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
      return {
        label: 'Retry Scheduled',
        className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
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
        label: `Auto-Retrying (attempt ${retryCount}/2)`,
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
    }
    return {
      label: 'Pending',
      className: 'bg-slate-500/10 text-slate-400 border-slate-700/40',
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Header / Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
              ⚡
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">ReviveAI</h1>
              <p className="text-xs text-slate-400">Payment Recovery Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchPayments(true)}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <svg
                className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
            <Link
              href="/test-payment"
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <span>+</span> Simulate Failure
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stat Cards Grid (5 columns) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Failed */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Failed Payments</span>
              <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs">⚠️</span>
            </div>
            {loading ? (
              <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-extrabold text-white tracking-tight">{totalFailed}</div>
            )}
            <p className="text-xs text-slate-500">Tracked failure events</p>
          </div>

          {/* Card 2: Amount at Risk */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Amount at Risk</span>
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs">💰</span>
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
            <p className="text-xs text-slate-500">Pending & scheduled</p>
          </div>

          {/* Card 3: Recovery Links Sent */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Recovery Links Sent</span>
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs">🚀</span>
            </div>
            {loading ? (
              <div className="h-8 w-20 bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-extrabold text-indigo-400 tracking-tight">{recoveryLinksSent}</div>
            )}
            <p className="text-xs text-slate-500">Active recovery URLs</p>
          </div>

          {/* Card 4: Revenue Recovered */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Revenue Recovered</span>
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs">🎉</span>
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
            <p className="text-xs text-slate-500">Completed link payments</p>
          </div>

          {/* Card 5: Recovery Rate */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Recovery Rate</span>
              <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs">📈</span>
            </div>
            {loading ? (
              <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-extrabold text-cyan-400 tracking-tight">
                {recoveryRate.toFixed(1)}%
              </div>
            )}
            <p className="text-xs text-slate-500">Success percentage</p>
          </div>
        </section>

        {/* Failed Payments Table */}
        <section className="bg-slate-900/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Failed Payment Records</h2>
              <p className="text-xs text-slate-400">View payment failure details and trigger automated recovery links.</p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {payments.length} {payments.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {loading ? (
            /* Skeleton Loading Table */
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-slate-800/50 rounded-xl animate-pulse w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto text-2xl">
                📥
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-200">No Failed Payments Recorded Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When a payment failure webhook is received from Razorpay, it will automatically populate here.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/test-payment"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg transition-all"
                >
                  Go to Test Simulation Page →
                </Link>
              </div>
            </div>
          ) : (
            /* Data Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Customer</th>
                    <th scope="col" className="px-6 py-3.5">Amount</th>
                    <th scope="col" className="px-6 py-3.5">Failure Reason</th>
                    <th scope="col" className="px-6 py-3.5">Status</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.map((row) => {
                    const categoryBadge = getCategoryBadge(row.failure_category);
                    const statusBadge = getStatusBadge(row);
                    const explanation = getFailureExplanation(row.failure_category);

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Customer */}
                        <td className="px-6 py-4 font-medium text-slate-200">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-100">
                              {row.customer_email || row.customer_contact || 'N/A'}
                            </div>
                            {row.customer_contact && row.customer_email && (
                              <div className="text-[11px] font-mono text-slate-400">
                                {row.customer_contact}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500 font-mono">
                              ID: {row.razorpay_payment_id || row.id.substring(0, 8)}
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4 font-mono font-semibold text-slate-100 text-sm">
                          {formatCurrency(row.amount, row.currency)}
                        </td>

                        {/* Failure Reason + Expandable Info Tooltip */}
                        <td className="px-6 py-4">
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
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
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
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-right">
                          {row.status === 'recovered' ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                              <span>✓</span> Paid
                            </span>
                          ) : row.recovery_link ? (
                            <button
                              onClick={() => window.open(row.recovery_link!, '_blank')}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                            >
                              <span>Open Link</span>
                              <span className="text-[10px]">↗</span>
                            </button>
                          ) : row.status === 'pending' ? (
                            <button
                              onClick={() => handleGenerateLink(row.id)}
                              disabled={generatingId === row.id}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer"
                            >
                              {generatingId === row.id ? (
                                <>
                                  <svg
                                    className="animate-spin h-3.5 w-3.5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Generating...
                                </>
                              ) : (
                                'Generate Recovery Link'
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-500 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
