from unittest.mock import Mock, patch

from complaint_resolution.models import ComplaintClassification, ResolutionDraft, RiskAssessment
from complaint_resolution.services.review_resolution import resume_review


def test_resume_review_accepts_pydantic_current_draft():
    state = {
        "customer_id": "CUST-019",
        "complaint_text": "damaged blender",
        "classification": ComplaintClassification(
            category="product_defect",
            financial_impact=0.0,
            emotional_signal="threatening_to_leave",
            summary="defective blender",
        ).model_dump(mode="json"),
        "risk_assessment": RiskAssessment(
            risk_score=30,
            requires_escalation=True,
            reasoning="Emotional signal detected",
        ).model_dump(mode="json"),
        "current_draft": ResolutionDraft(
            proposed_action="issue refund",
            draft_reply="Dear customer, we are sorry.",
            policy_reference="repeat issue",
        ).model_dump(mode="json"),
        "draft_attempts": [],
        "guardrail_results": [],
        "human_decision": None,
        "final_reply": "",
        "guardrail_exhausted": False,
    }

    with patch("complaint_resolution.services.review_resolution.load_pending_review", return_value={"state": state, "status": "pending"}), \
         patch("complaint_resolution.services.review_resolution.build_audit_log", return_value=Mock(model_dump=lambda **kwargs: {"ok": True})), \
         patch("complaint_resolution.services.review_resolution.update_customer_history"), \
         patch("complaint_resolution.services.review_resolution.init_audit_table"), \
         patch("complaint_resolution.services.review_resolution.save_audit_entry"), \
         patch("complaint_resolution.services.review_resolution.update_pending_review"), \
         patch("complaint_resolution.persistance.customer_repo.update_customer_history"), \
         patch("complaint_resolution.services.review_resolution.mark_review_resolved"):
        result = resume_review("review-123", "approve")

    assert result == {"ok": True}
