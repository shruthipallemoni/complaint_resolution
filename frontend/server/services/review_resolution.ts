import { load_pending_review, update_review_status } from '../persistance/review_repo';
import { getGeminiClient } from '../gemini';
import type { ReviewDecision, ResolvedResult } from '../../src/types';

export async function send_review_email(review_id: string, sendEmail: (to: string, body: string) => Promise<string>) {
  const record = load_pending_review(review_id);
  if (!record) throw new Error('Review not found');
  if (record.status !== 'resolved') throw new Error('Approve the review before sending email');

  const recipient = record.state.customer_email;
  const finalReply = record.state.current_draft;
  if (!recipient.includes('@')) throw new Error('The submitted customer email is invalid');
  if (!finalReply) throw new Error('No approved reply is available to send');

  return sendEmail(recipient, finalReply);
}

export async function resume_review(
  review_id: string,
  decision: ReviewDecision,
  edited_reply?: string | null
): Promise<ResolvedResult> {
  const record = load_pending_review(review_id);
  if (!record) {
    throw new Error('Review not found');
  }
  if (record.status !== 'pending') {
    throw new Error(`Review already ${record.status}`);
  }

  const { state, customer_id } = record;

  if (decision === 'approve') {
    update_review_status(review_id, 'resolved', state.current_draft);
    return {
      review_id,
      customer_id,
      status: 'resolved',
      final_response: state.current_draft,
      resolved_at: new Date().toISOString(),
      resolution_method: 'human_approved',
      classification: state.classification,
      risk_assessment: state.risk_assessment,
    };
  }

  if (decision === 'edit') {
    if (!edited_reply || !edited_reply.trim()) {
      throw new Error("edited_reply is required when decision is 'edit'");
    }
    update_review_status(review_id, 'resolved', edited_reply);
    return {
      review_id,
      customer_id,
      status: 'resolved',
      final_response: edited_reply,
      resolved_at: new Date().toISOString(),
      resolution_method: 'human_edited',
      classification: state.classification,
      risk_assessment: state.risk_assessment,
    };
  }

  if (decision === 'reject') {
    // Generate a fresh alternative draft with strict policy compliance
    let regeneratedDraft = '';
    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `A previous draft was rejected by a human reviewer. Generate a fresh, polished, strictly compliant response for this complaint.

Customer: ${customer_id}
Complaint: ${state.complaint_text}
Previous Rejected Draft: ${state.current_draft}

Write an alternative, highly professional response directly to the customer that remedies their grievance without making unauthorized promises.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        regeneratedDraft = response.text?.trim() || '';
      } catch (e) {
        console.warn('AI draft regeneration failed:', e);
      }
    }

    if (!regeneratedDraft) {
      regeneratedDraft = `Dear Customer,\n\nWe have reviewed the escalation regarding your account (${customer_id}). Our leadership team has initiated a high-priority review into your inquiry: "${state.complaint_text.slice(0, 80)}...".\n\nA senior account officer has been assigned to coordinate a complete resolution within 1 business day. We appreciate your patience as we rectify this matter.\n\nSincerely,\nResolver Executive Escalations Team`;
    }

    // Update draft and mark resolved with regenerated draft
    update_review_status(review_id, 'resolved', regeneratedDraft);

    return {
      review_id,
      customer_id,
      status: 'resolved',
      final_response: regeneratedDraft,
      resolved_at: new Date().toISOString(),
      resolution_method: 'regenerated',
      classification: state.classification,
      risk_assessment: state.risk_assessment,
    };
  }

  throw new Error(`Invalid decision: ${decision}`);
}
