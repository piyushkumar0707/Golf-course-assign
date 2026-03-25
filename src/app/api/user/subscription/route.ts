import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { resolveSubscriptionStatus } from '@/lib/subscription-status'

const cache = new Map<string, { expiresAt: number; result: { status: 'active' | 'lapsed' | 'inactive'; stripeStatus: string | null; source: string } }>()

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  const cached = cache.get(user.id)
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(
      {
        subscriptionStatus: cached.result.status,
        stripeStatus: cached.result.stripeStatus,
        source: `${cached.result.source}:cache`,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const supabase = createServiceRoleClient()
  const result = await resolveSubscriptionStatus({
    userId: user.id,
    userEmail: user.email ?? null,
    supabase,
  })

  cache.set(user.id, {
    expiresAt: now + 30_000,
    result: {
      status: result.status,
      stripeStatus: result.stripeStatus,
      source: result.source,
    },
  })

  return NextResponse.json(
    {
      subscriptionStatus: result.status,
      stripeStatus: result.stripeStatus,
      source: result.source,
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}
