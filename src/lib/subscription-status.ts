import type { SupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export type CanonicalProfileStatus = 'active' | 'lapsed' | 'inactive'

type LocalSubscriptionRow = {
  id?: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  status?: string | null
  current_period_end?: string | null
  created_at?: string | null
}

export type SubscriptionStatusResult = {
  status: CanonicalProfileStatus
  stripeStatus: string | null
  source: 'local' | 'stripe_reconciled' | 'no_stripe_customer' | 'no_stripe_subscription'
  customerId: string | null
  subscriptionId: string | null
  repaired: boolean
}

export function mapStripeStatusToProfileStatus(stripeStatus: string): CanonicalProfileStatus {
  if (stripeStatus === 'active' || stripeStatus === 'trialing') return 'active'
  if (['past_due', 'unpaid', 'incomplete', 'incomplete_expired'].includes(stripeStatus)) return 'lapsed'
  return 'inactive'
}

export async function resolveSubscriptionStatus(params: {
  userId: string
  userEmail: string | null
  supabase: SupabaseClient
  skipStripe?: boolean
}): Promise<SubscriptionStatusResult> {
  const { userId, userEmail, supabase, skipStripe = false } = params

  const { data: localRows, error: localError } = await supabase
    .from('subscriptions')
    .select('id, stripe_customer_id, stripe_subscription_id, status, current_period_end, created_at')
    .eq('user_id', userId)
    .order('current_period_end', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (localError) throw localError

  const localSub = ((localRows || [])[0] || null) as LocalSubscriptionRow | null

  if (localSub?.status === 'active' || localSub?.status === 'trialing') {
    return {
      status: 'active',
      stripeStatus: localSub.status,
      source: 'local',
      customerId: localSub.stripe_customer_id || null,
      subscriptionId: localSub.stripe_subscription_id || null,
      repaired: false,
    }
  }

  if (skipStripe) {
    return {
      status: mapStripeStatusToProfileStatus(localSub?.status || 'canceled'),
      stripeStatus: localSub?.status || null,
      source: 'local',
      customerId: localSub?.stripe_customer_id || null,
      subscriptionId: localSub?.stripe_subscription_id || null,
      repaired: false,
    }
  }

  let customerId = localSub?.stripe_customer_id || null

  if (!customerId && localSub?.stripe_subscription_id) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(localSub.stripe_subscription_id)
      customerId = String(stripeSub.customer)
    } catch {
      customerId = null
    }
  }

  if (!customerId && userEmail) {
    const customers = await stripe.customers.list({ email: userEmail, limit: 10 })
    const matched = customers.data.find((c) => c.metadata?.supabase_uuid === userId)
    customerId = matched?.id ?? customers.data[0]?.id ?? null
  }

  if (!customerId) {
    try {
      const search = await stripe.customers.search({
        query: `metadata['supabase_uuid']:'${userId}'`,
        limit: 1,
      })
      customerId = search.data[0]?.id || null
    } catch {
      customerId = null
    }
  }

  if (!customerId) {
    return {
      status: 'inactive',
      stripeStatus: null,
      source: 'no_stripe_customer',
      customerId: null,
      subscriptionId: null,
      repaired: false,
    }
  }

  const stripeSubs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 10,
  })

  const preferred =
    stripeSubs.data.find((s) => ['active', 'trialing'].includes(s.status)) ||
    stripeSubs.data.find((s) => ['past_due', 'unpaid', 'incomplete', 'incomplete_expired'].includes(s.status)) ||
    stripeSubs.data[0] ||
    null

  if (!preferred) {
    return {
      status: 'inactive',
      stripeStatus: null,
      source: 'no_stripe_subscription',
      customerId,
      subscriptionId: null,
      repaired: false,
    }
  }

  const periodEnd =
    typeof (preferred as any).current_period_end === 'number'
      ? (preferred as any).current_period_end
      : Math.floor(Date.now() / 1000)

  const canonicalProfileStatus = mapStripeStatusToProfileStatus(preferred.status)

  await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: preferred.id,
        status: preferred.status,
        plan: preferred.items.data[0]?.price?.id === process.env.STRIPE_PRICE_MONTHLY ? 'monthly' : 'yearly',
        current_period_end: new Date(periodEnd * 1000).toISOString(),
      },
      { onConflict: 'stripe_customer_id' }
    )

  await supabase
    .from('profiles')
    .update({ subscription_status: canonicalProfileStatus })
    .eq('id', userId)

  return {
    status: canonicalProfileStatus,
    stripeStatus: preferred.status,
    source: 'stripe_reconciled',
    customerId,
    subscriptionId: preferred.id,
    repaired: true,
  }
}
