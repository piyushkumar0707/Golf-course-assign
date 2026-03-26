import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/shared/FadeIn'
import { ProofUploadForm } from './ProofUploadForm'

export default async function ProofsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch winner records
  const { data: winners } = await supabase
    .from('winners')
    .select('*, draw_entries(draw_id, scores)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 max-w-5xl">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Winnings & Proofs</h1>
          <p className="text-muted-foreground mt-2">
            View your draw winnings. To claim your prize, upload evidence confirming your qualifying golf scores.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="space-y-6">
          {winners && winners.length > 0 ? (
            winners.map((win) => {
              const amountGBP = (win.prize_amount / 100).toFixed(2)
              const status = win.payment_status === 'paid' ? 'paid' : win.proof_status
              
              return (
                <Card key={win.id} className="overflow-hidden">
                  <div className="border-b bg-muted/20 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg">{win.tier}-Number Match</h3>
                      <p className="text-sm text-muted-foreground">Won on {new Date(win.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="text-2xl font-black text-primary">£{amountGBP}</div>
                      <Badge variant={
                        status === 'paid' ? 'default' :
                        status === 'approved' ? 'secondary' :
                        status === 'rejected' ? 'destructive' : 'outline'
                      } className={status === 'paid' ? 'bg-green-600 hover:bg-green-700' : ''}>
                        {status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-6">
                    {(status === 'awaiting' || status === 'rejected') ? (
                      <div className="space-y-4">
                        {status === 'rejected' && (
                          <div className="p-3 border border-destructive/50 bg-destructive/10 text-destructive text-sm rounded-md">
                            <strong>Proof rejected.</strong> {win.rejection_reason || 'Please ensure the screenshot clearly shows your score and date.'}
                          </div>
                        )}
                        <ProofUploadForm winnerId={win.id} />
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {status === 'pending' && 'Your proof is under review. You will be notified once verified.'}
                        {status === 'approved' && 'Your proof was approved! Payment is processing.'}
                        {status === 'paid' && 'Prize paid out successfully.'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          ) : (
             <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <p>You haven't won any draws yet.</p>
                <p className="text-sm mt-2">Keep playing and maintaining those 5 rolling scores!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </FadeIn>
    </div>
  )
}
