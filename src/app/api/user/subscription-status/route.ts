import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'

type CanonicalStatus = 'active' | 'lapsed' | 'inactive'

function mapFromSubscriptions(statuses: string[]): CanonicalStatus {
  if (statuses.some((s) => s === 'active' || s === 'trialing')) return 'active'
  if (statuses.some((s) => s === 'past_due' || s === 'unpaid' || s === 'incomplete' || s === 'incomplete_expired')) {
    return 'lapsed'
  }
  return 'inactive'
}

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  const [profileResult, subscriptionsResult] = await Promise.all([
    supabase.from('profiles').select('subscription_status').eq('id', user.id).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('status, current_period_end, created_at')
      .eq('user_id', user.id)
      .order('current_period_end', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
  ])

  if (profileResult.error) {
    return NextResponse.json({ error: profileResult.error.message }, { status: 500 })
  }

  if (subscriptionsResult.error) {
    return NextResponse.json({ error: subscriptionsResult.error.message }, { status: 500 })
  }

  const profileStatus = (profileResult.data?.subscription_status as CanonicalStatus | null) || 'inactive'
  const subscriptionStatuses = (subscriptionsResult.data || [])
    .map((s) => s.status)
    .filter((s): s is string => typeof s === 'string')

  const canonicalStatus = subscriptionStatuses.length > 0 ? mapFromSubscriptions(subscriptionStatuses) : profileStatus

  if (canonicalStatus !== profileStatus) {
    await supabase
      .from('profiles')
      .update({ subscription_status: canonicalStatus })
      .eq('id', user.id)
  }

  return NextResponse.json({
    status: canonicalStatus,
    profileStatus,
    source: subscriptionStatuses.length > 0 ? 'subscriptions' : 'profile',
    hasSubscriptions: subscriptionStatuses.length > 0,
  })
}
