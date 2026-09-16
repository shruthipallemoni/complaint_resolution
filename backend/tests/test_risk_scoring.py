from complaint_resolution.models import ComplaintClassification, CustomerHistory
from complaint_resolution.services.risk_scoring import calculate_risk_score

def make_classification(financial_impact=None, emotional_signal="neutral"):
    return ComplaintClassification(
        category="billing",
        financial_impact=financial_impact,
        emotional_signal=emotional_signal,
        summary="test complaint",
    )

def make_history(previous_complaint_count=0, recurring_issue=False):
    return CustomerHistory(
        customer_id="test-customer",
        previous_complaint_count=previous_complaint_count,
        recurring_issue=recurring_issue,
    )

def test_low_impact_neutral_does_not_escalate():
    classification = make_classification(financial_impact=10.0, emotional_signal="neutral")
    history = make_history()
    result = calculate_risk_score(classification, history)
    assert result.requires_escalation is False


def test_recurring_issue_escalates_even_with_low_amount():
    classification = make_classification(financial_impact=10.0)
    history = make_history(recurring_issue=True, previous_complaint_count=3)
    result = calculate_risk_score(classification, history)
    assert result.requires_escalation is True


def test_threatening_to_leave_escalates():
    classification = make_classification(financial_impact=0, emotional_signal="threatening_to_leave")
    history = make_history()
    result = calculate_risk_score(classification, history)
    assert result.requires_escalation is True


def test_risk_score_never_exceeds_100():
    classification = make_classification(financial_impact=500.0, emotional_signal="threatening_to_leave")
    history = make_history(recurring_issue=True, previous_complaint_count=5)
    result = calculate_risk_score(classification, history)
    assert result.risk_score <= 100


def test_high_financial_impact_escalates():
    classification = make_classification(financial_impact=100.0)
    history = make_history()
    result = calculate_risk_score(classification, history)
    assert result.requires_escalation is True
    assert result.risk_score == 40  # single high-risk factor, score doesn't need to hit 50


def test_moderate_amount_alone_does_not_escalate():
    # $30 is within the auto-resolution range (no high-risk factor triggered),
    # and 15 points alone is below the 50-point combined threshold
    classification = make_classification(financial_impact=30.0)
    history = make_history()
    result = calculate_risk_score(classification, history)
    assert result.requires_escalation is False
    assert result.risk_score == 15