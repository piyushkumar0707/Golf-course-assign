import Link from 'next/link'
import { LayoutDashboard, Users, Trophy, Heart, Archive } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row flex-1">
      <aside className="w-full md:w-64 border-r bg-slate-900 text-slate-100">
        <div className="p-4 font-bold text-lg border-b border-slate-800 text-slate-400">
          Admin Portal
        </div>
        <nav className="flex flex-col gap-2 p-4 md:sticky md:top-16 md:h-[calc(100vh-8rem)]">
          <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            <LayoutDashboard className="h-4 w-4" /> Reports Insight
          </Link>
          <Link href="/admin/users" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            <Users className="h-4 w-4" /> User Management
          </Link>
          <Link href="/admin/draws" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            <Archive className="h-4 w-4" /> Draw Manager
          </Link>
          <Link href="/admin/winners" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            <Trophy className="h-4 w-4" /> Winner Validations
          </Link>
          <Link href="/admin/charities" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
            <Heart className="h-4 w-4" /> Charities Catalog
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-muted/10">
        {children}
      </main>
    </div>
  )
}
