from ..models import ComplaintState, GuardrailResult, ResolutionDraft
from ..persistance.review_repo import load_pending_review, mark_review_resolved
from ..services.audit import build_audit_log
from ..persistance.customer_repo import update_customer_history
from ..persistance.review_repo import update_pending_review
from ..persistance.audit_repo import init_audit_table, save_audit_entry
from ..crew import ComplaintResolution
from crewai import Crew, Process


def _resolve_current_draft(current_draft):
    if current_draft is None:
        raise ValueError("No current draft available for this review")
    if isinstance(current_draft, ResolutionDraft):
        return current_draft
    if isinstance(current_draft, dict):
        return ResolutionDraft(**current_draft)
    raise TypeError(f"Unsupported current_draft type: {type(current_draft).__name__}")


MAX_HUMAN_REJECTIONS = 2

def resume_review(review_id: str, decision: str, edited_reply: str = None) -> dict:
    record = load_pending_review(review_id)
    if record is None:
        raise ValueError(f"No review found for review_id={review_id}")
    if record["status"] != "pending":
        raise ValueError(f"Review {review_id} already resolved")

    state = ComplaintState(**record["state"])

    if decision == "approve":
        state.human_decision = "approved"
        state.final_reply = _resolve_current_draft(state.current_draft).draft_reply
        return _finalize(review_id, state)

    if decision == "edit":
        state.human_decision = "edited"
        state.final_reply = edited_reply or ""
        return _finalize(review_id, state)

    if decision == "reject":
        # NOTE: this is a separate counter from state.rework_count, which is
        # used by the automated pre-human guardrail loop (in flow.py) before
        # a human ever sees a draft. Sharing one counter between "the AI
        # retried itself" and "a human rejected it" meant a case that had
        # already exhausted automated retries would instantly hit the limit
        # on the very first human rejection, skipping the redraft entirely.
        state.human_reject_count += 1

        if state.human_reject_count > MAX_HUMAN_REJECTIONS:
            state.human_decision = "rejected_max_attempts"
            # Surface the last attempted draft rather than an empty reply,
            # so whoever handles this manually has something to work from.
            state.final_reply = _resolve_current_draft(state.current_draft).draft_reply
            result = _finalize(review_id, state)
            result["message"] = (
                "Maximum rework attempts reached. Showing the last generated "
                "draft for manual handling — this was NOT sent to the customer."
            )
            return result

        base = ComplaintResolution()
        agent, task = base.escalation_drafter_agent(), base.escalation_task()
        inputs = {
            "complaint_text": state.complaint_text,
            "classification": state.classification.model_dump(),
            "risk_assessment": state.risk_assessment.model_dump(),
            "previous_attempt_feedback": "Human reviewer rejected the previous draft.",
        }
        crew = Crew(agents=[agent], tasks=[task], process=Process.sequential)
        result = crew.kickoff(inputs=inputs)

        state.current_draft = result.pydantic.model_dump()
        state.draft_attempts.append(state.current_draft)

        # Same review_id, still pending — just updated in place.
        update_pending_review(review_id, state.model_dump(mode="json"))
        return {
            "status": "pending_review",
            "review_id": review_id,
            "attempt_count": state.human_reject_count,
            "note": "Redrafted after rejection — please review again.",
        }

    raise ValueError(f"Unknown decision: {decision}")


def _finalize(review_id: str, state: ComplaintState):
    from ..persistance.customer_repo import update_customer_history

    entry = build_audit_log(
        customer_id=state.customer_id,
        complaint_text=state.complaint_text,
        classification=state.classification,
        risk_assessment=state.risk_assessment,
        draft_attempts=state.draft_attempts,
        guardrail_results=state.guardrail_results,
        human_decision=state.human_decision,
        final_reply=state.final_reply,
    )
    init_audit_table()
    save_audit_entry(entry.model_dump(mode="json"), source_id=review_id)
    was_escalated = (
        state.risk_assessment.requires_escalation
        if state.risk_assessment
        else False
    )
    category = state.classification.category if state.classification else "unknown"
    update_customer_history(state.customer_id, category, was_escalated)
    update_pending_review(review_id, state.model_dump(mode="json"))
    mark_review_resolved(review_id)
    return entry.model_dump(mode="json")