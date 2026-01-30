import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Get wishlist items for a customer
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const productId = searchParams.get('productId')

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if specific product is in wishlist
    if (productId) {
      const { data, error } = await supabase
        .from('wishlists')
        .select('id')
        .eq('customer_id', customerId)
        .eq('product_id', productId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking wishlist:', error)
        return NextResponse.json({ error: 'Failed to check wishlist' }, { status: 500 })
      }

      return NextResponse.json({ inWishlist: !!data })
    }

    // Get all wishlist items with product details
    const { data: wishlistItems, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        created_at,
        products (
          id,
          title,
          slug,
          price,
          compare_at_price,
          is_published,
          user_id,
          product_images (
            image_url,
            position
          ),
          items (
            quantity_on_hand
          )
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching wishlist:', error)
      return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
    }

    return NextResponse.json({ wishlistItems })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add to wishlist
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, productId } = body

    if (!customerId || !productId) {
      return NextResponse.json(
        { error: 'Customer ID and Product ID required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('customer_id', customerId)
      .eq('product_id', productId)
      .single()

    if (existing) {
      return NextResponse.json({ message: 'Already in wishlist', id: existing.id })
    }

    const { data, error } = await supabase
      .from('wishlists')
      .insert({
        customer_id: customerId,
        product_id: productId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding to wishlist:', error)
      return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Added to wishlist', id: data.id }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Remove from wishlist
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const productId = searchParams.get('productId')

    if (!customerId || !productId) {
      return NextResponse.json(
        { error: 'Customer ID and Product ID required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('customer_id', customerId)
      .eq('product_id', productId)

    if (error) {
      console.error('Error removing from wishlist:', error)
      return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Removed from wishlist' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
