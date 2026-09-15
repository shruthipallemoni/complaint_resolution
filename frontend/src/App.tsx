import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PendingReviewsQueue } from './components/PendingReviewsQueue';
import { ReviewDecisionView } from './components/ReviewDecisionView';
import { SubmitComplaintView } from './components/SubmitComplaintView';
import { ResolvedComplaintsView } from './components/ResolvedComplaintsView';
import type { PendingReviewRecord } from './types';
import { apiFetch } from './api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'queue' | 'submit' | 'detail' | 'resolved'>('queue');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<PendingReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resolvedRefreshToken, setResolvedRefreshToken] = useState(0);

  // Fetch pending reviews from GET /reviews/pending
  const fetchPendingReviews = async () => {
    try {
      const res = await apiFetch('/reviews/pending');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const handleSelectReview = (reviewId: string) => {
    setActiveReviewId(reviewId);
    setCurrentTab('detail');
  };

  const handleBackToQueue = () => {
    setActiveReviewId(null);
    setCurrentTab('queue');
    fetchPendingReviews();
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await apiFetch('/api/reset-demo', { method: 'POST' });
      await fetchPendingReviews();
      if (currentTab === 'detail') {
        setCurrentTab('queue');
        setActiveReviewId(null);
      }
    } catch (err) {
      console.error('Failed to reset demo:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b111a] text-slate-100 flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'queue') {
            setActiveReviewId(null);
            fetchPendingReviews();
          }
          if (tab === 'resolved') setResolvedRefreshToken((value) => value + 1);
        }}
        pendingCount={reviews.length}
        activeReviewId={activeReviewId}
        onBackToQueue={handleBackToQueue}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      <main className="flex-1 pb-16">
        {currentTab === 'queue' && (
          <PendingReviewsQueue
            reviews={reviews}
            isLoading={isLoading}
            onSelectReview={handleSelectReview}
            onNavigateSubmit={() => setCurrentTab('submit')}
          />
        )}

        {currentTab === 'detail' && activeReviewId && (
          <ReviewDecisionView
            reviewId={activeReviewId}
            onBackToQueue={handleBackToQueue}
            onDecisionCompleted={() => {
              fetchPendingReviews();
            }}
          />
        )}

        {currentTab === 'submit' && (
          <SubmitComplaintView
            onReviewCreated={(reviewId) => {
              setActiveReviewId(reviewId);
              setCurrentTab('detail');
              fetchPendingReviews();
            }}
            onRefreshPending={fetchPendingReviews}
          />
        )}

        {currentTab === 'resolved' && <ResolvedComplaintsView refreshToken={resolvedRefreshToken} />}
      </main>
    </div>
  );
}
