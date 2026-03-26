'use client'

import { useState } from 'react'
import { deleteScore } from './actions'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteScoreButton({ scoreId }: { scoreId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const result = await deleteScore(scoreId)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Score deleted.')
    }
    setLoading(false)
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete} 
      disabled={loading}
      className="text-muted-foreground hover:text-destructive"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
