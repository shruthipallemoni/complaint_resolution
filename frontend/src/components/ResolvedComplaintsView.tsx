import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Edit3, RefreshCw, XCircle } from 'lucide-react';
import { apiFetch } from '../api';

interface ResolvedComplaint {
  timestamp: string;
  customer_id: string;
  complaint_text: string;
  classification: { category: string };
  risk_assessment: { risk_score: number; reasoning: string };
  human_decision?: string | null;
  final_reply: string;
}

interface ResolvedComplaintsViewProps {
  refreshToken: number;
}

const decisionDetails: Record<string, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  approved: { label: 'Approved', className: 'text-emerald-300 bg-emerald-950/50 border-emerald-700/60', Icon: CheckCircle2 },
  edited: { label: 'Edited', className: 'text-cyan-300 bg-cyan-950/50 border-cyan-700/60', Icon: Edit3 },
  rejected_max_attempts: { label: 'Rejected for manual handling', className: 'text-red-300 bg-red-950/50 border-red-700/60', Icon: XCircle },
  automated: { label: 'Auto-resolved', className: 'text-teal-300 bg-teal-950/50 border-teal-700/60', Icon: CheckCircle2 },
};

export const ResolvedComplaintsView: React.FC<ResolvedComplaintsViewProps> = ({ refreshToken }) => {
  const [complaints, setComplaints] = useState<ResolvedComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResolved = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/complaints/resolved?limit=100');
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `Failed to fetch resolved complaints (${response.status})`);
      setComplaints(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resolved complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResolved();
  }, [refreshToken]);

  const formatDate = (value: string) => new Date(value).toLocaleString();

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Resolved Complaints</h1>
          <p className="text-slate-400 text-sm mt-1">Completed complaint decisions and customer response drafts.</p>
        </div>
        <button
          type="button"
          onClick={fetchResolved}
          title="Refresh resolved complaints"
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="space-y-4">
        {loading && complaints.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0d1522] p-10 text-center text-slate-400">Loading resolved complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0d1522] p-10 text-center text-slate-400">No resolved complaints have been recorded yet.</div>
        ) : complaints.map((complaint, index) => {
          const decision = complaint.human_decision || 'automated';
          const details = decisionDetails[decision] || { label: decision, className: 'text-slate-300 bg-slate-900 border-slate-700', Icon: Clock3 };
          const Icon = details.Icon;
          return (
            <article key={`${complaint.timestamp}-${complaint.customer_id}-${index}`} className="rounded-xl border border-slate-800/90 bg-[#0d1522] p-5 shadow-lg space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{complaint.customer_id}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs text-cyan-300">{complaint.classification?.category || 'Unclassified'}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${details.className}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {details.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2"><Clock3 className="w-3.5 h-3.5" />{formatDate(complaint.timestamp)}</div>
                </div>
                <div className="text-xs text-slate-400">Risk: <span className="font-mono text-slate-200">{complaint.risk_assessment?.risk_score ?? 0}%</span></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg bg-[#090e17] border border-slate-800 p-4">
                  <div className="text-[11px] font-mono font-bold tracking-wider text-slate-500 uppercase mb-2">Complaint</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{complaint.complaint_text}</p>
                </div>
                <div className="rounded-lg bg-[#090e17] border border-slate-800 p-4">
                  <div className="text-[11px] font-mono font-bold tracking-wider text-slate-500 uppercase mb-2">Final response</div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{complaint.final_reply}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};