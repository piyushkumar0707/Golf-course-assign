'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function DashboardWinningsPage() {
  const [wins, setWins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchWins()
  }, [])

  const fetchWins = async () => {
    try {
      const res = await fetch('/api/winners')
      if (res.ok) setWins(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, winnerId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      setMessage('Invalid file type (JPG, PNG, PDF only).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('File too large (Max 5MB).')
      return
    }

    setUploading(winnerId)
    setMessage(null)
    try {
      // 1. Upload to Supabase Storage
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()
      const filePath = `winner-proofs/${winnerId}-${Date.now()}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('winner-proofs')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('winner-proofs')
        .getPublicUrl(filePath)

      // 2. Submit to API
      const res = await fetch(`/api/winners/${winnerId}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl: publicUrl })
      })

      if (res.ok) {
        setMessage('Proof submitted. We will review it shortly.')
        fetchWins()
      } else {
        setMessage(await res.text())
      }
    } catch (e: any) {
      setMessage('Upload failed: ' + e.message)
    } finally {
      setUploading(null)
    }
  }

  if (loading) return <div>Loading history...</div>

  return (
    <div className="max-w-6xl">
      {message && (
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-semibold text-indigo-700">
          {message}
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Winnings</h1>
      <p className="text-gray-500 mb-10 text-lg">Tracks your prize matched across all draws you have entered.</p>

      {wins.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center shadow-inner border border-gray-100 ring-1 ring-gray-900/5">
           <p className="text-gray-400 font-medium italic text-xl mb-4">No winnings yet. Enter your scores and keep playing!</p>
           <Link href="/dashboard/scores" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700">Add Next Score</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 ring-1 ring-gray-900/5 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
               <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-indigo-500 uppercase tracking-widest">Draw Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-indigo-500 uppercase tracking-widest">Match Tier</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-indigo-500 uppercase tracking-widest">Amount Won</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-indigo-500 uppercase tracking-widest">Proof Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-indigo-500 uppercase tracking-widest">Payment</th>
               </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
               {wins.map((win) => (
                 <tr key={win.id} className="hover:bg-gray-50 transiston-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-900">
                      {new Date(win.draws.year, win.draws.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                      Tier {win.tier} ({win.tier}-Number Match)
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-lg text-gray-900 font-extrabold">
                      £{(win.prize_amount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                       <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs font-bold rounded uppercase w-fit ${
                             win.proof_status === 'approved' ? 'bg-green-100 text-green-700' :
                             win.proof_status === 'pending' ? 'bg-indigo-100 text-indigo-700' :
                             win.proof_status === 'rejected' ? 'bg-red-100 text-red-700' :
                             'bg-yellow-100 text-yellow-700'
                          }`}>
                            {win.proof_status}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      {win.payment_status === 'paid' ? (
                        <span className="text-green-600 font-black text-xs uppercase flex items-center justify-end gap-1">
                           <span className="p-1 bg-green-50 rounded-full">✓</span> PAID
                        </span>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                           <span className="text-gray-400 text-xs font-bold uppercase">Pending</span>
                           {(win.proof_status === 'awaiting' || win.proof_status === 'rejected') && (
                             <div>
                                <input
                                  type="file"
                                  id={`file-${win.id}`}
                                  className="hidden"
                                  accept="image/png, image/jpeg, application/pdf"
                                  onChange={(e) => handleFileUpload(e, win.id)}
                                />
                                <label
                                  htmlFor={`file-${win.id}`}
                                  className="cursor-pointer bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold shadow hover:bg-indigo-700 transition"
                                >
                                  {uploading === win.id ? 'Uploading...' : 'Upload Proof'}
                                </label>
                                {win.rejection_reason && <p className="text-[10px] text-red-500 mt-1 max-w-40 leading-tight font-medium">Rejected: {win.rejection_reason}</p>}
                             </div>
                           )}
                        </div>
                      )}
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
