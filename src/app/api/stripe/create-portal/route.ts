import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const { user } = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subError || !sub?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 400 }
      )
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Billing portal error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to open billing portal. Please try again.' },
      { status: 500 }
    )
  }
}
