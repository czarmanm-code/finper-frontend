import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import {
  ArrowTrendingUpIcon,
  SparklesIcon,
  BanknotesIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline'

export default function Investments() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8 max-w-7xl w-full mx-auto">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Savings & Investments
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Coming Next
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Compound growth engine, liquidity reserves, and long-term wealth building
              </p>
            </div>
          </div>

          {/* Hero Vision Banner */}
          <div className="w-full rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 shadow-sm relative overflow-hidden">
            <div className="max-w-2xl space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                <SparklesIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Next Major Milestone: Wealth Acceleration</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                Where your capital multiplies and works for your future.
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Just like <strong className="text-sky-600 dark:text-sky-400">Loans</strong> tracks your countdown to zero liability, this module will track your trajectory to financial freedom through high-yield accounts, emergency reserves, and compounding investment portfolios.
              </p>
            </div>
          </div>

          {/* Blueprint Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1: High Yield & Reserves */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Emergency & Liquid Funds
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Track your 3-6 month safety runway in CETES, Bonddia, Nu Cajitas, or high-yield accounts with instant liquidity metrics.
              </p>
            </div>

            {/* Pillar 2: Long-Term Portfolios */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800">
                <ArrowTrendingUpIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Investment Portfolios
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Track stocks, ETFs (S&P 500, VT), GBM portfolios, Afores, and real estate assets with overall valuation progress.
              </p>
            </div>

            {/* Pillar 3: Goal Milestones */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <RocketLaunchIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Milestone Targets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Set tangible targets: House down payments, new car savings, dream vacations, or retirement horizons with live progress bars.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

