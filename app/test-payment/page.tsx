'use client';

import { useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

import { 
  CreditCard, 
  TestTube2, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Loader2,
  Sparkles,
  Zap,
  IndianRupee,
  FlaskConical,
  Ban,
  Wifi,
  WalletCards,
  Globe,
  ShieldX,
  Clock
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

/* ---------- Failure scenario definitions ---------- */
const FAILURE_SCENARIOS = [
  {
    key: 'insufficient_funds',
    label: 'Insufficient Funds',
    icon: WalletCards,
    description: 'Customer has low balance — auto-retried after salary cycle.',
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ringClass: 'ring-amber-500/30',
  },
  {
    key: 'card_expired',
    label: 'Card Expired',
    icon: Ban,
    description: 'Card past its expiry date — sends update request.',
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    ringClass: 'ring-rose-500/30',
  },
  {
    key: 'international_restricted',
    label: 'Intl Restricted',
    icon: Globe,
    description: 'International txn not allowed on card — asks to switch method.',
    color: 'purple',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    ringClass: 'ring-purple-500/30',
  },
  {
    key: 'network_glitch',
    label: 'Gateway Error',
    icon: Wifi,
    description: 'Transient bank gateway failure — auto-retried in 2 hrs.',
    color: 'slate',
    badgeClass: 'bg-slate-500/10 text-slate-300 border-slate-700/50',
    ringClass: 'ring-slate-500/30',
  },
  {
    key: 'authentication_failed',
    label: 'Auth Failed',
    icon: ShieldX,
    description: 'Wrong OTP or user cancelled 3DS — sent recovery link.',
    color: 'cyan',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    ringClass: 'ring-cyan-500/30',
  },
  {
    key: 'card_declined',
    label: 'Card Declined',
    icon: CreditCard,
    description: 'Issuer declined — generic bank refusal. Sends recovery link.',
    color: 'red',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    ringClass: 'ring-red-500/30',
  },
];

export default function TestPaymentPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(499);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [failureTriggered, setFailureTriggered] = useState<boolean>(false);

  // Scenario simulator state
  const [selectedScenario, setSelectedScenario] = useState<string>('insufficient_funds');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);

  const getActiveAmount = (): number => {
    if (selectedAmount === 0 && customAmount) {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) || parsed <= 0 ? 499 : parsed;
    }
    return selectedAmount;
  };

  /* ---------- Razorpay Checkout flow (existing) ---------- */
  const handleSimulatePayment = async () => {
    try {
      setLoading(true);
      setFailureTriggered(false);
      setStatus('Creating test order via Razorpay API...');

      const amountToCharge = getActiveAmount();
      const amountInPaise = Math.round(amountToCharge * 100);

      const response = await fetch('/api/create-test-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: amountInPaise }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create test order');
      }

      setOrderId(data.order_id);
      setStatus(`Order created: ${data.order_id}. Opening Razorpay checkout...`);

      const keyId = data.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!window.Razorpay) {
        throw new Error('Razorpay Checkout SDK not loaded yet. Please try again in a moment.');
      }

      const options = {
        key: keyId,
        amount: data.amount || amountInPaise,
        currency: data.currency || 'INR',
        name: 'ReviveAI Test Gateway',
        description: `Simulated Failure Test (₹${amountToCharge})`,
        order_id: data.order_id,
        prefill: {
          name: 'Test User',
          email: 'test.user@reviveai.demo',
          contact: '9876543210',
        },
        theme: {
          color: '#6366f1',
        },
        handler: function (response: any) {
          console.log('[Test Payment] Payment Succeeded:', response);
          setStatus(`Payment succeeded (ID: ${response.razorpay_payment_id}). Note: To test failure recovery, please select "Failure" in the Razorpay test screen!`);
          setLoading(false);
        },
        modal: {
          ondismiss: function () {
            console.log('[Test Payment] Checkout modal closed');
            setStatus('Checkout popup closed.');
            setLoading(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', function (response: any) {
        console.log('[Test Payment] Payment Failed Event Triggered:', response.error);
        setFailureTriggered(true);
        setStatus(
          `Payment Failed! Error: ${response.error?.code || 'Failure'} - ${response.error?.description || 'Simulated failure'}. Webhook emitted to ReviveAI!`
        );
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error('[Test Payment] Error:', err);
      setStatus(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  /* ---------- Scenario-based mock failure ---------- */
  const handleScenarioSimulate = async () => {
    try {
      setSimulating(true);
      setSimResult(null);

      const amountToCharge = getActiveAmount();
      const amountInPaise = Math.round(amountToCharge * 100);

      const response = await fetch('/api/simulate-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedScenario,
          amount: amountInPaise,
          email: 'test.user@reviveai.demo',
          contact: '9876543210',
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Simulation failed');
      }

      setSimResult(data);
    } catch (err: any) {
      setSimResult({ error: err.message });
    } finally {
      setSimulating(false);
    }
  };

  const activeScenario = FAILURE_SCENARIOS.find((s) => s.key === selectedScenario);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* Shared Sticky Navbar */}
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        
        {/* Header Title */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <TestTube2 className="w-3.5 h-3.5" />
            <span>Interactive Webhook Simulator</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Razorpay Failure Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Trigger real or mock payment failures to observe ReviveAI's automated classification engine.
          </p>
        </div>

        {/* Amount Selector (shared between both methods) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 relative overflow-hidden backdrop-blur-md">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Transaction Amount
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[499, 1499, 4999].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setSelectedAmount(amt);
                  setCustomAmount('');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedAmount === amt
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[10px] text-slate-400">Test Plan</div>
                <div className="text-lg font-extrabold font-mono text-indigo-300">₹{amt}</div>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSelectedAmount(0)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedAmount === 0
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-[10px] text-slate-400">Custom Amount</div>
              <div className="text-sm font-bold text-slate-300">Enter Value</div>
            </button>
          </div>

          {selectedAmount === 0 && (
            <div className="pt-2 animate-in fade-in">
              <input
                type="number"
                placeholder="Enter custom amount in ₹ (e.g. 1299)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* ====== Two-Column Layout: Scenario Simulator | Razorpay Checkout ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ── LEFT: Scenario-Based Simulator (Recommended) ── */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
            
            {/* Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Scenario Simulator</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Recommended
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-2">
              Pick a realistic failure scenario. Records are inserted with production-accurate error fields so the classifier produces the real category.
            </p>

            {/* Scenario Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FAILURE_SCENARIOS.map((sc) => {
                const Icon = sc.icon;
                const isActive = selectedScenario === sc.key;
                return (
                  <button
                    key={sc.key}
                    type="button"
                    onClick={() => setSelectedScenario(sc.key)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? `${sc.badgeClass} ring-2 ${sc.ringClass} shadow-lg`
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs font-semibold truncate">{sc.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">
                      {sc.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Simulate Button */}
            <button
              onClick={handleScenarioSimulate}
              disabled={simulating}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {simulating ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4.5 h-4.5" />
                  <span>Inject "{activeScenario?.label}" Failure (₹{getActiveAmount()})</span>
                </>
              )}
            </button>

            {/* Simulation Result */}
            {simResult && (
              <div className={`p-4 rounded-2xl text-xs space-y-2 border ${
                simResult.error
                  ? 'bg-red-950/40 border-red-800/40 text-red-200'
                  : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200'
              }`}>
                {simResult.error ? (
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="font-semibold">Error: {simResult.error}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold">Failure injected successfully!</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300 space-y-0.5">
                      <div>Classified as: <span className="text-white font-bold">{simResult.classified_as}</span></div>
                      <div>Retry strategy: <span className="text-slate-200">{simResult.retry_strategy}</span></div>
                    </div>
                    <div className="pt-2">
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                      >
                        <span>View in Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Razorpay Live Checkout ── */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
            
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Razorpay Live Checkout</h2>
            </div>
            <p className="text-[11px] text-slate-400 -mt-2">
              Opens real Razorpay checkout in sandbox mode. Note: Sandbox always sends a generic "payment_failed" reason regardless of how you fail.
            </p>

            {/* Instructions Box */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-3 text-slate-300">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>How to trigger failure:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1">
                <li>Click <strong className="text-white">Launch Razorpay Checkout</strong> below.</li>
                <li>Select any payment method (e.g. <strong className="text-white">Netbanking</strong> or <strong className="text-white">Card</strong>).</li>
                <li>In the Razorpay sandbox screen, select <strong className="text-rose-400 font-bold">"Failure"</strong>.</li>
                <li>Razorpay emits the <span className="font-mono text-indigo-300">payment.failed</span> webhook to ReviveAI.</li>
              </ol>
            </div>

            {/* Launch Simulator Button */}
            <button
              onClick={handleSimulatePayment}
              disabled={loading}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Launching Popup...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Launch Razorpay Checkout (₹{getActiveAmount()})</span>
                </>
              )}
            </button>

            {/* Live Status Feedback */}
            {status && (
              <div className="p-4 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl text-xs text-indigo-200 space-y-2">
                <div className="font-semibold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400" /> Event Status Log
                </div>
                <p className="font-mono text-[11px] leading-relaxed break-all text-slate-300">
                  {status}
                </p>
                {orderId && (
                  <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-indigo-900/60">
                    Razorpay Order ID: {orderId}
                  </div>
                )}
              </div>
            )}

            {/* Success Banner after failure is triggered */}
            {failureTriggered && (
              <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3 animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Payment Failure Captured!</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  ReviveAI has processed the failure event and stored it. Note: Sandbox failures always appear as "Network Glitch" due to Razorpay sandbox limitations.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    <span>View Record in Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
