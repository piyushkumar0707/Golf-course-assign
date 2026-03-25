import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { resolveSubscriptionStatus } from '@/lib/subscription-status'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceRoleClient()
  const result = await resolveSubscriptionStatus({
    userId: user.id,
    userEmail: user.email ?? null,
    supabase,
  })

  return NextResponse.json({
    status: result.status,
    stripeStatus: result.stripeStatus,
    source: result.source,
    hasSubscriptions: !!result.subscriptionId,
  })
}
