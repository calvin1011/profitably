import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Get reviews for a product
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const customerId = searchParams.get('customerId')

    const supabase = createAdminClient()

    // Get customer's review for a specific product
    if (customerId && productId) {
      const { data: review, error } = await supabase
        .from('reviews')
        .select(`
          *,
          customers (
            full_name
          ),
          review_replies (
            id,
            content,
            created_at
          )
        `)
        .eq('customer_id', customerId)
        .eq('product_id', productId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching review:', error)
        return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 })
      }

      return NextResponse.json({ review })
    }

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Get all approved reviews for a product
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        title,
        content,
        is_verified_purchase,
        created_at,
        customers (
          full_name
        ),
        review_replies (
          id,
          content,
          created_at
        )
      `)
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    // Calculate average rating
    const totalRating = reviews?.reduce((sum, r) => sum + r.rating, 0) || 0
    const averageRating = reviews && reviews.length > 0 ? totalRating / reviews.length : 0

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews?.length || 0,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create a review
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, customerId, orderId, rating, title, content } = body

    if (!productId || !customerId || !rating || !content) {
      return NextResponse.json(
        { error: 'Product ID, Customer ID, rating, and content required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if customer already reviewed this product
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('customer_id', customerId)
      .eq('product_id', productId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    // Check if this is a verified purchase
    let isVerifiedPurchase = false
    if (orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderId)
        .eq('customer_id', customerId)
        .single()

      isVerifiedPurchase = !!order
    } else {
      // Check if customer has any order with this product
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          id,
          orders!inner (
            customer_id,
            status
          )
        `)
        .eq('product_id', productId)
        .eq('orders.customer_id', customerId)
        .in('orders.status', ['paid', 'processing', 'shipped', 'delivered'])
        .limit(1)

      isVerifiedPurchase = !!(orderItems && orderItems.length > 0)
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        customer_id: customerId,
        order_id: orderId || null,
        rating,
        title: title || null,
        content,
        is_verified_purchase: isVerifiedPurchase,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating review:', error)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update a review
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { reviewId, customerId, rating, title, content } = body

    if (!reviewId || !customerId) {
      return NextResponse.json(
        { error: 'Review ID and Customer ID required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', reviewId)
      .eq('customer_id', customerId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (rating !== undefined) updates.rating = rating
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content

    const { data: review, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single()

    if (error) {
      console.error('Error updating review:', error)
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete a review
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')
    const customerId = searchParams.get('customerId')

    if (!reviewId || !customerId) {
      return NextResponse.json(
        { error: 'Review ID and Customer ID required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('customer_id', customerId)

    if (error) {
      console.error('Error deleting review:', error)
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Review deleted' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
