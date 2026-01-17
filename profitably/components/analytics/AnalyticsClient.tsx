'use client'

import { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieLabelRenderProps,
} from 'recharts'

interface Item {
  id: string
  name: string
  category: string | null
  purchase_price: number
}

interface Sale {
  id: string
  item_id: string
  platform: string
  sale_price: number
  sale_date: string
  quantity_sold: number
  net_profit: number
  profit_margin: number
  items: Item
}

interface ItemData {
  id: string
  name: string
  category: string | null
  purchase_price: number
  quantity_on_hand: number
  quantity_sold: number
}

interface AnalyticsClientProps {
  sales: Sale[]
  items: ItemData[]
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export default function AnalyticsClient({ sales, items }: AnalyticsClientProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  // Filter sales by time range
  const filteredSales = useMemo(() => {
    if (timeRange === 'all') return sales

    const now = new Date()
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo))

    return sales.filter(sale => new Date(sale.sale_date) >= cutoffDate)
  }, [sales, timeRange])

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity_sold), 0)
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.net_profit, 0)
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.quantity_sold, 0)
    const avgProfitMargin = filteredSales.length > 0
      ? filteredSales.reduce((sum, sale) => sum + sale.profit_margin, 0) / filteredSales.length
      : 0

    return { totalRevenue, totalProfit, totalSales, avgProfitMargin }
  }, [filteredSales])

  // Sales over time data
  const salesOverTime = useMemo(() => {
    const groupedByDate: Record<string, { revenue: number; profit: number; count: number }> = {}

    filteredSales.forEach(sale => {
      const date = new Date(sale.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!groupedByDate[date]) {
        groupedByDate[date] = { revenue: 0, profit: 0, count: 0 }
      }
      groupedByDate[date].revenue += sale.sale_price * sale.quantity_sold
      groupedByDate[date].profit += sale.net_profit
      groupedByDate[date].count += sale.quantity_sold
    })

    return Object.entries(groupedByDate).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      profit: data.profit,
      sales: data.count,
    }))
  }, [filteredSales])

  // Platform performance
  const platformData = useMemo(() => {
    const platforms: Record<string, { revenue: number; profit: number; sales: number }> = {}

    filteredSales.forEach(sale => {
      if (!platforms[sale.platform]) {
        platforms[sale.platform] = { revenue: 0, profit: 0, sales: 0 }
      }
      platforms[sale.platform].revenue += sale.sale_price * sale.quantity_sold
      platforms[sale.platform].profit += sale.net_profit
      platforms[sale.platform].sales += sale.quantity_sold
    })

    return Object.entries(platforms).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      revenue: data.revenue,
      profit: data.profit,
      sales: data.sales,
    }))
  }, [filteredSales])

  // Category performance
  const categoryData = useMemo(() => {
    const categories: Record<string, { revenue: number; profit: number; sales: number }> = {}

    filteredSales.forEach(sale => {
      const category = sale.items.category || 'Uncategorized'
      if (!categories[category]) {
        categories[category] = { revenue: 0, profit: 0, sales: 0 }
      }
      categories[category].revenue += sale.sale_price * sale.quantity_sold
      categories[category].profit += sale.net_profit
      categories[category].sales += sale.quantity_sold
    })

    return Object.entries(categories)
      .map(([name, data]) => ({
        name,
        value: data.profit,
        revenue: data.revenue,
        sales: data.sales,
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredSales])

  // Top performing items
  const topItems = useMemo(() => {
    const itemPerformance: Record<string, { name: string; profit: number; sales: number; revenue: number }> = {}

    filteredSales.forEach(sale => {
      if (!itemPerformance[sale.item_id]) {
        itemPerformance[sale.item_id] = {
          name: sale.items.name,
          profit: 0,
          sales: 0,
          revenue: 0,
        }
      }
      itemPerformance[sale.item_id].profit += sale.net_profit
      itemPerformance[sale.item_id].sales += sale.quantity_sold
      itemPerformance[sale.item_id].revenue += sale.sale_price * sale.quantity_sold
    })

    return Object.values(itemPerformance)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)
  }, [filteredSales])

  // Inventory value by category
  const inventoryByCategory = useMemo(() => {
    const categories: Record<string, number> = {}

    items.forEach(item => {
      const category = item.category || 'Uncategorized'
      const value = item.purchase_price * item.quantity_on_hand
      categories[category] = (categories[category] || 0) + value
    })

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }))
  }, [items])

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-slate-400">Insights and performance metrics</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 mb-8 animate-slide-down" style={{ animationDelay: '0.1s' }}>
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl font-medium transition-smooth ${
                timeRange === range
                  ? 'bg-profit-500/20 text-profit-400 border border-profit-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {range === 'all' ? 'All Time' : range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-dark rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-slate-400 text-sm mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-100">{formatCurrency(metrics.totalRevenue)}</p>
          </div>
          <div className="glass-dark rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-slate-400 text-sm mb-2">Total Profit</p>
            <p className="text-3xl font-bold gradient-text">{formatCurrency(metrics.totalProfit)}</p>
          </div>
          <div className="glass-dark rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-slate-400 text-sm mb-2">Items Sold</p>
            <p className="text-3xl font-bold text-slate-100">{metrics.totalSales}</p>
          </div>
          <div className="glass-dark rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <p className="text-slate-400 text-sm mb-2">Avg Margin</p>
            <p className="text-3xl font-bold text-slate-100">{metrics.avgProfitMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Over Time */}
          <div className="glass-dark rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-xl font-bold text-slate-100 mb-4">Revenue & Profit Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesOverTime}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Performance */}
          <div className="glass-dark rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <h3 className="text-xl font-bold text-slate-100 mb-4">Platform Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[8, 8, 0, 0]} />
                <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="glass-dark rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.8s' }}>
            <h3 className="text-xl font-bold text-slate-100 mb-4">Profit by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: PieLabelRenderProps): string => {
                    const percent = props.percent || 0
                    const name = props.name || ''
                    return `${name} ${(percent * 100).toFixed(0)}%`
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Inventory Value */}
          <div className="glass-dark rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.9s' }}>
            <h3 className="text-xl font-bold text-slate-100 mb-4">Inventory Value by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: PieLabelRenderProps): string => {
                    const percent = props.percent || 0
                    const name = props.name || ''
                    return `${name} ${(percent * 100).toFixed(0)}%`
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {inventoryByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Items */}
        <div className="glass-dark rounded-xl p-6 animate-slide-up" style={{ animationDelay: '1s' }}>
          <h3 className="text-xl font-bold text-slate-100 mb-4">Top 10 Performing Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Item</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Sales</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Revenue</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item, index) => (
                  <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50 transition-smooth">
                    <td className="py-3 px-4 text-slate-100">{item.name}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{item.sales}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(item.revenue)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-profit-400 font-semibold">{formatCurrency(item.profit)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}