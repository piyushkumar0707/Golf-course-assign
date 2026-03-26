'use client'

import { useState } from 'react'
import { updateCharityPreferences } from './actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type Charity = { id: string; name: string }

export function CharityForm({ 
  charities, 
  defaultCharityId, 
  defaultPercent 
}: { 
  charities: Charity[], 
  defaultCharityId: string | null, 
  defaultPercent: number 
}) {
  const [loading, setLoading] = useState(false)
  const [charityId, setCharityId] = useState<string>(defaultCharityId || '')
  const [percent, setPercent] = useState<number>(defaultPercent)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.append('charity_id', charityId)
    formData.append('charity_percent', percent.toString())

    const result = await updateCharityPreferences(formData)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Charity preferences updated!')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="space-y-3">
        <Label>Select Charity</Label>
        <Select value={charityId} onValueChange={(val) => setCharityId(val || '')} required>
          <SelectTrigger>
            <SelectValue placeholder="Choose a partner" />
          </SelectTrigger>
          <SelectContent>
            {charities.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Contribution Percentage (%)</Label>
        <Input 
          type="number" 
          min="10" 
          max="100" 
          value={percent} 
          onChange={(e) => setPercent(parseInt(e.target.value, 10))}
          required 
        />
        <p className="text-xs text-muted-foreground">
          You can allocate between 10% (minimum) and 100% of your net subscription to this charity.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !charityId}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save Preferences
      </Button>
    </form>
  )
}
