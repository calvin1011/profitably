import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewsManagementClient from './ReviewsManagementClient'

export default async function ReviewsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  return <ReviewsManagementClient />
}
