import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function mapStripeStatusToProfileStatus(status: string): 'active' | 'lapsed' | 'inactive' {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete' || status === 'incomplete_expired') {
    return 'lapsed'
  }
  return 'inactive'
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('Stripe-Signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Use service role for webhooks
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const getPeriodEndIso = (subscription: any) => {
    const periodEnd =
      typeof subscription.current_period_end === 'number'
        ? subscription.current_period_end
        : (subscription.current_period_end as any)?.getTime?.() / 1000 || Math.floor(Date.now() / 1000)
    return new Date(periodEnd * 1000).toISOString()
  }

  const findUserIdByCustomer = async (customerId: string): Promise<string | null> => {
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (existing?.user_id) return existing.user_id

    const customer = (await stripe.customers.retrieve(customerId)) as any
    const userId = customer?.metadata?.supabase_uuid

    if (!userId) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    return profile?.id ?? null
  }

  const resolveUserId = async (customerId: string, fallbackUserId?: string | null): Promise<string | null> => {
    if (fallbackUserId) {
      return fallbackUserId
    }

    return findUserIdByCustomer(customerId)
  }

  const upsertSubscriptionForCustomer = async (
    subscription: any,
    customerId: string,
    fallbackUserId?: string | null
  ): Promise<string | null> => {
    const resolvedUserId = await resolveUserId(customerId, fallbackUserId)

    const payload: Record<string, any> = {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan: subscription.items.data[0].price.id === process.env.STRIPE_PRICE_MONTHLY ? 'monthly' : 'yearly',
      current_period_end: getPeriodEndIso(subscription),
    }

    // Never overwrite an existing user link with null.
    if (resolvedUserId) {
      payload.user_id = resolvedUserId
    }

    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert(payload, { onConflict: 'stripe_customer_id' })

    if (upsertError) {
      throw upsertError
    }

    if (resolvedUserId) {
      return resolvedUserId
    }

    const { data: linked } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    return linked?.user_id ?? null
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const customerId = String(session.customer)
      const subscriptionId = String(session.subscription)
      const fallbackUserId = session.client_reference_id as string | null
      const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as any

      try {
        const userId = await upsertSubscriptionForCustomer(subscription, customerId, fallbackUserId)
        if (userId) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ subscription_status: 'active' })
            .eq('id', userId)

          if (profileError) {
            console.error('Webhook checkout profile update failed:', profileError)
            throw profileError
          }
        }
      } catch (upsertError) {
        console.error('Webhook checkout upsert failed:', upsertError)
        throw upsertError
      }
    }

    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as any
      const customerId = String(subscription.customer)
      const fallbackUserId = (subscription.metadata?.supabase_uuid as string | undefined) || null
      const userId = await upsertSubscriptionForCustomer(subscription, customerId, fallbackUserId)

      if (userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ subscription_status: mapStripeStatusToProfileStatus(subscription.status) })
          .eq('id', userId)

        if (profileError) {
          console.error('Webhook subscription.created profile update failed:', profileError)
          throw profileError
        }
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any
      const customerId = String(subscription.customer)
      const fallbackUserId = (subscription.metadata?.supabase_uuid as string | undefined) || null
      const userId = await upsertSubscriptionForCustomer(subscription, customerId, fallbackUserId)

      if (userId) {
        await supabase
          .from('profiles')
          .update({ subscription_status: mapStripeStatusToProfileStatus(subscription.status) })
          .eq('id', userId)
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
