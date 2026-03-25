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

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const customerId = session.customer
      const subscriptionId = session.subscription
      const userId = session.client_reference_id

      if (userId) {
        const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as any
        const periodEnd = typeof subscription.current_period_end === 'number' 
          ? subscription.current_period_end 
          : (subscription.current_period_end as any)?.getTime?.() / 1000 || Math.floor(Date.now() / 1000)
        
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan: subscription.items.data[0].price.id === process.env.STRIPE_PRICE_MONTHLY ? 'monthly' : 'yearly',
          status: subscription.status,
          current_period_end: new Date(periodEnd * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' })

        await supabase.from('profiles').update({
          subscription_status: 'active'
        }).eq('id', userId)
      }
    }

    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as any
      const customerId = subscription.customer
      const periodEnd = typeof subscription.current_period_end === 'number' 
        ? subscription.current_period_end 
        : (subscription.current_period_end as any)?.getTime?.() / 1000 || Math.floor(Date.now() / 1000)
      
      // Find user by customer ID
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (subData?.user_id) {
        // Subscription already exists, just update it
        await supabase.from('subscriptions').update({
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          plan: subscription.items.data[0].price.id === process.env.STRIPE_PRICE_MONTHLY ? 'monthly' : 'yearly',
          current_period_end: new Date(periodEnd * 1000).toISOString()
        }).eq('stripe_customer_id', customerId)

        await supabase
          .from('profiles')
          .update({ subscription_status: mapStripeStatusToProfileStatus(subscription.status) })
          .eq('id', subData.user_id)
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any
      const periodEnd = typeof subscription.current_period_end === 'number' 
        ? subscription.current_period_end 
        : (subscription.current_period_end as any)?.getTime?.() / 1000 || Math.floor(Date.now() / 1000)
      
      await supabase.from('subscriptions').update({
        status: subscription.status,
        current_period_end: new Date(periodEnd * 1000).toISOString()
      }).eq('stripe_subscription_id', subscription.id)

      const { data } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (data?.user_id) {
        await supabase
          .from('profiles')
          .update({ subscription_status: mapStripeStatusToProfileStatus(subscription.status) })
          .eq('id', data.user_id)
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
  } catch (err: any) {
    return new NextResponse(`Webhook Handler Error: ${err.message}`, { status: 500 })
  }

  return new NextResponse('OK', { status: 200 })
}
