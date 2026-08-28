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
  IndianRupee
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function TestPaymentPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(499);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [failureTriggered, setFailureTriggered] = useState<boolean>(false);

  const getActiveAmount = (): number => {
    if (selectedAmount === 0 && customAmount) {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) || parsed <= 0 ? 499 : parsed;
    }
    return selectedAmount;
  };

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* Shared Sticky Navbar */}
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
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
            Create real test orders and trigger simulated payment failures to observe ReviveAI's automated webhook classification engine in real-time.
          </p>
        </div>

        {/* Main Simulator Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden backdrop-blur-md">
          
          {/* Preset Amount Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Choose Test Transaction Amount
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

          {/* Instructions Box */}
          <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-3 text-slate-300">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>How to trigger failure in Razorpay modal:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1">
              <li>Click <strong className="text-white">Launch Razorpay Checkout</strong> below.</li>
              <li>Select any payment method (e.g. <strong className="text-white">Netbanking</strong> or <strong className="text-white">Card</strong>) in the popup.</li>
              <li>In the Razorpay sandbox screen, select <strong className="text-rose-400 font-bold">"Failure"</strong>.</li>
              <li>Razorpay emits the <span className="font-mono text-indigo-300">payment.failed</span> webhook event to ReviveAI!</li>
            </ol>
          </div>

          {/* Launch Simulator Button */}
          <button
            onClick={handleSimulatePayment}
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Test Order & Launching Popup...</span>
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
                ReviveAI has processed the failure event, classified the failure reason, and stored the record in Supabase.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  <span>View Record in Recovery Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
