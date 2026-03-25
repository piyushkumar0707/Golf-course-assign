import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { resolveSubscriptionStatus } from '@/lib/subscription-status'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('Stripe-Signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Use service role for webhook reconciliation writes.
  const supabase = createServiceRoleClient()

  const findUserIdByCustomer = async (customerId: string): Promise<string | null> => {
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()

    if (existing?.user_id) return existing.user_id

    try {
      const customer = (await stripe.customers.retrieve(customerId)) as any
      return customer?.metadata?.supabase_uuid || null
    } catch {
      return null
    }
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const userId =
        (session.client_reference_id as string | null) ||
        (session.metadata?.supabase_uuid as string | undefined) ||
        null

      if (userId) {
        await resolveSubscriptionStatus({
          userId,
          userEmail: (session.customer_email as string | null) || null,
          supabase,
        })
      }
    }

    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as any
      const customerId = String(subscription.customer)
      const userId =
        (subscription.metadata?.supabase_uuid as string | undefined) ||
        (await findUserIdByCustomer(customerId))

      if (userId) {
        await resolveSubscriptionStatus({
          userId,
          userEmail: null,
          supabase,
        })
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any
      const customerId = String(subscription.customer)
      const userId =
        (subscription.metadata?.supabase_uuid as string | undefined) ||
        (await findUserIdByCustomer(customerId))

      if (userId) {
        await resolveSubscriptionStatus({
          userId,
          userEmail: null,
          supabase,
        })
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any
      await supabase.from('subscriptions').update({
        status: 'cancelled',
      }).eq('stripe_subscription_id', subscription.id)

      const { data } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', subscription.id).single()
      if (data?.user_id) {
        await supabase.from('profiles').update({
          subscription_status: 'inactive'
        }).eq('id', data.user_id)
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as any
      const subscriptionId = invoice.subscription
      await supabase.from('subscriptions').update({
        status: 'lapsed'
      }).eq('stripe_subscription_id', subscriptionId)

      const { data } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', subscriptionId).single()
      if (data?.user_id) {
        // TODO: trigger lapsed email
        await supabase.from('profiles').update({
          subscription_status: 'lapsed'
        }).eq('id', data.user_id)
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as any
      const subscriptionId = invoice.subscription

      const { data } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      if (data?.user_id) {
        await supabase
          .from('profiles')
          .update({ subscription_status: 'active' })
          .eq('id', data.user_id)
      }
    }
  } catch (err: any) {
    return new NextResponse(`Webhook Handler Error: ${err.message}`, { status: 500 })
  }

  return new NextResponse('OK', { status: 200 })
}
