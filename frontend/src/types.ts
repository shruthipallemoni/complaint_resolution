export interface Classification {
  category: string;
  sentiment_tone: string;
  confidence?: number;
}

export interface RiskAssessment {
  score: number;
  level?: 'Low' | 'Med' | 'High';
  rationale: string;
}

export interface ReviewState {
  complaint_text: string;
  customer_id: string;
  customer_email: string;
  classification: Classification;
  risk_assessment: RiskAssessment;
  guardrail_exhausted: boolean;
  current_draft: string;
  iteration_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PendingReviewRecord {
  review_id: string;
  customer_id: string;
  status: 'pending' | 'resolved' | 'rejected';
  state: ReviewState;
  created_at: string;
  updated_at?: string;
}

export interface ComplaintRequest {
  customer_id: string;
  customer_email: string;
  complaint_text: string;
}

export type ReviewDecision = 'approve' | 'edit' | 'reject';

export interface ReviewDecisionRequest {
  decision: ReviewDecision;
  edited_reply?: string | null;
}

export interface ResolvedResult {
  review_id?: string;
  customer_id: string;
  status: 'resolved';
  final_response: string;
  resolved_at: string;
  resolution_method: 'automated' | 'human_approved' | 'human_edited' | 'regenerated';
  classification: Classification;
  risk_assessment: RiskAssessment;
  complaint_text?: string;
  proposed_action?: string;
  policy_reference?: string;
  email_status?: 'sent' | 'failed' | 'not_sent';
  email_error?: string;
  execution_time_ms?: number;
}
