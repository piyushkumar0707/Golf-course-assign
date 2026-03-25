'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mocking analytics fetch for now
    setTimeout(() => {
      setStats({
        activeSubscribers: 1254,
        prizePool: 627000, // pence
        totalDonated: 4500000, // pence
        pendingWinners: 12
      })
      setLoading(false)
    }, 500)
  }, [])

  if (loading) return <div>Analyzing platform health...</div>

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-indigo-800/20 p-8 rounded-3xl border border-white/5 shadow-2xl">
         <div>
            <h1 className="text-5xl font-black text-white mb-2">Platform Overview</h1>
            <p className="text-indigo-400 font-bold uppercase tracking-widest">Live statistics & analytics</p>
         </div>
         <div className="bg-indigo-600/20 px-4 py-2 rounded-full border border-indigo-500/30 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-green-400 shadow"></span>
            <span className="text-xs font-black uppercase tracking-tighter text-indigo-300">System Live</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Subscribers" value={stats.activeSubscribers.toLocaleString()} color="indigo" />
        <StatCard title="Current Prize Pool" value={`£${(stats.prizePool / 100).toFixed(2)}`} color="green" />
        <StatCard title="Lifetime Charity" value={`£${(stats.totalDonated / 100).toFixed(2)}`} color="pink" />
        <StatCard title="Pending Review" value={stats.pendingWinners} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
         <div className="bg-white/5 p-8 rounded-3xl border border-white/5 h-80 flex flex-col justify-center items-center text-center">
            <h3 className="text-indigo-300 font-black uppercase text-sm mb-4">Draw Velocity</h3>
            <p className="text-white/20 italic font-medium">Chart visualization placeholder</p>
         </div>
         <div className="bg-white/5 p-8 rounded-3xl border border-white/5 h-80 flex flex-col justify-center items-center text-center">
            <h3 className="text-indigo-300 font-black uppercase text-sm mb-4">Charity Distribution</h3>
            <p className="text-white/20 italic font-medium">Pie chart placeholder</p>
         </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }: { title: string, value: string | number, color: string }) {
  const colors: Record<string, string> = {
    indigo: 'from-indigo-600 to-indigo-800 border-indigo-400/30',
    green: 'from-emerald-600 to-emerald-800 border-emerald-400/30',
    pink: 'from-fuchsia-600 to-fuchsia-800 border-fuchsia-400/30',
    yellow: 'from-amber-500 to-amber-700 border-amber-400/30',
  }

  return (
    <div className={`p-8 rounded-3xl bg-gradient-to-br shadow-2xl border ${colors[color]} ring-1 ring-white/5 transition-transform hover:scale-105 active:scale-95 cursor-default`}>
       <h3 className="text-white/60 font-black uppercase text-[10px] tracking-widest mb-2">{title}</h3>
       <p className="text-white font-black text-3xl tracking-tighter">{value}</p>
    </div>
  )
}
