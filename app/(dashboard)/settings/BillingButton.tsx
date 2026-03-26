'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export function BillingButton({ stripeCustomerId }: { stripeCustomerId: string | null }) {
  const [loading, setLoading] = useState(false)

  async function handleBillingPortal() {
    if (!stripeCustomerId) {
      toast.error('No customer record found.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: stripeCustomerId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Could not open billing portal')
        setLoading(false)
      }
    } catch {
      toast.error('Network error')
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleBillingPortal} disabled={loading} className="w-full sm:w-auto">
      {loading
        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        : <ExternalLink className="mr-2 h-4 w-4" />
      }
      Manage Billing via Stripe
    </Button>
  )
}
