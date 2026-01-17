import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from '@/components/analytics/AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all sales with item details
  const { data: sales } = await supabase
    .from('sales')
    .select(`
      *,
      items (
        id,
        name,
        category,
        purchase_price
      )
    `)
    .eq('user_id', user.id)
    .order('sale_date', { ascending: true })

  // Fetch all items
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)

  return (
    <AnalyticsClient
      sales={sales || []}
      items={items || []}
    />
  )
}