import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/shared/FadeIn'
import { WinnerCard } from './WinnerCard'

export default async function AdminWinnersPage({
  searchParams,
}: {
  searchParams: { draw?: string; status?: string }
}) {
  const { draw, status } = searchParams

  // Fetch draws for the filter dropdown
  const { data: draws } = await supabaseAdmin
    .from('draws')
    .select('id, month, year')
    .eq('status', 'published')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  let query = supabaseAdmin
    .from('winners')
    .select('*, profiles(full_name, email), draws(month, year)')
    .order('created_at', { ascending: false })

  if (draw) query = query.eq('draw_id', draw)
  if (status) {
    if (status === 'paid') query = query.eq('payment_status', 'paid')
    else query = query.eq('proof_status', status)
  }

  const { data: winners } = await query

  const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-6 max-w-6xl">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Winner Verification</h1>
          <p className="text-muted-foreground mt-2">
            Review submitted proofs and manage prize payouts.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        {/* Filter Bar */}
        <div className="flex gap-4 flex-wrap">
          <form className="flex gap-2 flex-wrap">
            <select name="draw" defaultValue={draw || ''}
              className="border rounded-md px-3 py-2 text-sm bg-background"
              onChange={e => { const u = new URL(window.location.href); u.searchParams.set('draw', e.target.value); window.location.href = u.toString() }}>
              <option value="">All Draws</option>
              {draws?.map(d => (
                <option key={d.id} value={d.id}>{monthNames[d.month]} {d.year}</option>
              ))}
            </select>
            <select name="status" defaultValue={status || ''}
              className="border rounded-md px-3 py-2 text-sm bg-background"
              onChange={e => { const u = new URL(window.location.href); u.searchParams.set('status', e.target.value); window.location.href = u.toString() }}>
              <option value="">All Statuses</option>
              <option value="awaiting">Awaiting</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
            </select>
          </form>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="space-y-4">
          {winners && winners.length > 0 ? (
            winners.map((winner) => (
              <WinnerCard key={winner.id} winner={winner} />
            ))
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
                No winners found matching your filters.
              </CardContent>
            </Card>
          )}
        </div>
      </FadeIn>
    </div>
  )
}
