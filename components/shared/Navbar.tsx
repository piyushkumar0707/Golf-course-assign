import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function Navbar() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl tracking-tight">Fairway Funders</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/charities" className="text-sm font-medium hover:underline underline-offset-4">
            Charities
          </Link>
          <Link href="/how-it-works" className="text-sm font-medium hover:underline underline-offset-4">
            How it works
          </Link>

          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">Admin</Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            </>
          ) : (
            <div className="space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
