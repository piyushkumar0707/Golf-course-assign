import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const requestRef = `bp_${Date.now().toString(36)}`
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

    const { data: subs, error: subError } = await supabase
      .from('subscriptions')
      .select('id, stripe_customer_id, stripe_subscription_id, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 })
    }

    let customerId =
      subs?.find((s: any) => typeof s.stripe_customer_id === 'string' && s.stripe_customer_id.length > 0)
        ?.stripe_customer_id || null
    const hasActiveLocal = (subs || []).some((s: any) => s.status === 'active' || s.status === 'trialing')

    // Fallback: resolve customer from known subscription id.
    if (!customerId) {
      const subId =
        subs?.find((s: any) => typeof s.stripe_subscription_id === 'string' && s.stripe_subscription_id.length > 0)
          ?.stripe_subscription_id || null

      if (subId) {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(subId)
          customerId = String(stripeSub.customer)

          // Best-effort repair: persist resolved customer id locally.
          const rowId = subs?.find((s: any) => s.stripe_subscription_id === subId)?.id
          if (rowId) {
            await supabase
              .from('subscriptions')
              .update({ stripe_customer_id: customerId })
              .eq('id', rowId)
          }
        } catch {
          // Ignore and continue fallback chain.
        }
      }
    }

    // Fallback: recover Stripe customer by email if local subscription row is missing.
    if (!customerId && user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 10,
      })
      customerId = customers.data[0]?.id || null
    }

    // Final fallback: search by metadata supabase_uuid in Stripe.
    if (!customerId) {
      try {
        const search = await stripe.customers.search({
          query: `metadata['supabase_uuid']:'${user.id}'`,
          limit: 1,
        })
        customerId = search.data[0]?.id || null
      } catch {
        // Search API may be unavailable in some environments.
      }
    }

    if (!customerId) {
      return NextResponse.json(
        hasActiveLocal
          ? {
              error: `We found an active subscription but could not locate your billing profile. Please contact support and share this code: ${requestRef}.`,
              code: requestRef,
            }
          : { error: 'No billing profile found for this account yet. Please complete one checkout, then try again.' },
        { status: 400 }
      )
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
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
