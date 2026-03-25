'use client'

import { useState, useEffect } from 'react'

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResult, setSimulationResult] = useState<any>(null)
   const [message, setMessage] = useState<string | null>(null)
   const [confirmPublish, setConfirmPublish] = useState(false)
  
  const [drawParams, setDrawParams] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    draw_type: 'weighted'
  })

  useEffect(() => {
    fetchDraws()
  }, [])

  const fetchDraws = async () => {
    try {
         const res = await fetch('/api/admin/draws')
      if (res.ok) setDraws(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSimulate = async () => {
    setIsSimulating(true)
    setSimulationResult(null)
      setMessage(null)
    try {
      const res = await fetch('/api/admin/draws/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drawParams)
      })
      if (res.ok) {
        setSimulationResult(await res.json())
      } else {
            setMessage(await res.text())
      }
    } catch (e) {
      console.error(e)
         setMessage('Failed to run simulation.')
    } finally {
      setIsSimulating(false)
    }
  }

  const handlePublish = async () => {
      if (!confirmPublish) {
         setConfirmPublish(true)
         setMessage('Click publish again to confirm this irreversible action.')
         return
      }

    try {
      const res = await fetch('/api/admin/draws/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drawParams)
      })
      if (res.ok) {
            setMessage('Draw published successfully.')
        setSimulationResult(null)
            setConfirmPublish(false)
        fetchDraws()
      } else {
            setMessage(await res.text())
      }
    } catch (e) {
      console.error(e)
         setMessage('Failed to publish draw.')
      } finally {
         setConfirmPublish(false)
    }
  }

  return (
    <div className="space-y-10 pb-20">
         {message && (
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4 text-sm font-bold text-indigo-200">
               {message}
            </div>
         )}

      <div className="flex justify-between items-center bg-indigo-800/20 p-8 rounded-3xl border border-white/5 shadow-2xl">
         <div>
            <h1 className="text-4xl font-black text-white mb-2">Draw Engine Hub</h1>
            <p className="text-indigo-400 font-bold uppercase tracking-widest">Randomize & Distribute Prizes</p>
         </div>
         <div className="bg-indigo-600/20 px-4 py-2 rounded-full border border-indigo-500/30">
            <span className="text-xs font-black uppercase text-indigo-300">Total Entries This Month: 345</span>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="bg-white/5 p-8 rounded-3xl border border-white/5 shadow-2xl h-fit">
            <h3 className="text-lg font-black text-white uppercase mb-8 flex items-center gap-3">
               <span className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">🎲</span> Configuration
            </h3>
            <div className="space-y-6">
               <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Month</label>
                  <select 
                    value={drawParams.month}
                    onChange={(e) => setDrawParams({...drawParams, month: parseInt(e.target.value)})}
                              aria-label="Select draw month"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i + 1} className="bg-[#0a0225] text-white">
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Year</label>
                  <select 
                    value={drawParams.year}
                    onChange={(e) => setDrawParams({...drawParams, year: parseInt(e.target.value)})}
                              aria-label="Select draw year"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[2024, 2025, 2026].map((y) => (
                      <option key={y} value={y} className="bg-[#0a0225] text-white">{y}</option>
                    ))}
                  </select>
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Algorithm</label>
                  <div className="grid grid-cols-2 gap-2">
                     <button
                        onClick={() => setDrawParams({...drawParams, draw_type: 'random'})}
                        className={`py-3 rounded-xl border font-bold text-xs uppercase tracking-tighter ${drawParams.draw_type === 'random' ? 'bg-indigo-600 border-indigo-400 shadow-xl' : 'bg-white/5 border-white/10 text-white/40'}`}
                     >
                        Pure Random
                     </button>
                     <button
                        onClick={() => setDrawParams({...drawParams, draw_type: 'weighted'})}
                        className={`py-3 rounded-xl border font-bold text-xs uppercase tracking-tighter ${drawParams.draw_type === 'weighted' ? 'bg-indigo-600 border-indigo-400 shadow-xl' : 'bg-white/5 border-white/10 text-white/40'}`}
                     >
                        Weighted
                     </button>
                  </div>
               </div>
               <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="w-full bg-indigo-500/10 border border-indigo-500/40 text-indigo-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500/20 transition-all mt-4"
               >
                  {isSimulating ? 'Processing...' : 'Run Simulation'}
               </button>
            </div>
         </div>

         <div className="lg:col-span-2">
            {!simulationResult ? (
              <div className="bg-white/5 p-20 rounded-3xl border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center">
                 <div className="p-6 bg-indigo-500/5 rounded-full mb-6 border border-white/5">
                    <span className="text-4xl filter grayscale opacity-50">🔮</span>
                 </div>
                 <h3 className="text-xl font-black text-white capitalize mb-2">Simulation Engine Ready</h3>
                 <p className="text-indigo-400/60 font-medium max-w-xs leading-relaxed">Configure the parameters and run a simulation to preview the results before publishing.</p>
              </div>
            ) : (
              <div className="bg-white/5 p-8 rounded-3xl border border-white/5 shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-500">
                <h3 className="text-lg font-black text-white uppercase mb-8 flex items-center justify-between">
                   <span>Simulation Result Preview</span>
                   <button onClick={() => setSimulationResult(null)} className="text-[10px] text-white/30 font-black hover:text-white transition-colors">RESET</button>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                   <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-4">Winning Numbers</p>
                      <div className="flex gap-2">
                         {simulationResult.winningNumbers.map((n: number, idx: number) => (
                           <span key={idx} className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 font-black text-white shadow-xl shadow-indigo-900/40">
                              {n}
                           </span>
                         ))}
                      </div>
                   </div>
                   <div className="bg-green-500/10 p-6 rounded-2xl border border-green-500/20">
                      <p className="text-[10px] font-black uppercase text-green-400 tracking-widest mb-4">Total Winners</p>
                      <div className="flex gap-4">
                         <div className="flex flex-col">
                            <span className="text-2xl font-black text-white">{simulationResult.matches[5] + simulationResult.matches[4] + simulationResult.matches[3]}</span>
                            <span className="text-[10px] font-bold text-green-500/60 uppercase">Matches Found</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-4 mb-10">
                   <TierRow tier={5} winners={simulationResult.matches[5]} pool={simulationResult.pools.tier5} perWinner={simulationResult.prizes[5]} />
                   <TierRow tier={4} winners={simulationResult.matches[4]} pool={simulationResult.pools.tier4} perWinner={simulationResult.prizes[4]} />
                   <TierRow tier={3} winners={simulationResult.matches[3]} pool={simulationResult.pools.tier3} perWinner={simulationResult.prizes[3]} />
                </div>

                <button
                  onClick={handlePublish}
                           className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 ${confirmPublish ? 'bg-linear-to-r from-red-500 to-rose-700 shadow-red-900/40' : 'bg-linear-to-r from-green-500 to-emerald-700 shadow-green-900/40'}`}
                >
                   {confirmPublish ? 'Confirm Publish Draw' : 'Publish Official Draw Results'}
                </button>
                <p className="text-center mt-4 text-[10px] font-black text-indigo-400/30 tracking-widest uppercase">Action is irreversible once confirmed</p>
              </div>
            )}
         </div>
      </div>

         <section className="bg-white/5 p-6 rounded-3xl border border-white/5 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-4">Published and Pending Draws</h2>
            {loading ? (
               <p className="text-indigo-300">Loading draws...</p>
            ) : draws.length === 0 ? (
               <p className="text-indigo-300">No draws available yet.</p>
            ) : (
               <div className="space-y-3">
                  {draws.map((draw) => (
                     <a
                        key={draw.id}
                        href={`/admin/draws/${draw.id}`}
                        className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-black/30 transition"
                     >
                        <div className="flex items-center justify-between gap-4">
                           <p className="text-white font-bold">
                              {new Date(draw.year, draw.month - 1).toLocaleString('default', {
                                 month: 'long',
                                 year: 'numeric',
                              })}{' '}
                              ({draw.draw_type})
                           </p>
                           <span className="text-xs font-black uppercase tracking-wider px-2 py-1 rounded bg-indigo-600/40 text-indigo-200">
                              {draw.status}
                           </span>
                        </div>
                     </a>
                  ))}
               </div>
            )}
         </section>
    </div>
  )
}

function TierRow({ tier, winners, pool, perWinner }: any) {
   return (
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
         <div className="flex items-center gap-4">
            <span className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center text-[10px] font-black text-indigo-400">{tier}</span>
            <div>
               <p className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Match {tier}</p>
               <p className="text-xs text-indigo-400 font-bold">{winners} winners found</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-lg font-black text-white tracking-tighter leading-none">£{(perWinner / 100).toFixed(2)}</p>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-tighter mt-1">Pool: £{(pool / 100).toFixed(2)}</p>
         </div>
      </div>
   )
}
