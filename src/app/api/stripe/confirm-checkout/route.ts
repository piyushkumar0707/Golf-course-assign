import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json()

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Missing checkout session id.' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existingActiveSub } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle()

    if (existingActiveSub) {
      await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', user.id)

      return NextResponse.json({
        ok: true,
        subscriptionStatus: existingActiveSub.status,
        profileStatus: 'active',
        source: 'db-fast-path',
      })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    const sessionUserId = session.client_reference_id || (session.metadata?.supabase_uuid as string | undefined) || null
    if (sessionUserId && sessionUserId !== user.id) {
      return NextResponse.json({ error: 'Session does not belong to current user.' }, { status: 403 })
    }

    const subscriptionFromExpand = session.subscription as any
    const subscriptionId =
      typeof subscriptionFromExpand === 'string'
        ? subscriptionFromExpand
        : subscriptionFromExpand?.id

    if (!subscriptionId) {
      return NextResponse.json({ error: 'No subscription found for this checkout session.' }, { status: 400 })
    }

    const subscription =
      typeof subscriptionFromExpand === 'object' && subscriptionFromExpand?.id
        ? subscriptionFromExpand
        : await stripe.subscriptions.retrieve(subscriptionId)

    const customerId = String(subscription.customer)
    const periodEnd =
      typeof (subscription as any).current_period_end === 'number'
        ? (subscription as any).current_period_end
        : Math.floor(Date.now() / 1000)

    const plan = subscription.items.data[0]?.price?.id === process.env.STRIPE_PRICE_MONTHLY ? 'monthly' : 'yearly'

    const { error: upsertError } = await supabase.from('subscriptions').upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        plan,
        status: subscription.status,
        current_period_end: new Date(periodEnd * 1000).toISOString(),
      },
      { onConflict: 'stripe_customer_id' }
    )

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    const profileStatus = subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'inactive'

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ subscription_status: profileStatus })
      .eq('id', user.id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      subscriptionStatus: subscription.status,
      profileStatus,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unable to confirm checkout.' },
      { status: 500 }
    )
  }
}
