import Link from 'next/link';
import { Zap, ShieldCheck, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: Brand & Purpose */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
              <Zap className="w-4 h-4 fill-white/20 stroke-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              ReviveAI
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
            Automated Payment Failure Recovery Engine for Razorpay. Intercepts payment failures, classifies root causes via smart heuristics, and delivers automated retry schedules or smart payment recovery links to turn lost revenue into completed sales.
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-mono">
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-indigo-400 font-semibold">
              Razorpay Buildathon 2026 Entry
            </span>
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/" className="hover:text-indigo-400 transition-colors">
                Product Overview
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">
                Live Recovery Dashboard
              </Link>
            </li>
            <li>
              <Link href="/test-payment" className="hover:text-indigo-400 transition-colors">
                Razorpay Simulator
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Tech Stack */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Built With</h4>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              Next.js 16
            </span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              Razorpay Webhooks
            </span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              Supabase DB
            </span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              Tailwind CSS v4
            </span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              TypeScript
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© 2026 ReviveAI. Built for the Razorpay Buildathon.</p>
        <p className="flex items-center gap-1">
          Designed for maximum payment recovery & merchant revenue protection.
        </p>
      </div>
    </footer>
  );
}
