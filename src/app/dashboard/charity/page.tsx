'use client'

import { useState, useEffect } from 'react'

export default function DashboardCharityPage() {
  const [userCharity, setUserCharity] = useState<any>(null)
  const [allCharities, setAllCharities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newPct, setNewPct] = useState(10)
  const [selectedId, setSelectedId] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, aRes] = await Promise.all([
          fetch('/api/user/charity'),
          fetch('/api/charities')
        ])

        if (uRes.status === 401) {
          if (typeof window !== 'undefined') {
            window.location.assign('/login')
          }
          return
        }

        if (!uRes.ok || !aRes.ok) {
          throw new Error('Failed to load charity data')
        }

        const uData = await uRes.json()
        const aData = await aRes.json()
        
        setUserCharity(uData)
        setAllCharities(aData)
        if (uData) {
          setNewPct(uData.contribution_pct)
          setSelectedId(uData.charity_id)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/user/charity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charity_id: selectedId, contribution_pct: newPct })
      })
      if (res.ok) {
        const updated = await res.json()
        setUserCharity(updated)
        setMessage('Impact updated successfully.')
      } else {
        setMessage(await res.text())
      }
    } catch (e) {
      console.error(e)
      setMessage('Failed to update impact settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Loading impact dashboard...</div>

  return (
    <div className="max-w-5xl">
      {message && (
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-semibold text-indigo-700">
          {message}
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Charity Impact</h1>
      <p className="text-gray-500 mb-10 text-lg">You are currently contributing <span className="text-indigo-600 font-bold">{userCharity?.contribution_pct || 10}%</span> of your subscription to <span className="text-indigo-600 font-bold">{userCharity?.charities?.name || 'an amazing cause'}</span>.</p>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-8 rounded-xl shadow-lg ring-1 ring-gray-900/5 transition-shadow hover:shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                 <span className="p-2 bg-indigo-50 rounded text-indigo-600">🏛️</span> Select Charity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-100 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-indigo-200">
                {allCharities.map((c) => (
                  <label key={c.id} className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedId === c.id ? 'border-indigo-600 bg-indigo-50 shadow-inner' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="charity"
                      value={c.id}
                      checked={selectedId === c.id}
                      onChange={() => setSelectedId(c.id)}
                      className="mt-1 h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-4">
                      <p className="font-bold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                    </div>
                  </label>
                ))}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-xl shadow-lg ring-1 ring-gray-900/5 transition-shadow hover:shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                 <span className="p-2 bg-indigo-50 rounded text-indigo-600">📈</span> Contribution Level
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-gray-700 uppercase tracking-tighter">
                   <span>Minimum</span>
                   <span className="text-indigo-600 text-lg">{newPct}%</span>
                   <span>100%</span>
                </div>
                <label htmlFor="contribution-range" className="sr-only">Contribution percentage</label>
                <input
                  id="contribution-range"
                  type="range"
                  min="10"
                  max="100"
                  value={newPct}
                  onChange={(e) => setNewPct(parseInt(e.target.value))}
                  className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <p className="text-xs text-gray-400 font-medium italic">You can change this at any time. Higher percentage = more impact per month.</p>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-4">
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Monthly Charge</span>
                    <span className="text-gray-900 font-bold">£10.00</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Monthly Donation</span>
                    <span className="text-indigo-600 font-bold">£{(10 * newPct / 100).toFixed(2)}</span>
                 </div>
              </div>
              <button
                type="submit"
                disabled={saving || !selectedId}
                className="mt-10 w-full bg-indigo-600 text-white py-4 rounded-lg font-bold shadow-xl hover:bg-indigo-700 disabled:bg-gray-400 transition-all hover:scale-[1.02]"
              >
                {saving ? 'Saving...' : 'Confirm Impact Settings'}
              </button>
           </div>
        </div>
      </form>
    </div>
  )
}
