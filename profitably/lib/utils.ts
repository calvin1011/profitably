import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

// Calculate profit margin
export function calculateProfitMargin(salePrice: number, purchasePrice: number): number {
  if (salePrice === 0) return 0
  return ((salePrice - purchasePrice) / salePrice) * 100
}

// Calculate ROI
export function calculateROI(profit: number, cost: number): number {
  if (cost === 0) return 0
  return (profit / cost) * 100
}