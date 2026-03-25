'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCharityPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/charities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        is_featured: isFeatured,
        is_active: isActive,
        image_urls: [],
        events: [],
      }),
    })
    setSaving(false)
    if (res.ok) router.push('/admin/charities')
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-black text-white">Create Charity</h1>
      <form onSubmit={submit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Charity name"
          required
          className="w-full px-3 py-2 rounded border border-white/10 bg-black/20 text-white"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          required
          className="w-full px-3 py-2 rounded border border-white/10 bg-black/20 text-white h-36"
        />
        <div className="flex gap-4">
          <label className="text-white text-sm"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Featured</label>
          <label className="text-white text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
        </div>
        <button disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">
          {saving ? 'Saving...' : 'Create'}
        </button>
      </form>
    </div>
  )
}
