from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ComplaintState(BaseModel):
    customer_id: str = ""
    customer_email: str = ""
    complaint_text: str = ""
    human_reject_count: int = 0
    classification: Optional["ComplaintClassification"] = None
    history: Optional["CustomerHistory"] = None
    risk_assessment: Optional["RiskAssessment"] = None
    current_draft: Optional["ResolutionDraft"] = None
    draft_attempts: List["ResolutionDraft"] = Field(default_factory=list)
    guardrail_results: List["GuardrailResult"] = Field(default_factory=list)
    rework_count: int = 0
    human_decision: Optional[str] = None
    final_reply: str = ""
    guardrail_exhausted: bool = False


class ComplaintClassification(BaseModel):
    category: str = Field(description="Complaint category, e.g. 'shipping', 'billing', 'product_defect'")
    financial_impact: Optional[float] = Field(description="Dollar amount involved, if any was mentioned. Null if none.")
    emotional_signal: str = Field(description="One of: 'neutral', 'frustrated', 'angry', 'threatening_to_leave'")
    summary: str = Field(description="One-sentence summary of what the customer is actually complaining about")


class CustomerHistory(BaseModel):
    customer_id: str
    previous_complaint_count: int = 0
    complaint_categories: List[str] = Field(default_factory=list)
    auto_resolved_count: int = 0
    escalated_count: int = 0
    recurring_issue: bool = False


class RiskAssessment(BaseModel):
    risk_score: int = Field(description="0-100 risk score", ge=0, le=100)
    requires_escalation: bool
    reasoning: str = Field(description="Why this risk score was assigned — cite specific factors")


class ResolutionDraft(BaseModel):
    proposed_action: str = Field(description="The specific action proposed, e.g. 'issue $20 credit', 'apologize and offer replacement'")
    draft_reply: str = Field(description="The actual customer-facing reply text")
    policy_reference: str = Field(description="Which policy rule justifies this action")


class GuardrailResult(BaseModel):
    issue_acknowledged: bool
    within_authorization: bool
    no_invented_facts: bool
    passed: bool
    failure_reason: Optional[str] = None


class AuditLogEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.now)
    customer_id: str
    complaint_text: str
    classification: ComplaintClassification
    risk_assessment: RiskAssessment
    draft_attempts: List[ResolutionDraft]
    guardrail_results: List[GuardrailResult]
    human_decision: Optional[str] = None  # "approved", "edited", "rejected", or None if auto-resolved
    final_reply: str


ComplaintState.model_rebuild()
