'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, FlaskConical, Rocket } from 'lucide-react'

type SimResult = {
  winningNumbers: number[]
  eligibleEntrants: number
  pool: { total: number; tier5: number; tier4: number; tier3: number }
  winners: { tier5: any[]; tier4: any[]; tier3: any[] }
  jackpotCarryOut: number
}

export function DrawManager() {
  const now = new Date()
  const [month, setMonth] = useState<string>(String(now.getMonth() + 1))
  const [year, setYear] = useState<string>(String(now.getFullYear()))
  const [drawType, setDrawType] = useState('random')
  const [jackpotCarryIn, setJackpotCarryIn] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [simResult, setSimResult] = useState<SimResult | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

  async function handleSimulate() {
    setLoading(true)
    setSimResult(null)
    try {
      const res = await fetch('/api/draws/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawType, month: parseInt(month), year: parseInt(year), jackpotCarryIn: jackpotCarryIn * 100 }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Simulation failed'); return }
      setSimResult(data)
      toast.success('Draw simulated — preview only, nothing saved.')
    } catch {
      toast.error('Network error during simulation')
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish() {
    if (!confirm('⚠️ This will PERMANENTLY publish the draw and cannot be undone. Continue?')) return
    setPublishing(true)
    try {
      const res = await fetch('/api/draws/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawType, month: parseInt(month), year: parseInt(year), jackpotCarryIn: jackpotCarryIn * 100 }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Publish failed'); return }
      setPublished(true)
      toast.success(`Draw for ${month}/${year} published successfully!`)
    } catch {
      toast.error('Network error during publish')
    } finally {
      setPublishing(false)
    }
  }

  const months = ['1','2','3','4','5','6','7','8','9','10','11','12']
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m, i) => <SelectItem key={m} value={m}>{monthNames[i]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Year</Label>
          <Input type="number" value={year} onChange={e => setYear(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Draw Type</Label>
          <Select value={drawType} onValueChange={setDrawType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="random">Random</SelectItem>
              <SelectItem value="weighted">Weighted (frequency)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Jackpot Carry-In (£)</Label>
          <Input type="number" min={0} value={jackpotCarryIn} onChange={e => setJackpotCarryIn(Number(e.target.value))} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSimulate} disabled={loading || publishing || published} variant="outline">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4" />}
          Simulate (Preview Only)
        </Button>
        <Button onClick={handlePublish} disabled={loading || publishing || published} variant="destructive">
          {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
          Publish Draw
        </Button>
      </div>

      {/* Simulation Result Preview */}
      {simResult && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <FlaskConical className="h-5 w-5" /> Simulation Preview
            </CardTitle>
            <CardDescription>These numbers are NOT saved. Press Publish to make it official.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Winning Numbers</p>
              <div className="flex gap-3">
                {simResult.winningNumbers.sort((a,b)=>a-b).map(n => (
                  <div key={n} className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {n}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tier 5 Winners</p>
                <p className="font-bold text-xl">{simResult.winners.tier5.length}</p>
                <p className="text-muted-foreground text-xs">Prize: £{(simResult.pool.tier5 / 100 / Math.max(1, simResult.winners.tier5.length)).toFixed(2)} each</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tier 4 Winners</p>
                <p className="font-bold text-xl">{simResult.winners.tier4.length}</p>
                <p className="text-muted-foreground text-xs">Prize: £{(simResult.pool.tier4 / 100 / Math.max(1, simResult.winners.tier4.length)).toFixed(2)} each</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tier 3 Winners</p>
                <p className="font-bold text-xl">{simResult.winners.tier3.length}</p>
                <p className="text-muted-foreground text-xs">Prize: £{(simResult.pool.tier3 / 100 / Math.max(1, simResult.winners.tier3.length)).toFixed(2)} each</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {simResult.jackpotCarryOut > 0 && (
                <p>⚠️ No Tier 5 winner — jackpot of <strong>£{(simResult.jackpotCarryOut / 100).toFixed(2)}</strong> carries to next draw.</p>
              )}
              <p>Eligible entrants: <strong>{simResult.eligibleEntrants}</strong></p>
            </div>
          </CardContent>
        </Card>
      )}

      {published && (
        <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-sm font-medium">
          ✅ Draw published! Winner notifications have been queued.
        </div>
      )}
    </div>
  )
}
