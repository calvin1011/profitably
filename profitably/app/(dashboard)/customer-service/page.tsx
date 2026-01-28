import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomerServiceClient from './CustomerServiceClient'

export default async function CustomerServicePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all customer messages for this store owner
  const { data: messages } = await supabase
    .from('customer_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <CustomerServiceClient initialMessages={messages || []} />
}
