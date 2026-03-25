import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { resolveSubscriptionStatus } from '@/lib/subscription-status'

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

    const serviceSupabase = createServiceRoleClient()
    const resolved = await resolveSubscriptionStatus({
      userId: user.id,
      userEmail: user.email ?? null,
      supabase: serviceSupabase,
    })

    const customerId = resolved.customerId
    const hasActiveLocal = resolved.status === 'active'

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
