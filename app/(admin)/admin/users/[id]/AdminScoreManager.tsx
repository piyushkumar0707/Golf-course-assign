'use client'

import { useState } from 'react'
import { adminEditScore, adminDeleteScore } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Pencil, Trash2, Check, X } from 'lucide-react'

type Score = {
  id: string
  score: number
  played_on: string
}

export function AdminScoreManager({ userId, scores }: { userId: string; scores: Score[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleSaveEdit(scoreId: string) {
    setLoadingId(scoreId)
    const result = await adminEditScore(scoreId, editValue, userId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Score updated (audit logged)')
      setEditingId(null)
    }
    setLoadingId(null)
  }

  async function handleDelete(scoreId: string) {
    if (!confirm('Delete this score? This action will be logged.')) return
    setLoadingId(scoreId)
    const result = await adminDeleteScore(scoreId, userId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Score deleted (audit logged)')
    }
    setLoadingId(null)
  }

  if (!scores || scores.length === 0) {
    return <p className="text-sm text-muted-foreground">No scores recorded for this user.</p>
  }

  return (
    <div className="space-y-3">
      {scores.map((s) => (
        <div key={s.id} className="flex items-center gap-4 p-3 border rounded-lg">
          {editingId === s.id ? (
            <>
              <Input
                type="number"
                min={1}
                max={45}
                value={editValue}
                onChange={(e) => setEditValue(parseInt(e.target.value, 10))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground flex-1">{new Date(s.played_on).toLocaleDateString()}</span>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(s.id)} disabled={!!loadingId}>
                  {loadingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                {s.score}
              </div>
              <span className="text-sm text-muted-foreground flex-1">{new Date(s.played_on).toLocaleDateString()}</span>
              <div className="flex gap-1">
                <Button
                  size="icon" variant="ghost"
                  onClick={() => { setEditingId(s.id); setEditValue(s.score) }}
                  disabled={!!loadingId}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon" variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(s.id)}
                  disabled={!!loadingId}
                >
                  {loadingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
