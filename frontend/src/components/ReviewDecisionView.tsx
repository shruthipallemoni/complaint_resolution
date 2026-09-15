import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  Edit3,
  Check,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  X,
  FileText,
} from 'lucide-react';
import type { ReviewDecision, ReviewDecisionRequest, ResolvedResult } from '../types';
import { apiFetch } from '../api';

interface ReviewData {
  review_id: string;
  complaint_text: string;
  classification: {
    category: string;
    sentiment_tone: string;
    confidence?: number;
  };
  risk_assessment: {
    score: number;
    level?: string;
    rationale: string;
  };
  guardrail_exhausted: boolean;
  current_draft: string;
}

function normalizeReviewData(review: any): ReviewData {
  const riskAssessment = review.risk_assessment || {};
  const currentDraft = review.current_draft;
  const classification = review.classification || {};

  return {
    ...review,
    classification: {
      category: classification.category || 'Unclassified',
      sentiment_tone: classification.sentiment_tone || classification.emotional_signal || 'Pending Analysis',
      confidence: classification.confidence,
    },
    risk_assessment: {
      score: riskAssessment.score ?? riskAssessment.risk_score ?? 0,
      level: riskAssessment.level || (riskAssessment.risk_score >= 70 ? 'High' : riskAssessment.risk_score >= 40 ? 'Med' : 'Low'),
      rationale: riskAssessment.rationale || riskAssessment.reasoning || 'Risk evaluation recorded during triage.',
    },
    current_draft:
      typeof currentDraft === 'string'
        ? currentDraft
        : currentDraft?.draft_reply || 'No response draft available.',
  };
}

interface ReviewDecisionViewProps {
  reviewId: string;
  onBackToQueue: () => void;
  onDecisionCompleted: () => void;
}

export const ReviewDecisionView: React.FC<ReviewDecisionViewProps> = ({
  reviewId,
  onBackToQueue,
  onDecisionCompleted,
}) => {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedReply, setEditedReply] = useState('');

  // Submitting decision state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<ReviewDecision | null>(null);
  const [resolutionResult, setResolutionResult] = useState<ResolvedResult | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Fetch review details from GET /reviews/{review_id}
  const fetchReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/reviews/${reviewId}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Failed to fetch review (Status ${res.status})`);
      }
      const reviewJson = normalizeReviewData(await res.json());
      setData(reviewJson);
      setEditedReply(reviewJson.current_draft);
    } catch (err: any) {
      console.error('Error fetching review:', err);
      setError(err.message || 'Failed to load review');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [reviewId]);

  // Submit decision to POST /reviews/{review_id}/decision
  const handleSubmitDecision = async (decision: ReviewDecision) => {
    if (!data) return;
    setIsSubmitting(true);
    setSubmittingAction(decision);
    setError(null);

    try {
      const payload: ReviewDecisionRequest = {
        decision,
        edited_reply: decision === 'edit' ? editedReply : null,
      };

      const res = await apiFetch(`/reviews/${reviewId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Failed to submit decision (Status ${res.status})`);
      }

      const responseData = await res.json();
      setResolutionResult(responseData.result);
    } catch (err: any) {
      console.error('Error submitting decision:', err);
      setError(err.message || 'Failed to submit decision');
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    setError(null);
    try {
      const res = await apiFetch(`/reviews/${reviewId}/send-email`, { method: 'POST' });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(responseData.detail || `Failed to send email (Status ${res.status})`);
      setEmailSent(true);
      onDecisionCompleted();
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Loading review #{reviewId}...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm">
          {error}
        </div>
        <button
          onClick={onBackToQueue}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Queue</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToQueue}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to queue</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>Target:</span>
          <span className="text-teal-400">/reviews/{reviewId}/decision</span>
        </div>
      </div>

      {/* Main Page Title Header matching screenshot 1 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Review Decision</h1>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300">
              ID: {data.review_id}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1.5 tracking-wide">
            GET /reviews/{data.review_id} • POST /reviews/{data.review_id}/decision
          </p>
        </div>

        {/* Status indicator badge matching screenshot 1 */}
        <div className="self-start md:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
          <span>Status: Awaiting Human Decision</span>
        </div>
      </div>

      {/* Decision Resolution Modal / Success Overlay */}
      {resolutionResult && (
        <div className="p-6 rounded-2xl bg-[#0e1c26] border border-teal-500/40 shadow-2xl space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Complaint Resolved & Dispatched</h3>
                <p className="text-xs text-teal-300/80">
                  Decision "{resolutionResult.resolution_method}" has been approved. Send it when ready.
                </p>
              </div>
            </div>
            <button
              onClick={onBackToQueue}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              FINAL DISPATCHED RESPONSE
            </div>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
              {resolutionResult.final_response}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail || emailSent}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs tracking-wide transition-all disabled:opacity-60"
            >
              {isSendingEmail ? (
                <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{emailSent ? 'Email Sent' : 'Send Email'}</span>
            </button>
            <button
              onClick={onBackToQueue}
              className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-md shadow-teal-500/20"
            >
              Return to Pending Queue →
            </button>
          </div>
        </div>
      )}

      {/* Two-Column Layout matching screenshot 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-5">
          {/* COMPLAINT_TEXT Card */}
          <div className="rounded-xl border border-slate-800/90 bg-[#0d1522] p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                COMPLAINT_TEXT
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                Inbound Payload
              </span>
            </div>

            <div className="rounded-lg bg-[#090e17] p-4 border border-slate-800/80">
              <p className="text-sm text-slate-200 leading-relaxed italic font-sans">
                {data.complaint_text.startsWith('"') ? data.complaint_text : `"${data.complaint_text}"`}
              </p>
            </div>
          </div>

          {/* CLASSIFICATION Card */}
          <div className="rounded-xl border border-slate-800/90 bg-[#0d1522] p-5 shadow-lg space-y-4">
            <div className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              CLASSIFICATION
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-[#090e17] p-3.5 border border-slate-800/80 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  CATEGORY
                </div>
                <div className="text-sm font-semibold text-white">
                  {data.classification?.category || 'Unclassified'}
                </div>
              </div>

              <div className="rounded-lg bg-[#090e17] p-3.5 border border-slate-800/80 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  SENTIMENT / TONE
                </div>
                <div className="text-sm font-semibold text-[#f87171]">
                  {data.classification?.sentiment_tone || 'Pending Analysis'}
                </div>
              </div>
            </div>
          </div>

          {/* RISK_ASSESSMENT Card */}
          <div className="rounded-xl border border-slate-800/90 bg-[#0d1522] p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                RISK_ASSESSMENT
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/60 text-red-300 border border-red-800/80">
                Score: {data.risk_assessment?.score ?? 0}%
              </span>
            </div>

            <div className="rounded-lg bg-[#090e17] p-4 border border-slate-800/80 space-y-1.5">
              <div className="text-xs font-semibold text-slate-300">Rationale:</div>
              <p className="text-xs text-slate-300/90 leading-relaxed font-sans">
                {data.risk_assessment?.rationale || 'Risk evaluation recorded during triage.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Warning banner: guardrail_exhausted (matching screenshot 1) */}
          {data.guardrail_exhausted && (
            <div className="rounded-xl border border-amber-800/60 bg-linear-to-r from-amber-950/40 via-amber-900/20 to-amber-950/40 p-4 shadow-lg flex items-start gap-3.5">
              <div className="p-1 rounded-lg text-amber-400 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-mono font-bold text-amber-400">
                  guardrail_exhausted: true
                </div>
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  AI failed to produce a policy-compliant draft — review carefully.
                </div>
              </div>
            </div>
          )}

          {/* CURRENT_DRAFT Card */}
          <div className="rounded-xl border border-slate-800/90 bg-[#0d1522] p-6 shadow-xl space-y-5">
            {/* Draft header matching screenshot 1 */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
                  CURRENT_DRAFT
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-teal-300 border border-slate-700">
                  AI Proposed
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Ready for Human Decision</span>
            </div>

            {/* Draft Body (View vs Edit Mode) */}
            <div className="rounded-xl bg-[#090e17] p-5 border border-slate-800/90 min-h-55">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-teal-400 font-medium">
                    <span>Editing Response Draft</span>
                    <span className="text-slate-500 font-mono text-[11px]">Markdown / Text supported</span>
                  </div>
                  <textarea
                    value={editedReply}
                    onChange={(e) => setEditedReply(e.target.value)}
                    rows={10}
                    className="w-full bg-slate-900 text-slate-100 p-3 rounded-lg border border-teal-500/50 text-sm font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-teal-400"
                    placeholder="Enter custom response to be dispatched to customer..."
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedReply(data.current_draft);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      Cancel Edit
                    </button>
                    <button
                      onClick={() => handleSubmitDecision('edit')}
                      disabled={isSubmitting || !editedReply.trim()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      {isSubmitting && submittingAction === 'edit' ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Save & Submit Edit</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                  {editedReply || data.current_draft}
                </div>
              )}
            </div>

            {/* Action Buttons matching screenshot 1 */}
            <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {/* Reject & Regenerate */}
                <button
                  onClick={() => handleSubmitDecision('reject')}
                  disabled={isSubmitting || isEditing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold tracking-wide transition-all shadow-sm disabled:opacity-50"
                >
                  <RotateCcw
                    className={`w-4 h-4 ${
                      isSubmitting && submittingAction === 'reject' ? 'animate-spin text-teal-400' : ''
                    }`}
                  />
                  <span>Reject & Regenerate</span>
                </button>

                {/* Edit Response */}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isSubmitting}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold tracking-wide transition-all shadow-sm ${
                    isEditing
                      ? 'bg-teal-950/60 text-teal-300 border-teal-500/50'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isEditing ? 'Viewing Mode' : 'Edit Response'}</span>
                </button>
              </div>

              {/* Approve Button (High emphasis cyan button matching screenshot 1) */}
              <button
                onClick={() => (isEditing ? handleSubmitDecision('edit') : handleSubmitDecision('approve'))}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-[#22d3ee] hover:bg-[#06b6d4] text-slate-950 text-xs font-bold tracking-wide transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {isSubmitting && (submittingAction === 'approve' || submittingAction === 'edit') ? (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                ) : (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>Approve</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
