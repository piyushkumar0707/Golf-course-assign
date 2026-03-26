import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreForm } from './ScoreForm'
import { FadeIn } from '@/components/shared/FadeIn'
import { DeleteScoreButton } from './DeleteScoreButton'

export default async function ScoresPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('played_on', { ascending: false })

  return (
    <div className="space-y-8 max-w-5xl">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Scores</h1>
          <p className="text-muted-foreground mt-2">
            Log your Stableford points. Only your latest 5 rounds are kept and entered into the draw.
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <FadeIn delay={0.1} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Log a Round</CardTitle>
              <CardDescription>Enter your points between 1 and 45.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreForm />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Rounds</CardTitle>
              <CardDescription>
                {scores?.length === 5 
                  ? "You have 5 qualifying scores. Ready for the next draw." 
                  : `You have ${scores?.length || 0} scores. Log ${5 - (scores?.length || 0)} more to qualify.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scores && scores.length > 0 ? (
                <div className="space-y-4">
                  {scores.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {s.score}
                        </div>
                        <div>
                          <p className="font-medium text-sm">Round {5 - idx}</p>
                          <p className="text-xs text-muted-foreground">{new Date(s.played_on).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <DeleteScoreButton scoreId={s.id} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>You haven't logged any scores yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}
