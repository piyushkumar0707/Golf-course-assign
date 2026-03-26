'use client'

import { useState } from 'react'
import { overrideSubscriptionStatus } from './actions'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function AdminUserActions({ userId, currentStatus }: { userId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const [targetStatus, setTargetStatus] = useState(currentStatus || 'inactive')

  async function handleOverride() {
    if (targetStatus === currentStatus) return

    setLoading(true)
    const result = await overrideSubscriptionStatus(userId, targetStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Subscription status overridden.')
    }
    setLoading(false)
  }

  return (
    <div className="flex gap-2 items-end">
      <div className="space-y-1 flex-1">
        <label className="text-xs text-muted-foreground font-medium">Force Override Status</label>
        <Select value={targetStatus} onValueChange={setTargetStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="lapsed">Lapsed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleOverride} disabled={loading || targetStatus === currentStatus}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Ensure
      </Button>
    </div>
  )
}
