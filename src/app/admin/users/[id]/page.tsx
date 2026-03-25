'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/admin/users/${id}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  const updateStatus = async (status: string) => {
    setSaving(true)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_status: status }),
    })
    setSaving(false)
    if (res.ok) load()
  }

  if (loading) return <div>Loading user profile...</div>
  if (!data) return <div>User not found.</div>

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-white">User Detail</h1>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
        <p className="text-white"><span className="font-bold">Name:</span> {data.profile.full_name || 'N/A'}</p>
        <p className="text-white"><span className="font-bold">Role:</span> {data.profile.role}</p>
        <p className="text-white"><span className="font-bold">Subscription:</span> {data.profile.subscription_status}</p>
        <div className="flex gap-2 pt-2">
          {['active', 'inactive', 'lapsed'].map((status) => (
            <button
              key={status}
              disabled={saving}
              onClick={() => updateStatus(status)}
              className="px-3 py-1 rounded-lg text-xs font-bold uppercase bg-indigo-600 text-white"
            >
              Set {status}
            </button>
          ))}
        </div>
      </div>

      <Section title="Scores">
        {(data.scores || []).length === 0 ? (
          <p className="text-indigo-300">No scores.</p>
        ) : (
          <ul className="space-y-2">
            {data.scores.map((s: any) => (
              <li key={s.id} className="text-white text-sm">{s.played_on}: {s.score}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Charity">
        {data.charity ? (
          <p className="text-white text-sm">
            {data.charity.charities?.name || 'Unknown'} ({data.charity.contribution_pct}%)
          </p>
        ) : (
          <p className="text-indigo-300">No charity selected.</p>
        )}
      </Section>

      <Section title="Wins">
        {(data.winners || []).length === 0 ? (
          <p className="text-indigo-300">No wins.</p>
        ) : (
          <ul className="space-y-2">
            {data.winners.map((w: any) => (
              <li key={w.id} className="text-white text-sm">
                Tier {w.tier} - £{(Number(w.prize_amount) / 100).toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      {children}
    </div>
  )
}
