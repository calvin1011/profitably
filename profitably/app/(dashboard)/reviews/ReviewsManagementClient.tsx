'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Review {
  id: string
  rating: number
  title: string | null
  content: string
  is_verified_purchase: boolean
  is_approved: boolean
  created_at: string
  customers: {
    id: string
    full_name: string
    email: string
  }
  products: {
    id: string
    title: string
    slug: string
    user_id: string
  }
  review_replies: {
    id: string
    content: string
    created_at: string
  }[]
}

export default function ReviewsManagementClient() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews/reply')
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReview || !replyContent.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          content: replyContent,
        }),
      })

      if (res.ok) {
        fetchReviews()
        setSelectedReview(null)
        setReplyContent('')
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleApproval = async (reviewId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/reviews/reply', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          isApproved: !currentStatus,
        }),
      })

      if (res.ok) {
        fetchReviews()
      }
    } catch (error) {
      console.error('Error toggling approval:', error)
    }
  }

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'pending') return review.review_replies.length === 0
    if (filter === 'replied') return review.review_replies.length > 0
    return true
  })

  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => r.review_replies.length === 0).length,
    averageRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-slate-600'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-700 rounded w-1/3"></div>
            <div className="h-6 bg-slate-700 rounded w-1/2"></div>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="h-24 bg-slate-700 rounded"></div>
              <div className="h-24 bg-slate-700 rounded"></div>
              <div className="h-24 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Reviews</span>
          </h1>
          <p className="text-slate-400">Manage customer reviews and respond to feedback</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-dark rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-1">Total Reviews</p>
            <p className="text-3xl font-bold text-slate-100">{stats.total}</p>
          </div>
          <div className="glass-dark rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-1">Awaiting Reply</p>
            <p className="text-3xl font-bold text-amber-400">{stats.pending}</p>
          </div>
          <div className="glass-dark rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-1">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-profit-400">{stats.averageRating}</p>
              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'replied'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                filter === f
                  ? 'bg-profit-500/20 text-profit-400 border border-profit-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && stats.pending > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="glass-dark rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">
              {filter === 'all' ? 'No reviews yet' : `No ${filter} reviews`}
            </h3>
            <p className="text-slate-400">
              {filter === 'all'
                ? 'Customer reviews will appear here once they start coming in'
                : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="glass-dark rounded-xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    {/* Review header */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      {renderStars(review.rating)}
                      <span className="text-slate-400 text-sm">
                        {formatDate(review.created_at)}
                      </span>
                      {review.is_verified_purchase && (
                        <span className="px-2 py-0.5 text-xs bg-profit-500/20 text-profit-400 rounded-full">
                          Verified Purchase
                        </span>
                      )}
                      {!review.is_approved && (
                        <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                          Hidden
                        </span>
                      )}
                    </div>

                    {/* Customer and Product */}
                    <div className="flex flex-wrap gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Customer: </span>
                        <span className="text-slate-300">{review.customers?.full_name || 'Anonymous'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Product: </span>
                        <span className="text-profit-400">{review.products?.title}</span>
                      </div>
                    </div>

                    {/* Review content */}
                    {review.title && (
                      <h4 className="font-semibold text-slate-100 mb-1">{review.title}</h4>
                    )}
                    <p className="text-slate-300">{review.content}</p>

                    {/* Existing reply */}
                    {review.review_replies.length > 0 && (
                      <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border-l-2 border-profit-500">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-profit-400">Your Response</span>
                          <span className="text-xs text-slate-500">
                            {formatDate(review.review_replies[0].created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">{review.review_replies[0].content}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row lg:flex-col gap-2">
                    {review.review_replies.length === 0 ? (
                      <button
                        onClick={() => {
                          setSelectedReview(review)
                          setReplyContent('')
                        }}
                        className="px-4 py-2 bg-profit-500/20 text-profit-400 text-sm font-medium rounded-lg
                                 hover:bg-profit-500/30 transition-smooth"
                      >
                        Reply
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedReview(review)
                          setReplyContent(review.review_replies[0].content)
                        }}
                        className="px-4 py-2 bg-slate-700 text-slate-300 text-sm font-medium rounded-lg
                                 hover:bg-slate-600 transition-smooth"
                      >
                        Edit Reply
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleApproval(review.id, review.is_approved)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-smooth ${
                        review.is_approved
                          ? 'bg-slate-700 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
                          : 'bg-profit-500/20 text-profit-400 hover:bg-profit-500/30'
                      }`}
                    >
                      {review.is_approved ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Modal */}
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedReview(null)}
            />
            <div className="relative w-full max-w-lg glass-dark rounded-2xl p-6">
              <h3 className="text-xl font-bold text-slate-100 mb-4">
                {selectedReview.review_replies.length > 0 ? 'Edit Your Reply' : 'Reply to Review'}
              </h3>

              <div className="mb-4 p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-sm text-slate-400">
                    by {selectedReview.customers?.full_name || 'Anonymous'}
                  </span>
                </div>
                <p className="text-sm text-slate-300 line-clamp-3">{selectedReview.content}</p>
              </div>

              <form onSubmit={handleReply}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your response..."
                  rows={4}
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500 resize-none
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !replyContent.trim()}
                    className="flex-1 px-4 py-2.5 bg-gradient-profit text-white font-medium rounded-xl
                             hover:shadow-glow-profit-lg transition-smooth
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Reply'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedReview(null)}
                    className="px-4 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-xl
                             hover:bg-slate-600 transition-smooth"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
