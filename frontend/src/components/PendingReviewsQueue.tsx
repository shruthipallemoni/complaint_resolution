import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { PendingReviewRecord } from '../types';

interface PendingReviewsQueueProps {
  reviews: PendingReviewRecord[];
  isLoading: boolean;
  onSelectReview: (reviewId: string) => void;
  onNavigateSubmit: () => void;
}

export const PendingReviewsQueue: React.FC<PendingReviewsQueueProps> = ({
  reviews,
  isLoading,
  onSelectReview,
  onNavigateSubmit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Compute metrics
  const totalPending = reviews.length;
  const highRiskCount = reviews.filter(
    (r) =>
      r.state.risk_assessment?.score >= 70 ||
      r.state.risk_assessment?.level === 'High' ||
      r.state.classification?.category === 'Security' ||
      r.state.classification?.category === 'Contract Terms'
  ).length;
  const standardCount = totalPending - highRiskCount;

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return reviews;
    const q = searchQuery.toLowerCase();
    return reviews.filter((r) => {
      const idMatch = r.review_id.toLowerCase().includes(q);
      const custMatch = (r.customer_id || r.state.customer_id || '').toLowerCase().includes(q);
      const catMatch = (r.state.classification?.category || '').toLowerCase().includes(q);
      const textMatch = (r.state.complaint_text || '').toLowerCase().includes(q);
      return idMatch || custMatch || catMatch || textMatch;
    });
  }, [reviews, searchQuery]);

  // Helper for formatting time
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return 'Recent';
    }
  };

  const getRiskBadge = (score: number, level?: string) => {
    const effectiveLevel = level || (score >= 70 ? 'High' : score >= 40 ? 'Med' : 'Low');
    if (effectiveLevel === 'High' || score >= 70) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/60 text-red-300 border border-red-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          {score}% High Risk
        </span>
      );
    }
    if (effectiveLevel === 'Med' || score >= 40) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          {score}% Med Risk
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {score}% Low Risk
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
        {category}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-6">
      {/* Title & Metrics Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Pending Reviews</h1>
          <p className="text-slate-400 text-sm mt-1">Complaints requiring human review and decision.</p>
        </div>

        {/* Metrics Pill Cluster matching screenshot 2 */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs font-medium self-start md:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 flex items-center gap-2 border border-slate-700/50">
            <span>Total Pending:</span>
            <span className="font-bold text-white font-mono">{totalPending}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-red-950/40 text-red-300 flex items-center gap-2 border border-red-900/40">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>High Risk:</span>
            <span className="font-bold font-mono">{highRiskCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-300 flex items-center gap-2 border border-slate-700/40">
            <span>Standard:</span>
            <span className="font-bold text-white font-mono">{standardCount}</span>
          </div>
        </div>
      </div>

      {/* Search Input matching screenshot 2 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search reviews by ID, customer, keyword..."
          className="w-full bg-[#0e1624] text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm border border-slate-800 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/40 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-500 hover:text-slate-300"
          >
            Clear
          </button>
        )}
      </div>

      {/* Reviews Queue Table */}
      <div className="rounded-xl border border-slate-800/90 bg-[#0d1522] overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-mono">REVIEW ID</th>
                <th className="py-3.5 px-4">CUSTOMER / CREATED</th>
                <th className="py-3.5 px-4">CATEGORY</th>
                <th className="py-3.5 px-4">RISK ASSESSMENT</th>
                <th className="py-3.5 px-4 min-w-70">COMPLAINT PREVIEW</th>
                <th className="py-3.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
                      <span>Loading pending queue...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-teal-950/50 border border-teal-500/30 flex items-center justify-center mx-auto text-teal-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-white">Queue is Clear!</h3>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {searchQuery
                          ? `No reviews matched "${searchQuery}". Try a different filter.`
                          : 'All customer complaints have been reviewed and resolved.'}
                      </p>
                      <button
                        onClick={onNavigateSubmit}
                        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-medium transition-all"
                      >
                        Submit a new complaint
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => {
                  const state = review.state;
                  const score = state?.risk_assessment?.score ?? 50;
                  const level = state?.risk_assessment?.level;
                  const category = state?.classification?.category || 'General';
                  const custId = review.customer_id || state?.customer_id || 'Unknown';
                  const previewText = state?.complaint_text
                    ? state.complaint_text.replace(/^["']|["']$/g, '')
                    : 'No complaint text available';

                  return (
                    <tr
                      key={review.review_id}
                      onClick={() => onSelectReview(review.review_id)}
                      className="group hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      {/* REVIEW ID */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                          {review.review_id}
                        </span>
                      </td>

                      {/* CUSTOMER / CREATED */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200 text-xs">{custId}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{formatTime(review.created_at)}</div>
                      </td>

                      {/* CATEGORY */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getCategoryBadge(category)}
                      </td>

                      {/* RISK ASSESSMENT */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getRiskBadge(score, level)}
                      </td>

                      {/* COMPLAINT PREVIEW */}
                      <td className="py-4 px-4 text-slate-300 text-xs">
                        <p className="line-clamp-2 max-w-lg leading-relaxed text-slate-300/90 font-sans">
                          {previewText}
                        </p>
                      </td>

                      {/* ACTION */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectReview(review.review_id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/40 hover:border-cyan-400 transition-all shadow-sm"
                        >
                          <span>Review Case</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info matching screenshot 2 */}
        <div className="border-t border-slate-800/80 px-4 py-3 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing all {filteredReviews.length} pending review{filteredReviews.length === 1 ? '' : 's'}
          </div>
          <div>Page 1 of 1</div>
        </div>
      </div>
    </div>
  );
};
