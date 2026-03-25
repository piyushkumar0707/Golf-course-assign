'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const fetchUsers = async () => {
    try {
      // Note: this needs a /api/admin/users route
      const res = await fetch(`/api/admin/users?page=${page}&q=${search}`)
      if (res.ok) setUsers(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-indigo-800/20 p-8 rounded-3xl border border-white/5 shadow-2xl">
         <div>
            <h1 className="text-4xl font-black text-white mb-2">User Registry</h1>
            <p className="text-indigo-400 font-bold uppercase tracking-widest">Subscriber base management</p>
         </div>
      </div>

      <div className="bg-white/5 p-8 rounded-3xl border border-white/5 shadow-2xl overflow-hidden ring-1 ring-white/5">
        <div className="mb-6 flex gap-4">
           <input
             type="text"
             placeholder="Search by name or email..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
           />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead>
              <tr className="text-left py-4 uppercase text-[10px] font-black text-indigo-400 tracking-widest">
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-white capitalize">{u.full_name || 'N/A'}</td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-indigo-200">{u.email}</td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'}`}>
                       {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${u.subscription_status === 'active' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                       {u.subscription_status}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-xs font-bold text-indigo-400 hover:text-white uppercase transition-colors"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                 <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-white/30 italic font-medium">No records matching criteria...</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
