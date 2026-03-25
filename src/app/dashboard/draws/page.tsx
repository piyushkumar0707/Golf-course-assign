'use client'

import { useEffect, useState } from 'react'

export default function DashboardDrawsPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [drawRes, winRes] = await Promise.all([
          fetch('/api/draws'),
          fetch('/api/winners'),
        ])

        const draws = drawRes.ok ? await drawRes.json() : []
        const wins: Array<{ draw_id: string; tier: number; prize_amount: number }> =
          winRes.ok ? await winRes.json() : []

        const winsByDraw = new Map<string, { draw_id: string; tier: number; prize_amount: number }>(
          wins.map((w) => [w.draw_id, w])
        )
        const mapped = draws.map((d: any) => {
          const win = winsByDraw.get(d.id)
          return {
            draw: d,
            result: win ? `Tier ${win.tier}` : 'No match',
            tier: win?.tier ?? null,
            prize: win?.prize_amount ?? 0,
          }
        })

        setEntries(mapped)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) return <div>Loading draw entries...</div>

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Draw Entries</h1>
      {entries.length === 0 ? (
        <p className="text-gray-500">No published draws yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Draw</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Result</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Prize</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((row: any) => (
                <tr key={row.draw.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(row.draw.year, row.draw.month - 1).toLocaleString('default', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.result}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.tier ?? '-'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    £{(Number(row.prize) / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
