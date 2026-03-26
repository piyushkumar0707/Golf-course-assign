'use client'

import { useState } from 'react'
import { addScore } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function ScoreForm() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await addScore(formData)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Score recorded successfully!')
      // Optional: reset form using a ref
      const form = document.getElementById('score-form') as HTMLFormElement
      if (form) form.reset()
    }
    setLoading(false)
  }

  return (
    <form id="score-form" action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="score">Stableford Points</Label>
        <Input 
          id="score" 
          name="score" 
          type="number" 
          min="1" 
          max="45" 
          placeholder="e.g. 36" 
          required 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="played_on">Date Played</Label>
        <Input 
          id="played_on" 
          name="played_on" 
          type="date"
          required 
        />
        <p className="text-xs text-muted-foreground">
          Must be within the last 12 months.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Submit Round
      </Button>
    </form>
  )
}
