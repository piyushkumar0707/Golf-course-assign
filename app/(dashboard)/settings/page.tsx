import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/shared/FadeIn'
import { BillingButton } from './BillingButton'

export default async function DashboardSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status, stripe_customer_id, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="space-y-8 max-w-2xl">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your billing, subscription, and account preferences.</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>Billing & Subscription</CardTitle>
            <CardDescription>
              Manage your payment method, upgrade/downgrade your plan, or cancel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 text-sm border-b pb-3">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium capitalize text-right">{subscription.plan}</span>
                </div>
                <div className="grid grid-cols-2 text-sm border-b pb-3">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium capitalize text-right ${subscription.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                    {subscription.status}
                  </span>
                </div>
                {subscription.current_period_end && (
                  <div className="grid grid-cols-2 text-sm pb-3">
                    <span className="text-muted-foreground">Next Renewal</span>
                    <span className="font-medium text-right text-sm">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <BillingButton stripeCustomerId={subscription.stripe_customer_id} />
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No active subscription found.{' '}
                <a href="/subscribe" className="text-primary underline">Subscribe now →</a>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
