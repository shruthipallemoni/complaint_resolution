from ..models import AuditLogEntry


def build_audit_log(customer_id, complaint_text, classification, risk_assessment,
                     draft_attempts, guardrail_results, human_decision, final_reply):
    return AuditLogEntry(
        customer_id=customer_id,
        complaint_text=complaint_text,
        classification=classification,
        risk_assessment=risk_assessment,
        draft_attempts=draft_attempts,
        guardrail_results=guardrail_results,
        human_decision=human_decision,
        final_reply=final_reply,
    )