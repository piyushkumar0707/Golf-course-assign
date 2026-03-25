'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // pending, approved, awaiting, rejected

  useEffect(() => {
    fetchWinners()
  }, [])

  const fetchWinners = async () => {
    try {
      const res = await fetch('/api/admin/winners') // Note: need a /api/admin/winners route
      if (res.ok) setWinners(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/admin/winners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        alert('Winner updated successfully!')
        fetchWinners()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filteredWinners = filter === 'all' ? winners : winners.filter(w => w.proof_status === filter || w.payment_status === filter)

  if (loading) return <div>Fetching prize claims...</div>

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center bg-indigo-800/20 p-8 rounded-3xl border border-white/5 shadow-2xl">
         <div>
            <h1 className="text-4xl font-black text-white mb-2">Winner Verification</h1>
            <p className="text-indigo-400 font-bold uppercase tracking-widest">Prize pool distribution management</p>
         </div>
      </div>

      <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto whitespace-nowrap scrollbar-hide">
         {['all', 'pending', 'awaiting', 'approved', 'rejected', 'paid'].map(f => (
           <button
             key={f}
             onClick={() => setFilter(f)}
             className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${filter === f ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-white/5 border-white/10 text-white/30 hover:text-white hover:border-white/20'}`}
           >
              {f}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredWinners.map((win) => (
          <div key={win.id} className="bg-white/5 p-8 rounded-3xl border border-white/5 shadow-2xl transition-transform hover:scale-[1.01]">
             <div className="flex flex-col lg:flex-row justify-between gap-8">
                <div className="flex-1 space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-xl font-black text-indigo-400 uppercase tracking-tighter">
                         T{win.tier}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">{win.profiles?.full_name || 'Subscriber'}</h3>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{win.profiles?.auth_users?.email}</p>
                      </div>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-6 mt-6">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Prize Amount</span>
                         <span className="text-2xl font-black text-green-400 tracking-tighter">£{(win.prize_amount / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Draw Date</span>
                         <span className="text-lg font-bold text-white/80">{new Date(win.draws.year, win.draws.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Status</span>
                         <div className="flex gap-2">
                           <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${win.proof_status === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-indigo-500/20 text-indigo-500'}`}>Proof: {win.proof_status}</span>
                           <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${win.payment_status === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>Payment: {win.payment_status}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col w-full lg:w-80 gap-4">
                   {win.proof_url ? (
                     <div className="flex flex-col gap-2">
                        <a href={win.proof_url} target="_blank" className="bg-indigo-600 border border-indigo-400/50 py-3 rounded-xl text-center text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-900/40 hover:bg-indigo-500 transition-all">View Proof Attachment</a>
                        
                        {win.proof_status === 'pending' && (
                          <div className="grid grid-cols-2 gap-2">
                             <button
                               onClick={() => handleUpdate(win.id, { proof_status: 'approved' })}
                               className="bg-green-600/20 border border-green-500/30 text-green-500 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-500/30 transition-all"
                             >
                               Approve
                             </button>
                             <button
                               onClick={() => {
                                 const reason = prompt('Rejection reason:')
                                 if (reason) handleUpdate(win.id, { proof_status: 'rejected', rejection_reason: reason })
                               }}
                               className="bg-red-600/20 border border-red-500/30 text-red-500 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500/30 transition-all"
                             >
                               Reject
                             </button>
                          </div>
                        )}
                        
                        {win.proof_status === 'approved' && win.payment_status !== 'paid' && (
                          <button
                            onClick={() => handleUpdate(win.id, { payment_status: 'paid' })}
                            className="bg-green-500 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-green-900/40 hover:bg-green-400 transition-all"
                          >
                             Mark as Paid
                          </button>
                        )}
                     </div>
                   ) : (
                     <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-6 text-center text-indigo-400/40 font-black uppercase text-[10px] tracking-widest">
                        Awaiting user proof upload
                     </div>
                   )}
                </div>
             </div>
          </div>
        ))}

        {filteredWinners.length === 0 && (
           <div className="border border-white/5 p-20 rounded-3xl text-center text-white/20 italic font-medium uppercase text-xs tracking-widest">No claim records found for this category</div>
        )}
      </div>
    </div>
  )
}
