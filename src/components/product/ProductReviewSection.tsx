import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useProductReviews, useProductRatingSummary, useUserReview, useSubmitReview } from '@/hooks/useProductReviews';
import { StarRating } from './StarRating';
import toast from 'react-hot-toast';

const REVIEWS_PER_PAGE = 5;

interface Props {
  productId: string;
}

export function ProductReviewSection({ productId }: Props) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const { data: summary } = useProductRatingSummary(productId);
  const { data: userReview } = useUserReview(productId, user?.id);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * REVIEWS_PER_PAGE;
    return reviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [reviews, currentPage]);

  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * REVIEWS_PER_PAGE, reviews.length);

  return (
    <section className="mt-16 border-t pt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        {t('review.title', 'Customer Reviews')}
      </h2>

      {/* Top section: Rating Summary (left) + Submit Form (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <RatingSummary summary={summary} />

        {user ? (
          <ReviewForm productId={productId} existingReview={userReview} />
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center">
            <p className="text-gray-600">
              {t('review.loginToReview', 'Please log in to write a review.')}
            </p>
          </div>
        )}
      </div>

      {/* Review List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-2 p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {t('review.noReviews', 'No reviews yet. Be the first to review this product!')}
        </p>
      ) : (
        <>
          <div className="space-y-0 divide-y divide-gray-200">
            {paginatedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} isOwn={review.user_id === user?.id} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                {t('review.showing', 'Showing')} <span className="font-semibold text-gray-900">{startIndex} - {endIndex}</span> {t('review.of', 'of')} <span className="font-semibold text-gray-900">{reviews.length}</span> {t('review.reviews', 'Reviews')}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                &larr; {t('common.prev', 'Prev')}
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      currentPage === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                {t('common.next', 'Next')} &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function RatingSummary({ summary }: { summary: ReturnType<typeof useProductRatingSummary>['data'] }) {
  const { t } = useTranslation();

  const avgRating = summary?.avg_rating ?? 0;
  const reviewCount = summary?.review_count ?? 0;

  const bars = [
    { stars: 5, count: summary?.five_star ?? 0 },
    { stars: 4, count: summary?.four_star ?? 0 },
    { stars: 3, count: summary?.three_star ?? 0 },
    { stars: 2, count: summary?.two_star ?? 0 },
    { stars: 1, count: summary?.one_star ?? 0 },
  ];

  // Calculate recommended % (4+ stars)
  const recommendedCount = (summary?.five_star ?? 0) + (summary?.four_star ?? 0);
  const totalWithOpinion = reviewCount;
  const recommendedPct = totalWithOpinion > 0 ? Math.round((recommendedCount / totalWithOpinion) * 100) : 0;

  return (
    <div>
      {/* Average Rating */}
      <div className="flex items-start gap-6 mb-6">
        <div>
          <p className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-1">{t('review.averageRating', 'Average Rating')}</p>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={avgRating} size="sm" />
            <span className="text-xs text-gray-400">
              ({reviewCount} {t('review.reviewsAndRatings', 'Reviews & 0 Ratings')})
            </span>
          </div>
        </div>
      </div>

      {/* Recommended */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{recommendedPct}%</span>
          <span className="text-sm text-gray-500">
            {t('review.recommended', 'Recommended')}
            <span className="text-gray-400 ml-1">({recommendedCount} {t('review.ofCount', 'of')} {totalWithOpinion})</span>
          </span>
        </div>
      </div>

      {/* Rating Bars */}
      <div className="space-y-2">
        {bars.map((bar) => {
          const pct = reviewCount > 0 ? Math.round((bar.count / reviewCount) * 100) : 0;
          return (
            <div key={bar.stars} className="flex items-center gap-2">
              <div className="flex gap-0.5 w-24">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= bar.stars ? 'text-amber-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ))}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-amber-400 h-2.5 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-10 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewForm({
  productId,
  existingReview,
}: {
  productId: string;
  existingReview: ReturnType<typeof useUserReview>['data'];
}) {
  const { t } = useTranslation();
  const submitReview = useSubmitReview();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [body, setBody] = useState(existingReview?.body ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error(t('review.ratingRequired', 'Please select a rating'));
      return;
    }

    try {
      await submitReview.mutateAsync({ product_id: productId, rating, title: '', body });
      toast.success(
        existingReview
          ? t('review.updated', 'Review updated successfully!')
          : t('review.submitted', 'Review submitted! It will be visible after admin approval.')
      );
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-5">
        {existingReview
          ? t('review.editReview', 'Edit Your Review')
          : t('review.submitYourReview', 'Submit Your Review')}
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Rating */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('review.yourRatingOfProduct', 'Your Rating Of This Product')} :
          </label>
          <StarRating rating={rating} size="lg" interactive onRate={setRating} />
        </div>

        {/* Body */}
        <div className="mb-5">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('review.writePlaceholder', 'Write Your Review Here...')}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-700"
            maxLength={2000}
          />
        </div>

        <button
          type="submit"
          disabled={submitReview.isPending || rating === 0}
          className="px-8 py-3 bg-sky-500 text-white rounded font-semibold uppercase tracking-wide hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitReview.isPending
            ? t('common.loading')
            : existingReview
              ? t('review.updateReview', 'Update Review')
              : t('review.submitReview', 'Submit Review')}
        </button>

        {!existingReview && (
          <p className="text-xs text-gray-500 mt-3">
            {t('review.approvalNote', 'Your review will be visible to others after admin approval.')}
          </p>
        )}
      </form>
    </div>
  );
}

function ReviewCard({ review, isOwn }: { review: import('@/types/domain').ProductReview; isOwn: boolean }) {
  const { t } = useTranslation();
  const initial = (review.user_name ?? 'A').charAt(0).toUpperCase();

  return (
    <div className={`py-6 ${isOwn ? 'bg-blue-50/30 -mx-4 px-4 rounded-lg' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-white font-semibold text-sm">{initial}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Stars */}
          <StarRating rating={review.rating} size="sm" />

          {/* Name, date, verified badge */}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">
              by <span className="font-medium text-gray-700">{review.user_name ?? 'Anonymous'}</span> on{' '}
              {new Date(review.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
              })}
            </span>
            {review.is_approved && (
              <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {t('review.verifiedPurchase', 'Verified Purchase')}
              </span>
            )}
            {isOwn && !review.is_approved && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                {t('review.pendingApproval', 'Pending approval')}
              </span>
            )}
          </div>

          {/* Title */}
          {review.title && (
            <h4 className="font-semibold text-gray-900 mt-2">{review.title}</h4>
          )}

          {/* Body */}
          {review.body && (
            <p className="mt-2 text-gray-600 leading-relaxed">{review.body}</p>
          )}

          {/* Helpful */}
          <div className="mt-4">
            <span className="text-sm text-gray-500">{t('review.wasHelpful', 'Was this review helpful?')}</span>
            <div className="flex items-center gap-4 mt-1">
              <button className="flex items-center gap-1 text-gray-400 hover:text-green-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                </svg>
                <span className="text-sm">0</span>
              </button>
              <button className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
                </svg>
                <span className="text-sm">0</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
