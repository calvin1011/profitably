import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Get all reviews for seller's products (for dashboard)
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all reviews for products owned by this seller
    const { data: reviews, error } = await adminClient
      .from('reviews')
      .select(`
        id,
        rating,
        title,
        content,
        is_verified_purchase,
        is_approved,
        created_at,
        customers (
          id,
          full_name,
          email
        ),
        products!inner (
          id,
          title,
          slug,
          user_id
        ),
        review_replies (
          id,
          content,
          created_at
        )
      `)
      .eq('products.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create a reply to a review (seller only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reviewId, content } = body

    if (!reviewId || !content) {
      return NextResponse.json(
        { error: 'Review ID and content required' },
        { status: 400 }
      )
    }

    // Verify the review is for a product owned by this seller
    const { data: review } = await adminClient
      .from('reviews')
      .select(`
        id,
        products (
          user_id
        )
      `)
      .eq('id', reviewId)
      .single()

    if (!review || (review.products as any)?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if reply already exists
    const { data: existingReply } = await adminClient
      .from('review_replies')
      .select('id')
      .eq('review_id', reviewId)
      .single()

    if (existingReply) {
      // Update existing reply
      const { data: reply, error } = await adminClient
        .from('review_replies')
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReply.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating reply:', error)
        return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 })
      }

      return NextResponse.json({ reply, updated: true })
    }

    // Create new reply
    const { data: reply, error } = await adminClient
      .from('review_replies')
      .insert({
        review_id: reviewId,
        user_id: user.id,
        content,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating reply:', error)
      return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })
    }

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update review approval status (seller moderation)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reviewId, isApproved } = body

    if (!reviewId || typeof isApproved !== 'boolean') {
      return NextResponse.json(
        { error: 'Review ID and approval status required' },
        { status: 400 }
      )
    }

    // Verify the review is for a product owned by this seller
    const { data: review } = await adminClient
      .from('reviews')
      .select(`
        id,
        products (
          user_id
        )
      `)
      .eq('id', reviewId)
      .single()

    if (!review || (review.products as any)?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      )
    }

    const { data: updatedReview, error } = await adminClient
      .from('reviews')
      .update({
        is_approved: isApproved,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single()

    if (error) {
      console.error('Error updating review:', error)
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
    }

    return NextResponse.json({ review: updatedReview })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete a reply
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const replyId = searchParams.get('replyId')

    if (!replyId) {
      return NextResponse.json({ error: 'Reply ID required' }, { status: 400 })
    }

    // Verify the reply belongs to this seller
    const { data: reply } = await adminClient
      .from('review_replies')
      .select('id, user_id')
      .eq('id', replyId)
      .single()

    if (!reply || reply.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Reply not found or unauthorized' },
        { status: 404 }
      )
    }

    const { error } = await adminClient
      .from('review_replies')
      .delete()
      .eq('id', replyId)

    if (error) {
      console.error('Error deleting reply:', error)
      return NextResponse.json({ error: 'Failed to delete reply' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Reply deleted' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
