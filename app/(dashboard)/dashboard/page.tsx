import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/shared/FadeIn'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch multiple sets of data in parallel
  const [profileResult, subResult, scoresResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('scores').select('*').eq('user_id', user.id).order('played_on', { ascending: false }).limit(5)
  ])

  const profile = profileResult.data
  const subscription = subResult.data
  const scores = scoresResult.data || []

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {profile?.full_name || 'Golfer'}. Here's your current standing.
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{subscription?.plan || 'None'}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                Status:{' '}
                <Badge variant={subscription?.status === 'active' ? 'default' : 'destructive'} className="capitalize bg-green-600/20 text-green-700 hover:bg-green-600/30">
                  {subscription?.status || 'Inactive'}
                </Badge>
              </p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Valid Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scores.length} / 5</div>
              <p className="text-xs text-muted-foreground mt-1">
                {scores.length === 5 ? 'Ready for draw.' : `Need ${5 - scores.length} more to qualify.`}
              </p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Charity Match</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.charity_percent || 10}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Donated to selected partner.
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.4}>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Scores Summary</CardTitle>
            <CardDescription>Your rolling 5 scores matching against the global draw.</CardDescription>
          </CardHeader>
          <CardContent>
            {scores.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {scores.map((s) => (
                  <div key={s.id} className="flex flex-col items-center justify-center bg-muted rounded-md p-4 w-24 h-24">
                    <span className="text-3xl font-black text-primary">{s.score}</span>
                    <span className="text-xs text-muted-foreground mt-2">{new Date(s.played_on).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No scores recorded yet. Head over to My Scores to log your first round!</p>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
