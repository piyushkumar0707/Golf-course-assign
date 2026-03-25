'use client'

import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

const navItems = [
  { name: 'Overview', href: '/dashboard' },
  { name: 'Scores', href: '/dashboard/scores' },
  { name: 'My Charity', href: '/dashboard/charity' },
  { name: 'Winning History', href: '/dashboard/winnings' },
  { name: 'Past Draws', href: '/dashboard/draws' },
  { name: 'Settings', href: '/dashboard/settings' },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, role, loading } = useUser()
  const pathname = usePathname()

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row">
      {/* Sidebar for desktop */}
      <aside className="hidden sm:flex sm:flex-col w-64 border-r border-gray-200 bg-white">
        <div className="p-6">
          <h2 className="text-xl font-bold text-indigo-600">Golf Charity</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-md font-medium ${pathname === item.href ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {item.name}
            </Link>
          ))}
          {role === 'admin' && (
            <Link
              href="/admin"
              className="block px-4 py-2 rounded-md font-medium text-red-600 hover:bg-red-50 mt-10"
            >
              Admin Panel
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
           <span className="text-sm font-semibold truncate">{user?.email}</span>
           <button 
             onClick={async () => {
               const { createClient } = await import('@/lib/supabase/browser')
               const supabase = createClient()
               await supabase.auth.signOut()
               window.location.href = '/'
             }}
             className="text-xs text-red-500 font-bold hover:underline self-start"
           >
             Sign out
           </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="sm:hidden bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3 sticky top-0 z-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
         <div className="flex gap-4">
           {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`text-sm font-semibold ${pathname === item.href ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
              >
                {item.name}
              </Link>
           ))}
         </div>
      </nav>

      <main className="flex-1 p-6 sm:p-10">
        {children}
      </main>
    </div>
  )
}
