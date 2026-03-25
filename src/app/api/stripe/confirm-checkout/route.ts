import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { resolveSubscriptionStatus } from '@/lib/subscription-status'

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

    const serviceSupabase = createServiceRoleClient()

    const existingActive = await resolveSubscriptionStatus({
      userId: user.id,
      userEmail: user.email ?? null,
      supabase: serviceSupabase,
      skipStripe: true,
    })

    if (existingActive.status === 'active') {
      return NextResponse.json({
        ok: true,
        subscriptionStatus: existingActive.stripeStatus,
        profileStatus: existingActive.status,
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
      typeof subscriptionFromExpand === 'string' ? subscriptionFromExpand : subscriptionFromExpand?.id

    if (!subscriptionId || typeof subscriptionId !== 'string') {
      return NextResponse.json({ error: 'No subscription found for this checkout session.' }, { status: 400 })
    }

    const result = await resolveSubscriptionStatus({
      userId: user.id,
      userEmail: user.email ?? null,
      supabase: serviceSupabase,
    })

    return NextResponse.json({
      ok: true,
      subscriptionStatus: result.stripeStatus,
      profileStatus: result.status,
      source: result.source,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unable to confirm checkout.' },
      { status: 500 }
    )
  }
}
