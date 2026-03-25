'use client'

import { useUser } from '@/hooks/useUser'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function DashboardOverview() {
  const { user, role } = useUser()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scoreRes, charityRes, winRes] = await Promise.all([
          fetch('/api/scores'),
          fetch('/api/user/charity'),
          fetch('/api/winners'),
        ])
        
        const scores = await scoreRes?.json() || []
        const userCharity = await charityRes?.json() || null
        
        setData({ scores, userCharity })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleManageSub = async () => {
    const res = await fetch('/api/stripe/create-portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  if (loading) return <div>Loading overview...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 self-start">Welcome back, {user?.user_metadata?.full_name || 'Subscriber'}</h1>
        <div className="flex gap-4">
           {role === 'admin' && (
             <Link href="/admin" className="p-2 border border-red-500 rounded bg-red-50 text-red-700 text-sm font-bold shadow-md hover:bg-red-100 transition-colors">
                ADMIN ACCESS
             </Link>
           )}
           <button 
             onClick={handleManageSub}
             className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold text-sm shadow hover:bg-indigo-700 transition-colors"
           >
             Manage Subscription
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Subscription Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 ring-1 ring-gray-900/5 transition-transform hover:scale-[1.02]">
           <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">Subscription</h3>
           <div className="flex items-center gap-2 mb-4">
             <span className="text-2xl font-bold text-gray-900">Active</span>
             <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">PRO</span>
           </div>
           <p className="text-sm text-gray-500 mb-6 font-medium">Your donation to your selected charity is set at 15%.</p>
           <button onClick={handleManageSub} className="text-indigo-600 text-sm font-bold hover:underline">Billing Details &rarr;</button>
        </div>

        {/* Charity Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 ring-1 ring-gray-900/5 transition-transform hover:scale-[1.02]">
           <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">My Charity</h3>
           {data?.userCharity ? (
             <div className="flex flex-col h-full justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-900 mb-1">{data.userCharity.charities.name}</p>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{data.userCharity.charities.description}</p>
                </div>
                <Link href="/dashboard/charity" className="mt-4 text-indigo-600 text-sm font-bold hover:underline self-start">Change Impact &rarr;</Link>
             </div>
           ) : (
             <div className="flex flex-col h-full justify-between text-center py-6">
                <p className="text-sm text-gray-500 italic mb-4">No charity selected yet.</p>
                <Link href="/dashboard/charity" className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded font-bold text-xs ring-1 ring-yellow-300">Choose Charity</Link>
             </div>
           )}
        </div>

        {/* Scores Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 ring-1 ring-gray-900/5 transition-transform hover:scale-[1.02]">
           <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">Recent Scores</h3>
           <div className="space-y-3 mb-6">
             {data?.scores?.slice(0, 3).map((s: any) => (
               <div key={s.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-100">
                  <span className="font-bold text-indigo-600">{s.score} pts</span>
                  <span className="text-xs text-gray-500 font-medium">{new Date(s.played_on).toLocaleDateString()}</span>
               </div>
             ))}
             {data?.scores?.length === 0 && (
                <p className="text-sm text-gray-500 italic">Get started by logging your first score!</p>
             )}
           </div>
           <Link href="/dashboard/scores" className="text-indigo-600 text-sm font-bold hover:underline">Full History & Add New &rarr;</Link>
        </div>
      </div>
    </div>
  )
}
