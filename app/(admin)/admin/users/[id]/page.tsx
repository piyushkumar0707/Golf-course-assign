import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/shared/FadeIn'
import { AdminUserActions } from './AdminUserActions'
import { AdminScoreManager } from './AdminScoreManager'

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const userId = params.id

  // Fetch all user context in parallel using Admin Client (Bypass RLS)
  const [
    { data: profile },
    { data: subscription },
    { data: scores },
    { data: winners },
    { data: charity }
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
    supabaseAdmin.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from('scores').select('*').eq('user_id', userId).order('played_on', { descending: true }),
    supabaseAdmin.from('winners').select('*, draws(month, year)').eq('user_id', userId).order('created_at', { descending: true }),
    // To get charity details, we need the user's charity_id
    supabaseAdmin.from('profiles').select('charity_id, charity_percent, charities(name)').eq('id', userId).single()
  ])

  if (!profile) {
    return <div>User not found.</div>
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User: {profile.full_name || 'Unnamed'}</h1>
          <p className="text-muted-foreground mt-2">
            ID: {profile.id}  |  Role: <span className="capitalize">{profile.role}</span>
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-2">
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Profile & Subscription</CardTitle>
              <CardDescription>System overrides and account state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 text-sm border-b pb-2">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-right">{profile.email || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 text-sm border-b pb-2">
                  <span className="text-muted-foreground">Subscription ID:</span>
                  <span className="font-medium text-right font-mono text-xs">{subscription?.stripe_subscription_id || 'None'}</span>
                </div>
                <div className="grid grid-cols-2 text-sm border-b pb-2">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium text-right capitalize ${profile.subscription_status === 'active' ? 'text-green-600' : 'text-slate-600'}`}>
                    {profile.subscription_status || 'Inactive'}
                  </span>
                </div>
                <div className="pt-4">
                  <h4 className="font-medium mb-2 text-sm">Admin Overrides</h4>
                  <AdminUserActions userId={userId} currentStatus={profile.subscription_status} />
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Partner Charity</CardTitle>
              <CardDescription>Current selected contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/20 text-center h-full">
                {charity?.charity_id ? (
                  <>
                    <Heart className="h-8 w-8 text-primary mb-2" />
                    <h3 className="text-xl font-bold">{charity.charities?.name || 'Unknown'}</h3>
                    <p className="text-muted-foreground">Receiving {charity.charity_percent}% of net contribution</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">User has not selected a charity yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle>Rolling Scores</CardTitle>
            <CardDescription>
              Admin score management. Any deletions or edits will be logged to the audit table.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminScoreManager userId={userId} scores={scores || []} />
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.4}>
        <Card>
          <CardHeader>
            <CardTitle>Winnings History</CardTitle>
            <CardDescription>All recorded tier matches for this user.</CardDescription>
          </CardHeader>
          <CardContent>
             {winners && winners.length > 0 ? (
                <div className="space-y-4">
                  {winners.map((win) => (
                    <div key={win.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <div className="font-bold">{win.tier}-Match</div>
                        <div className="text-xs text-muted-foreground">Draw: {win.draws?.month}/{win.draws?.year}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">£{(win.prize_amount / 100).toFixed(2)}</div>
                        <div className="text-xs capitalize text-muted-foreground">{win.status || win.payment_status}</div>
                      </div>
                    </div>
                  ))}
                </div>
             ) : (
               <div className="text-center py-8 text-muted-foreground">No winnings recorded for this user.</div>
             )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}

// Temporary inline Heart icon if not exported from lucide directly here
import { Heart } from 'lucide-react'
