#!/usr/bin/env python
import sys
import warnings

from .flow import ComplaintFlow

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

from .services.resilience import CrewExecutionError

def run():
    inputs = {
        "customer_id": "CUST-004",
        "complaint_text": (
        "The product I received is completely different from what I ordered. "
        "I ordered a black wireless headset, but I received a blue keyboard instead. "
         "Please arrange a replacement or refund as soon as possible."
       ),
    }
    flow = ComplaintFlow()
    try:
        result = flow.kickoff(inputs=inputs)
        print("\n--- FINAL RESULT ---")
        print(result)
    except CrewExecutionError as e:
        print(f"\n❌ Complaint processing failed after retries: {e}")
        print("This complaint should be flagged for manual handling.")

def plot():
    """
    Generate a visual diagram of the flow — useful for your README and
    for explaining the architecture in an interview.
    """
    flow = ComplaintFlow()
    flow.plot()


if __name__ == "__main__":
    run()