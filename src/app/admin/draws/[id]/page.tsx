import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDrawDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: draw }, { data: winners }] = await Promise.all([
    supabase.from('draws').select('*, prize_pool(*)').eq('id', id).single(),
    supabase
      .from('winners')
      .select('id, user_id, tier, prize_amount, proof_status, payment_status')
      .eq('draw_id', id),
  ])

  if (!draw) return notFound()
  const pool = draw.prize_pool?.[0]

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-white">
        Draw {draw.month}/{draw.year} ({draw.draw_type})
      </h1>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Winning Numbers</h2>
        <div className="flex gap-2">
          {(draw.winning_numbers || []).map((n: number, i: number) => (
            <span key={i} className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
              {n}
            </span>
          ))}
        </div>
      </div>

      {pool && (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Tier Breakdown</h2>
          <ul className="space-y-2 text-white">
            <li>Tier 5 winners: {pool.winners_tier_5}</li>
            <li>Tier 4 winners: {pool.winners_tier_4}</li>
            <li>Tier 3 winners: {pool.winners_tier_3}</li>
          </ul>
        </div>
      )}

      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Winners</h2>
        {(!winners || winners.length === 0) ? (
          <p className="text-indigo-300">No winners in this draw.</p>
        ) : (
          <ul className="space-y-2 text-white text-sm">
            {winners.map((w) => (
              <li key={w.id}>
                {w.user_id} - Tier {w.tier} - £{(Number(w.prize_amount) / 100).toFixed(2)} - {w.proof_status}/{w.payment_status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
