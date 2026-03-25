import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const startedAt = Date.now()

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await req.json()
    const priceId = plan === 'yearly' ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 })
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User email is missing. Please update your account email and try again.' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        metadata: {
          supabase_uuid: user.id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscribe/cancel`,
      client_reference_id: user.id,
    })

    return NextResponse.json({
      url: session.url,
      ms: Date.now() - startedAt,
    })
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Internal Error'
    const code = typeof error?.code === 'string' ? error.code : undefined
    const type = typeof error?.type === 'string' ? error.type : undefined

    console.error('create-checkout failed', {
      code,
      type,
      message,
      ms: Date.now() - startedAt,
    })

    return NextResponse.json(
      {
        error: message,
        code,
        type,
        ms: Date.now() - startedAt,
      },
      { status: 500 }
    )
  }
}
