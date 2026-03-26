import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendDrawReminderEmail } from '@/lib/email/send'

export async function GET(req: Request) {
  // Protect cron route
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Fetch all active subscribers with their emails
  const { data: subscribers, error } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, profiles(full_name, email)')
    .eq('status', 'active')

  if (error || !subscribers) {
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
  }

  const results = await Promise.allSettled(
    subscribers.map(async (sub: any) => {
      const profile = sub.profiles
      if (!profile?.email) return
      return sendDrawReminderEmail(profile.email, profile.full_name || 'Golfer')
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
