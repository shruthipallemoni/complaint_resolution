from ..models import CustomerHistory
from .db import get_connection


def get_customer_history(customer_id: str) -> CustomerHistory:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM customer_history WHERE customer_id = ?", (customer_id,)
    ).fetchone()
    conn.close()

    if row is None:
        return CustomerHistory(customer_id=customer_id)

    categories = row["complaint_categories"].split(",") if row["complaint_categories"] else []
    return CustomerHistory(
        customer_id=row["customer_id"],
        previous_complaint_count=row["previous_complaint_count"],
        complaint_categories=categories,
        auto_resolved_count=row["auto_resolved_count"],
        escalated_count=row["escalated_count"],
        recurring_issue=bool(row["recurring_issue"]),
    )


def update_customer_history(customer_id: str, category: str, was_escalated: bool):
    history = get_customer_history(customer_id)

    new_count = history.previous_complaint_count + 1
    new_categories = history.complaint_categories + [category]
    new_recurring = new_categories.count(category) >= 2

    conn = get_connection()
    conn.execute("""
        INSERT INTO customer_history
            (customer_id, previous_complaint_count, complaint_categories,
             auto_resolved_count, escalated_count, recurring_issue)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(customer_id) DO UPDATE SET
            previous_complaint_count = excluded.previous_complaint_count,
            complaint_categories = excluded.complaint_categories,
            auto_resolved_count = excluded.auto_resolved_count,
            escalated_count = excluded.escalated_count,
            recurring_issue = excluded.recurring_issue
    """, (
        customer_id,
        new_count,
        ",".join(new_categories),
        history.auto_resolved_count + (0 if was_escalated else 1),
        history.escalated_count + (1 if was_escalated else 0),
        new_recurring,
    ))
    conn.commit()
    conn.close()