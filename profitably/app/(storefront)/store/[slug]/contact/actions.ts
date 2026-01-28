'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function submitContactForm(storeSlug: string, prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const orderNumber = formData.get('orderNumber') as string
  const subject = formData.get('subject') as string
  const message = formData.get('message') as string

  if (!name || !email || !subject || !message) {
    return { error: 'Please fill in all required fields' }
  }

  const supabase = createAdminClient()

  // Get store owner's user_id
  const { data: store } = await supabase
    .from('store_settings')
    .select('user_id')
    .eq('store_slug', storeSlug)
    .single()

  if (!store) {
    return { error: 'Store not found' }
  }

  // Create customer message
  const { error } = await supabase
    .from('customer_messages')
    .insert({
      user_id: store.user_id,
      customer_name: name,
      customer_email: email,
      order_number: orderNumber || null,
      subject,
      message,
      status: 'new',
    })

  if (error) {
    console.error('Error creating customer message:', error)
    return { error: 'Failed to send message. Please try again.' }
  }

  return { success: true }
}
