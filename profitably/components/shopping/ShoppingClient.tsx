'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import MarkPurchasedModal from './MarkPurchasedModal'

interface Item {
  id: string
  name: string
  category: string | null
  quantity_on_hand: number
  purchase_price: number
  purchase_location: string
}

interface ShoppingListItem {
  id: string
  item_id: string | null
  item_name: string
  last_purchase_price: number | null
  last_purchase_location: string | null
  priority: 'high' | 'medium' | 'low'
  reason: string
  target_quantity: number
  max_price: number | null
  notes: string | null
  created_at: string
  items: Item | null
}

interface RestockAlert {
  item_id: string
  item_name: string
  quantity_on_hand: number
  last_purchase_price: number
  last_purchase_location: string
  category: string | null
  priority: 'high' | 'medium' | 'low'
  reason: string
  times_sold: number
  avg_profit: number
  last_sale_date: string | null
  days_since_last_sale: number
}

interface ShoppingClientProps {
  initialShoppingList: ShoppingListItem[]
  restockAlerts: RestockAlert[]
}

export default function ShoppingClient({ initialShoppingList, restockAlerts }: ShoppingClientProps) {
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<ShoppingListItem | null>(null)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [addingAlertId, setAddingAlertId] = useState<string | null>(null)

  // Separate shopping list by manual vs auto-added
  const manualItems = initialShoppingList.filter(item => item.reason === 'manual')
  const autoItems = initialShoppingList.filter(item => item.reason !== 'manual')

  // Filter out alerts that are already in shopping list
  const availableAlerts = restockAlerts.filter(
    alert => !initialShoppingList.some(item => item.item_id === alert.item_id)
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'medium':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
    }
  }

  const handleAddToList = async (alert: RestockAlert) => {
    setAddingAlertId(alert.item_id)
    try {
      const response = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: alert.item_id,
          item_name: alert.item_name,
          last_purchase_price: alert.last_purchase_price,
          last_purchase_location: alert.last_purchase_location,
          priority: alert.priority,
          reason: alert.reason,
          target_quantity: Math.max(1, Math.ceil(alert.times_sold / 30)),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add to shopping list')
      }

      router.refresh()
    } catch (error) {
      console.error('Error adding to list:', error)
    } finally {
      setAddingAlertId(null)
    }
  }

  const handleRemoveFromList = async (itemId: string) => {
    if (!confirm('Remove this item from your shopping list?')) return

    setRemovingId(itemId)
    try {
      const response = await fetch(`/api/shopping-list?id=${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove item')
      }

      router.refresh()
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item from shopping list')
    } finally {
      setRemovingId(null)
    }
  }

  const handleMarkPurchased = (item: ShoppingListItem) => {
    setSelectedItem(item)
    setIsPurchaseModalOpen(true)
  }

  const renderShoppingListItem = (item: ShoppingListItem) => (
    <div
      key={item.id}
      className="glass-dark rounded-xl p-6 hover:shadow-glass-lg transition-smooth"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-100 mb-2">{item.item_name}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border ${getPriorityColor(item.priority)}`}>
              {getPriorityIcon(item.priority)}
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
            </span>
            {item.items?.category && (
              <span className="inline-block px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-400">
                {item.items.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Purchase History */}
      {item.last_purchase_location && (
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Last Purchased From</span>
            <span className="text-slate-100 font-medium">{item.last_purchase_location}</span>
          </div>
          {item.last_purchase_price && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Last Price</span>
              <span className="text-slate-100 font-medium">{formatCurrency(item.last_purchase_price)}</span>
            </div>
          )}
        </div>
      )}

      {/* Current Stock (if linked to item) */}
      {item.items && (
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Current Stock</span>
            <span className={`font-medium ${item.items.quantity_on_hand === 0 ? 'text-red-400' : 'text-amber-400'}`}>
              {item.items.quantity_on_hand} units
            </span>
          </div>
        </div>
      )}

      {/* Target Quantity */}
      <div className="flex justify-between text-sm mb-4">
        <span className="text-slate-400">Target Quantity</span>
        <span className="text-slate-100 font-medium">{item.target_quantity} units</span>
      </div>

      {/* Max Price */}
      {item.max_price && (
        <div className="flex justify-between text-sm mb-4">
          <span className="text-slate-400">Max Price</span>
          <span className="text-slate-100 font-medium">{formatCurrency(item.max_price)}</span>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div className="mb-4 p-3 rounded-lg bg-slate-800/30">
          <p className="text-xs text-slate-400 mb-1">Notes</p>
          <p className="text-sm text-slate-300">{item.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-slate-700">
        <button
          onClick={() => handleMarkPurchased(item)}
          className="flex-1 px-4 py-2 rounded-xl font-medium
                   bg-gradient-profit text-white
                   hover:shadow-glow-profit-lg hover:scale-105
                   active:scale-95 transition-smooth"
        >
          Mark as Purchased
        </button>
        <button
          onClick={() => handleRemoveFromList(item.id)}
          disabled={removingId === item.id}
          className="px-4 py-2 rounded-xl font-medium
                   bg-slate-800 text-slate-400 border border-slate-700
                   hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-smooth"
        >
          {removingId === item.id ? 'Removing...' : 'Remove'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Shopping List</span>
          </h1>
          <p className="text-slate-400">Items to restock and purchase</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-dark rounded-xl p-4 animate-slide-up">
            <p className="text-slate-400 text-sm mb-1">Total Items</p>
            <p className="text-2xl font-bold text-slate-100">{initialShoppingList.length}</p>
          </div>
          <div className="glass-dark rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-slate-400 text-sm mb-1">Auto-Detected</p>
            <p className="text-2xl font-bold text-slate-100">{autoItems.length}</p>
          </div>
          <div className="glass-dark rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-slate-400 text-sm mb-1">Available Alerts</p>
            <p className="text-2xl font-bold text-slate-100">{availableAlerts.length}</p>
          </div>
        </div>

        {/* Restock Alerts Section */}
        {availableAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              Items Needing Restock
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({availableAlerts.length} items)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableAlerts.map((alert) => (
                <div
                  key={alert.item_id}
                  className="glass-dark rounded-xl p-4 hover:shadow-glass-lg transition-smooth"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-100">{alert.item_name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-lg border ${getPriorityColor(alert.priority)}`}>
                      {getPriorityIcon(alert.priority)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Stock</span>
                      <span className={alert.quantity_on_hand === 0 ? 'text-red-400 font-medium' : 'text-amber-400 font-medium'}>
                        {alert.quantity_on_hand} left
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Price</span>
                      <span className="text-slate-100">{formatCurrency(alert.last_purchase_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Profit</span>
                      <span className="text-profit-400 font-medium">{formatCurrency(alert.avg_profit)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToList(alert)}
                    disabled={addingAlertId === alert.item_id}
                    className="w-full px-4 py-2 rounded-xl font-medium text-sm
                             bg-profit-500/20 text-profit-400 border border-profit-500/30
                             hover:bg-profit-500/30 hover:shadow-glow-profit
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-smooth"
                  >
                    {addingAlertId === alert.item_id ? 'Adding...' : 'Add to Shopping List'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shopping List */}
        {initialShoppingList.length === 0 ? (
          <div className="glass-dark rounded-2xl p-12 text-center animate-slide-up">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">Shopping list is empty</h3>
            <p className="text-slate-400 mb-6">
              {availableAlerts.length > 0
                ? 'Add items from the restock alerts above'
                : 'Items will appear here when stock runs low'}
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              Your Shopping List
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({initialShoppingList.length} items)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialShoppingList.map((item) => renderShoppingListItem(item))}
            </div>
          </div>
        )}
      </div>

      {/* Mark Purchased Modal */}
      {selectedItem && (
        <MarkPurchasedModal
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false)
            setSelectedItem(null)
          }}
          shoppingItem={selectedItem}
        />
      )}
    </div>
  )
}