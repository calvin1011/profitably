import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShoppingClient from '@/components/shopping/ShoppingClient'

export default async function ShoppingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // fetch shopping list items
  const { data: shoppingList, error: listError } = await supabase
    .from('shopping_list')
    .select(`
      *,
      items (
        id,
        name,
        category,
        quantity_on_hand,
        purchase_price,
        purchase_location
      )
    `)
    .eq('user_id', user.id)
    .eq('is_purchased', false)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })

  // fetch restock alerts (items that should be restocked)
  const { data: restockAlerts, error: alertsError } = await supabase
    .from('restock_alerts')
    .select('*')
    .eq('user_id', user.id)

  if (listError) {
    console.error('Error fetching shopping list:', listError)
  }

  if (alertsError) {
    console.error('Error fetching restock alerts:', alertsError)
  }

  return (
    <ShoppingClient
      initialShoppingList={shoppingList || []}
      restockAlerts={restockAlerts || []}
    />
  )
}