import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeRestock = searchParams.get('include_restock') === 'true'

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

    if (listError) {
      console.error('Error fetching shopping list:', listError)
      return NextResponse.json({ error: 'Failed to fetch shopping list' }, { status: 500 })
    }

    // optionally fetch restock alerts (items that should be added)
    let restockAlerts = []
    if (includeRestock) {
      const { data: alerts, error: alertsError } = await supabase
        .from('restock_alerts')
        .select('*')
        .eq('user_id', user.id)

      if (!alertsError && alerts) {
        restockAlerts = alerts
      }
    }

    return NextResponse.json({
      shopping_list: shoppingList || [],
      restock_alerts: restockAlerts
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add item to shopping list
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
      item_id,
      item_name,
      last_purchase_price,
      last_purchase_location,
      priority,
      reason,
      target_quantity,
      max_price,
      notes,
    } = body

    if (!item_name) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 })
    }

    // add to shopping list
    const { data: shoppingItem, error } = await supabase
      .from('shopping_list')
      .insert({
        user_id: user.id,
        item_id: item_id || null,
        item_name,
        last_purchase_price: last_purchase_price || null,
        last_purchase_location: last_purchase_location || null,
        priority: priority || 'medium',
        reason: reason || 'manual',
        target_quantity: target_quantity || 1,
        max_price: max_price || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Item already in shopping list' }, { status: 409 })
      }
      console.error('Error adding to shopping list:', error)
      return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
    }

    return NextResponse.json({ shopping_item: shoppingItem }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove item from shopping list
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    if (!itemId) {
      return NextResponse.json({ error: 'Shopping list item ID is required' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('shopping_list')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting shopping list item:', deleteError)
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Item removed from shopping list' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}