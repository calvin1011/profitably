import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, status } = await request.json()

    if (!messageId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const updateData: any = { status }
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('customer_messages')
      .update(updateData)
      .eq('id', messageId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating message:', error)
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
