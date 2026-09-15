import json
import uuid
from datetime import datetime
from .db import get_connection


def init_reviews_table():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS pending_reviews (
            review_id TEXT PRIMARY KEY,
            state_json TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def save_pending_review(state_dict: dict) -> str:
    review_id = str(uuid.uuid4())
    conn = get_connection()
    conn.execute(
        "INSERT INTO pending_reviews (review_id, state_json, status, created_at) VALUES (?, ?, ?, ?)",
        (review_id, json.dumps(state_dict), "pending", datetime.now().isoformat()),
    )
    conn.commit()
    conn.close()
    return review_id


def load_pending_review(review_id: str) -> dict | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT state_json, status FROM pending_reviews WHERE review_id = ?", (review_id,)
    ).fetchone()
    conn.close()
    if row is None:
        return None
    return {"state": json.loads(row["state_json"]), "status": row["status"]}


def mark_review_resolved(review_id: str):
    conn = get_connection()
    conn.execute("UPDATE pending_reviews SET status = 'resolved' WHERE review_id = ?", (review_id,))
    conn.commit()
    conn.close()

def update_pending_review(review_id: str, state_dict: dict):
    conn = get_connection()
    conn.execute(
        "UPDATE pending_reviews SET state_json = ? WHERE review_id = ?",
        (json.dumps(state_dict), review_id),
    )
    conn.commit()
    conn.close()