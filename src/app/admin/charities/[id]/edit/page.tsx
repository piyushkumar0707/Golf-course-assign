'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function EditCharityPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    is_featured: false,
    is_active: true,
  })

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/admin/charities')
      if (res.ok) {
        const rows = await res.json()
        const row = rows.find((c: any) => c.id === id)
        if (row) {
          setForm({
            name: row.name || '',
            description: row.description || '',
            is_featured: !!row.is_featured,
            is_active: !!row.is_active,
          })
        }
      }
      setLoading(false)
    }

    load()
  }, [id])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/admin/charities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) router.push('/admin/charities')
  }

  if (loading) return <div>Loading charity...</div>

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-black text-white">Edit Charity</h1>
      <form onSubmit={save} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Charity name"
          required
          className="w-full px-3 py-2 rounded border border-white/10 bg-black/20 text-white"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          required
          className="w-full px-3 py-2 rounded border border-white/10 bg-black/20 text-white h-36"
        />
        <div className="flex gap-4">
          <label className="text-white text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
          <label className="text-white text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        </div>
        <button disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
}
