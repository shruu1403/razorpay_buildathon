import Link from 'next/link';
import Navbar from '@/components/Navbar';
import RoiCalculator from '@/components/RoiCalculator';
import { 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  Link as LinkIcon,
  Clock,
  BarChart3,
  TestTube2
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Sticky Global Navbar */}
      <Navbar />

      <main className="flex-1 space-y-20 pb-20">
        
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
          {/* Glowing Gradient Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute top-1/3 right-10 w-[300px] h-[200px] bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none -z-10" />

          <div className="text-center space-y-6 max-w-4xl mx-auto">


            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Turn Razorpay Payment Failures Into{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Recovered Revenue
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              ReviveAI intercepts payment failures in real-time, classifies root causes via smart heuristics, and executes automated recovery workflows — turning lost transactions into completed sales.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Open Live Recovery Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/test-payment"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <TestTube2 className="w-4 h-4 text-indigo-400" />
                <span>Simulate Payment Failure</span>
              </Link>
            </div>

            {/* Live Webhook Teaser Bar */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Razorpay Webhook Integrated</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instant Payment Link Generation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Supabase Real-Time Tracking</span>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS & PROOF BANNER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
            <div className="text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">35%+</span>
              <p className="text-xs text-slate-400 font-medium">Est. Revenue Recovered</p>
            </div>
            <div className="text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-indigo-400 tracking-tight">&lt; 100ms</span>
              <p className="text-xs text-slate-400 font-medium">Webhook Interception</p>
            </div>
            <div className="text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">5 Failure</span>
              <p className="text-xs text-slate-400 font-medium">Smart Categories</p>
            </div>
            <div className="text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">100%</span>
              <p className="text-xs text-slate-400 font-medium">Razorpay API Native</p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS PIPELINE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Automated Architecture
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              How ReviveAI Recovers Lost Sales
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              A 4-step intelligent pipeline that works silently behind your Razorpay integration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 relative group hover:border-indigo-500/40 transition-all shadow-xl">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/20">
                01
              </div>
              <h4 className="text-base font-bold text-white">Webhook Interception</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                When a payment fails on Razorpay, our webhook endpoint receives the raw failure payload with signature verification.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 relative group hover:border-indigo-500/40 transition-all shadow-xl">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/20">
                02
              </div>
              <h4 className="text-base font-bold text-white">Smart Classification</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our heuristics engine analyzes error codes to identify whether it's Card Expiry, Insufficient Funds, Gateway Glitch, or Method Restriction.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 relative group hover:border-indigo-500/40 transition-all shadow-xl">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/20">
                03
              </div>
              <h4 className="text-base font-bold text-white">Recovery Strategy</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Triggers either a silent auto-retry schedule or generates a custom Razorpay Payment Link dispatched via email/SMS.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 relative group hover:border-indigo-500/40 transition-all shadow-xl">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/20">
                04
              </div>
              <h4 className="text-base font-bold text-white">Revenue Recon</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                When the recovery link is paid, <span className="font-mono text-emerald-400">payment_link.paid</span> marks the transaction as Recovered in real-time.
              </p>
            </div>
          </div>
        </section>

        {/* INTERACTIVE ROI CALCULATOR SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RoiCalculator />
        </section>

        {/* CORE FEATURES GRID */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Powerful Feature Set
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Designed for Razorpay Merchants & Developers
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 w-fit">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Smart Failure Classifier</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Distinguishes between hard declines (card expired) and soft declines (insufficient funds / gateway timeouts). Prevents annoying customer churn with tailored rules.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit">
                <LinkIcon className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Instant Razorpay Payment Links</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates 1-click Razorpay payment short links automatically via API, enabling customers to complete payment with any alternative payment method.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 w-fit">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Automated Retry Scheduler</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Background cron engine checks pending retries and re-triggers payment links at high-conversion times (e.g. after salary credit days).
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-950 border border-indigo-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="space-y-2 max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Ready to Experience ReviveAI Live?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Explore the real-time analytics dashboard or run a test payment failure in Razorpay test mode right now.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Go to Recovery Dashboard</span>
              </Link>
              <Link
                href="/test-payment"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <TestTube2 className="w-4 h-4 text-indigo-400" />
                <span>Test Failure Simulation</span>
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
