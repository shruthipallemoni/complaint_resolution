import type { PendingReviewRecord, ReviewState } from '../../src/types';

// In-memory persistent store
let reviews: Map<string, PendingReviewRecord> = new Map();

export function init_db(): void {
  // Initialize reviews table structure without seed data
  init_reviews_table();
}

export function get_connection() {
  return {
    execute: (query: string, params: any[] = []) => {
      // Provide query emulation for SELECT
      return {
        fetchall: () => {
          const rows: any[] = [];
          for (const r of reviews.values()) {
            if (r.status === 'pending') {
              rows.push({
                review_id: r.review_id,
                customer_id: r.customer_id,
                status: r.status,
                state_json: JSON.stringify(r.state),
                created_at: r.created_at,
              });
            }
          }
          return rows;
        }
      };
    },
    close: () => {}
  };
}

export function init_reviews_table(): void {
  // Clears reviews table, ready for incoming live data
  reviews.clear();
}

export function load_pending_review(review_id: string): PendingReviewRecord | null {
  const rec = reviews.get(review_id);
  if (!rec) return null;
  return rec;
}

export function save_pending_review(
  review_id: string,
  customer_id: string,
  state: ReviewState
): PendingReviewRecord {
  const record: PendingReviewRecord = {
    review_id,
    customer_id,
    status: 'pending',
    state,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  reviews.set(review_id, record);
  return record;
}

export function update_review_status(
  review_id: string,
  status: 'pending' | 'resolved' | 'rejected',
  updatedDraft?: string
): PendingReviewRecord | null {
  const rec = reviews.get(review_id);
  if (!rec) return null;
  rec.status = status;
  rec.updated_at = new Date().toISOString();
  if (updatedDraft !== undefined) {
    rec.state.current_draft = updatedDraft;
  }
  reviews.set(review_id, rec);
  return rec;
}

export function getAllReviews(): PendingReviewRecord[] {
  return Array.from(reviews.values());
}
