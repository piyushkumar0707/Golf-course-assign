import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendRenewalReminderEmail } from '@/lib/email/send'

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Find subscribers whose current_period_end is within the next 3 days
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const { data: upcoming, error } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, current_period_end, profiles(full_name, email)')
    .eq('status', 'active')
    .lte('current_period_end', threeDaysFromNow.toISOString())
    .gte('current_period_end', now.toISOString())

  if (error || !upcoming) {
    return NextResponse.json({ error: 'Failed to fetch renewals' }, { status: 500 })
  }

  const results = await Promise.allSettled(
    upcoming.map(async (sub: any) => {
      const profile = sub.profiles
      if (!profile?.email) return
      const renewalDate = new Date(sub.current_period_end).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
      return sendRenewalReminderEmail(profile.email, profile.full_name || 'Golfer', renewalDate)
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
