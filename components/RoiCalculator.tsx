'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RoiCalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(1000000); // ₹10,00,000 default
  const [failureRate, setFailureRate] = useState<number>(12); // 12% default
  const [recoveryEfficiency, setRecoveryEfficiency] = useState<number>(38); // 38% default recovery

  // Calculations
  const lostRevenueMonthly = (monthlyRevenue * (failureRate / 100));
  const recoveredRevenueMonthly = (lostRevenueMonthly * (recoveryEfficiency / 100));
  const recoveredRevenueAnnual = recoveredRevenueMonthly * 12;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/20 shadow-2xl shadow-indigo-950/50 space-y-8 relative overflow-hidden backdrop-blur-md">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Calculator className="w-3.5 h-3.5" />
            <span>Interactive Merchant ROI Simulator</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Calculate Your Recoverable Revenue
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            See how much lost revenue ReviveAI can reclaim for your Razorpay business every month.
          </p>
        </div>

        <div className="text-right flex sm:flex-col items-baseline sm:items-end justify-between">
          <span className="text-xs text-slate-400">Est. Annual Recovered</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
            {formatCurrency(recoveredRevenueAnnual)}
          </span>
        </div>
      </div>

      {/* Sliders & Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Inputs */}
        <div className="space-y-6">
          {/* Slider 1: Monthly Revenue */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">
                Monthly Transaction Volume
              </label>
              <span className="font-mono font-bold text-indigo-400 text-sm bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/40">
                {formatCurrency(monthlyRevenue)}
              </span>
            </div>
            <input
              type="range"
              min={100000}
              max={20000000}
              step={100000}
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>₹1 Lakh</span>
              <span>₹1 Crore</span>
              <span>₹2 Crore</span>
            </div>
          </div>

          {/* Slider 2: Failure Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">
                Payment Failure Rate
              </label>
              <span className="font-mono font-bold text-amber-400 text-sm bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/40">
                {failureRate}%
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={30}
              step={1}
              value={failureRate}
              onChange={(e) => setFailureRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>2% (Industry Low)</span>
              <span>12% (Average)</span>
              <span>30% (High Vol)</span>
            </div>
          </div>

          {/* Slider 3: Recovery Rate Efficiency */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">
                ReviveAI Recovery Target
              </label>
              <span className="font-mono font-bold text-emerald-400 text-sm bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                {recoveryEfficiency}%
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={60}
              step={1}
              value={recoveryEfficiency}
              onChange={(e) => setRecoveryEfficiency(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>15% (Conservative)</span>
              <span>38% (Standard)</span>
              <span>60% (Optimal)</span>
            </div>
          </div>
        </div>

        {/* Right Output Card */}
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Monthly Revenue at Risk
              </span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                {formatCurrency(lostRevenueMonthly)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                ReviveAI Monthly Recovery
              </span>
              <span className="font-mono font-bold text-indigo-400 text-base">
                {formatCurrency(recoveredRevenueMonthly)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 to-indigo-950/50 border border-emerald-500/30 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Direct Net Impact
              </span>
              <p className="text-2xl font-extrabold text-white tracking-tight">
                +{formatCurrency(recoveredRevenueMonthly)} <span className="text-xs font-normal text-slate-300">/ mo</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Rescued from card expiry, bank glitches & silent churn.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group"
          >
            <span>Launch Live Recovery Dashboard</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
