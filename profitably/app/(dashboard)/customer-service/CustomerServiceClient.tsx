'use client'

import { useState } from 'react'
import Link from 'next/link'

type CustomerMessage = {
  id: string
  customer_name: string
  customer_email: string
  order_number: string | null
  subject: string
  message: string
  status: 'new' | 'in_progress' | 'resolved'
  created_at: string
  resolved_at: string | null
  admin_notes: string | null
}

export default function CustomerServiceClient({
  initialMessages,
}: {
  initialMessages: CustomerMessage[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all')
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessage | null>(null)

  const filteredMessages = filter === 'all'
    ? messages
    : messages.filter((m) => m.status === filter)

  const newCount = messages.filter((m) => m.status === 'new').length
  const inProgressCount = messages.filter((m) => m.status === 'in_progress').length

  async function updateMessageStatus(messageId: string, status: 'new' | 'in_progress' | 'resolved') {
    const response = await fetch('/api/customer-service/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, status }),
    })

    if (response.ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, status, resolved_at: status === 'resolved' ? new Date().toISOString() : null }
            : m
        )
      )
      if (selectedMessage?.id === messageId) {
        setSelectedMessage((prev) =>
          prev ? { ...prev, status, resolved_at: status === 'resolved' ? new Date().toISOString() : null } : null
        )
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Customer Service</h1>
          <p className="text-slate-400">Manage customer inquiries and support requests</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="glass-dark rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">New Messages</p>
                <p className="text-3xl font-bold text-profit-400">{newCount}</p>
              </div>
              <div className="w-12 h-12 bg-profit-500/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="glass-dark rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-400">{inProgressCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="glass-dark rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Messages</p>
                <p className="text-3xl font-bold text-slate-100">{messages.length}</p>
              </div>
              <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          {(['all', 'new', 'in_progress', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-profit-500 text-white shadow-lg shadow-profit-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {status === 'all' ? 'All' : status === 'new' ? 'New' : status === 'in_progress' ? 'In Progress' : 'Resolved'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="glass-dark rounded-xl p-8 border border-slate-800 text-center">
                <p className="text-slate-400">No messages found</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-left glass-dark rounded-xl p-6 border transition-all hover:border-slate-600 ${
                    selectedMessage?.id === msg.id
                      ? 'border-profit-500 shadow-lg shadow-profit-500/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100 mb-1">{msg.subject}</h3>
                      <p className="text-sm text-slate-400">
                        {msg.customer_name} • {msg.customer_email}
                      </p>
                    </div>
                    <StatusBadge status={msg.status} />
                  </div>

                  {msg.order_number && (
                    <div className="mb-2">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
                        Order: {msg.order_number}
                      </span>
                    </div>
                  )}

                  <p className="text-slate-300 text-sm line-clamp-2 mb-3">{msg.message}</p>

                  <p className="text-xs text-slate-500">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="glass-dark rounded-xl p-6 border border-slate-800 sticky top-6">
            {selectedMessage ? (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 mb-2">{selectedMessage.subject}</h2>
                    <p className="text-slate-400 text-sm">
                      From: {selectedMessage.customer_name}
                    </p>
                    <a
                      href={`mailto:${selectedMessage.customer_email}`}
                      className="text-profit-400 hover:text-profit-300 text-sm transition-colors"
                    >
                      {selectedMessage.customer_email}
                    </a>
                  </div>
                  <StatusBadge status={selectedMessage.status} />
                </div>

                {selectedMessage.order_number && (
                  <div className="mb-4">
                    <Link
                      href={`/orders/${selectedMessage.order_number}`}
                      className="inline-flex items-center gap-2 text-sm text-profit-400 hover:text-profit-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      View Order: {selectedMessage.order_number}
                    </Link>
                  </div>
                )}

                <div className="mb-6 pb-6 border-b border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Message</h3>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>

                <div className="mb-6">
                  <p className="text-xs text-slate-500 mb-4">
                    Received: {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>

                  <h3 className="text-sm font-semibold text-slate-100 mb-3">Update Status</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'new')}
                      disabled={selectedMessage.status === 'new'}
                      className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      New
                    </button>
                    <button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'in_progress')}
                      disabled={selectedMessage.status === 'in_progress'}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'resolved')}
                      disabled={selectedMessage.status === 'resolved'}
                      className="flex-1 px-4 py-2 bg-profit-600 hover:bg-profit-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Resolved
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <a
                    href={`mailto:${selectedMessage.customer_email}?subject=Re: ${selectedMessage.subject}`}
                    className="block w-full px-4 py-3 bg-profit-600 hover:bg-profit-500 text-white text-center rounded-lg font-medium transition-colors"
                  >
                    Reply via Email
                  </a>
                  {selectedMessage.order_number && (
                    <a
                      href={`tel:903-634-7794`}
                      className="block w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 text-center rounded-lg font-medium transition-colors"
                    >
                      Call Customer
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-slate-400">Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'new' | 'in_progress' | 'resolved' }) {
  const styles = {
    new: 'bg-profit-500/10 text-profit-400 border-profit-500/30',
    in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    resolved: 'bg-green-500/10 text-green-400 border-green-500/30',
  }

  const labels = {
    new: 'New',
    in_progress: 'In Progress',
    resolved: 'Resolved',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
