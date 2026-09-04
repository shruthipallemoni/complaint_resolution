import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent.parent / "complaints.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS customer_history (
            customer_id TEXT PRIMARY KEY,
            previous_complaint_count INTEGER DEFAULT 0,
            complaint_categories TEXT DEFAULT '',
            auto_resolved_count INTEGER DEFAULT 0,
            escalated_count INTEGER DEFAULT 0,
            recurring_issue INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()