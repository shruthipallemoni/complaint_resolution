import React, { useState } from 'react';
import {
  Send,
  User,
  Copy,
  Check,
  Mail,
  Clock,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import type { ComplaintRequest, ResolvedResult } from '../types';
import { apiFetch } from '../api';

interface SubmitComplaintViewProps {
  onReviewCreated: (reviewId: string) => void;
  onRefreshPending: () => void;
}

export const SubmitComplaintView: React.FC<SubmitComplaintViewProps> = ({
  onReviewCreated,
  onRefreshPending,
}) => {
  const [customerId, setCustomerId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [complaintText, setComplaintText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Response outcome state (null until submitted)
  const [responseStatus, setResponseStatus] = useState<'resolved' | 'pending_review' | null>(null);
  const [resolvedResult, setResolvedResult] = useState<ResolvedResult | null>(null);
  const [createdReviewId, setCreatedReviewId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId.trim() || !customerEmail.trim() || !complaintText.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setEmailSent(false);
    const startTime = Date.now();

    try {
      const payload: ComplaintRequest = {
        customer_id: customerId.trim(),
        customer_email: customerEmail.trim(),
        complaint_text: complaintText.trim(),
      };

      const res = await apiFetch('/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const execTime = Date.now() - startTime;
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Submission failed (Status ${res.status})`);

      if (data.status === 'pending_review') {
        setResponseStatus('pending_review');
        setCreatedReviewId(data.review_id);
        setResolvedResult(null);
        onRefreshPending();
      } else if (data.status === 'resolved') {
        setResponseStatus('resolved');
        setResolvedResult({
          ...data.result,
          execution_time_ms: data.result?.execution_time_ms || execTime,
        });
        setCreatedReviewId(null);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!resolvedResult?.final_response) return;
    setIsSendingEmail(true);
    setError(null);
    try {
      const res = await apiFetch('/complaints/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: customerEmail.trim(),
          final_response: resolvedResult.final_response,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `Email delivery failed (Status ${res.status})`);
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email delivery failed');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopy = () => {
    if (resolvedResult?.final_response) {
      navigator.clipboard.writeText(resolvedResult.final_response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Title & Route Subtitle */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Submit Complaint</h1>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <span>Direct ingestion to</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 text-teal-300 font-mono text-xs border border-slate-800">
            POST /complaints
          </span>
        </div>
      </div>

      {/* Complaint Submission Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800/90 bg-[#0d1522] p-6 sm:p-7 shadow-2xl space-y-5"
      >
        {/* CUSTOMER ID */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
              CUSTOMER ID
            </label>
            <span className="text-xs font-mono text-slate-500">customer_id: str</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              placeholder="e.g. CUST-984210"
              className="w-full bg-[#090e17] text-slate-100 placeholder-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm border border-slate-800 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/40 font-mono transition-all"
            />
          </div>
        </div>

        {/* CUSTOMER EMAIL */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
              CUSTOMER EMAIL
            </label>
            <span className="text-xs font-mono text-slate-500">customer_email: str</span>
          </div>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            placeholder="e.g. customer@example.com"
            className="w-full bg-[#090e17] text-slate-100 placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm border border-slate-800 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/40 font-mono transition-all"
          />
        </div>

        {/* COMPLAINT TEXT */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
              COMPLAINT TEXT
            </label>
            <span className="text-xs font-mono text-slate-500">complaint_text: str</span>
          </div>
          <textarea
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            rows={5}
            required
            placeholder="Type customer grievance or support escalation payload..."
            className="w-full bg-[#090e17] text-slate-100 placeholder-slate-600 rounded-xl p-3.5 text-sm border border-slate-800 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/40 leading-relaxed font-sans transition-all"
          />
        </div>

        {/* Submit Complaint Button */}
        <button
          type="submit"
          disabled={isSubmitting || !customerId.trim() || !customerEmail.trim() || !complaintText.trim()}
          className="w-full py-3 px-4 rounded-xl bg-[#06b6d4] hover:bg-[#22d3ee] text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
              <span>Evaluating Complaint Policy & Risk...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Complaint</span>
            </>
          )}
        </button>
      </form>

      {/* RESPONSE SECTION (Only shown when a submission has occurred) */}
      {responseStatus && (
        <div className="space-y-3">
          {error && (
            <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              RESPONSE OUTCOME
            </span>
            <span className="text-xs text-slate-500 font-mono">
              status: {responseStatus}
            </span>
          </div>

          {/* Resolved Card */}
          {responseStatus === 'resolved' && (
            <div className="rounded-2xl border border-teal-900/60 bg-[#0c181f] p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-teal-900/40">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                    <Check className="w-3.5 h-3.5" />
                    <span>Status: Resolved</span>
                  </span>
                  <span className="font-mono text-xs text-slate-400">200 OK</span>
                </div>

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Response'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  COMPUTED RESOLUTION
                </div>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                  {resolvedResult?.final_response}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-950/50 border border-slate-800 p-3">
                  <div className="text-slate-500 uppercase tracking-wider font-mono">Classification</div>
                  <div className="text-slate-200 mt-1">{resolvedResult?.classification.category}</div>
                </div>
                <div className="rounded-lg bg-slate-950/50 border border-slate-800 p-3">
                  <div className="text-slate-500 uppercase tracking-wider font-mono">Risk</div>
                  <div className="text-slate-200 mt-1">
                    {resolvedResult?.risk_assessment.score}% {resolvedResult?.risk_assessment.level}
                  </div>
                  <div className="text-slate-400 mt-1">{resolvedResult?.risk_assessment.rationale}</div>
                </div>
                <div className="sm:col-span-2 rounded-lg bg-slate-950/50 border border-slate-800 p-3">
                  <div className="text-slate-500 uppercase tracking-wider font-mono">Proposed action</div>
                  <div className="text-slate-200 mt-1">{resolvedResult?.proposed_action}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-teal-900/40 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-teal-400" />
                  <span>{emailSent ? 'Customer notified via email' : 'Draft ready for email approval'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || emailSent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold disabled:opacity-60"
                >
                  {isSendingEmail ? 'Sending...' : emailSent ? 'Email Sent' : 'Send Email'}
                </button>
              </div>
            </div>
          )}

          {/* Pending Review Card */}
          {responseStatus === 'pending_review' && (
            <div className="rounded-2xl border border-amber-800/60 bg-[#16120b] p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-amber-900/40">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Status: Pending Review</span>
                  </span>
                  <span className="font-mono text-xs text-slate-400">200 OK • Flow Escalated</span>
                </div>

                {createdReviewId && (
                  <span className="font-mono text-xs text-cyan-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
                    review_id: {createdReviewId}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono font-bold tracking-wider text-amber-400 uppercase">
                  ESCALATED TO HUMAN REVIEW QUEUE
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  This complaint triggered risk thresholds or policy guardrails. Automated dispatch has been halted,
                  and the case is awaiting human review and approval in the pending queue.
                </p>
              </div>

              {createdReviewId && (
                <div className="pt-3 border-t border-amber-900/40 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-amber-300">
                    <span>Queued in pending review repository</span>
                  </div>
                  <button
                    onClick={() => onReviewCreated(createdReviewId)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs transition-all shadow-md"
                  >
                    <span>Review Case ({createdReviewId})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
