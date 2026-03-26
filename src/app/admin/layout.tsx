import Link from 'next/link'
import { ReactNode } from 'react'
import { getUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

const navItems = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Draws', href: '/admin/draws' },
  { name: 'Charities', href: '/admin/charities' },
  { name: 'Winners', href: '/admin/winners' },
  { name: 'Reports', href: '/admin/reports' },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, role } = await getUser()
  if (!user || role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-indigo-900 flex flex-col sm:flex-row text-white">
      {/* Sidebar */}
      <aside className="hidden sm:flex sm:flex-col w-64 border-r border-indigo-700 bg-indigo-950">
        <div className="p-6">
          <h2 className="text-xl font-black tracking-tighter uppercase mb-1">Golf Admin</h2>
          <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Central Command</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 rounded-md font-bold text-sm tracking-wide hover:bg-indigo-800 text-indigo-300"
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-800 bg-black/20">
           <span className="text-[10px] uppercase font-black text-indigo-500 mb-2 block">Logged as Admin</span>
           <span className="text-xs truncate font-medium text-indigo-100 block">{user?.email}</span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 sm:p-10 bg-[#0a0225] text-white">
        {children}
      </main>
    </div>
  )
}
