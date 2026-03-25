'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_featured: false,
    is_active: true
  })

  useEffect(() => {
    fetchCharities()
  }, [])

  const fetchCharities = async () => {
    const res = await fetch('/api/admin/charities')
    if (res.ok) {
      const data = await res.json()
      setCharities(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editing ? 'PATCH' : 'POST'
    const url = editing ? `/api/admin/charities/${editing.id}` : '/api/admin/charities'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      fetchCharities()
      setShowForm(false)
      setEditing(null)
      setFormData({ name: '', description: '', is_featured: false, is_active: true })
    }
  }

  if (loading) return <div className="p-8">Loading charities...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Charity Management</h1>
          <p className="text-gray-500 mt-1">Manage partner charities and their impact levels.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 flex items-center gap-2"
        >
          <span>➕</span> Add New Charity
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl ring-1 ring-gray-900/5 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Charity</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Featured</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {charities.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 shrink-0 bg-indigo-100 rounded-lg flex items-center justify-center text-xl">
                      🏛️
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">{c.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {c.is_featured ? (
                    <span className="text-yellow-500 text-xl" title="Featured">⭐</span>
                  ) : (
                    <span className="text-gray-300">No</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditing(c)
                      setFormData({ name: c.name, description: c.description, is_featured: c.is_featured, is_active: c.is_active })
                      setShowForm(true)
                    }}
                    className="text-indigo-600 hover:text-indigo-900 font-bold mr-4"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-10 overflow-hidden relative">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              {editing ? '📝 Edit Charity' : '✨ Add New Charity'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Charity Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                  placeholder="e.g. Save the Fairways"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none h-32 resize-none"
                  placeholder="Tell the story of their impact..."
                />
              </div>
              <div className="flex items-center gap-8 py-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">Featured</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">Active</span>
                </label>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditing(null); }}
                  className="flex-1 px-6 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
                >
                  {editing ? 'Save Changes' : 'Create Charity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
