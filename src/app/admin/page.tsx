import { createClient } from '@/lib/supabase/server'

export default async function AdminOverview() {
  const supabase = await createClient()

  const [
    { count: activeSubscribers },
    { count: totalUsers },
    { data: latestPool },
    { count: pendingProofs },
    { count: unpaidWinners },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'active'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('prize_pool')
      .select('total_pool')
      .order('draw_id', { ascending: false })
      .limit(1),
    supabase
      .from('winners')
      .select('id', { count: 'exact', head: true })
      .eq('proof_status', 'pending'),
    supabase
      .from('winners')
      .select('id', { count: 'exact', head: true })
      .neq('payment_status', 'paid'),
  ])

  const currentPrizePool = Number(latestPool?.[0]?.total_pool || 0)

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-indigo-800/20 p-8 rounded-3xl border border-white/5 shadow-2xl">
        <div>
          <h1 className="text-5xl font-black text-white mb-2">Platform Overview</h1>
          <p className="text-indigo-400 font-bold uppercase tracking-widest">Live statistics</p>
        </div>
        <div className="bg-indigo-600/20 px-4 py-2 rounded-full border border-indigo-500/30 flex items-center gap-2">
          <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-green-400 shadow"></span>
          <span className="text-xs font-black uppercase tracking-tighter text-indigo-300">System Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Total Users" value={(totalUsers || 0).toLocaleString()} color="indigo" />
        <StatCard title="Active Subscribers" value={(activeSubscribers || 0).toLocaleString()} color="green" />
        <StatCard title="Current Prize Pool" value={`£${(currentPrizePool / 100).toFixed(2)}`} color="pink" />
        <StatCard title="Pending Proofs" value={(pendingProofs || 0).toLocaleString()} color="yellow" />
        <StatCard title="Unpaid Winners" value={(unpaidWinners || 0).toLocaleString()} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 h-56 flex flex-col justify-center items-center text-center">
          <h3 className="text-indigo-300 font-black uppercase text-sm mb-4">Operational Summary</h3>
          <p className="text-white/70 font-medium max-w-md leading-relaxed">
            Use Users, Draws, Winners, and Reports sections to run monthly cycles, review proofs, and export audit-ready data.
          </p>
        </div>
        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 h-56 flex flex-col justify-center items-center text-center">
          <h3 className="text-indigo-300 font-black uppercase text-sm mb-4">Next Actions</h3>
          <p className="text-white/70 font-medium max-w-md leading-relaxed">
            Run a simulation before publishing each draw, then process pending winner proofs and payouts.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'from-indigo-600 to-indigo-800 border-indigo-400/30',
    green: 'from-emerald-600 to-emerald-800 border-emerald-400/30',
    pink: 'from-fuchsia-600 to-fuchsia-800 border-fuchsia-400/30',
    yellow: 'from-amber-500 to-amber-700 border-amber-400/30',
    orange: 'from-orange-500 to-orange-700 border-orange-400/30',
  }

  return (
    <div className={`p-8 rounded-3xl bg-linear-to-br shadow-2xl border ${colors[color]} ring-1 ring-white/5`}>
      <h3 className="text-white/60 font-black uppercase text-[10px] tracking-widest mb-2">{title}</h3>
      <p className="text-white font-black text-3xl tracking-tighter">{value}</p>
    </div>
  )
}
