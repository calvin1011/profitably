import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          currency: string
          timezone: string
          low_stock_threshold: number
          email_notifications: boolean
          push_notifications: boolean
          subscription_tier: 'free' | 'pro' | 'business'
          subscription_status: 'active' | 'cancelled' | 'past_due'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          timezone?: string
          low_stock_threshold?: number
          email_notifications?: boolean
          push_notifications?: boolean
          subscription_tier?: 'free' | 'pro' | 'business'
          subscription_status?: 'active' | 'cancelled' | 'past_due'
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          timezone?: string
          low_stock_threshold?: number
          email_notifications?: boolean
          push_notifications?: boolean
        }
      }
      items: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          sku: string | null
          category: string | null
          purchase_price: number
          purchase_date: string
          purchase_location: string
          quantity_purchased: number
          quantity_on_hand: number
          quantity_sold: number
          image_url: string | null
          notes: string | null
          is_archived: boolean
          created_at: string
          updated_at: string
        }
      }
      sales: {
        Row: {
          id: string
          user_id: string
          item_id: string
          listing_id: string | null
          platform: 'amazon' | 'ebay' | 'facebook' | 'mercari' | 'poshmark' | 'other'
          sale_price: number
          sale_date: string
          quantity_sold: number
          platform_fees: number
          shipping_cost: number
          other_fees: number
          gross_profit: number
          net_profit: number
          profit_margin: number
          platform_order_id: string | null
          is_synced_from_api: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}