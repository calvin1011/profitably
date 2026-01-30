'use client'

import { useState, useEffect } from 'react'

interface WishlistButtonProps {
  productId: string
  customerId: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function WishlistButton({ 
  productId, 
  customerId, 
  className = '',
  size = 'md' 
}: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  useEffect(() => {
    if (!customerId) return

    const checkWishlist = async () => {
      try {
        const res = await fetch(`/api/wishlist?customerId=${customerId}&productId=${productId}`)
        const data = await res.json()
        setIsInWishlist(data.inWishlist)
      } catch (error) {
        console.error('Error checking wishlist:', error)
      }
    }

    checkWishlist()
  }, [customerId, productId])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!customerId) {
      // Could show a login prompt here
      alert('Please sign in to add items to your wishlist')
      return
    }

    setIsLoading(true)

    try {
      if (isInWishlist) {
        await fetch(`/api/wishlist?customerId=${customerId}&productId=${productId}`, {
          method: 'DELETE',
        })
        setIsInWishlist(false)
      } else {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, productId }),
        })
        setIsInWishlist(true)
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center
                 transition-all duration-200 ${className}
                 ${isInWishlist 
                   ? 'bg-red-500 text-white hover:bg-red-600' 
                   : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                 }
                 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        className={iconSizes[size]}
        fill={isInWishlist ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  )
}
