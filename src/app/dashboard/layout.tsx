'use client'

import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: '📊' },
  { name: 'Scores', href: '/dashboard/scores', icon: '⛳' },
  { name: 'My Charity', href: '/dashboard/charity', icon: '❤️' },
  { name: 'Winnings', href: '/dashboard/winnings', icon: '🏆' },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, role, subscriptionStatus, loading, isSubscriptionSyncing } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)

    const redirectToLogin = () => {
      router.replace('/login?logout=1')
      router.refresh()

      if (typeof window !== 'undefined') {
        window.location.replace('/login?logout=1')
      }
    }

    try {
      // Server signout clears auth cookies reliably.
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Fall through to navigation even if sign-out request fails.
    }

    if (typeof window !== 'undefined') {
      // Clear client-side caches that can keep stale user/profile UI around.
      window.sessionStorage.removeItem('gc_profile_cache')
      window.sessionStorage.removeItem('gc_dashboard_summary')
      window.localStorage.removeItem('gc_profile_cache')

      // Clear readable profile cache cookie.
      document.cookie = 'gc_profile_data=; Max-Age=0; path=/'
    }

    // Best effort: clear local auth state, but do not block redirect on this.
    void (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/browser')
        const supabase = createClient()
        await Promise.race([
          supabase.auth.signOut({ scope: 'local' }),
          new Promise((resolve) => setTimeout(resolve, 1200)),
        ])
      } catch {
        // Ignore local signout errors; server session is already revoked.
      }
    })()

    redirectToLogin()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-slate-200">
        {/* Logo & Branding */}
        <div className="p-8 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-3 mb-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-linear-to-br from-indigo-600 to-pink-600 rounded-2xl flex items-center justify-center font-black text-white">G</div>
            <span className="font-black text-slate-900 text-lg">Golf Charity</span>
          </Link>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-4">
            {subscriptionStatus === 'active' ? (
              <span className="flex items-center gap-2 text-green-600">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                Subscription Active
              </span>
            ) : isSubscriptionSyncing ? (
              <span className="flex items-center gap-2 text-blue-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                Syncing Subscription
              </span>
            ) : (
              <span className="flex items-center gap-2 text-amber-600">
                <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                Not Subscribed
              </span>
            )}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${
                  isActive
                    ? 'bg-linear-to-r from-indigo-50 to-pink-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
          
          {role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm tracking-wide text-red-600 hover:bg-red-50 transition-all mt-6 pt-6 border-t border-slate-200"
            >
              <span className="text-xl">👨‍💼</span>
              Admin Panel
            </Link>
          )}
        </nav>

        {/* User Info */}
        <div className="p-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-indigo-400 to-pink-400 rounded-xl flex items-center justify-center font-black text-white text-lg">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">{user?.email}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{role || 'Subscriber'}</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full text-sm font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {signingOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-indigo-600 to-pink-600 rounded-lg flex items-center justify-center font-black text-white text-sm">G</div>
              <span className="font-black text-slate-900">Golf Charity</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                subscriptionStatus === 'active'
                  ? 'bg-green-100 text-green-700'
                  : isSubscriptionSyncing
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
              }`}>
                {subscriptionStatus === 'active' ? 'Active' : isSubscriptionSyncing ? 'Syncing' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="px-4 pb-4 flex gap-2 overflow-x-auto whitespace-nowrap">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                  pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.icon} {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Subscription Warning */}
        {subscriptionStatus !== 'active' && (
          <div className={`mx-4 mt-4 lg:mx-8 lg:mt-6 rounded-2xl border-2 p-5 shadow-sm ${
            isSubscriptionSyncing
              ? 'border-blue-300 bg-linear-to-r from-blue-50 to-cyan-50'
              : 'border-amber-300 bg-linear-to-r from-amber-50 to-orange-50'
          }`}>
            <div className="flex items-start gap-4">
              <span className="text-2xl">{isSubscriptionSyncing ? '⏳' : '⚠️'}</span>
              <div className="flex-1">
                {isSubscriptionSyncing ? (
                  <>
                    <p className="font-black text-slate-900 text-sm">Subscription Activation In Progress</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      We are syncing your latest payment with your account. This usually takes a few seconds.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-black text-slate-900 text-sm">Subscription Not Active</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">Re-subscribe to participate in monthly draws and support your chosen charity.</p>
                    <Link href="/subscribe" className="inline-block mt-3 text-xs font-black text-amber-700 hover:text-amber-800 bg-amber-200 hover:bg-amber-300 px-4 py-2 rounded-lg transition-colors">
                      Re-subscribe Now →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  )
}
