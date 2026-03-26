import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/shared/FadeIn'
import { DrawManager } from './DrawManager'
import { Badge } from '@/components/ui/badge'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  simulated: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
}

const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default async function AdminDrawsPage() {
  const { data: draws } = await supabaseAdmin
    .from('draws')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  return (
    <div className="space-y-8 max-w-6xl">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Draw Manager</h1>
          <p className="text-muted-foreground mt-2">
            Simulate and publish monthly prize draws. Publishing is irreversible.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>Create / Publish Draw</CardTitle>
            <CardDescription>Configure and run the draw engine for a specific month.</CardDescription>
          </CardHeader>
          <CardContent>
            <DrawManager />
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle>Draw History</CardTitle>
            <CardDescription>All past draws by most recent first.</CardDescription>
          </CardHeader>
          <CardContent>
            {draws && draws.length > 0 ? (
              <div className="space-y-3">
                {draws.map((draw) => (
                  <div key={draw.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/40 transition-colors">
                    <div>
                      <p className="font-semibold">{monthNames[draw.month]} {draw.year}</p>
                      <p className="text-xs text-muted-foreground capitalize">{draw.draw_type} draw · Numbers: [{draw.winning_numbers?.join(', ')}]</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {draw.jackpot_carry_out > 0 && (
                        <span className="text-xs text-amber-600">Jackpot rolled → £{(draw.jackpot_carry_out/100).toFixed(2)}</span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[draw.status] || 'bg-gray-100 text-gray-800'}`}>
                        {draw.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No draws have been published yet.
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
