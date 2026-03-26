import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { customerId } = await req.json()

  if (!customerId) {
    return NextResponse.json({ error: 'No customer ID provided' }, { status: 400 })
  }

  try {
    const session = await (stripe as any).billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Billing portal error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create portal session' }, { status: 500 })
  }
}
