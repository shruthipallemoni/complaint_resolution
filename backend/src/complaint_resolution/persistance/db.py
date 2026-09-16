import os

import psycopg
from psycopg.rows import dict_row

def get_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL must be set to a PostgreSQL connection string")
    return psycopg.connect(database_url, row_factory=dict_row)


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS customer_history (
            customer_id TEXT PRIMARY KEY,
            previous_complaint_count INTEGER DEFAULT 0,
            complaint_categories TEXT DEFAULT '',
            auto_resolved_count INTEGER DEFAULT 0,
            escalated_count INTEGER DEFAULT 0,
            recurring_issue BOOLEAN DEFAULT FALSE
        )
    """)
    conn.commit()
    conn.close()