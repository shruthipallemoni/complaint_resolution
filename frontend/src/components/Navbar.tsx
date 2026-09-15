import React from 'react';
import { ShieldCheck, User, RefreshCw, AlertCircle } from 'lucide-react';

interface NavbarProps {
  currentTab: 'queue' | 'submit' | 'detail' | 'resolved';
  setCurrentTab: (tab: 'queue' | 'submit' | 'detail' | 'resolved') => void;
  pendingCount: number;
  activeReviewId?: string | null;
  onBackToQueue?: () => void;
  onResetDemo?: () => void;
  isResetting?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  pendingCount,
  activeReviewId,
  onBackToQueue,
  onResetDemo,
  isResetting,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#0d1522] sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left branding and breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('queue')}
            className="flex items-center gap-2.5 text-slate-100 hover:text-white transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-teal-400 group-hover:border-teal-400 transition-colors shadow-sm shadow-teal-500/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-semibold tracking-tight text-lg text-white">Resolver AI</span>
          </button>

          {currentTab === 'detail' && activeReviewId && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
              <span className="text-slate-600">/</span>
              <button
                onClick={onBackToQueue}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Pending Reviews
              </button>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300 font-medium">Review Detail</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 text-xs font-mono border border-slate-700">
                {activeReviewId}
              </span>
            </div>
          )}
        </div>

        {/* Center navigation tabs (when not in detail or for quick switching) */}
        <nav className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('submit')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'submit'
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            Submit Complaint
          </button>

          <button
            onClick={() => setCurrentTab('resolved')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'resolved'
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            Resolved
          </button>

          <button
            onClick={() => setCurrentTab('queue')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'queue'
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <span>Pending Reviews</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${
                currentTab === 'queue'
                  ? 'bg-teal-400 text-slate-950'
                  : 'bg-slate-800 text-teal-400 border border-teal-500/20'
              }`}
            >
              {pendingCount}
            </span>
          </button>
        </nav>

        {/* Right meta and user section */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
            <span className="text-slate-500">API:</span>
            <span className="text-teal-400/90">
              {currentTab === 'queue'
                ? '/reviews/pending'
                : currentTab === 'submit'
                ? '/complaints'
                : currentTab === 'resolved'
                ? '/complaints/resolved'
                : `/reviews/${activeReviewId || ':id'}`}
            </span>
          </div>

          {onResetDemo && (
            <button
              onClick={onResetDemo}
              disabled={isResetting}
              title="Reset pending reviews to seed dataset"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          )}

          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};
