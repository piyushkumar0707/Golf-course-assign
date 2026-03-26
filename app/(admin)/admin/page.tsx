import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/shared/FadeIn'
import { Users, Coins, Heart, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function AdminDashboardPage() {
  // Aggregate stats using service role client to bypass User RLS restrictions for globals
  const [
    { count: activeSubscribers },
    { data: charities },
    { data: allSubscriptions }
  ] = await Promise.all([
    supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('charities').select('id, name').eq('is_active', true),
    supabaseAdmin.from('subscriptions').select('id, plan, status')
  ])

  // Simple current prize pool estimation (not exact unless recorded in draws, but shows live potential)
  // For monthly, £10 = 1000 pence. 
  // Here we just calculate baseline sub revenue
  const monthlyCount = allSubscriptions?.filter(s => s.status === 'active' && s.plan === 'monthly').length || 0
  const yearlyCount = allSubscriptions?.filter(s => s.status === 'active' && s.plan === 'yearly').length || 0
  
  // Assuming yearly counts as £100/12 per month roughly for live pool, or we just use £10 flat equivalent.
  // Standardizing: 1 entry = £10. So (monthlyCount + yearlyCount) * £10
  const totalSubscribers = monthlyCount + yearlyCount
  const liveMonthlyRevenuePence = totalSubscribers * 1000
  const livePrizePool = (liveMonthlyRevenuePence * 0.40) + (liveMonthlyRevenuePence * 0.35) + (liveMonthlyRevenuePence * 0.25)
  const totalDonatedPotential = liveMonthlyRevenuePence * 0.10 // minimum 10% guarantee

  return (
    <div className="space-y-8 max-w-6xl">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Reports</h1>
            <p className="text-muted-foreground mt-2">
              High-level overview of the Golf Charity platform performance.
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/api/admin/reports/export?type=users">
              <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Users CSV</Button>
            </a>
            <a href="/api/admin/reports/export?type=winners">
              <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Winners CSV</Button>
            </a>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-3">
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeSubscribers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthlyCount} Monthly / {yearlyCount} Yearly
              </p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Live Prize Pool Estimate</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">£{(livePrizePool / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pot available for next draw
              </p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Monthly Charity Impact</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">£{(totalDonatedPotential / 100).toFixed(2)}+</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {charities?.length || 0} active partners
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Put Draw history chart or tables here later */}
    </div>
  )
}
