'use client'

import { useState } from 'react'
import { toggleCharityActive } from './actions'
import { CharityForm } from './CharityForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Star, EyeOff, Eye, Pencil } from 'lucide-react'

type Charity = {
  id: string
  name: string
  description: string | null
  is_featured: boolean
  is_active: boolean
}

export function CharityList({ charities }: { charities: Charity[] }) {
  const [editTarget, setEditTarget] = useState<Charity | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function handleToggle(id: string, isActive: boolean) {
    const result = await toggleCharityActive(id, isActive)
    if (result.error) toast.error(result.error)
    else toast.success(isActive ? 'Charity deactivated.' : 'Charity reactivated.')
  }

  return (
    <div className="space-y-3">
      {charities.map((c) => (
        <div
          key={c.id}
          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3 ${!c.is_active ? 'opacity-50' : ''}`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{c.name}</span>
              {c.is_featured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{c.description || 'No description'}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={dialogOpen && editTarget?.id === c.id} onOpenChange={(o) => { if(!o) { setDialogOpen(false); setEditTarget(null) } }}>
              <button
                onClick={() => { setEditTarget(c); setDialogOpen(true) }}
                className="inline-flex items-center gap-1 border rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              {editTarget?.id === c.id && (
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Charity</DialogTitle>
                  </DialogHeader>
                  <CharityForm mode="edit" charity={editTarget} />
                </DialogContent>
              )}
            </Dialog>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleToggle(c.id, c.is_active)}
              title={c.is_active ? 'Deactivate' : 'Reactivate'}
            >
              {c.is_active
                ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                : <Eye className="h-4 w-4 text-green-600" />}
            </Button>
          </div>
        </div>
      ))}
      {charities.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">No charities added yet.</p>
      )}
    </div>
  )
}
