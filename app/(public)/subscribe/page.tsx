'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { FadeIn } from '@/components/shared/FadeIn'

export default function SubscribePage() {
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)

  async function handleSubscribe(plan: 'monthly' | 'yearly') {
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to initialize checkout')
        setLoading(null)
      }
    } catch {
      toast.error('Network error during checkout initialization')
      setLoading(null)
    }
  }

  return (
    <div className="container py-24 px-4 md:px-6 flex flex-col items-center flex-1">
      <FadeIn>
        <div className="text-center max-w-2xl mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Choose Your Impact</h1>
          <p className="text-xl text-muted-foreground">
            Join the Fairway Funders community. Track scores, compete in draws, and support incredible charities.
          </p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <FadeIn delay={0.1}>
          <Card className="flex flex-col h-full border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Monthly Supporter</CardTitle>
              <CardDescription>Billed every month</CardDescription>
              <div className="mt-4 text-4xl font-extrabold">£10<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Track rolling 5 scores</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 1 entry to monthly draw</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Choose your charity (10-100% split)</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cancel anytime</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleSubscribe('monthly')}
                disabled={!!loading}
              >
                {loading === 'monthly' ? 'Processing...' : 'Select Monthly'}
              </Button>
            </CardFooter>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card className="flex flex-col h-full border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
              BEST VALUE
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Yearly Champion</CardTitle>
              <CardDescription>Billed annually</CardDescription>
              <div className="mt-4 text-4xl font-extrabold">£100<span className="text-lg font-normal text-muted-foreground">/yr</span></div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 2 Months Free</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Track rolling 5 scores</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Guaranteed entry matching</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Increased charity impact</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleSubscribe('yearly')}
                disabled={!!loading}
              >
                {loading === 'yearly' ? 'Processing...' : 'Select Yearly'}
              </Button>
            </CardFooter>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}
