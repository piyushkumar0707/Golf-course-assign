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

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('subscription_status', 'active')

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const profile of profiles) {
    const { data } = await supabase.auth.admin.getUserById(profile.id)
    if (data.user?.email) {
      await sendEmail({
        to: data.user.email,
        subject: 'Draw Reminder: Log your latest scores',
        text: 'Your monthly draw is approaching. Make sure your latest 5 scores are in before month end.',
      })
      sent++
    }
  }

  return NextResponse.json({ sent })
}
