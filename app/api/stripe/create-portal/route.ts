import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const { user } = await getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const supabase = await createClient()
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!sub?.stripe_customer_id) return new NextResponse('No active subscription', { status: 400 })

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}
