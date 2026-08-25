'use client';

import { useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function TestPaymentPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleSimulatePayment = async () => {
    try {
      setLoading(true);
      setStatus('Creating test order via Razorpay API...');

      const response = await fetch('/api/create-test-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        amount: data.amount || 49900,
        currency: data.currency || 'INR',
        name: 'Payment Recovery Assistant',
        description: 'Simulated Failed Payment Test (₹499)',
        order_id: data.order_id,
        prefill: {
          name: 'Test Customer',
          email: 'test.customer@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#6366f1',
        },
        handler: function (response: any) {
          console.log('[Test Payment] Payment Succeeded:', response);
          setStatus(`Payment succeeded (ID: ${response.razorpay_payment_id}). To test failure, choose "Failure" in the Razorpay test modal!`);
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
        setStatus(
          `Payment Failed! Error: ${response.error?.code || 'Failure'} - ${response.error?.description || 'Simulated failure'}`
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
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-slate-50 font-sans">
        <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 mb-2 text-xl font-bold">
              💳
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Razorpay Failure Simulation
            </h1>
            <p className="text-sm text-slate-400">
              Create a ₹499 test order and trigger a simulated payment failure in Razorpay test mode.
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-2">
            <p className="font-semibold text-amber-400 flex items-center gap-1">
              💡 How to simulate failure in Razorpay modal:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Click <strong>Simulate Failed Payment</strong> below.</li>
              <li>Select <strong>Netbanking</strong> or <strong>Card / UPI</strong> in the popup.</li>
              <li>In Razorpay Test Screen, click <strong>"Failure"</strong>.</li>
              <li>Check your terminal output for the incoming webhook!</li>
            </ol>
          </div>

          <button
            onClick={handleSimulatePayment}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                Processing...
              </>
            ) : (
              'Simulate Failed Payment'
            )}
          </button>

          {orderId && (
            <div className="p-3 bg-slate-800/50 rounded-lg text-xs font-mono text-slate-400 break-all">
              <span className="text-slate-500">Order ID:</span> {orderId}
            </div>
          )}

          {status && (
            <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-lg text-xs text-indigo-300">
              {status}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
