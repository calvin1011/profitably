'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface ShoppingItem {
  id: string
  item_name: string
  last_purchase_price: number | null
  last_purchase_location: string | null
  target_quantity: number
}

interface MarkPurchasedModalProps {
  isOpen: boolean
  onClose: () => void
  shoppingItem: ShoppingItem
}

export default function MarkPurchasedModal({ isOpen, onClose, shoppingItem }: MarkPurchasedModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [actualPrice, setActualPrice] = useState(shoppingItem.last_purchase_price?.toString() || '')
  const [actualLocation, setActualLocation] = useState(shoppingItem.last_purchase_location || '')
  const [quantity, setQuantity] = useState(shoppingItem.target_quantity.toString())
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/shopping-list/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopping_list_id: shoppingItem.id,
          actual_price: parseFloat(actualPrice),
          actual_location: actualLocation,
          quantity: parseInt(quantity),
          purchase_date: purchaseDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark as purchased')
      }

      // Success - close modal and refresh
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as purchased')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-dark rounded-2xl shadow-glass-lg animate-slide-up">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text">Mark as Purchased</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700
                       hover:bg-slate-700 transition-smooth flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Item Info */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-6">
            <h3 className="font-semibold text-slate-100 mb-2">{shoppingItem.item_name}</h3>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Target Quantity:</span>
              <span className="text-slate-100">{shoppingItem.target_quantity} units</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Actual Price */}
            <div>
              <label htmlFor="actualPrice" className="block text-sm font-medium text-slate-300 mb-2">
                Actual Price <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  id="actualPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={actualPrice}
                  onChange={(e) => setActualPrice(e.target.value)}
                  required
                  className="w-full pl-8 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                  placeholder="45.00"
                />
              </div>
              {shoppingItem.last_purchase_price && (
                <p className="mt-1 text-xs text-slate-500">
                  Last paid: {formatCurrency(shoppingItem.last_purchase_price)}
                </p>
              )}
            </div>

            {/* Actual Location */}
            <div>
              <label htmlFor="actualLocation" className="block text-sm font-medium text-slate-300 mb-2">
                Store/Location <span className="text-red-400">*</span>
              </label>
              <input
                id="actualLocation"
                type="text"
                value={actualLocation}
                onChange={(e) => setActualLocation(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                         text-slate-100 placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                         transition-smooth"
                placeholder="Target, Marshalls, etc."
              />
            </div>

            {/* Quantity and Date */}
            <div className="grid grid-cols-2 gap-4">
              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-slate-300 mb-2">
                  Quantity <span className="text-red-400">*</span>
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                />
              </div>

              {/* Purchase Date */}
              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-slate-300 mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Info box */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-blue-400">
                This will add {quantity} unit(s) to your inventory and remove this item from your shopping list.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl font-medium
                         bg-slate-800 text-slate-100 border border-slate-700
                         hover:bg-slate-700 hover:border-slate-600
                         transition-smooth"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl font-semibold
                         bg-gradient-profit text-white
                         shadow-lg shadow-profit-500/50
                         hover:shadow-glow-profit-lg hover:scale-[1.02]
                         active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-smooth"
              >
                {loading ? 'Processing...' : 'Mark as Purchased'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}