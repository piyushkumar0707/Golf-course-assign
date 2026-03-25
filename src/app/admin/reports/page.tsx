import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminReportsPage() {
  const { role } = await getUser()
  if (role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const [{ count: activeSubscribers }, { data: pools }, { data: winners }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'active'),
    supabase
      .from('prize_pool')
      .select('total_pool')
      .order('draw_id', { ascending: false })
      .limit(12),
    supabase.from('winners').select('tier, prize_amount'),
  ])

  const currentMonthPrizePool = Number(pools?.[0]?.total_pool || 0)
  const totalPaidOut = (winners || []).reduce((sum, row) => sum + Number(row.prize_amount || 0), 0)
  const totalDonatedEstimate = Math.round((activeSubscribers || 0) * 1000 * 0.1)

  const tiers = { 3: 0, 4: 0, 5: 0 } as Record<number, number>
  for (const w of winners || []) tiers[w.tier] = (tiers[w.tier] || 0) + 1

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white">Reports & Analytics</h1>
        <p className="text-indigo-300 mt-2">Live operational and draw performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Active Subscribers" value={(activeSubscribers || 0).toLocaleString()} />
        <Card title="Current Prize Pool" value={`£${(currentMonthPrizePool / 100).toFixed(2)}`} />
        <Card title="Total Paid Out" value={`£${(totalPaidOut / 100).toFixed(2)}`} />
        <Card title="Estimated Charity Total" value={`£${(totalDonatedEstimate / 100).toFixed(2)}`} />
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h2 className="text-white text-xl font-bold mb-4">Draw Match Rates</h2>
        <div className="grid grid-cols-3 gap-4">
          <SmallCard label="Tier 5 Wins" value={tiers[5]} />
          <SmallCard label="Tier 4 Wins" value={tiers[4]} />
          <SmallCard label="Tier 3 Wins" value={tiers[3]} />
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h2 className="text-white text-xl font-bold mb-4">CSV Exports</h2>
        <div className="flex flex-wrap gap-3">
          <Link className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold" href="/api/admin/reports/export?type=users">
            Export Users
          </Link>
          <Link className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold" href="/api/admin/reports/export?type=winners">
            Export Winners
          </Link>
          <Link className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold" href="/api/admin/reports/export?type=draws">
            Export Draws
          </Link>
        </div>
      </div>
    </div>
  )
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      <p className="text-indigo-300 text-xs font-black uppercase tracking-widest">{title}</p>
      <p className="text-white text-3xl font-black mt-2">{value}</p>
    </div>
  )
}

function SmallCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4">
      <p className="text-indigo-300 text-xs font-black uppercase tracking-widest">{label}</p>
      <p className="text-white text-2xl font-black mt-1">{value}</p>
    </div>
  )
}
