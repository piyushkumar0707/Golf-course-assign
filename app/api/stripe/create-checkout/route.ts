import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { plan } = body // 'monthly' | 'yearly'

    const priceId = plan === 'yearly' 
      ? process.env.STRIPE_PRICE_YEARLY 
      : process.env.STRIPE_PRICE_MONTHLY

    if (!priceId) {
      return NextResponse.json({ error: 'Subscription prices not configured' }, { status: 500 })
    }

    // Attempt to find existing customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name || '',
        metadata: {
          supabaseUUID: user.id
        }
      })
      customerId = customer.id
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/subscribe?canceled=true`,
      metadata: {
        supabaseUUID: user.id,
        plan
      }
    })

    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
