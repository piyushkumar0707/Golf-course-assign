import Link from 'next/link'
import { LayoutDashboard, Award, Settings, Heart, Upload } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row flex-1">
      <aside className="w-full md:w-64 border-r bg-muted/20">
        <nav className="flex flex-col gap-2 p-4 md:sticky md:top-16 md:h-[calc(100vh-4rem)]">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </Link>
          <Link href="/dashboard/scores" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
            <Award className="h-4 w-4" /> My Scores
          </Link>
          <Link href="/dashboard/charity" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
            <Heart className="h-4 w-4" /> Charity Match
          </Link>
          <Link href="/dashboard/proofs" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
            <Upload className="h-4 w-4" /> Win Proofs
          </Link>
          <div className="mt-auto pt-4">
            <Link href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
              <Settings className="h-4 w-4" /> Settings
            </Link>
          </div>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
