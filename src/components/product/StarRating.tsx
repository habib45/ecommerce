interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const SIZES = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

export function StarRating({ rating, size = 'md', interactive = false, onRate }: StarRatingProps) {
  const sizeClass = SIZES[size];

  return (
    <div className={`flex gap-0.5 ${interactive ? 'cursor-pointer' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(star)}
            className={`${interactive ? 'hover:scale-110 transition-transform' : ''} disabled:cursor-default`}
          >
            <svg
              className={`${sizeClass} ${filled ? 'text-amber-400' : 'text-gray-300'}`}
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
