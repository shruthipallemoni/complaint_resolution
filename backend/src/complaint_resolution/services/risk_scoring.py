from ..models import ComplaintClassification, CustomerHistory, RiskAssessment


def calculate_risk_score(classification: ComplaintClassification, history: CustomerHistory) -> RiskAssessment:
    score = 0
    reasons = []
    high_risk_factors = []

    if classification.financial_impact:
        if classification.financial_impact > 50:
            score += 40
            high_risk_factors.append("high_financial_impact")
            reasons.append(f"Financial impact (${classification.financial_impact}) exceeds $50 auto-resolution limit")
        elif classification.financial_impact > 0:
            score += 15
            reasons.append(f"Financial impact (${classification.financial_impact}) within auto-resolution range")

    if history.recurring_issue or history.previous_complaint_count >= 2:
        score += 30
        high_risk_factors.append("recurring_issue")
        reasons.append(f"Recurring issue: {history.previous_complaint_count} prior complaints")

    if classification.emotional_signal in ("angry", "threatening_to_leave"):
        score += 30
        high_risk_factors.append("emotional_escalation")
        reasons.append(f"Emotional signal detected: {classification.emotional_signal}")
    elif classification.emotional_signal == "frustrated":
        score += 10
        reasons.append("Customer shows frustration")

    # Escalate if score >= 50 OR if there are high-risk factors present
    requires_escalation = score >= 50 or len(high_risk_factors) > 0

    return RiskAssessment(
        risk_score=min(score, 100),
        requires_escalation=requires_escalation,
        reasoning="; ".join(reasons) if reasons else "No risk factors detected"
    )