import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Mark shopping list item as purchased and create new inventory
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      shopping_list_id,
      actual_price,
      actual_location,
      quantity,
      purchase_date,
    } = body

    if (!shopping_list_id || !actual_price || !actual_location || !quantity || !purchase_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (typeof actual_price !== 'number' || actual_price <= 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      )
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      )
    }

    // call the database function to mark as purchased and create inventory
    const { data, error } = await supabase.rpc('mark_shopping_item_purchased', {
      p_shopping_list_id: shopping_list_id,
      p_actual_price: actual_price,
      p_actual_location: actual_location,
      p_quantity: quantity,
      p_purchase_date: purchase_date,
    })

    if (error) {
      console.error('Error marking item as purchased:', error)
      return NextResponse.json(
        { error: 'Failed to mark item as purchased' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Item marked as purchased and added to inventory',
      new_item_id: data,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}