'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/shared/FadeIn'
import { toast } from 'sonner'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await login(formData)
    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    }
    // if successful, 'login' action redirects to dashboard
  }

  return (
    <div className="flex flex-1 items-center justify-center pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <FadeIn>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to log in.
            </CardDescription>
          </CardHeader>
          <form action={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Log in'}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </FadeIn>
    </div>
  )
}
