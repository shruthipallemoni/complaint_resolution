import time
from crewai import Crew, Process

from complaint_resolution.crew import ComplaintResolution
from complaint_resolution.models import CustomerHistory
from complaint_resolution.services.risk_scoring import calculate_risk_score

EVAL_CASES = [
    {
        "complaint": "My package never arrived and it's been two weeks.",
        "expected_category": "shipping",
        "expected_escalation": False,
    },
    {
        "complaint": "You charged me $200 twice and I want a full refund immediately or I'm calling my bank.",
        "expected_category": "billing",
        "expected_escalation": True,
    },
    {
        "complaint": "The blender I ordered arrived with a cracked jug.",
        "expected_category": "product_defect",
        "expected_escalation": False,
    },
    {
        "complaint": "This is the third defective unit I've received of the same product. I'm done.",
        "expected_category": "product_defect",
        "expected_escalation": True,
    },
    {
        "complaint": "My order shipped a day late, no big deal, just wanted to flag it.",
        "expected_category": "shipping",
        "expected_escalation": False,
    },
    {
        "complaint": "I was billed $15 more than the listed price, please correct it.",
        "expected_category": "billing",
        "expected_escalation": False,
    },
    {
        "complaint": "I will be filing a complaint with my bank and considering legal action over this billing error.",
        "expected_category": "billing",
        "expected_escalation": True,
    },
    {
        "complaint": "Delivery was fine but the packaging was a bit crushed, item is okay though.",
        "expected_category": "shipping",
        "expected_escalation": False,
    },
    {
        "complaint": "I'm extremely frustrated, this is the second time my subscription auto-renewed after I cancelled it.",
        "expected_category": "billing",
        "expected_escalation": True,
    },
    {
        "complaint": "The shirt I ordered was the wrong size, could I get an exchange?",
        "expected_category": "product_defect",
        "expected_escalation": False,
    },
]


def classify_only(complaint_text: str):
    """Runs just the classification step — cheap and fast for eval purposes,
    since drafting/guardrail/HITL aren't what we're measuring here."""
    base = ComplaintResolution()
    crew = Crew(
        agents=[base.classifier_agent()],
        tasks=[base.classification_task()],
        process=Process.sequential,
    )
    start_time = time.time()
    result = crew.kickoff(inputs={"complaint_text": complaint_text})
    latency = time.time() - start_time
    return result.pydantic, latency


def run_evaluation():
    total = len(EVAL_CASES)
    category_correct = 0
    escalation_correct = 0
    invalid_outputs = 0
    latencies = []

    print(f"Running evaluation on {total} fixed test cases...\n")

    for i, case in enumerate(EVAL_CASES, start=1):
        try:
            classification, latency = classify_only(case["complaint"])
            latencies.append(latency)
        except Exception as e:
            print(f"[{i}] FAILED to classify: {e}")
            invalid_outputs += 1
            continue

        if classification is None:
            print(f"[{i}] Invalid output — did not match ComplaintClassification schema")
            invalid_outputs += 1
            continue

        # Fresh, no-history customer for a clean, comparable escalation check.
        history = CustomerHistory(customer_id="eval-customer")
        risk = calculate_risk_score(classification, history)

        category_match = classification.category == case["expected_category"]
        escalation_match = risk.requires_escalation == case["expected_escalation"]

        category_correct += category_match
        escalation_correct += escalation_match

        status_cat = "✓" if category_match else "✗"
        status_esc = "✓" if escalation_match else "✗"
        print(f"[{i}] {status_cat} category={classification.category} (expected {case['expected_category']}) | "
              f"{status_esc} escalation={risk.requires_escalation} (expected {case['expected_escalation']}) | "
              f"{latency:.2f}s")

    print("\n--- EVALUATION SUMMARY ---")
    print(f"Total cases: {total}")
    print(f"Classification accuracy: {category_correct}/{total} ({100 * category_correct / total:.1f}%)")
    print(f"Escalation accuracy: {escalation_correct}/{total} ({100 * escalation_correct / total:.1f}%)")
    print(f"Invalid outputs: {invalid_outputs}/{total}")
    if latencies:
        print(f"Average classification latency: {sum(latencies) / len(latencies):.2f}s")


if __name__ == "__main__":
    run_evaluation()