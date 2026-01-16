import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// fetch all sales for the authenticated user
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

    // fetch sales with item details
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        items (
          id,
          name,
          purchase_price,
          category,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('sale_date', { ascending: false })

    if (error) {
      console.error('Error fetching sales:', error)
      return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
    }

    return NextResponse.json({ sales })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// create a new sale
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
      platform,
      sale_price,
      sale_date,
      quantity_sold,
      platform_fees,
      shipping_cost,
      other_fees,
      notes,
    } = body

    if (!item_id || !platform || !sale_price || !sale_date || !quantity_sold) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (typeof sale_price !== 'number' || sale_price < 0) {
      return NextResponse.json(
        { error: 'Sale price must be a positive number' },
        { status: 400 }
      )
    }

    if (typeof quantity_sold !== 'number' || quantity_sold <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      )
    }

    // check if item exists and belongs to user
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, quantity_on_hand, purchase_price')
      .eq('id', item_id)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // check if enough quantity available
    if (item.quantity_on_hand < quantity_sold) {
      return NextResponse.json(
        { error: `Only ${item.quantity_on_hand} units available` },
        { status: 400 }
      )
    }

    // create sale (database trigger will calculate profit and update quantities)
    const { data: sale, error } = await supabase
      .from('sales')
      .insert({
        user_id: user.id,
        item_id,
        platform,
        sale_price,
        sale_date,
        quantity_sold,
        platform_fees: platform_fees || 0,
        shipping_cost: shipping_cost || 0,
        other_fees: other_fees || 0,
        notes: notes || null,
        is_synced_from_api: false,
      })
      .select(`
        *,
        items (
          id,
          name,
          purchase_price,
          category
        )
      `)
      .single()

    if (error) {
      console.error('Error creating sale:', error)
      return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
    }

    return NextResponse.json({ sale }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// update a sale
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      item_id,
      platform,
      sale_price,
      sale_date,
      quantity_sold,
      platform_fees,
      shipping_cost,
      other_fees,
      notes,
    } = body

    if (!id) return NextResponse.json({ error: 'Sale ID required' }, { status: 400 })

    const { data: oldSale } = await supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!oldSale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })

    const { data: item } = await supabase
      .from('items')
      .select('*')
      .eq('id', oldSale.item_id)
      .single()

    const quantityDiff = quantity_sold - oldSale.quantity_sold

    if (quantityDiff > 0 && item.quantity_on_hand < quantityDiff) {
       return NextResponse.json({ error: `Not enough stock. You need ${quantityDiff} more, but only have ${item.quantity_on_hand}.` }, { status: 400 })
    }

    const purchasePrice = item.purchase_price
    const gross = (sale_price * quantity_sold) - (purchasePrice * quantity_sold)
    const net = gross - (platform_fees || 0) - (shipping_cost || 0) - (other_fees || 0)
    const margin = sale_price > 0 ? (net / (sale_price * quantity_sold)) * 100 : 0

    const { data: sale, error: updateError } = await supabase
      .from('sales')
      .update({
        platform,
        sale_price,
        sale_date,
        quantity_sold,
        platform_fees,
        shipping_cost,
        other_fees,
        notes,
        gross_profit: gross,
        net_profit: net,
        profit_margin: margin
      })
      .eq('id', id)
      .select(`
        *,
        items (
          id,
          name,
          purchase_price,
          category
        )
      `)
      .single()

    if (updateError) throw updateError

    // update Inventory
    if (quantityDiff !== 0) {
      await supabase
        .from('items')
        .update({
          quantity_on_hand: item.quantity_on_hand - quantityDiff,
          quantity_sold: item.quantity_sold + quantityDiff
        })
        .eq('id', item.id)
    }

    return NextResponse.json({ sale })

  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const saleId = searchParams.get('id')

    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 })
    }

    const { data: sale } = await supabase
      .from('sales')
      .select('item_id, quantity_sold')
      .eq('id', saleId)
      .eq('user_id', user.id)
      .single()

    if (sale) {

      const { data: item } = await supabase
        .from('items')
        .select('quantity_on_hand, quantity_sold')
        .eq('id', sale.item_id)
        .single()

      if (item) {
        await supabase
          .from('items')
          .update({
            quantity_on_hand: item.quantity_on_hand + sale.quantity_sold,
            quantity_sold: item.quantity_sold - sale.quantity_sold
          })
          .eq('id', sale.item_id)
      }
    }

    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting sale:', deleteError)
      return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Sale deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}