import {
  init_reviews_table,
  load_pending_review,
  save_pending_review,
  update_review_status,
  getAllReviews,
} from './db';
import type { PendingReviewRecord, ReviewState } from '../../src/types';

export {
  init_reviews_table,
  load_pending_review,
  save_pending_review,
  update_review_status,
};

export function listPendingReviews(): PendingReviewRecord[] {
  return getAllReviews().filter((r) => r.status === 'pending');
}
