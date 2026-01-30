'use client'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  totalReviews?: number
  interactive?: boolean
  onChange?: (rating: number) => void
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showNumber = false,
  totalReviews,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1
          const isFilled = starValue <= rating
          const isHalfFilled = !isFilled && starValue - 0.5 <= rating

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(starValue)}
              disabled={!interactive}
              className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} 
                         transition-transform disabled:cursor-default`}
            >
              <svg
                className={`${sizeClasses[size]} ${
                  isFilled || isHalfFilled ? 'text-yellow-400' : 'text-slate-600'
                }`}
                fill={isFilled ? 'currentColor' : isHalfFilled ? 'url(#half)' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isHalfFilled && (
                  <defs>
                    <linearGradient id="half">
                      <stop offset="50%" stopColor="currentColor" />
                      <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                )}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          )
        })}
      </div>

      {showNumber && (
        <span className={`${textSizes[size]} text-slate-400 ml-1`}>
          {rating.toFixed(1)}
          {totalReviews !== undefined && (
            <span className="text-slate-500"> ({totalReviews})</span>
          )}
        </span>
      )}
    </div>
  )
}
