import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/mailer'

function isAuthorized(req: Request) {
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return new NextResponse('Unauthorized', { status: 401 })

  const supabase = await createClient()

  const in3Days = new Date()
  in3Days.setDate(in3Days.getDate() + 3)

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id, current_period_end, status')
    .in('status', ['active', 'trialing'])

  let sent = 0

  for (const sub of subs || []) {
    if (!sub.current_period_end) continue
    const end = new Date(sub.current_period_end)
    if (Math.abs(end.getTime() - in3Days.getTime()) > 24 * 60 * 60 * 1000) continue

    const { data } = await supabase.auth.admin.getUserById(sub.user_id)
    if (data.user?.email) {
      await sendEmail({
        to: data.user.email,
        subject: 'Subscription renewal reminder',
        text: 'Your subscription is due for renewal in about 3 days. You can manage billing in your dashboard.',
      })
      sent++
    }
  }

  return NextResponse.json({ sent })
}
