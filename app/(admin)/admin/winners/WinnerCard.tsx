'use client'

import { useState } from 'react'
import { approveProof, rejectProof, markWinnerPaid } from './actions'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle, CreditCard, ExternalLink } from 'lucide-react'

type Winner = {
  id: string
  tier: number
  prize_amount: number
  proof_url: string | null
  proof_status: string
  payment_status: string
  rejection_reason: string | null
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
  draws: { month: number; year: number } | null
}

const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function WinnerCard({ winner }: { winner: Winner }) {
  const [loading, setLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const effectiveStatus = winner.payment_status === 'paid' ? 'paid' : winner.proof_status

  async function handleApprove() {
    setLoading(true)
    const result = await approveProof(winner.id)
    if (result.error) toast.error(result.error)
    else toast.success('Proof approved!')
    setLoading(false)
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error('Please provide a rejection reason.'); return }
    setLoading(true)
    const result = await rejectProof(winner.id, rejectReason)
    if (result.error) toast.error(result.error)
    else { toast.success('Proof rejected.'); setShowRejectInput(false) }
    setLoading(false)
  }

  async function handleMarkPaid() {
    setLoading(true)
    const result = await markWinnerPaid(winner.id)
    if (result.error) toast.error(result.error)
    else toast.success('Marked as paid!')
    setLoading(false)
  }

  const statusVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    awaiting: 'outline',
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    paid: 'default',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between gap-2">
          <div>
            <p className="font-bold">{winner.profiles?.full_name || 'Anonymous'}</p>
            <p className="text-xs text-muted-foreground">{winner.profiles?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Draw: {monthNames[winner.draws?.month || 0]} {winner.draws?.year} · Tier {winner.tier} Match
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl font-bold text-primary">£{(winner.prize_amount / 100).toFixed(2)}</span>
            <Badge variant={statusVariantMap[effectiveStatus] || 'outline'}
              className={effectiveStatus === 'paid' ? 'bg-green-600 hover:bg-green-700' : ''}>
              {effectiveStatus.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Proof Preview */}
        {winner.proof_url ? (
          <div className="border rounded-md p-3 bg-muted/30">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Submitted Proof</p>
            {winner.proof_url.endsWith('.pdf') ? (
              <a href={winner.proof_url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-primary underline flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" /> View PDF Proof
              </a>
            ) : (
              <a href={winner.proof_url} target="_blank" rel="noopener noreferrer">
                <img src={winner.proof_url} alt="Winner proof" className="max-h-48 rounded object-contain" />
              </a>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">No proof submitted yet.</div>
        )}

        {/* Action Buttons */}
        {effectiveStatus === 'pending' && (
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Approve
            </Button>
            {!showRejectInput ? (
              <Button size="sm" variant="destructive" onClick={() => setShowRejectInput(true)} disabled={loading}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            ) : (
              <div className="flex gap-2 items-center w-full flex-wrap">
                <Input
                  placeholder="Rejection reason..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="flex-1 min-w-[200px]"
                />
                <Button size="sm" variant="destructive" onClick={handleReject} disabled={loading}>
                  Confirm Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowRejectInput(false)}>Cancel</Button>
              </div>
            )}
          </div>
        )}

        {effectiveStatus === 'approved' && (
          <Button size="sm" onClick={handleMarkPaid} disabled={loading} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CreditCard className="h-4 w-4 mr-1" />}
            Mark as Paid
          </Button>
        )}

        {winner.rejection_reason && effectiveStatus === 'rejected' && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            Rejection reason: {winner.rejection_reason}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
