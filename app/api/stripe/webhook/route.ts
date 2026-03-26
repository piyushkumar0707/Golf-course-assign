import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`)
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  // Handle the event according to PRD Sec 8
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.supabaseUUID
        if (!userId) break

        const subscriptionId = session.subscription as string
        const customerId = session.customer as string
        const plan = session.metadata?.plan || 'monthly'

        // Retrieve subscription details to get period start/end
        const subResponse = await stripe.subscriptions.retrieve(subscriptionId)
        const sub = subResponse as any

        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan: plan,
          status: 'active',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString()
        }, { onConflict: 'stripe_subscription_id' })

        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        await supabaseAdmin.from('subscriptions').update({
          status: sub.status === 'active' || sub.status === 'trialing' ? 'active' : 'lapsed',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString()
        }).eq('stripe_subscription_id', sub.id)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        await supabaseAdmin.from('subscriptions').update({
          status: 'cancelled'
        }).eq('stripe_subscription_id', sub.id)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string
        if (subscriptionId) {
          await supabaseAdmin.from('subscriptions').update({
            status: 'lapsed'
          }).eq('stripe_subscription_id', subscriptionId)
        }
        break
      }
      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (error) {
    console.error('Error handling webhook:', error)
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
