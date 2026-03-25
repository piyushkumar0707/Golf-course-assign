import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function DrawResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: draw } = await supabase
    .from('draws')
    .select('*, prize_pool(*)')
    .eq('id', id)
    .single()

  if (!draw || draw.status !== 'published') return notFound()

  const pool = draw.prize_pool[0] || {}

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        {new Date(draw.year, draw.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} Draw Results
      </h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8 mt-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Winning Numbers</h3>
        </div>
        <div className="px-4 py-8 sm:px-6 flex justify-center gap-4">
          {draw.winning_numbers.map((n: number, i: number) => (
            <div 
              key={i} 
              className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-600 text-white text-2xl font-bold animate-bounce shadow-lg"
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winners</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prize per Winner</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900">5 Numbers (Jackpot)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.winners_tier_5 || 0}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {pool.winners_tier_5 > 0 ? `£${(pool.pool_tier_5 / pool.winners_tier_5 / 100).toFixed(2)}` : 'Rolled over'}
              </td>
            </tr>
            <tr>
              <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900">4 Numbers</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.winners_tier_4 || 0}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                £{pool.winners_tier_4 > 0 ? (pool.pool_tier_4 / pool.winners_tier_4 / 100).toFixed(2) : '0.00'}
              </td>
            </tr>
            <tr>
              <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900">3 Numbers</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.winners_tier_3 || 0}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                £{pool.winners_tier_3 > 0 ? (pool.pool_tier_3 / pool.winners_tier_3 / 100).toFixed(2) : '0.00'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {pool.winners_tier_5 === 0 && draw.jackpot_carry_out > 0 && (
        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No 5-match winners this month. The jackpot of <span className="font-bold">£{(draw.jackpot_carry_out / 100).toFixed(2)}</span> has rolled over to the next draw!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
