'use client'

import { useState } from 'react'
import { createCharity, updateCharity } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type Charity = { id: string; name: string; description: string | null; is_featured: boolean }

export function CharityForm({ mode, charity }: { mode: 'create' | 'edit'; charity?: Charity }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = mode === 'create'
      ? await createCharity(formData)
      : await updateCharity(charity!.id, formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(mode === 'create' ? 'Charity created!' : 'Charity updated!')
      if (mode === 'create') (e.target as HTMLFormElement).reset()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={charity?.name} required placeholder="e.g. Cancer Research UK" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={charity?.description || ''} rows={3} placeholder="Brief description..." />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_featured" name="is_featured" defaultChecked={charity?.is_featured} className="h-4 w-4" />
        <Label htmlFor="is_featured" className="cursor-pointer">Set as Featured (only one allowed)</Label>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {mode === 'create' ? 'Create Charity' : 'Save Changes'}
      </Button>
    </form>
  )
}
