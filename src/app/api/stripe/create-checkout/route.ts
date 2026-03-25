import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { user } = await getUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { plan } = await req.json()
    const priceId = plan === 'yearly' ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY

    if (!priceId) {
      return new NextResponse('Price ID not configured', { status: 500 })
    }

    const supabase = await createClient()
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_uuid: user.id },
      })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscribe/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscribe/cancel`,
      client_reference_id: user.id,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}
